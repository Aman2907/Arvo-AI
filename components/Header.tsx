import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Zap, Sparkles } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@base-ui/react";
import { PricingModal } from "@/components/PricingModal";
import { checkUser } from "@/lib/checkUser";
import { auth } from "@clerk/nextjs/server";

const Header = async () => {
  const { userId } = await auth();
  const user = userId ? await checkUser() : null;

  return (
    <header className="fixed left-1/2 top-4 z-50 w-[95%] max-w-7xl -translate-x-1/2">
      <nav className="relative flex h-20 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f]/85 px-6 shadow-2xl shadow-purple-500/10 backdrop-blur-2xl">

        {/* Purple Glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl" />

        {/* Blue Glow */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />

        {/* Gradient Line */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70" />

        {/* ================= LOGO ================= */}
        <Link
          href="/"
          className="group relative z-10 flex items-center gap-3"
        >
          <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-xl transition-all duration-300 group-hover:bg-purple-500/40" />

          <Image
            src="/arvo.png"
            alt="Arvo AI"
            width={150}
            height={150}
            priority
            className="relative h-13 w-auto rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
          />

          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">
                Arvo
              </span>

              <span className="rounded-md bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                AI
              </span>
            </div>

            <p className="text-[10px] text-white/30">
              Your AI workspace
            </p>
          </div>
        </Link>

        {/* ================= CENTER PROJECTS ================= */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/projects"
            className="group relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-semibold text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-purple-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />

            <span>Projects</span>

            <span className="absolute bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 group-hover:w-16" />
          </Link>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="relative z-10 ml-auto flex items-center gap-3">

          {/* SIGNED IN */}
          {user ? (
            <>
              {/* Credits */}
              <PricingModal>
                <button
                  type="button"
                  className="group inline-flex h-10 items-center gap-2 rounded-full border border-purple-400/20 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 px-4 text-sm font-medium text-white/70 shadow-inner shadow-purple-500/10 transition-all duration-300 hover:border-purple-400/40 hover:bg-purple-500/20 hover:text-white"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20">
                    <Zap className="h-3.5 w-3.5 fill-purple-400 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
                  </span>

                  <span>{user.credits}</span>

                  <span className="hidden text-white/40 sm:inline">
                    credits
                  </span>
                </button>
              </PricingModal>

              {/* User */}
              <div className="ml-1 border-l border-white/10 pl-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-10 w-10",
                    },
                  }}
                />
              </div>
            </>
          ) : (
            /* ================= SIGNED OUT ================= */
            <>
              <SignInButton mode="modal">
                <Button className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/5 hover:text-white active:scale-95">
                  Sign In
                </Button>
              </SignInButton>

              <SignUpButton mode="modal">
                <Button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95">
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started

                    <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  </span>

                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;