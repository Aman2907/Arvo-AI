import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/prisma";
import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import type { Message, FileData } from "@/types/workspace";
import { aj } from "@/lib/arcjet";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// ─────────────────────────────────────────────────────────────────────────────
// SSE helper
// ─────────────────────────────────────────────────────────────────────────────

function sseEvent(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({
    type,
    ...(payload as object),
  })}\n\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract short label from Gemini thought chunk
// ─────────────────────────────────────────────────────────────────────────────

function extractThoughtLabel(text: string): string | null {
  // Try to grab **bold heading**
  const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);

  if (boldMatch) {
    return boldMatch[1].trim();
  }

  // Fall back to first sentence
  const sentence = text.split(/[.\n]/)[0].trim();

  if (sentence.length >= 8 && sentence.length <= 80) {
    return sentence;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// npm validation
// ─────────────────────────────────────────────────────────────────────────────

async function validateDependencies(
  deps: Record<string, string>
): Promise<Record<string, string>> {
  const valid: Record<string, string> = {};

  await Promise.all(
    Object.entries(deps).map(async ([pkg, version]) => {
      try {
        const res = await fetch(
          `https://registry.npmjs.org/${pkg}/latest`,
          {
            signal: AbortSignal.timeout(1500),
          }
        );

        if (res.ok) {
          valid[pkg] = version;
        }
      } catch {
        // Silently skip unavailable / hallucinated packages
      }
    })
  );

  return valid;
}

// ─────────────────────────────────────────────────────────────────────────────
// History trimming
// ─────────────────────────────────────────────────────────────────────────────

function trimHistory(messages: Message[]): Message[] {
  if (messages.length <= 10) {
    return messages;
  }

  return [
    messages[0],
    ...messages.slice(-8),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are an expert React developer.

Your job is to generate complete, working React applications based on user prompts.

RULES:

1. Always respond with a valid JSON object.
   No markdown fences.
   No extra text outside the JSON.

2. The JSON must match this exact shape:

{
  "assistantMessage": "<brief explanation of what you built/changed>",
  "title": "<short 2-4 word title for the app>",
  "files": {
    "/App.js": {
      "code": "<full file content>"
    },
    "/components/SomeComponent.js": {
      "code": "<full file content>"
    }
  },
  "dependencies": {
    "some-package": "latest"
  }
}

3. Use React functional components and hooks.

4. Do NOT use TypeScript in generated files.

5. Use Tailwind CSS for all styling.

6. Do not use CSS modules.

7. Avoid inline styles unless absolutely necessary.

8. The entry point must always be:

/App.js

9. /App.js must export a default component.

10. All imports must reference:
    - files included in "files"
    - OR packages included in "dependencies"

11. Do NOT include these in dependencies:

react
react-dom
tailwindcss

They are already available.

12. When modifying existing code, include ALL files:
    both changed and unchanged files.

13. Keep generated code clean, readable, and production-quality.

14. If the user attaches an image, use it as a design reference.

15. Every third-party package imported anywhere must appear in dependencies.

16. Before returning JSON, inspect every import statement.

17. Never import a third-party package unless it is included in dependencies.

18. Build visually attractive applications with:
    - responsive layouts
    - modern spacing
    - attractive cards
    - gradients when appropriate
    - hover states
    - loading states
    - empty states
    - polished typography

19. For dashboards, prefer:
    - cards
    - charts
    - statistics
    - responsive grids
    - clear visual hierarchy

20. For weather applications, include:
    - weather cards
    - temperatures
    - conditions
    - animated or visual weather indicators
    - responsive layout

21. For Spotify/statistics applications, include:
    - statistics cards
    - charts
    - rankings
    - responsive dashboard layout

22. Return ONLY the JSON object.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Gemini contents builder
// ─────────────────────────────────────────────────────────────────────────────

function buildContents(
  messages: Message[],
  fileData: FileData | null
) {
  const trimmed = trimHistory(messages);

  return trimmed.map((msg, idx) => {
    const role = msg.role === "assistant"
      ? "model"
      : "user";

    if (msg.role === "user") {
      const parts: object[] = [];

      let text = msg.content;

      if (msg.imageUrl) {
        text =
          `[The user has attached an image. ` +
          `Use this URL directly in the generated app where relevant ` +
          `(as img src, background-image, etc.): ${msg.imageUrl}]\n\n` +
          text;
      }

      const isLast = idx === trimmed.length - 1;

      if (isLast && fileData) {
        text +=
          "\n\nCurrent project files for context:\n" +
          JSON.stringify(fileData, null, 2);
      }

      parts.push({
        text,
      });

      return {
        role,
        parts,
      };
    }

    return {
      role,
      parts: [
        {
          text: msg.content,
        },
      ],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // Clerk authentication
    // ─────────────────────────────────────────────────────────────────────────

    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return Response.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Request body
    // ─────────────────────────────────────────────────────────────────────────

    const body = await request.json();

    const {
      workspaceId,
      userId,
      messages,
      fileData,
    } = body as {
      workspaceId: string | null;
      userId: string;
      messages: Message[];
      fileData: FileData | null;
    };

    if (!messages?.length) {
      return Response.json(
        {
          message: "No messages provided",
        },
        {
          status: 400,
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Arcjet
    // ─────────────────────────────────────────────────────────────────────────

    // Keep your Arcjet configuration here when you are ready to enable it.
    //
    // const arcjetReq = new Request(request.url, {
    //   method: request.method,
    //   headers: request.headers,
    //   body: JSON.stringify(body),
    // });
    //
    // const lastUserMessage =
    //   [...messages]
    //     .reverse()
    //     .find((m) => m.role === "user")
    //     ?.content ?? "";
    //
    // const decision = await aj.protect(arcjetReq, {
    //   requested: 1,
    //   userId: clerkId,
    //   detectPromptInjectionMessage: lastUserMessage,
    // });
    //
    // if (decision.isDenied()) {
    //   return Response.json(
    //     {
    //       message:
    //         decision.reason?.type ??
    //         "Request blocked",
    //     },
    //     {
    //       status: 429,
    //     }
    //   );
    // }

    // ─────────────────────────────────────────────────────────────────────────
    // Find user
    // ─────────────────────────────────────────────────────────────────────────

    const user = await db.user.findUnique({
      where: {
        id: userId,
        clerkId,
      },
      select: {
        id: true,
        credits: true,
      },
    });

    if (!user) {
      return Response.json(
        {
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Check credits
    // ─────────────────────────────────────────────────────────────────────────

    if (user.credits < CREDIT_COST_PER_GENERATION) {
      return Response.json(
        {
          message: "Insufficient credits",
        },
        {
          status: 402,
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SSE
    // ─────────────────────────────────────────────────────────────────────────

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;

        const safeEnqueue = (chunk: string) => {
          if (closed) return;

          try {
            controller.enqueue(
              encoder.encode(chunk)
            );
          } catch {
            closed = true;
          }
        };

        const closeStream = () => {
          if (closed) return;

          try {
            controller.close();
          } catch {
            // Already closed
          }

          closed = true;
        };

        try {
          // ─────────────────────────────────────────────────────────────────────
          // IMPORTANT:
          // Send something immediately.
          //
          // This allows us to confirm that the SSE connection itself works
          // before Gemini starts generating.
          // ─────────────────────────────────────────────────────────────────────

          safeEnqueue(
            sseEvent("status", {
              message: "Starting AI generation...",
            })
          );

          const contents = buildContents(
            messages,
            fileData
          );

          // ─────────────────────────────────────────────────────────────────────
          // Send another status before Gemini
          // ─────────────────────────────────────────────────────────────────────

          safeEnqueue(
            sseEvent("status", {
              message: "Connecting to AI...",
            })
          );

          console.log(
            "[gen-ai-code] Starting Gemini generation"
          );

          // ─────────────────────────────────────────────────────────────────────
          // Gemini streaming
          // ─────────────────────────────────────────────────────────────────────

          const geminiStream =
            await ai.models.generateContentStream({
              model: "gemini-3.5-flash",

              contents,

              config: {
                systemInstruction:
                  SYSTEM_PROMPT,

                responseMimeType:
                  "application/json",

                // Gemini 3.5:
                // low = faster generation
                thinkingConfig: {
                  thinkingLevel: "low",
                  includeThoughts: false,
                },
              },
            });

          console.log(
            "[gen-ai-code] Gemini stream connected"
          );

          safeEnqueue(
            sseEvent("status", {
              message: "AI is building your app...",
            })
          );

          // ─────────────────────────────────────────────────────────────────────
          // Collect response
          // ─────────────────────────────────────────────────────────────────────

          let accumulated = "";

          let chunkCount = 0;

          for await (const chunk of geminiStream) {
            chunkCount++;

            console.log(
              `[gen-ai-code] Gemini chunk #${chunkCount}`
            );

            const parts =
              chunk.candidates?.[0]?.content?.parts ??
              [];

            for (const part of parts) {
              if (!part.text) {
                continue;
              }

              accumulated += part.text;
            }

            // Send progress every few chunks
            if (chunkCount % 5 === 0) {
              safeEnqueue(
                sseEvent("status", {
                  message:
                    "Generating your application...",
                })
              );
            }
          }

          console.log(
            "[gen-ai-code] Gemini stream finished"
          );

          console.log(
            "[gen-ai-code] Total chunks:",
            chunkCount
          );

          console.log(
            "[gen-ai-code] Output length:",
            accumulated.length
          );

          // ─────────────────────────────────────────────────────────────────────
          // Empty response protection
          // ─────────────────────────────────────────────────────────────────────

          if (!accumulated.trim()) {
            console.error(
              "[gen-ai-code] Gemini returned empty response"
            );

            safeEnqueue(
              sseEvent("error", {
                message:
                  "AI returned an empty response. Please try again.",
              })
            );

            closeStream();
            return;
          }

          // ─────────────────────────────────────────────────────────────────────
          // Parse JSON
          // ─────────────────────────────────────────────────────────────────────

          let parsed: {
            assistantMessage: string;
            title?: string;
            files: Record<
              string,
              {
                code: string;
              }
            >;
            dependencies: Record<
              string,
              string
            >;
          };

          try {
            parsed = JSON.parse(
              accumulated
            );
          } catch (parseError) {
            console.error(
              "[gen-ai-code] JSON parse error:",
              parseError
            );

            console.error(
              "[gen-ai-code] Raw output:",
              accumulated.slice(0, 5000)
            );

            safeEnqueue(
              sseEvent("error", {
                message:
                  "AI returned invalid JSON. Please try again.",
              })
            );

            closeStream();
            return;
          }

          // ─────────────────────────────────────────────────────────────────────
          // Validate files
          // ─────────────────────────────────────────────────────────────────────

          const {
            assistantMessage,
            title: aiTitle,
            files,
            dependencies,
          } = parsed;

          if (
            !files ||
            typeof files !== "object" ||
            Object.keys(files).length === 0
          ) {
            console.error(
              "[gen-ai-code] AI response missing files"
            );

            safeEnqueue(
              sseEvent("error", {
                message:
                  "AI response did not contain application files. Please try again.",
              })
            );

            closeStream();
            return;
          }

          // ─────────────────────────────────────────────────────────────────────
          // Validate dependencies
          // ─────────────────────────────────────────────────────────────────────

          safeEnqueue(
            sseEvent("status", {
              message:
                "Validating packages...",
            })
          );

          const validatedDeps =
            await validateDependencies(
              dependencies ?? {}
            );

          const newFileData: FileData = {
            files,
            dependencies: validatedDeps,
            title: aiTitle,
          };

          // ─────────────────────────────────────────────────────────────────────
          // Save workspace
          // ─────────────────────────────────────────────────────────────────────

          safeEnqueue(
            sseEvent("status", {
              message: "Saving your project...",
            })
          );

          const lastUserMessage =
            messages[messages.length - 1];

          const updatedMessages: Message[] = [
            ...messages,
            {
              role: "assistant",
              content: assistantMessage,
            },
          ];

          const [workspace] =
            await db.$transaction([
              workspaceId
                ? db.workspace.update({
                    where: {
                      id: workspaceId,
                      userId,
                    },

                    data: {
                      messages:
                        updatedMessages as never,

                      fileData:
                        newFileData as never,
                    },
                  })
                : db.workspace.create({
                    data: {
                      userId,

                      title:
                        aiTitle ??
                        lastUserMessage.content.slice(
                          0,
                          80
                        ),

                      messages:
                        updatedMessages as never,

                      fileData:
                        newFileData as never,
                    },
                  }),

              db.user.update({
                where: {
                  id: userId,
                },

                data: {
                  credits: {
                    decrement:
                      CREDIT_COST_PER_GENERATION,
                  },
                },
              }),
            ]);

          // ─────────────────────────────────────────────────────────────────────
          // Updated credits
          // ─────────────────────────────────────────────────────────────────────

          const updatedUser =
            await db.user.findUnique({
              where: {
                id: userId,
              },

              select: {
                credits: true,
              },
            });

          // ─────────────────────────────────────────────────────────────────────
          // FINAL RESULT
          // ─────────────────────────────────────────────────────────────────────

          console.log(
            "[gen-ai-code] Generation completed successfully"
          );

          safeEnqueue(
            sseEvent("done", {
              workspaceId:
                workspace.id,

              assistantMessage,

              fileData:
                newFileData,

              creditsRemaining:
                updatedUser?.credits ??
                user.credits -
                  CREDIT_COST_PER_GENERATION,
            })
          );
        } catch (err) {
          console.error(
            "[gen-ai-code] stream error:",
            err
          );

          // Show the REAL error during development.
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Unknown AI error";

          console.error(
            "[gen-ai-code] Error message:",
            errorMessage
          );

          safeEnqueue(
            sseEvent("error", {
              message: errorMessage,
            })
          );
        } finally {
          closeStream();
        }
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Return SSE response
    // ─────────────────────────────────────────────────────────────────────────

    return new Response(stream, {
      headers: {
        "Content-Type":
          "text/event-stream; charset=utf-8",

        "Cache-Control":
          "no-cache, no-transform",

        Connection: "keep-alive",

        // Prevent proxy buffering
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error(
      "[gen-ai-code] Request error:",
      error
    );

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Next.js configuration
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

export const maxDuration = 300;