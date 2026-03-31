import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Class } from "@/lib/types";

interface ClassCardProps {
  cls: Class;
}

const levelColors: Record<Class["level"], string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
  "All Levels": "bg-blue-100 text-blue-700",
};

export function ClassCard({ cls }: ClassCardProps) {
  const spotsLeft = cls.maxCapacity - cls.enrolledCount;
  const isFull = spotsLeft === 0;

  return (
    <article className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      <div className="relative h-44 overflow-hidden">
        <Image
          src={cls.imageUrl}
          alt={cls.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className="bg-accent text-accent-foreground text-xs">
            {cls.sport}
          </Badge>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[cls.level]}`}
          >
            {cls.level}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-bold text-foreground text-base leading-tight">
            {cls.name}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 leading-relaxed">
            {cls.description}
          </p>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={cls.imageUrl} alt={cls.instructorName} />
            <AvatarFallback className="text-xs bg-secondary">
              {cls.instructorName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {cls.instructorName}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {cls.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {cls.schedule.length}x/week
          </span>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-bold text-foreground text-base">
            £{cls.price}
            <span className="text-xs font-normal text-muted-foreground">
              /session
            </span>
          </span>
          <Link href={`/classes/${cls.id}`}>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              disabled={isFull}
            >
              {isFull ? "Full" : "Enrol"}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
