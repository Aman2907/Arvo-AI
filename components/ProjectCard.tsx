"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trash2, MessageSquare, ArrowUpRight } from "lucide-react";
import { ProjectSummary } from "@/actions/projects";
import { DeleteProjectModal } from "./DeleteProjectModal";

interface ProjectCardProps {
  projects: ProjectSummary[];
}

export function ProjectCard({ projects }: ProjectCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project, index) => {
        const title = project.title ?? "Untitled project";

        const timeAgo = formatDistanceToNow(new Date(project.updatedAt), {
          addSuffix: true,
        });

        const msgCount = Math.floor(project.messageCount / 2);

        const gradients = [
          "from-purple-500/20 via-indigo-500/10 to-blue-500/20",
          "from-cyan-500/20 via-blue-500/10 to-purple-500/20",
          "from-pink-500/20 via-purple-500/10 to-indigo-500/20",
          "from-orange-500/20 via-pink-500/10 to-purple-500/20",
          "from-emerald-500/20 via-cyan-500/10 to-blue-500/20",
          "from-yellow-500/20 via-orange-500/10 to-pink-500/20",
        ];

        const gradient = gradients[index % gradients.length];

        return (
          <div
            key={project.id}
            className={`group relative flex min-h-[230px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/10`}
          >
            {/* Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl transition-all duration-500 group-hover:bg-purple-500/25" />

            {/* Top gradient line */}
            <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-60 transition-opacity group-hover:opacity-100" />

            {/* Open project */}
            <Link
              href={`/workspace?id=${project.id}`}
              className="absolute inset-0 rounded-2xl"
              aria-label={`Open ${title}`}
            />

            {/* Header */}
            <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* Project icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg shadow-lg backdrop-blur-md">
                  ✨
                </div>

                <p className="line-clamp-2 text-base font-semibold leading-snug text-white">
                  {title}
                </p>
              </div>

              <DeleteProjectModal project={project}>
                <span className="relative z-20 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/30 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </span>
              </DeleteProjectModal>
            </div>

            {/* Prompt preview */}
            {project.firstPrompt ? (
              <p className="relative z-10 mb-5 line-clamp-3 text-sm leading-relaxed text-white/50">
                {project.firstPrompt}
              </p>
            ) : (
              <p className="relative z-10 mb-5 text-sm italic text-white/25">
                No description available
              </p>
            )}

            {/* Bottom */}
            <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-4">
                {/* Messages */}
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
                  <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                  {msgCount} message{msgCount !== 1 ? "s" : ""}
                </span>

                {/* Time */}
                <span className="text-xs text-white/30">{timeAgo}</span>
              </div>

              {/* Arrow */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/30 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white">
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}