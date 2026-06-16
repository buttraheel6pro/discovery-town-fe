"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface HomeHeroCloudPanelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

// Fixed canvas dimensions for high resolution scaling
const VIEWBOX_W = 1200;
const VIEWBOX_H = 700;

// Padding inside the SVG viewBox to prevent edges from clipping
const INSET_X = 60;
const INSET_Y = 60;

// The dimensions of the core rectangle shape before the scallops are added
const RECT_W = VIEWBOX_W - INSET_X * 2; // 1080
const RECT_H = VIEWBOX_H - INSET_Y * 2; // 580

// Exact width of a single scallop bump (smaller number = more bumps)
const BUMP_SIZE = 76;

/**
 * Generates an exact, perfectly repeating scallop/cloud border around a rectangle.
 * Sweeps clock-wise starting from top-left, matching the rhythm of image_3e51bf.jpg.
 */
function buildPerfectScallopPath(): string {
  const startX = INSET_X;
  const startY = INSET_Y;

  // Calculate exactly how many bumps fit on horizontal and vertical sides
  const horizBumps = Math.round(RECT_W / BUMP_SIZE);
  const vertBumps = Math.round(RECT_H / BUMP_SIZE);

  // Recalculate exact step sizes so they fit perfectly into the box constraints
  const stepX = RECT_W / horizBumps;
  const stepY = RECT_H / vertBumps;

  let path = `M ${startX} ${startY}`;

  // 1. TOP EDGE (Left to Right)
  // sweep-flag = 1 creates an OUTWARD bump
  for (let i = 0; i < horizBumps; i++) {
    const nextX = startX + (i + 1) * stepX;
    const currentX = startX + i * stepX;
    const midX = currentX + stepX / 2;
    path += ` Q ${midX} ${startY - 35}, ${nextX} ${startY}`;
  }

  // 2. RIGHT EDGE (Top to Bottom)
  const rightX = startX + RECT_W;
  for (let i = 0; i < vertBumps; i++) {
    const nextY = startY + (i + 1) * stepY;
    const currentY = startY + i * stepY;
    const midY = currentY + stepY / 2;
    path += ` Q ${rightX + 35} ${midY}, ${rightX} ${nextY}`;
  }

  // 3. BOTTOM EDGE (Right to Left)
  const bottomY = startY + RECT_H;
  for (let i = horizBumps; i > 0; i--) {
    const nextX = startX + (i - 1) * stepX;
    const currentX = startX + i * stepX;
    const midX = currentX - stepX / 2;
    path += ` Q ${midX} ${bottomY + 35}, ${nextX} ${bottomY}`;
  }

  // 4. LEFT EDGE (Bottom to Top)
  for (let i = vertBumps; i > 0; i--) {
    const nextY = startY + (i - 1) * stepY;
    const currentY = startY + i * stepY;
    const midY = currentY - stepY / 2;
    path += ` Q ${startX - 35} ${midY}, ${startX} ${nextY}`;
  }

  path += " Z";
  return path;
}

const CONSTANT_CLOUD_PATH = buildPerfectScallopPath();

export function HomeHeroCloudPanel({
  children,
  className,
}: HomeHeroCloudPanelProps) {
  const panelId = useId();
  const shadowId = `${panelId}-shadow`;

  return (
    <div className={cn("relative mx-auto w-full max-w-[64rem]", className)}>
      {/* Background SVG Cloud Wrapper */}
      <div className="absolute inset-0 -mx-4 -my-4 sm:-mx-6 sm:-my-6 pointer-events-none select-none">
        <svg
          className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.07)]"
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="none" // Stretching evenly based on wrapper size
          aria-hidden
        >
          <path d={CONSTANT_CLOUD_PATH} fill="#ffffff" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-6 pt-12 pb-16 text-center sm:px-14 sm:pt-16 sm:pb-20 md:px-20">
        {children}
      </div>
    </div>
  );
}
