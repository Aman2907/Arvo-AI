import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Zap } from "lucide-react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@base-ui/react";
import { PricingModal } from "@/components/PricingModal";
import { checkUser } from "@/lib/checkUser";
import { PLANS } from "@/lib/constants";
import { Plan } from "@/types/plans";


const Header = async () => {
  const user = await checkUser();

  return (
    <header className="w-full fixed top-0 left-0 z-50 h-16 w-[300px] rounded-xl border border-white/10 bg-white/7 backdrop-blur-md">
      <nav className="flex h-full items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <Image
            src="/logo.png"
            alt="Forge"
            width={100}
            height={100}
            loading="eager"
            className="h-9 w-auto rounded-md"
          />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {/* Signed In */}
          <Show when="signed-in">
            <Link
              href="/projects"
              className="text-[13px] font-medium text-white/50 transition-colors hover:text-white"
            >
              Projects
            </Link>

            {user && (
              <PricingModal>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/70">
                  <Zap className="h-3 w-3 fill-white/70" />
                   {user.credits} credits
                </span>
              </PricingModal>
            )}

            <UserButton />
          </Show>

          {/* Signed Out */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button className="rounded-full px-3 py-2 text-[13px] font-medium text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-[13px] font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-purple-400 hover:to-indigo-400 hover:shadow-purple-500/40 active:scale-95">
                Get Started
              </Button>
            </SignUpButton>
          </Show>
        </div>
      </nav>
    </header>
  );
}

export default Header;