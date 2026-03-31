"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Star,
  MapPin,
} from "lucide-react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { classes, instructors } from "@/lib/mock-data";
import { Instructors } from "@/lib/types";

const levelColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
  "All Levels": "bg-blue-100 text-blue-700",
};

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cls = classes.find((c) => c.id === id) ?? classes[0];
  const instructor: Instructors | undefined = instructors.find(
    (i) => i.id === cls.instructorId,
  );

  const [enrolled, setEnrolled] = useState(false);
  const spotsLeft = cls.maxCapacity - cls.enrolledCount;
  const fillPct = Math.round((cls.enrolledCount / cls.maxCapacity) * 100);

  return (
    <>
      <CustomerNavbar />
      <main>
        <div className="relative h-72 sm:h-80">
          <Image
            src={cls.imageUrl}
            alt={cls.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-primary/65" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <Link
              href="/classes"
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Classes
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent text-accent-foreground">
                    {cls.sport}
                  </Badge>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelColors[cls.level]}`}
                  >
                    {cls.level}
                  </span>
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-black text-white text-balance"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  {cls.name}
                </h1>
              </div>
              <p className="text-3xl font-black text-accent">
                £{cls.price}
                <span className="text-base font-normal text-white/80">
                  /session
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-3">About this Class</h2>
              <p className="text-muted-foreground leading-relaxed">
                {cls.description}
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-bold mb-5">Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cls.schedule.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border"
                  >
                    <Calendar className="w-5 h-5 text-accent shrink-0" />
                    <div>
                      <p className="font-bold text-sm">{s.dayOfWeek}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.startTime} – {s.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-accent" />{" "}
                  {cls.durationMinutes} min
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent" /> {cls.facilityName}
                </span>
              </div>
            </section>

            {instructor && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-bold mb-5">Your Instructor</h2>
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-secondary border border-border">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={instructor.avatarUrl}
                        alt={instructor.name}
                      />
                      <AvatarFallback>
                        {instructor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base">{instructor.name}</p>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />{" "}
                          {instructor.rating}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {instructor.bio}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {instructor.specializations.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Enrolment card */}
          <aside>
            <Card className="sticky top-24 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">
                  Enrol in this Class
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {enrolled ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-lg">Enrolment Confirmed!</p>
                    <p className="text-sm text-muted-foreground">
                      You are now enrolled in {cls.name}.
                    </p>
                    <Link href="/account">
                      <Button variant="outline" className="w-full mt-2">
                        View My Classes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {cls.enrolledCount}/
                          {cls.maxCapacity} enrolled
                        </span>
                        <span
                          className={
                            spotsLeft <= 3 ? "text-destructive font-bold" : ""
                          }
                        >
                          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                        </span>
                      </div>
                      <Progress value={fillPct} className="h-2" />
                    </div>

                    <Separator />

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Price per session</span>
                        <span>£{cls.price}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Duration</span>
                        <span>{cls.durationMinutes} min</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Sessions/week</span>
                        <span>{cls.schedule.length}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                        <span>First session</span>
                        <span className="text-accent">£{cls.price}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                      disabled={spotsLeft === 0}
                      onClick={() => setEnrolled(true)}
                    >
                      {spotsLeft === 0 ? "Class Full" : "Enrol Now"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Cancel anytime with 48h notice
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}
