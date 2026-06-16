"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  HeroOutlineHeart,
  HeroSunSparkles,
} from "@/components/customer/home-hero-decorations";
import { HomeHeroCloudPanel } from "@/components/customer/home-hero-cloud-panel";
import { LazyFadeImage } from "@/components/customer/lazy-fade-image";
import { cn } from "@/lib/utils";

interface HomeHeroSectionProps {
  readonly playLabel: string;
  readonly eventsLabel: string;
  readonly showPlayCta: boolean;
}

const HERO_IMAGE_SRC = "/play.png";

interface HeroCtaButtonProps {
  readonly href: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly className: string;
  readonly animationClass?: string;
}

function HeroCtaButton({
  href,
  icon,
  label,
  className,
  animationClass,
}: HeroCtaButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "home-hero-enter-child inline-flex min-h-[4rem] flex-1 items-center gap-4",
        "rounded-[24px] border-[3px] border-white px-6 py-4 text-white shadow-xl sm:flex-none sm:min-w-[16rem]",
        "text-sm font-black uppercase tracking-wider",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:brightness-105",
        animationClass,
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <span className="text-left leading-tight">{label}</span>
    </Link>
  );
}

export function HomeHeroSection({
  playLabel,
  eventsLabel,
  showPlayCta,
}: HomeHeroSectionProps) {
  return (
    <section
      className="relative h-svh min-h-svh w-full overflow-x-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="relative h-full min-h-svh w-full overflow-hidden">
        <LazyFadeImage
          src={HERO_IMAGE_SRC}
          alt="Child playing at Discovery Town"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/5" aria-hidden />

        <div className="relative z-10 flex h-full min-h-svh flex-col items-center justify-center overflow-visible px-4 py-12 sm:px-6">
          <div className="flex w-full translate-y-3 flex-col items-center gap-8 sm:translate-y-5 sm:gap-10">
          <HomeHeroCloudPanel className="home-hero-enter w-full max-w-[56rem]">
            <div className="relative select-none">
              {/* Contextually positioned decoration elements */}
              <HeroSunSparkles className="absolute -top-6 left-2 sm:-top-8 sm:left-4" />
              <HeroOutlineHeart className="absolute -top-1 right-2 sm:right-6 -rotate-12" />

              <h1
                id="hero-heading"
                className="home-hero-title px-4 font-black tracking-tighter uppercase"
              >
                <span className="block text-[2.25rem] leading-none text-[#2B9A93] sm:text-[3.5rem] md:text-[4rem]">
                  WHERE LITTLE
                </span>
                <span className="mt-1 block text-[2.75rem] leading-none text-[#E86A24] sm:text-[4.25rem] md:text-[5rem]">
                  IMAGINATIONS
                </span>
                <span className="mt-1 block text-[2.25rem] leading-none text-[#11223F] sm:text-[3.5rem] md:text-[4rem]">
                  COME TO LIFE
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base font-semibold text-[#11223F]/90 sm:mt-8 sm:max-w-2xl sm:text-xl sm:leading-relaxed">
                <span className="block">An imaginative indoor play café where children</span>
                <span className="block">explore, create, and discover while</span>
                <span className="block">
                  parents relax and recharge.{" "}
                  <span
                    className="relative -top-1 inline-block align-baseline text-[2.125rem] leading-none text-[#E86A24] animate-pulse sm:-top-1.5 sm:text-[2.75rem]"
                    aria-hidden
                  >
                    ♥
                  </span>
                </span>
              </p>
            </div>
          </HomeHeroCloudPanel>

          {/* CTA Buttons Row Matching Image Elements */}
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 sm:flex-row sm:justify-center sm:gap-6">
            {showPlayCta && (
              <HeroCtaButton
                href="/play"
                icon={
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                label={`Book\n${playLabel}`}
                className="bg-[#2B9A93]"
                animationClass="home-hero-enter-delay-2"
              />
            )}

            <HeroCtaButton
              href="/events"
              icon={
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              }
              label={`Book\n${eventsLabel}`}
              className="bg-[#E86A24]"
              animationClass={
                showPlayCta
                  ? "home-hero-enter-delay-3"
                  : "home-hero-enter-delay-2"
              }
            />

            <HeroCtaButton
              href="/membership"
              icon={
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              label="Membership\nBenefits"
              className="bg-[#F1A619]"
              animationClass={
                showPlayCta
                  ? "home-hero-enter-delay-4"
                  : "home-hero-enter-delay-3"
              }
            />
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
