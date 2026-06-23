/** Sawtooth / scalloped section divider — maximum smoothness, flawless continuous fluid waves matching image_058ed1.png. */
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ScallopFill = "cream" | "homeCream" | "teal" | "white" | "background";

const FILL_CLASS: Record<ScallopFill, string> = {
  cream: "fill-brand-cream",
  homeCream: "fill-home-cream",
  teal: 'fill-brand-teal',
  white: "fill-white",
  background: "fill-background",
};

interface ScallopDividerProps {
  readonly className?: string;
  readonly fill?: ScallopFill;
  readonly direction?: "up" | "down";
  readonly size?: "default" | "footer";
}

const SIZE_CLASS: Record<NonNullable<ScallopDividerProps["size"]>, string> = {
  default: "h-6 w-full sm:h-7",
  footer: "h-8 w-full sm:h-9 md:h-10",
};

export function ScallopDivider({
  className,
  fill = "background",
  direction = "up",
  size = "default",
}: ScallopDividerProps) {
  const [windowWidth, setWindowWidth] = useState(1440);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clean frequency tracking for beautiful brand ripples
  const targetWaveCount = 11;
  const waveWidth = windowWidth / targetWaveCount;

  const waveHeight = 16;
  const count = Math.ceil(windowWidth / waveWidth);
  const totalWidth = count * waveWidth;

  // Start perfectly flat halfway up the canvas boundary coordinate
  let path = `M 0 ${waveHeight / 2}`;

  for (let i = 0; i < count; i++) {
    const startX = i * waveWidth;
    const endX = startX + waveWidth;

    // UNIFIED SMOOTH WAVE: Uses balanced 1/3 and 2/3 distribution anchors across the wave window.
    // This removes the intermediate midpoint connection entirely so there is physically no joint to pinch.
    if (direction === "up") {
      path += ` C ${startX + waveWidth * 0.333} ${waveHeight * 1.15}, ${startX + waveWidth * 0.666} ${-waveHeight * 0.15}, ${endX} ${waveHeight / 2}`;
    } else {
      path += ` C ${startX + waveWidth * 0.333} ${-waveHeight * 0.15}, ${startX + waveWidth * 0.666} ${waveHeight * 1.15}, ${endX} ${waveHeight / 2}`;
    }
  }

  if (direction === "up") {
    path += ` L ${totalWidth} ${waveHeight + 20} L 0 ${waveHeight + 20} Z`;
  } else {
    path += ` L ${totalWidth} -20 L 0 -20 Z`;
  }

  return (
    <div
      className={cn(
        "pointer-events-none w-full overflow-hidden leading-none relative z-20 block",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${totalWidth} ${waveHeight}`}
        preserveAspectRatio="none"
        className={cn("block w-full", SIZE_CLASS[size])}
      >
        <path className={FILL_CLASS[fill]} d={path} />
      </svg>
    </div>
  );
}

/** @deprecated Unified migration wrapper pointing seamlessly to ScallopDivider */
export function HomeWaveDivider({
  className,
  fillClassName = "fill-background",
  flip = false,
}: {
  readonly className?: string;
  readonly fillClassName?: string;
  readonly flip?: boolean;
}) {
  const fill: ScallopFill = fillClassName.includes("white")
    ? "white"
    : fillClassName.includes("primary") || fillClassName.includes("teal")
      ? "teal"
      : fillClassName.includes("cream")
        ? "cream"
        : "background";

  return (
    <ScallopDivider
      className={className}
      fill={fill}
      direction={flip ? "down" : "up"}
    />
  );
}
