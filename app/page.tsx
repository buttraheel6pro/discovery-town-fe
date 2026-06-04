"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
  ArrowRight,
  ChevronRight,
  Star,
  Shield,
  Clock,
  Users,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { FacilityCard } from "@/components/customer/facility-card";
import { EventCard } from "@/components/customer/event-card";
import { ClassCard } from "@/components/customer/class-card";
import {
  buildSchedulingCategoryById,
  hasAssignedConsumerSlot,
  isConsumerEventCatalogService,
  isConsumerVisibleSchedulingService,
} from "@/lib/scheduling-visibility";
import { useScheduling } from "@/lib/scheduling-store";

const features = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "CCTV monitored, fully insured facilities with trained staff on-site at all times.",
  },
  {
    icon: Clock,
    title: "Open 7 Days",
    description:
      "We open from 6am to 10pm Monday to Friday, and 7am to 9pm on weekends.",
  },
  {
    icon: Users,
    title: "For Everyone",
    description:
      "From beginners to elite athletes, we have programmes and facilities for all levels.",
  },
  {
    icon: Award,
    title: "Award-Winning",
    description:
      "Winner of the Regional Sports Complex of the Year award three years running.",
  },
];

const testimonials = [
  {
    name: "Emma Clarke",
    role: "Competitive Swimmer",
    text: "The Olympic pool is world-class. I've improved my PB by 8 seconds in just three months of training here.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    rating: 5,
  },
  {
    name: "Marcus Osei",
    role: "Football Coach",
    text: "The pitches are always in perfect condition, and the booking system makes scheduling incredibly easy.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80",
    rating: 5,
  },
  {
    name: "Priya Gupta",
    role: "Yoga Enthusiast",
    text: "The yoga studio is my sanctuary. Priya's classes are transformational. I come three times a week.",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80",
    rating: 5,
  },
];

export default function HomePage() {
  const { categories, services, slots } = useScheduling();

  const categoryById = useMemo(
    () => buildSchedulingCategoryById(categories),
    [categories],
  );

  const stats = useMemo(() => {
    const facilitiesCount = services.filter(
      (service) =>
        isConsumerVisibleSchedulingService(service, categoryById, {
          requireCurrentCatalog: true,
        }) &&
        hasAssignedConsumerSlot(service, slots) &&
        (service.categoryId === "cat-open-play" || service.categoryId === "cat-private-play"),
    ).length;
    const classesCount = services.filter(
      (service) =>
        isConsumerVisibleSchedulingService(service, categoryById, {
          requireCurrentCatalog: true,
        }) &&
        hasAssignedConsumerSlot(service, slots) &&
        service.categoryId.startsWith("cat-gym-") &&
        service.categoryId !== "cat-gym-eyeclick",
    ).length;
    const activeEventsCount = services.filter(
      (service) =>
        isConsumerEventCatalogService(service, categoryById) &&
        hasAssignedConsumerSlot(service, slots),
    ).length;
    const upcomingSlotsCount = slots.filter((slot) => {
      const startAt = new Date(slot.startAt).getTime();
      return slot.status !== "CANCELLED" && slot.status !== "COMPLETED" && startAt > Date.now();
    }).length;

    return [
      { label: "Facilities", value: `${facilitiesCount}` },
      { label: "Classes", value: `${classesCount}` },
      { label: "Events", value: `${activeEventsCount}` },
      { label: "Upcoming Slots", value: `${upcomingSlotsCount}` },
    ];
  }, [categoryById, services, slots]);

  const featuredFacilities = useMemo(() => {
    return services
      .filter(
        (s) =>
          isConsumerVisibleSchedulingService(s, categoryById, {
            requireCurrentCatalog: true,
          }) &&
          hasAssignedConsumerSlot(s, slots) &&
          (s.categoryId === "cat-open-play" || s.categoryId === "cat-private-play"),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 3);
  }, [categoryById, services, slots]);

  const nextSlotByServiceId = useMemo(() => {
    const map = new Map<string, (typeof slots)[0]>();
    const now = new Date().getTime();
    const sorted = [...slots].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    for (const slot of sorted) {
      if (slot.status === "CANCELLED" || slot.status === "COMPLETED") continue;
      if (new Date(slot.startAt).getTime() < now) continue;
      if (!map.has(slot.serviceId)) map.set(slot.serviceId, slot);
    }
    return map;
  }, [slots]);

  const featuredClasses = useMemo(() => {
    return services
      .filter(
        (s) =>
          isConsumerVisibleSchedulingService(s, categoryById, {
            requireCurrentCatalog: true,
          }) &&
          hasAssignedConsumerSlot(s, slots) &&
          s.categoryId.startsWith("cat-gym-") &&
          s.categoryId !== "cat-gym-eyeclick",
      )
      .slice(0, 3);
  }, [categoryById, services, slots]);

  const slotByEventServiceId = useMemo(() => {
    const map = new Map<string, (typeof slots)[0]>();
    for (const sl of slots) {
      if (!map.has(sl.serviceId)) map.set(sl.serviceId, sl);
    }
    return map;
  }, [slots]);

  const upcomingEvents = useMemo(() => {
    const catalog = services.filter(
      (service) =>
        isConsumerEventCatalogService(service, categoryById) &&
        hasAssignedConsumerSlot(service, slots),
    );
    const published = catalog.filter(
      (s) => s.eventStatus === "PUBLISHED" || s.eventStatus === "Upcoming",
    );
    const list = published.length > 0 ? published : catalog;
    return list.slice(0, 3);
  }, [categoryById, services, slots]);

  return (
    <>
      <CustomerNavbar />
      <main>
        {/* ── Hero ──────────────────────────────────────── */}
        <section
          className="relative min-h-[85vh] flex items-center"
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-sports.jpg"
              alt="Discovery Town Complex facilities"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-primary/75" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-3xl space-y-8">
              <Badge className="bg-accent text-accent-foreground font-semibold text-xs px-3 py-1.5 uppercase tracking-widest">
                Indianapolis&apos;s Premier Sports Complex
              </Badge>
              <h1
                id="hero-heading"
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight text-balance"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                PLAY. <span className="text-accent">TRAIN.</span> EXCEL.
              </h1>
              <p className="text-lg text-white/80 max-w-xl leading-relaxed">
                Book world-class facilities, join expert-led classes, and
                compete at inspiring events. Everything you need to reach your
                peak is right here.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/facilities">
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base px-8 h-12"
                  >
                    Book a Facility
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/events">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/100 font-semibold text-base px-8 h-12"
                  >
                    Browse Events
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p
                      className="text-3xl font-black text-accent"
                      style={{ fontFamily: "var(--font-barlow)" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-white/60 uppercase tracking-wider mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features strip ────────────────────────────── */}
        <section
          className="bg-primary py-16"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="features-heading" className="sr-only">
              Why choose Discovery Town
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-foreground text-sm mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-primary-foreground/60 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Facilities ───────────────────────── */}
        <section
          className="py-20 bg-background"
          aria-labelledby="facilities-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">
                  World-Class Venues
                </p>
                <h2
                  id="facilities-heading"
                  className="text-3xl sm:text-4xl font-black text-foreground text-balance"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  OUR FACILITIES
                </h2>
              </div>
              <Link
                href="/facilities"
                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredFacilities.map((service) => (
                <FacilityCard key={service.id} service={service} />
              ))}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link href="/facilities">
                <Button variant="outline" className="gap-2">
                  View All Facilities <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Upcoming Events ───────────────────────────── */}
        <section
          className="py-20 bg-secondary"
          aria-labelledby="events-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">
                  Don&apos;t Miss Out
                </p>
                <h2
                  id="events-heading"
                  className="text-3xl sm:text-4xl font-black text-foreground text-balance"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  UPCOMING EVENTS
                </h2>
              </div>
              <Link
                href="/events"
                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((service) => (
                <EventCard
                  key={service.id}
                  service={service}
                  slot={slotByEventServiceId.get(service.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Classes ───────────────────────────────────── */}
        <section
          className="py-20 bg-background"
          aria-labelledby="classes-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">
                  Expert-Led Programmes
                </p>
                <h2
                  id="classes-heading"
                  className="text-3xl sm:text-4xl font-black text-foreground text-balance"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  CLASSES &amp; TRAINING
                </h2>
              </div>
              <Link
                href="/play"
                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredClasses.map((service) => (
                <ClassCard
                  key={service.id}
                  service={service}
                  nextSlot={nextSlotByServiceId.get(service.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────── */}
        <section className="bg-accent py-20" aria-labelledby="cta-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap
                className="w-6 h-6 text-accent-foreground"
                fill="currentColor"
              />
              <span className="text-accent-foreground/80 font-bold text-sm uppercase tracking-widest">
                Get Started Today
              </span>
            </div>
            <h2
              id="cta-heading"
              className="text-4xl sm:text-5xl font-black text-accent-foreground text-balance"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              READY TO REACH YOUR PEAK?
            </h2>
            <p className="text-accent-foreground/80 text-lg max-w-xl mx-auto leading-relaxed">
              Join thousands of members who have transformed their fitness at
              Discovery Town Complex. Your first facility booking is just clicks
              away.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/facilities">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base px-8 h-12"
                >
                  Book a Facility
                </Button>
              </Link>
              <Link href="/account/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10 font-semibold text-base px-8 h-12"
                >
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────── */}
        <section
          className="py-20 bg-background"
          aria-labelledby="testimonials-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">
                Member Stories
              </p>
              <h2
                id="testimonials-heading"
                className="text-3xl sm:text-4xl font-black text-foreground"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                WHAT OUR MEMBERS SAY
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <blockquote
                  key={t.name}
                  className="bg-card rounded-xl p-6 border border-border space-y-4"
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-500 text-yellow-500"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  );
}
