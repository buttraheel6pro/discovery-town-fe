/** Configure a single events-module add-on (simple details or complex cafe options). */
"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CafeModifierGroup } from "@/components/customer/cafe-modifier-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  buildEventAddOnConfiguration,
  clampEventAddOnQuantity,
  isEventAddOnConfiguratorRequired,
  resolveEventAddOnImageUrl,
  type EventAddOnConfigurationResult,
  type EventOptionalAddOnListItem,
} from "@/lib/event-booking-add-ons";
import {
  defaultModifierSelections,
  modifierGroupsForProduct,
  modifiersSatisfied,
  resolveAttributeOptionsForProduct,
} from "@/lib/cafe-utils";
import { isComplexAddOn } from "@/lib/add-on-structure";
import { cn, formatPrice } from "@/lib/utils";
import type {
  AddOn,
  AttributeGroup,
  CafeProduct,
  ModifierGroup,
  Product,
} from "@/lib/types";

export interface EventAddOnExistingConfiguration {
  readonly unitPrice: number;
  readonly quantity: number;
  readonly summary: string;
  readonly selectedByGroup: Record<string, string[]>;
  readonly selectedAttributesByGroup: Record<string, string[]>;
  readonly customerNote: string;
}

export interface EventAddOnConfiguratorModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly item: EventOptionalAddOnListItem | null;
  readonly cafeProduct: CafeProduct | null;
  readonly cafeProducts: readonly CafeProduct[];
  readonly modifierGroups: readonly ModifierGroup[];
  readonly attributeGroups: readonly AttributeGroup[];
  readonly inventoryProducts?: readonly Product[];
  readonly existing?: EventAddOnExistingConfiguration | null;
  readonly onDone: (
    addOnId: string,
    result: EventAddOnConfigurationResult,
  ) => void;
  readonly onRemove?: (addOnId: string) => void;
}

function defaultAttributeSelections(
  cafeProduct: CafeProduct | null,
  attributeGroups: readonly AttributeGroup[],
): Record<string, string[]> {
  if (!cafeProduct) {
    return {};
  }
  const out: Record<string, string[]> = {};
  for (const group of attributeGroups) {
    const allowedIds = cafeProduct.attributeGroups[group.id] ?? [];
    const allowedOptions = group.options.filter((option) =>
      allowedIds.includes(option.id),
    );
    if (allowedOptions.length === 0) {
      continue;
    }
    if (group.selectionType === "single") {
      const first = allowedOptions[0]?.id;
      out[group.id] = first ? [first] : [];
    } else {
      out[group.id] = [];
    }
  }
  return out;
}

function attributesSatisfied(
  cafeProduct: CafeProduct | null,
  attributeGroups: readonly AttributeGroup[],
  selectedByGroup: Record<string, string[]>,
): boolean {
  if (!cafeProduct) {
    return true;
  }
  for (const group of attributeGroups) {
    const allowedIds = cafeProduct.attributeGroups[group.id] ?? [];
    if (allowedIds.length === 0) {
      continue;
    }
    if (!group.isRequired) {
      continue;
    }
    const count = (selectedByGroup[group.id] ?? []).length;
    if (count === 0) {
      return false;
    }
    if (group.selectionType === "multiple") {
      const requiredCount = Math.min(
        group.maxSelect ?? group.options.length,
        allowedIds.length,
      );
      if (count < requiredCount) {
        return false;
      }
    }
  }
  return true;
}

export function EventAddOnConfiguratorModal({
  open,
  onOpenChange,
  item,
  cafeProduct,
  cafeProducts,
  modifierGroups,
  attributeGroups,
  inventoryProducts = [],
  existing,
  onDone,
  onRemove,
}: Readonly<EventAddOnConfiguratorModalProps>) {
  const addOn: AddOn | null = item?.bookingAddOn ?? null;
  const isComplex = addOn !== null && isComplexAddOn(addOn);
  const showCustomise =
    addOn !== null && isEventAddOnConfiguratorRequired(addOn, cafeProduct)

  const groups = useMemo(
    () =>
      cafeProduct
        ? modifierGroupsForProduct(cafeProduct, [...modifierGroups])
        : [],
    [cafeProduct, modifierGroups],
  );

  const chips = useMemo(
    () =>
      cafeProduct
        ? resolveAttributeOptionsForProduct(cafeProduct, [...attributeGroups])
        : [],
    [attributeGroups, cafeProduct],
  );

  const availableAttributeGroups = useMemo(() => {
    if (!cafeProduct) {
      return [];
    }
    return attributeGroups
      .map((group) => {
        const allowedIds = cafeProduct.attributeGroups[group.id] ?? [];
        const allowedOptions = group.options.filter((option) =>
          allowedIds.includes(option.id),
        );
        if (allowedOptions.length === 0) {
          return null;
        }
        return { group, allowedOptions };
      })
      .filter(
        (
          row,
        ): row is {
          group: AttributeGroup;
          allowedOptions: AttributeGroup["options"];
        } => Boolean(row),
      );
  }, [attributeGroups, cafeProduct]);

  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<string, string[]>
  >({});
  const [selectedAttributesByGroup, setSelectedAttributesByGroup] = useState<
    Record<string, string[]>
  >({});
  const [customerNote, setCustomerNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open || !item) {
      return;
    }
    setSelectedByGroup(
      existing?.selectedByGroup ?? defaultModifierSelections(groups),
    );
    setSelectedAttributesByGroup(
      existing?.selectedAttributesByGroup ??
        defaultAttributeSelections(cafeProduct, attributeGroups),
    );
    setCustomerNote(existing?.customerNote ?? "");
    setQuantity(clampEventAddOnQuantity(existing?.quantity ?? 1));
  }, [attributeGroups, cafeProduct, existing, groups, item, open]);

  const modifierTotal = useMemo(() => {
    if (!cafeProduct) {
      return 0;
    }
    let sum = 0;
    for (const group of groups) {
      const ids = selectedByGroup[group.id] ?? [];
      for (const id of ids) {
        const mod = group.modifiers.find((row) => row.id === id);
        if (mod) {
          sum += mod.priceDelta;
        }
      }
    }
    return sum;
  }, [cafeProduct, groups, selectedByGroup]);

  const basePrice = cafeProduct?.basePrice ?? addOn?.price ?? item?.price ?? 0;
  const unitPrice = Math.round((basePrice + modifierTotal) * 100) / 100;
  const safeQuantity = clampEventAddOnQuantity(quantity);
  const lineTotal = Math.round(unitPrice * safeQuantity * 100) / 100;
  const modifiersOk =
    groups.length === 0 || modifiersSatisfied(groups, selectedByGroup);
  const attributesOk = attributesSatisfied(
    cafeProduct,
    attributeGroups,
    selectedAttributesByGroup,
  );
  const canDone = modifiersOk && attributesOk;

  function decreaseQuantity(): void {
    setQuantity((prev) => clampEventAddOnQuantity(prev - 1));
  }

  function increaseQuantity(): void {
    setQuantity((prev) => clampEventAddOnQuantity(prev + 1));
  }

  function updateGroupSelections(groupId: string, next: string[]): void {
    setSelectedByGroup((prev) => ({ ...prev, [groupId]: next }));
  }

  function toggleAttributeSelection(
    group: AttributeGroup,
    optionId: string,
  ): void {
    setSelectedAttributesByGroup((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selectionType === "single") {
        return { ...prev, [group.id]: [optionId] };
      }
      const cap = Math.max(1, (group.maxSelect ?? group.options.length) || 1);
      if (!current.includes(optionId) && current.length >= cap) {
        return prev;
      }
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [group.id]: next };
    });
  }

  function handleDone(): void {
    if (!item || !addOn) {
      return;
    }
    const built = buildEventAddOnConfiguration(
      addOn,
      cafeProduct,
      modifierGroups,
      attributeGroups,
      {
        quantity: safeQuantity,
        selectedByGroup,
        selectedAttributesByGroup,
        customerNote,
      },
    );
    if (!built) {
      return;
    }
    onDone(item.id, built);
    onOpenChange(false);
  }

  if (!item || !addOn) {
    return null;
  }

  const categoryLabel = item.category.replace(/_/g, " ");
  const displayDescription = item.description.trim() || addOn.description;
  const heroImageUrl = resolveEventAddOnImageUrl(
    addOn,
    cafeProducts,
    inventoryProducts,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[98vw] max-w-3xl flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.pricingLabel}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative min-h-[200px] overflow-hidden rounded-xl border border-border bg-muted lg:min-h-[240px]">
              <Image
                src={heroImageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {categoryLabel}
                </p>
                <h2
                  className="text-2xl font-black text-foreground"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  {item.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {displayDescription}
                </p>
                {chips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <Badge key={chip.id} variant="secondary">
                        {chip.emoji.trim().length > 0 ? `${chip.emoji} ` : ""}
                        {chip.label}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p
                    className="text-2xl font-black text-foreground"
                    style={{ fontFamily: "var(--font-barlow)" }}
                  >
                    {formatPrice(isComplex ? unitPrice : addOn.price)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Quantity
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(unitPrice)} each
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          disabled={safeQuantity <= 1}
                          onClick={decreaseQuantity}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span
                          className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums"
                          aria-live="polite"
                        >
                          {safeQuantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={increaseQuantity}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-bold tabular-nums text-foreground">
                        Total: {formatPrice(lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {showCustomise ? (
            <Card className="mt-6">
              <CardContent className="space-y-6 p-6">
                <h3
                  className="text-lg font-black text-foreground"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  Customise
                </h3>
                {groups.map((group) => (
                  <CafeModifierGroup
                    key={group.id}
                    group={group}
                    selectedIds={selectedByGroup[group.id] ?? []}
                    onChange={(next) => updateGroupSelections(group.id, next)}
                  />
                ))}
                {availableAttributeGroups
                  .filter((row) => row.group.selectionType === "single")
                  .map((row) => (
                    <div
                      key={row.group.id}
                      className="space-y-2 rounded-lg border border-border p-4"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {row.group.name}
                        {row.group.isRequired ? (
                          <span className="ml-2 text-xs font-medium text-amber-600">
                            (required)
                          </span>
                        ) : null}
                      </p>
                      <div className="space-y-2">
                        {row.allowedOptions.map((option) => {
                          const selected =
                            selectedAttributesByGroup[row.group.id]?.includes(
                              option.id,
                            ) ?? false;
                          return (
                            <label
                              key={option.id}
                              className={cn(
                                "flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-border",
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  className="h-4 w-4 accent-primary"
                                  checked={selected}
                                  onChange={() =>
                                    toggleAttributeSelection(
                                      row.group,
                                      option.id,
                                    )
                                  }
                                  name={`evt-attr-${row.group.id}`}
                                />
                                <span>{option.label}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                {availableAttributeGroups.some(
                  (row) => row.group.selectionType === "multiple",
                ) ? (
                  <div className="space-y-3 rounded-lg border border-border p-4">
                    {availableAttributeGroups
                      .filter((row) => row.group.selectionType === "multiple")
                      .map((row) => (
                        <div key={row.group.id} className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            {row.group.name}
                          </p>
                          <div className="space-y-2">
                            {row.allowedOptions.map((option) => {
                              const selected =
                                selectedAttributesByGroup[
                                  row.group.id
                                ]?.includes(option.id) ?? false;
                              return (
                                <label
                                  key={option.id}
                                  className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-primary"
                                    checked={selected}
                                    onChange={() =>
                                      toggleAttributeSelection(
                                        row.group,
                                        option.id,
                                      )
                                    }
                                  />
                                  <span>{option.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label
                    htmlFor="evt-addon-note"
                    className="text-sm font-semibold text-foreground"
                  >
                    Notes (optional)
                  </label>
                  <Textarea
                    id="evt-addon-note"
                    value={customerNote}
                    onChange={(event) => setCustomerNote(event.target.value)}
                    placeholder="Special requests for this add-on"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-between">
          {existing && onRemove ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onRemove(item.id);
                onOpenChange(false);
              }}
            >
              Remove add-on
            </Button>
          ) : (
            <span />
          )}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={!canDone} onClick={handleDone}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
