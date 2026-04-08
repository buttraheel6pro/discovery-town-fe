"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroupProps {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  pathname: string;
}

const SECTION_ROOTS = [
  "/admin/inventory",
  "/admin/scheduling",
  "/admin/calendar",
  "/admin/clients",
  "/admin/reports",
  "/admin"
];

function isItemActive(href: string, pathname: string) {
  if (pathname === href) return true;
  if (SECTION_ROOTS.includes(href)) return pathname === href;
  return pathname.startsWith(href + "/");
}

export function SidebarItem({ item, isActive, isChild = false }: { item: NavItem; isActive: boolean; isChild?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
        isChild && "pl-11"
      )}
    >
      {!isChild && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
      <span className="truncate">{item.label}</span>
      {isActive && !isChild && (
        <div className="absolute left-1.5 w-1 h-5 bg-sidebar-primary rounded-full" />
      )}
    </Link>
  );
}

export function SidebarGroup({ label, icon: Icon, items, pathname }: NavGroupProps) {
  const isAnyChildActive = items.some((item) => isItemActive(item.href, pathname));
  
  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive, pathname]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200 cursor-pointer text-left group",
            isAnyChildActive
              ? "text-sidebar-foreground font-semibold bg-sidebar-accent/20"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Icon className="w-[18px] h-[18px] flex-shrink-0 transition-colors group-hover:text-sidebar-primary" />
            <span className="truncate leading-tight">{label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5 space-y-0.5 overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        {items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={isItemActive(item.href, pathname)}
            isChild={true}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
