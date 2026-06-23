/** About Us & FAQ — image hero, story, photo gallery, and expandable questions. */
'use client'

import Link from 'next/link'

import { AboutUsGallery } from '@/components/customer/about-us-gallery'
import { LazyFadeImage } from '@/components/customer/lazy-fade-image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ABOUT_HERO_DESCRIPTION,
  ABOUT_HERO_IMAGE_SRC,
  ABOUT_HERO_OVERLINE,
  ABOUT_HERO_TITLE,
  ABOUT_US_HEADLINE,
  ABOUT_US_PARAGRAPHS,
  FAQ_ITEMS,
  FAQ_SECTION_OVERLINE,
  FAQ_SECTION_TITLE,
} from '@/lib/about-faq-content'

export function AboutFaqPage() {
  return (
    <div className="bg-brand-cream">
      <section className="relative isolate min-h-[12rem] overflow-hidden sm:min-h-[14rem] lg:min-h-[16rem]">
        <div className="absolute inset-0">
          <LazyFadeImage
            src={ABOUT_HERO_IMAGE_SRC}
            alt="Families playing at Discovery Town"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-brand-navy/80 via-brand-navy/45 to-brand-navy/15"
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/15" aria-hidden />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
            {ABOUT_HERO_OVERLINE}
          </p>
          <h1
            className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {ABOUT_HERO_TITLE}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/90 md:text-base">
            {ABOUT_HERO_DESCRIPTION}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/play">Explore Play</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="#faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="about-us"
        className="scroll-mt-24 border-b border-border bg-background py-12 md:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                {ABOUT_HERO_OVERLINE}
              </p>
              <h2
                className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {ABOUT_US_HEADLINE}
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                {ABOUT_US_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph.slice(0, 28)}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8">
                <Button
                  asChild
                  className="rounded-full bg-brand-orange font-bold text-white shadow-md hover:bg-brand-orange/90"
                >
                  <Link href="/events">Book an event</Link>
                </Button>
              </div>
            </div>

            <div className="relative min-h-[16rem] overflow-hidden rounded-2xl border border-border shadow-lg sm:min-h-[20rem]">
              <LazyFadeImage
                src={ABOUT_HERO_IMAGE_SRC}
                alt="Families playing at Discovery Town"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-navy/50 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </div>

          <AboutUsGallery className="mt-10 sm:mt-12" />
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 py-8 md:py-10">
        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-5 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {FAQ_SECTION_OVERLINE}
            </p>
            <h2
              className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {FAQ_SECTION_TITLE}
            </h2>
          </div>

          <Card className="mt-6 border-border bg-background shadow-sm">
            <CardContent className="px-4 py-1 sm:px-6">
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border-border">
                    <AccordionTrigger className="py-3 text-left text-sm font-semibold text-foreground hover:text-accent sm:text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
