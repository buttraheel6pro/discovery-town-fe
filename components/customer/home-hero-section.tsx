"use client";

import Link from "next/link";

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
  readonly label: string;
  readonly backgroundColor: string;
  readonly animationClass?: string;
}

function HeroCtaButton({
  href,
  label,
  backgroundColor,
  animationClass,
}: HeroCtaButtonProps) {
  return (
    <Link
      href={href}
      className={cn("home-hero-enter-child home-hero-cta-button", animationClass)}
      style={{ backgroundColor }}
    >
      {label}
    </Link>
  );
}

export function HomeHeroSection({
  playLabel: _playLabel,
  eventsLabel: _eventsLabel,
  showPlayCta,
}: HomeHeroSectionProps) {
  return (
    <section
      className="relative h-svh min-h-svh w-full overflow-x-clip"
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
        <div className="absolute inset-0 bg-black/20" aria-hidden />

        <div className="relative z-10 flex h-full min-h-svh flex-col items-center justify-center overflow-visible px-4 pb-16 pt-12 sm:px-6 sm:pb-24">
          <div className="flex w-full -translate-y-6 flex-col items-center gap-8 sm:-translate-y-10 sm:gap-10">
            <div className="home-hero-enter w-full max-w-[56rem] px-4 text-center">
              <h1 id="hero-heading" className="home-hero-title m-0">
                <span className="home-hero-title-line home-hero-title-line-sm text-[#3C918C]">
                  WHERE LITTLE
                </span>
                <span className="home-hero-title-line home-hero-title-line-lg text-[#F37210]">
                  IMAGINATIONS
                </span>
                <span className="home-hero-title-line home-hero-title-line-sm text-[#717272]">
                  COME TO LIFE
                </span>
              </h1>

              <p className="home-hero-subtitle mx-auto mt-6 max-w-2xl sm:mt-8">
                <span className="block">An imaginative indoor play café where children</span>
                <span className="block">
                  explore, create, and discover while parents relax and recharge.
                </span>
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-[40rem] flex-col items-center gap-4 px-4 sm:flex-row sm:justify-center sm:gap-5">
              {showPlayCta ? (
                <HeroCtaButton
                  href="/play"
                  label="Book Parties"
                  backgroundColor="#3C918C"
                  animationClass="home-hero-enter-delay-2"
                />
              ) : null}

              <HeroCtaButton
                href="/events"
                label="Book Events"
                backgroundColor="#E87722"
                animationClass={
                  showPlayCta ? "home-hero-enter-delay-3" : "home-hero-enter-delay-2"
                }
              />

              <HeroCtaButton
                href="/membership"
                label="Membership"
                backgroundColor="#F1A61A"
                animationClass={
                  showPlayCta ? "home-hero-enter-delay-4" : "home-hero-enter-delay-3"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
