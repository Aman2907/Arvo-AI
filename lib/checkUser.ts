import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { PLANS } from "./constants";
import type { Plan } from "@/types/plans";

const getCurrentPlan = async (): Promise<Plan> => {
  const { has } = await auth();
  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "starter" })) return "starter";
  return "free";
};


export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const currentPlan = await getCurrentPlan();

    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error("Clerk user does not have an email address");
    }

    // 1. Find user by Clerk ID
    const existing = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (existing) {
      if (existing.plan !== currentPlan) {
        const existingPlanCredits =
          PLANS[existing.plan as Plan]?.credits ?? 0;

        const newPlanCredits = PLANS[currentPlan].credits;

        const creditDelta =
          newPlanCredits - existingPlanCredits;

        await db.user.updateMany({
          where: {
            clerkId: user.id,
            plan: existing.plan,
          },
          data: {
            plan: currentPlan,
            credits:
              creditDelta > 0
                ? existing.credits + creditDelta
                : existing.credits,
          },
        });

        return await db.user.findUnique({
          where: { clerkId: user.id },
        });
      }

      return existing;
    }

    // 2. Clerk ID not found.
    // Check whether this email already exists.
    const existingByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Existing database user belongs to the same person.
      // Update the Clerk ID instead of creating a duplicate.
      return await db.user.update({
        where: { email },
        data: {
          clerkId: user.id,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          imageUrl: user.imageUrl ?? "",
        },
      });
    }

    // 3. Completely new user
    return await db.user.create({
      data: {
        clerkId: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        email,
        imageUrl: user.imageUrl ?? "",
        credits: PLANS.free.credits,
        plan: "free",
      },
    });
  } catch (error) {
    console.error("checkUser error:", error);
    return null;
  }
};
