/** Admin scheduling services — categories and service catalog backed by SchedulingProvider. */

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  Baby,
  ChevronsUpDown,
  CreditCard,
  GripVertical,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookingModeBadge } from "@/components/admin/booking-mode-badge";
import { CategoryPlacedPackagesSection } from "@/components/admin/category-placed-packages-section";
import { OpenPlayMembershipAdminSection } from "@/components/admin/open-play-membership-admin-section";
import { CrudModal } from "@/components/admin/crud-modal";
import { SchedulingCategoryImageField } from "@/components/admin/scheduling-category-image-field";
import { CustomerNavSettingsModal } from "@/components/admin/customer-nav-settings-modal";
import { EventTypeBadge } from "@/components/admin/event-type-badge";
import {
  EventBookingScheduleFields,
  type EventBookingScheduleDraft,
} from '@/components/admin/event-booking-schedule-fields'
import { EventTypeSelector } from "@/components/admin/event-type-selector";
import { ServiceTypeBadge } from "@/components/customer/service-type-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClients } from "@/lib/client-store";
import { imageUrlForApiPayload, isInlineImageDataUrl } from "@/lib/client-image-compression";
import { newAdminEntityId } from "@/lib/scheduling-admin-builders";
import {
  OPEN_BOOKING_SLOT_INCREMENT_OPTIONS,
  adminValueFromSlotIncrementMinutes,
  slotIncrementMinutesFromAdminValue,
} from "@/lib/open-booking-slot-windows";
import {
  createServiceCategory,
  listServiceCategories,
  updateServiceCategory,
  deleteServiceCategory,
} from "@/lib/services/service-categories";
import {
  createSchedulingService,
  updateSchedulingService,
} from "@/lib/services/scheduling-services";
import { isAdminApiReady } from "@/lib/api/client";
import {
  productTypeToCustomerNavKey,
  schedulingTopLevelToNavKey,
} from "@/lib/customer-nav-admin-map";
import type { CustomerNavLabelKey } from "@/lib/customer-nav-labels";
import { LABELS } from "@/lib/constants/ui-labels";
import { locations, samplePreschoolAddOns } from "@/lib/mock-data";
import {
  countCafeFoodProductsForInventoryCategory,
  listCafeFoodProductsForInventoryCategory,
} from "@/lib/cafe-utils";
import { useInventory } from "@/lib/inventory-store";
import {
  CATALOG_MENU_ORDER,
  catalogSlugFromProductType,
  catalogSlugFromSchedulingCategoryId,
  catalogSlugToSchedulingTopLevel,
  getCatalogMenuLabel,
  isProductCatalogSlug,
  isSchedulingCatalogSlug,
  normalizeCatalogSlug,
  type CatalogSlug,
  type SchedulingCatalogSlug,
} from "@/lib/catalog-slugs";
import {
  effectiveProductCategoryCatalogSlug,
  effectiveProductPlacementSlug,
  getSchedulingTopLevelIdFromCategory,
  patchProductSubCategoryPlacement,
  patchSchedulingCategoryPlacement,
  getProductSubCategoryMenuBucket,
  productSubCategoryAppearsUnderMenuSlug,
  resolveCatalogMenuTarget,
  schedulingCategoryAppearsUnderMenuSlug,
} from "@/lib/catalog-placement";
import {
  SCHEDULING_TOP_LEVEL_ORDER,
  getSchedulingTopLevelId,
  getSchedulingTopLevelLabel,
  isConsumerAlignedCategoryId,
  type SchedulingTopLevelId,
} from "@/lib/scheduling-consumer-categories";
import { showMaxPassCountAdminField } from "@/lib/booking-pass-count";
import { withoutOpenPlayPassCatalogServices } from "@/lib/open-play-pass-catalog";
import {
  resolveAdminCategoryPlacedPackages,
} from "@/lib/package-placement";
import { serviceSupportsAdminSlotCreation } from "@/lib/admin-scheduling-slot-actions";
import {
  buildAdminLearnServiceFormHref,
  isLearnCategoryId,
  isLearnSchedulingService,
} from "@/lib/learn-catalog";
import { isCurrentCatalogService } from "@/lib/scheduling-visibility";
import {
  isWeBringPlayCatalogServiceId,
  isWeBringPlaySchedulingCategoryId,
  WE_BRING_PLAY_CATEGORY_ID,
} from "@/lib/we-bring-play-offerings";
import { WE_BRING_PLAY_RENTAL_CATEGORY_ID } from "@/lib/we-bring-play-rental-products";
import {
  eventBookingScheduleDraftFromService,
  eventBookingSchedulePatchFromDraft,
} from "@/lib/event-booking-schedule";
import { useScheduling } from "@/lib/scheduling-store";
import {
  bookingAddOnToSchedulingAddOn,
  cn,
  formatPrice,
  getAgeRangeLabel,
  plainTextFromHtml,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  normalizeRentalAcknowledgmentFormRows,
  rentalAcknowledgmentsToFormRows,
} from "@/lib/rental-acknowledgments";
import { StockAdjustmentModal } from "@/components/admin/stock-adjustment-modal";
import type {
  SchedulingBookingMode,
  SchedulingCategory,
  EventVisibility,
  SchedulingService,
  SchedulingServiceAddOn,
  SchedulingServiceType,
  Product,
  ProductCategory,
} from "@/lib/types";
import {
  CATEGORY_ADD_ON_CHARGE_FREQUENCIES,
  EventBookingScheduleModeEnum,
  SchedulingServiceTypeEnum,
  type CategoryAddOnChargeFrequency,
} from "@/lib/types";

type EditDraft = EventBookingScheduleDraft & {
  categoryId: string;
  locationId: string;
  name: string;
  description: string;
  subscriptionPrice: string;
  requiresWaiver: boolean;
  requiredDocumentIds: string[];
  ageMin: string;
  ageMax: string;
  basePrice: string;
  capacity: string;
  durationMinutes: string;
  isActive: boolean;
  eventType: EventVisibility;
  minDurationMinutes: string;
  maxDurationMinutes: string;
  slotIncrementMinutes: string;
  maxConcurrent: string;
  minAdvanceHours: string;
  maxAdvanceHours: string;
  siblingPrice: string;
  freeAdultCount: string;
  maxPassCount: string;
  additionalAdultPrice: string;
  minSeats: string;
  pricePerHour: string;
  minChildSeats: string;
  maxChildSeats: string;
  minAdultSeats: string;
  maxAdultSeats: string;
  additionalChildPrice: string;
  isPackageService: boolean;
};

type CreateDraft = EditDraft & {
  categoryId: string;
  serviceType: SchedulingServiceType;
  bookingMode: SchedulingBookingMode;
  eventType: EventVisibility;
  pendingServiceAddOnLinks: {
    addOnId: string;
    addOnName?: string;
    isFree: boolean;
    quantity: string;
    unitPrice: string;
    chargeFrequency: CategoryAddOnChargeFrequency;
  }[];
};

type CategoryDraft = {
  menuCatalogSlug: CatalogSlug;
  parentTopLevelId: SchedulingTopLevelId;
  name: string;
  icon: string;
  imageUrl: string;
  displayOrder: string;
  isActive: boolean;
  description: string;
  requiresAttendee: boolean;
  membersOnly: boolean;
  freeInfantMonths: string;
  depositPercent: string;
  specialInstructionsEnabled: boolean;
  waitlistEnabled: boolean;
  allowFamilyMember: boolean;
  requireCheckInBeforeRebook: boolean;
  pendingAddOnLinks: {
    addOnId: string;
    addOnName?: string;
    isFree: boolean;
    quantity: string;
    unitPrice: string;
    chargeFrequency: CategoryAddOnChargeFrequency;
  }[];
};

const allServiceTypes = Object.values(SchedulingServiceTypeEnum);
const ALL_CATEGORIES_VALUE = "all";

function slugifyCategoryName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type CatalogView = "services" | "products";

export default function AdminSchedulingServicesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading services...</div>}>
      <AdminSchedulingServicesPageContent />
    </Suspense>
  );
}

function AdminSchedulingServicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { documents } = useClients();
  const {
    bookingAddOns,
    products,
    productCategories,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
    updateProduct,
    deleteProduct,
    promoteProductToAddOn,
    delinkBookingAddOnFromProduct,
  } = useInventory();
  const { toast } = useToast();
  const {
    categories,
    addCategory,
    removeCategory,
    updateCategory,
    services,
    addService,
    updateService,
    packages,
    linkSchedulingAddOn,
    unlinkSchedulingAddOn,
    setSchedulingAddOnFree,
  } = useScheduling();
  const [categoriesLoadError] = useState<string | null>(null);
  const sortedCategories = useMemo<SchedulingCategory[]>(() => {
    return categories
      .filter((category) => isConsumerAlignedCategoryId(category.id))
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories]);

  const alignedServices = useMemo<SchedulingService[]>(() => {
    return withoutOpenPlayPassCatalogServices(services).filter(
      (service) =>
        isConsumerAlignedCategoryId(service.categoryId) &&
        isCurrentCatalogService(service.id) &&
        !isWeBringPlayCatalogServiceId(service.id),
    );
  }, [services]);

  const [categoryId, setCategoryId] = useState<string>(
    sortedCategories[0]?.id ?? "",
  );
  const [serviceCategoryFilterId, setServiceCategoryFilterId] = useState<
    string | "ALL"
  >(sortedCategories[0]?.id ?? "ALL");

  const [catalogView, setCatalogView] = useState<CatalogView>("services");
  const [customerNavModal, setCustomerNavModal] = useState<{
    navKey: CustomerNavLabelKey;
    sectionLabel: string;
  } | null>(null);
  const [selectedProductMenuCategoryId, setSelectedProductMenuCategoryId] =
    useState<string | null>(null);
  const [draggingProductMenuCategoryId, setDraggingProductMenuCategoryId] =
    useState<string | null>(null);
  const [dragOverProductMenuCategoryId, setDragOverProductMenuCategoryId] =
    useState<string | null>(null);

  const [productSubCategoryFormOpen, setProductSubCategoryFormOpen] =
    useState(false);
  const [productSubCategoryName, setProductSubCategoryName] = useState("");
  const [productSubCategoryImageUrl, setProductSubCategoryImageUrl] = useState("");
  const [productSubCategoryIsActive, setProductSubCategoryIsActive] =
    useState(true);
  const [productSubCategoryParentId, setProductSubCategoryParentId] = useState<
    string | null
  >(null);
  const [productSubCategoryMenuSlug, setProductSubCategoryMenuSlug] =
    useState<CatalogSlug>("shop");
  const [dragOverMenuSlug, setDragOverMenuSlug] = useState<CatalogSlug | null>(
    null,
  );
  const [editingProductSubCategoryId, setEditingProductSubCategoryId] =
    useState<string | null>(null);
  const [productSubCategoryAcknowledgmentRows, setProductSubCategoryAcknowledgmentRows] =
    useState<{ text: string; detailUrl: string }[]>([]);
  const [deleteProductSubCategoryId, setDeleteProductSubCategoryId] = useState<
    string | null
  >(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  const [selected, setSelected] = useState<SchedulingService | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(
    null,
  );
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(
    null,
  );
  const [packageDisableConfirmOpen, setPackageDisableConfirmOpen] =
    useState(false);
  const [categoryAddOnOpen, setCategoryAddOnOpen] = useState(false);
  const [createAddOnOpen, setCreateAddOnOpen] = useState(false);
  const [editAddOnOpen, setEditAddOnOpen] = useState(false);
  const [linkAddOnModalOpen, setLinkAddOnModalOpen] = useState(false);
  const [linkAddOnTarget, setLinkAddOnTarget] = useState<
    "category" | "create" | "edit" | null
  >(null);
  const [categoryPendingAddOnId, setCategoryPendingAddOnId] = useState("");
  const [createPendingAddOnId, setCreatePendingAddOnId] = useState("");
  const [editPendingAddOnId, setEditPendingAddOnId] = useState("");
  const [linkAddOnId, setLinkAddOnId] = useState("");
  const [linkAddOnName, setLinkAddOnName] = useState("");
  const [linkAddOnUnitPrice, setLinkAddOnUnitPrice] = useState("");
  const [linkAddOnIsFree, setLinkAddOnIsFree] = useState(false);
  const [linkAddOnQuantity, setLinkAddOnQuantity] = useState("1");
  const [linkAddOnChargeFrequency, setLinkAddOnChargeFrequency] =
    useState<CategoryAddOnChargeFrequency>("ONE_TIME");
  const [editDraft, setEditDraft] = useState<EditDraft>({
    categoryId: sortedCategories[0]?.id ?? "",
    locationId: locations[0]?.id ?? "loc-1",
    name: "",
    description: "",
    subscriptionPrice: "",
    requiresWaiver: false,
    requiredDocumentIds: [],
    ageMin: "",
    ageMax: "",
    basePrice: "",
    capacity: "",
    durationMinutes: "",
    isActive: true,
    eventType: "PUBLIC",
    minDurationMinutes: "",
    maxDurationMinutes: "",
    slotIncrementMinutes: "none",
    maxConcurrent: "",
    minAdvanceHours: "",
    maxAdvanceHours: "",
    siblingPrice: "",
    freeAdultCount: "2",
    maxPassCount: "",
    additionalAdultPrice: "",
    minSeats: "1",
    pricePerHour: "",
    minChildSeats: "",
    maxChildSeats: "",
    minAdultSeats: "",
    maxAdultSeats: "",
    additionalChildPrice: "",
    isPackageService: false,
    eventBookingScheduleMode: EventBookingScheduleModeEnum.PER_EVENT,
  });
  const [createProgramArea, setCreateProgramArea] = useState<SchedulingTopLevelId>(
    () => getSchedulingTopLevelId(sortedCategories[0]?.id ?? "cat-gym-babies"),
  );
  const [editProgramArea, setEditProgramArea] = useState<SchedulingTopLevelId>("GYM");
  const [createDraft, setCreateDraft] = useState<CreateDraft>({
    categoryId: sortedCategories[0]?.id ?? "",
    serviceType: "GYM_CLASS",
    bookingMode: "SCHEDULED",
    eventType: "PUBLIC",
    locationId: locations[0]?.id ?? "loc-1",
    name: "",
    description: "",
    subscriptionPrice: "",
    requiresWaiver: false,
    requiredDocumentIds: [],
    ageMin: "",
    ageMax: "",
    basePrice: "",
    capacity: "",
    durationMinutes: "60",
    isActive: true,
    minDurationMinutes: "",
    maxDurationMinutes: "",
    slotIncrementMinutes: "none",
    maxConcurrent: "",
    minAdvanceHours: "",
    maxAdvanceHours: "",
    siblingPrice: "",
    freeAdultCount: "2",
    maxPassCount: "",
    additionalAdultPrice: "",
    minSeats: "1",
    pricePerHour: "",
    minChildSeats: "",
    maxChildSeats: "",
    minAdultSeats: "",
    maxAdultSeats: "",
    additionalChildPrice: "",
    isPackageService: false,
    eventBookingScheduleMode: EventBookingScheduleModeEnum.PER_EVENT,
    pendingServiceAddOnLinks: [],
  });

  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({
    menuCatalogSlug: "gym",
    parentTopLevelId: "GYM",
    name: "",
    icon: "",
    imageUrl: "",
    displayOrder: String(
      (sortedCategories[sortedCategories.length - 1]?.displayOrder ?? 0) + 1,
    ),
    isActive: true,
    description: "",
    requiresAttendee: false,
    membersOnly: false,
    freeInfantMonths: "",
    depositPercent: "",
    specialInstructionsEnabled: false,
    waitlistEnabled: true,
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    pendingAddOnLinks: [],
  });

  const isWeBringRentalAdminSelection = useMemo(
    () =>
      isWeBringPlaySchedulingCategoryId(serviceCategoryFilterId) ||
      selectedProductMenuCategoryId === WE_BRING_PLAY_RENTAL_CATEGORY_ID,
    [serviceCategoryFilterId, selectedProductMenuCategoryId],
  );

  const effectiveCatalogView: CatalogView = useMemo(
    () => (isWeBringRentalAdminSelection ? "products" : catalogView),
    [catalogView, isWeBringRentalAdminSelection],
  );

  const effectiveSelectedProductMenuCategoryId = useMemo(() => {
    if (isWeBringRentalAdminSelection) {
      return WE_BRING_PLAY_RENTAL_CATEGORY_ID;
    }
    return selectedProductMenuCategoryId;
  }, [isWeBringRentalAdminSelection, selectedProductMenuCategoryId]);

  const playSchedulingCategoryFallbackId = useMemo(() => {
    return (
      sortedCategories.find(
        (category) =>
          getSchedulingTopLevelId(category.id) === "PLAY" &&
          !isWeBringPlaySchedulingCategoryId(category.id),
      )?.id ?? sortedCategories[0]?.id ?? ""
    );
  }, [sortedCategories]);

  const contextualReturnTo = useMemo(() => {
    const params = new URLSearchParams();
    if (isWeBringRentalAdminSelection) {
      params.set("catalogView", "products");
      params.set("productCategoryId", WE_BRING_PLAY_RENTAL_CATEGORY_ID);
      if (playSchedulingCategoryFallbackId) {
        params.set("categoryId", playSchedulingCategoryFallbackId);
        params.set("serviceCategoryFilterId", playSchedulingCategoryFallbackId);
      }
      return `/admin/scheduling/services?${params.toString()}`;
    }
    params.set("catalogView", catalogView);
    params.set("categoryId", categoryId);
    params.set("serviceCategoryFilterId", serviceCategoryFilterId);
    if (selectedProductMenuCategoryId) {
      params.set("productCategoryId", selectedProductMenuCategoryId);
    }
    return `/admin/scheduling/services?${params.toString()}`;
  }, [
    catalogView,
    categoryId,
    isWeBringRentalAdminSelection,
    playSchedulingCategoryFallbackId,
    selectedProductMenuCategoryId,
    serviceCategoryFilterId,
  ]);

  useEffect(() => {
    if (!sortedCategories.length) return;
    const hasCurrent = sortedCategories.some(
      (category) => category.id === categoryId,
    );
    if (!hasCurrent) {
      setCategoryId(sortedCategories[0].id);
      setCreateDraft((draft) => ({
        ...draft,
        categoryId: sortedCategories[0].id,
      }));
    }
  }, [categoryId, sortedCategories]);

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (serviceCategoryFilterId === "ALL") {
      setServiceCategoryFilterId(sortedCategories[0].id);
      return;
    }
    const exists = sortedCategories.some(
      (category) => category.id === serviceCategoryFilterId,
    );
    if (!exists) {
      setServiceCategoryFilterId("ALL");
    }
  }, [serviceCategoryFilterId, sortedCategories]);

  useEffect(() => {
    if (!sortedCategories.length) return;

    const requestedCatalogView = searchParams.get("catalogView");
    const requestedCategoryId = searchParams.get("categoryId");
    const requestedFilterId = searchParams.get("serviceCategoryFilterId");
    const requestedProductCategoryId = searchParams.get("productCategoryId");

    let nextCatalogView: CatalogView = "services";
    if (
      requestedCatalogView === "services" ||
      requestedCatalogView === "products"
    ) {
      nextCatalogView = requestedCatalogView;
    }

    let nextCategoryId = sortedCategories[0]?.id ?? "";
    if (
      requestedCategoryId &&
      sortedCategories.some((category) => category.id === requestedCategoryId)
    ) {
      nextCategoryId = requestedCategoryId;
    }

    let nextFilterId: string | "ALL" = sortedCategories[0]?.id ?? "ALL";
    if (requestedFilterId === "ALL") {
      nextFilterId = "ALL";
    } else if (
      requestedFilterId &&
      sortedCategories.some((category) => category.id === requestedFilterId)
    ) {
      nextFilterId = requestedFilterId;
    }

    let nextProductCategoryId: string | null = null;
    if (
      requestedProductCategoryId &&
      productCategories.some(
        (category) => category.id === requestedProductCategoryId,
      )
    ) {
      nextProductCategoryId = requestedProductCategoryId;
    }

    const weBringFromUrl =
      isWeBringPlaySchedulingCategoryId(nextFilterId) ||
      nextProductCategoryId === WE_BRING_PLAY_RENTAL_CATEGORY_ID;

    if (weBringFromUrl) {
      nextCatalogView = "products";
      nextProductCategoryId = WE_BRING_PLAY_RENTAL_CATEGORY_ID;
      if (isWeBringPlaySchedulingCategoryId(nextFilterId)) {
        nextFilterId = playSchedulingCategoryFallbackId || nextFilterId;
        nextCategoryId = playSchedulingCategoryFallbackId || nextCategoryId;
      }
    }

    setCatalogView(nextCatalogView);
    setCategoryId(nextCategoryId);
    setServiceCategoryFilterId(nextFilterId);
    setSelectedProductMenuCategoryId(nextProductCategoryId);
  }, [
    playSchedulingCategoryFallbackId,
    productCategories,
    searchParams,
    sortedCategories,
  ]);

  useEffect(() => {
    if (!isWeBringPlaySchedulingCategoryId(serviceCategoryFilterId)) {
      return;
    }
    setCatalogView("products");
    setSelectedProductMenuCategoryId(WE_BRING_PLAY_RENTAL_CATEGORY_ID);
    if (playSchedulingCategoryFallbackId) {
      setServiceCategoryFilterId(playSchedulingCategoryFallbackId);
      setCategoryId(playSchedulingCategoryFallbackId);
    }
  }, [
    playSchedulingCategoryFallbackId,
    serviceCategoryFilterId,
  ]);

  const filtered = useMemo(() => {
    return alignedServices.filter((service) => {
      if (
        serviceCategoryFilterId !== "ALL" &&
        service.categoryId !== serviceCategoryFilterId
      ) {
        return false;
      }
      return true;
    });
  }, [alignedServices, serviceCategoryFilterId]);

  const catalogSupportsSlotCreation = useMemo(
    () => filtered.some(serviceSupportsAdminSlotCreation),
    [filtered],
  );

  const categoriesByTopLevel = useMemo<
    Record<SchedulingTopLevelId, SchedulingCategory[]>
  >(() => {
    const grouped: Record<SchedulingTopLevelId, SchedulingCategory[]> = {
      GYM: [],
      PLAY: [],
      EVENT: [],
      LEARN: [],
    };
    for (const category of sortedCategories) {
      grouped[getSchedulingTopLevelId(category.id)].push(category);
    }
    return grouped;
  }, [sortedCategories]);

  const totalServicesByTopLevel = useMemo<
    Record<SchedulingTopLevelId, number>
  >(() => {
    const counts: Record<SchedulingTopLevelId, number> = {
      GYM: 0,
      PLAY: 0,
      EVENT: 0,
      LEARN: 0,
    };
    for (const service of alignedServices) {
      counts[getSchedulingTopLevelId(service.categoryId)] += 1;
    }
    return counts;
  }, [alignedServices]);

  useEffect(() => {
    if (!selected) return;
    setEditProgramArea(getSchedulingTopLevelId(selected.categoryId));
    setEditDraft({
      categoryId: selected.categoryId,
      locationId: selected.locationId ?? locations[0]?.id ?? "loc-1",
      name: selected.name,
      description: selected.description ?? "",
      subscriptionPrice:
        selected.subscriptionPrice != null
          ? String(selected.subscriptionPrice)
          : "",
      requiresWaiver: selected.requiresWaiver,
      requiredDocumentIds: selected.requiredDocumentIds?.slice() ?? [],
      ageMin: selected.ageMin != null ? String(selected.ageMin) : "",
      ageMax: selected.ageMax != null ? String(selected.ageMax) : "",
      basePrice: String(selected.basePrice),
      capacity: String(selected.capacity),
      durationMinutes: String(selected.durationMinutes),
      isActive: selected.isActive,
      eventType: selected.eventType ?? "PUBLIC",
      minDurationMinutes:
        selected.minDurationMinutes != null
          ? String(selected.minDurationMinutes)
          : "",
      maxDurationMinutes:
        selected.maxDurationMinutes != null
          ? String(selected.maxDurationMinutes)
          : "",
      slotIncrementMinutes: adminValueFromSlotIncrementMinutes(
        selected.slotIncrementMinutes,
      ),
      maxConcurrent:
        selected.maxConcurrent != null ? String(selected.maxConcurrent) : "",
      minAdvanceHours:
        selected.minAdvanceHours != null
          ? String(selected.minAdvanceHours)
          : "",
      maxAdvanceHours:
        selected.maxAdvanceHours != null
          ? String(selected.maxAdvanceHours)
          : "",
      siblingPrice: selected.siblingPrice ?? "",
      freeAdultCount:
        selected.freeAdultCount != null ? String(selected.freeAdultCount) : "2",
      maxPassCount:
        selected.maxPassCount != null ? String(selected.maxPassCount) : "",
      additionalAdultPrice: selected.additionalAdultPrice ?? "",
      minSeats: selected.minSeats != null ? String(selected.minSeats) : "1",
      pricePerHour: selected.pricePerHour ?? "",
      minChildSeats:
        selected.minChildSeats != null ? String(selected.minChildSeats) : "",
      maxChildSeats:
        selected.maxChildSeats != null ? String(selected.maxChildSeats) : "",
      minAdultSeats:
        selected.minAdultSeats != null ? String(selected.minAdultSeats) : "",
      maxAdultSeats:
        selected.maxAdultSeats != null ? String(selected.maxAdultSeats) : "",
      additionalChildPrice: selected.additionalChildPrice ?? "",
      isPackageService: selected.isPackageService ?? false,
      ...eventBookingScheduleDraftFromService(selected),
    });
  }, [selected]);

  const createSubCategories = useMemo(
    () =>
      sortedCategories.filter(
        (category) => getSchedulingTopLevelId(category.id) === createProgramArea,
      ),
    [createProgramArea, sortedCategories],
  );

  const editSubCategories = useMemo(
    () =>
      sortedCategories.filter(
        (category) => getSchedulingTopLevelId(category.id) === editProgramArea,
      ),
    [editProgramArea, sortedCategories],
  );

  useEffect(() => {
    if (createSubCategories.some((category) => category.id === createDraft.categoryId)) {
      return;
    }
    const fallback = createSubCategories[0]?.id ?? "";
    if (!fallback) {
      return;
    }
    setCreateDraft((draft) => ({ ...draft, categoryId: fallback }));
  }, [createDraft.categoryId, createSubCategories]);

  useEffect(() => {
    if (editSubCategories.some((category) => category.id === editDraft.categoryId)) {
      return;
    }
    const fallback = editSubCategories[0]?.id ?? "";
    if (!fallback) {
      return;
    }
    setEditDraft((draft) => ({ ...draft, categoryId: fallback }));
  }, [editDraft.categoryId, editSubCategories]);

  function handleCreateProgramAreaChange(next: SchedulingTopLevelId): void {
    setCreateProgramArea(next);
    setCreateDraft((draft) => {
      const subs = sortedCategories.filter(
        (category) => getSchedulingTopLevelId(category.id) === next,
      );
      const keep = subs.some((category) => category.id === draft.categoryId);
      return {
        ...draft,
        categoryId: keep ? draft.categoryId : (subs[0]?.id ?? draft.categoryId),
      };
    });
  }

  function handleEditProgramAreaChange(next: SchedulingTopLevelId): void {
    setEditProgramArea(next);
    setEditDraft((draft) => {
      const subs = sortedCategories.filter(
        (category) => getSchedulingTopLevelId(category.id) === next,
      );
      const keep = subs.some((category) => category.id === draft.categoryId);
      return {
        ...draft,
        categoryId: keep ? draft.categoryId : (subs[0]?.id ?? draft.categoryId),
      };
    });
  }

  const addOnCatalog = useMemo(() => {
    const map = new Map<string, SchedulingServiceAddOn>();
    for (const s of alignedServices) {
      for (const a of s.addOns ?? []) {
        if (a.isActive) {
          map.set(a.id, a);
        }
      }
    }
    for (const a of samplePreschoolAddOns) {
      map.set(a.id, a);
    }
    for (const a of bookingAddOns) {
      if (!a.isActive) continue;
      map.set(a.id, bookingAddOnToSchedulingAddOn(a));
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [bookingAddOns, alignedServices]);

  const selectedLinkAddOn = useMemo(() => {
    if (!linkAddOnId) return null;
    return addOnCatalog.find((entry) => entry.id === linkAddOnId) ?? null;
  }, [addOnCatalog, linkAddOnId]);

  function beginLinkAddOnFlow(
    target: "category" | "create" | "edit",
    addOn: SchedulingServiceAddOn,
  ): void {
    if (target === "category") {
      setCategoryAddOnOpen(false);
    } else if (target === "create") {
      setCreateAddOnOpen(false);
    } else {
      setEditAddOnOpen(false);
    }
    setLinkAddOnTarget(target);
    setLinkAddOnId(addOn.id);
    setLinkAddOnName(addOn.name);
    setLinkAddOnQuantity("1");
    setLinkAddOnIsFree(false);
    setLinkAddOnUnitPrice(String(Number(addOn.price.toFixed(2))));
    setLinkAddOnChargeFrequency("ONE_TIME");
    setLinkAddOnModalOpen(true);
  }

  function openLinkModalForTarget(
    target: "category" | "create" | "edit",
  ): void {
    const addOnId =
      target === "category"
        ? categoryPendingAddOnId
        : target === "create"
          ? createPendingAddOnId
          : editPendingAddOnId;
    if (!addOnId) return;
    const addOn = addOnCatalog.find((entry) => entry.id === addOnId);
    if (!addOn) return;
    beginLinkAddOnFlow(target, addOn);
  }

  function confirmLinkAddOnFlow(): void {
    if (!linkAddOnTarget || !linkAddOnId) return;
    const quantity = Number.parseInt(linkAddOnQuantity, 10);
    const unitPrice = linkAddOnIsFree
      ? 0
      : Number.parseFloat(linkAddOnUnitPrice);
    if (
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      !Number.isFinite(unitPrice)
    ) {
      return;
    }

    if (linkAddOnTarget === "category") {
      setCategoryDraft((draft) => ({
        ...draft,
        pendingAddOnLinks: [
          ...draft.pendingAddOnLinks,
          {
            addOnId: linkAddOnId,
            addOnName: linkAddOnName || selectedLinkAddOn?.name,
            isFree: linkAddOnIsFree,
            quantity: String(quantity),
            unitPrice: Number(unitPrice).toFixed(2),
            chargeFrequency: linkAddOnChargeFrequency,
          },
        ],
      }));
      setCategoryAddOnOpen(false);
      setCategoryPendingAddOnId("");
    } else if (linkAddOnTarget === "create") {
      setCreateDraft((draft) => ({
        ...draft,
        pendingServiceAddOnLinks: [
          ...draft.pendingServiceAddOnLinks,
          {
            addOnId: linkAddOnId,
            addOnName: linkAddOnName || selectedLinkAddOn?.name,
            isFree: linkAddOnIsFree,
            quantity: String(quantity),
            unitPrice: Number(unitPrice).toFixed(2),
            chargeFrequency: linkAddOnChargeFrequency,
          },
        ],
      }));
      setCreateAddOnOpen(false);
      setCreatePendingAddOnId("");
    } else if (linkAddOnTarget === "edit" && selected) {
      linkSchedulingAddOn(
        "service",
        selected.id,
        linkAddOnId,
        linkAddOnName,
        linkAddOnIsFree,
        {
          quantity,
          unitPrice,
          chargeFrequency: linkAddOnChargeFrequency,
        },
      );
      setEditAddOnOpen(false);
      setEditPendingAddOnId("");
    }

    setLinkAddOnModalOpen(false);
    setLinkAddOnTarget(null);
    setLinkAddOnId("");
    setLinkAddOnName("");
    setLinkAddOnIsFree(false);
  }

  const waiverDocs = useMemo(() => {
    return documents.filter((d) => d.documentType === "WAIVER");
  }, [documents]);

  function parseOptionalInt(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseInt(trimmed, 10);
    return Number.isFinite(n) ? n : null;
  }

  function parseOptionalFloat(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseFloat(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of alignedServices) {
      map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1);
    }
    return map;
  }, [alignedServices]);

  const selectedCategory = useMemo(() => {
    return (
      sortedCategories.find((c) => c.id === categoryId) ??
      sortedCategories[0] ??
      null
    );
  }, [sortedCategories, categoryId]);

  const productRootMenuCategories = useMemo(() => {
    const rootCategories = productCategories.filter(
      (c) => (c.parentId ?? null) === null,
    );
    return CATALOG_MENU_ORDER.filter((entry) => entry.kind === "product")
      .map((entry) => {
        const expectedType = catalogSlugFromProductType(entry.slug);
        return (
          rootCategories
            .filter(
              (c) =>
                catalogSlugFromProductType(c.productType ?? "shop") ===
                expectedType,
            )
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)[0] ?? null
        );
      })
      .filter((c): c is ProductCategory => c != null);
  }, [productCategories]);

  const productRootBySlug = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const root of productRootMenuCategories) {
      const slug = catalogSlugFromProductType(root.productType ?? "shop");
      out[slug] = root.id;
    }
    return out;
  }, [productRootMenuCategories]);

  const schedulingRowsByMenuSlug = useMemo(() => {
    const out: Partial<Record<CatalogSlug, SchedulingCategory[]>> = {};
    for (const entry of CATALOG_MENU_ORDER) {
      const rows = sortedCategories
        .filter(
          (category) =>
            !isWeBringPlaySchedulingCategoryId(category.id) &&
            schedulingCategoryAppearsUnderMenuSlug(
              category,
              entry.slug,
              productRootBySlug,
              productCategories,
            ),
        )
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder);
      if (rows.length > 0) {
        out[entry.slug] = rows;
      }
    }
    return out;
  }, [sortedCategories, productRootBySlug]);

  const productSubRowsByMenuSlug = useMemo(() => {
    const out: Partial<Record<CatalogSlug, ProductCategory[]>> = {};
    for (const entry of CATALOG_MENU_ORDER) {
      const rootId = isProductCatalogSlug(entry.slug)
        ? productRootBySlug[entry.slug]
        : undefined;
      const rows = productCategories
        .filter((category) => {
          if ((category.parentId ?? null) === null) {
            return false
          }
          const bucket = getProductSubCategoryMenuBucket(
            category,
            productRootBySlug,
          )
          if (bucket === entry.slug) {
            return true
          }
          return productSubCategoryAppearsUnderMenuSlug(
            category,
            entry.slug,
            rootId,
            isSchedulingCatalogSlug(entry.slug),
          )
        })
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder);
      if (rows.length > 0) {
        out[entry.slug] = rows;
      }
    }
    return out;
  }, [productCategories, productRootBySlug]);

  const productCategoryById = useMemo(() => {
    return new Map(productCategories.map((c) => [c.id, c]));
  }, [productCategories]);

  const productSubCategoryModalParent = useMemo(() => {
    if (!productSubCategoryParentId) return null;
    return productCategoryById.get(productSubCategoryParentId) ?? null;
  }, [productCategoryById, productSubCategoryParentId]);

  const isRentalProductSubCategoryModal = useMemo(() => {
    if (editingProductSubCategoryId) {
      const row = productCategoryById.get(editingProductSubCategoryId) ?? null;
      return row != null && effectiveProductCategoryCatalogSlug(row) === "rentals";
    }
    return (
      productSubCategoryModalParent != null &&
      effectiveProductCategoryCatalogSlug(productSubCategoryModalParent) ===
        "rentals"
    );
  }, [
    editingProductSubCategoryId,
    productCategoryById,
    productSubCategoryModalParent,
  ]);

  const productFormCategories = useMemo(() => {
    return productCategories
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [productCategories]);

  const selectedProductMenuCategory = useMemo(() => {
    if (!effectiveSelectedProductMenuCategoryId) return null;
    return (
      productCategoryById.get(effectiveSelectedProductMenuCategoryId) ?? null
    );
  }, [effectiveSelectedProductMenuCategoryId, productCategoryById]);

  const productsInSelectedMenu = useMemo(() => {
    if (!effectiveSelectedProductMenuCategoryId) return [];
    const category = productCategoryById.get(
      effectiveSelectedProductMenuCategoryId,
    );
    const isCafeMenu =
      (category?.productType ?? "").toLowerCase() === "cafe&food";
    if (isCafeMenu) {
      return listCafeFoodProductsForInventoryCategory(
        products,
        effectiveSelectedProductMenuCategoryId,
        productCategories,
      );
    }
    return products.filter(
      (p) =>
        p.isActive &&
        p.categoryId === effectiveSelectedProductMenuCategoryId,
    );
  }, [
    effectiveSelectedProductMenuCategoryId,
    productCategoryById,
    products,
  ]);

  const productTypeProductCountsByRootId = useMemo(() => {
    const out = new Map<string, number>();
    for (const root of productRootMenuCategories) {
      const menuSlug = catalogSlugFromProductType(root.productType ?? "shop");
      const subIds = (productSubRowsByMenuSlug[menuSlug] ?? [])
        .filter((sub) => {
          const nativeParent = sub.parentId ?? null;
          return nativeParent === root.id || sub.placementParentId === root.id;
        })
        .map((c) => c.id);
      const isCafeRoot =
        (root.productType ?? "").toLowerCase() === "cafe&food";
      const count = isCafeRoot
        ? products.filter(
            (p) =>
              p.isActive &&
              subIds.includes(p.categoryId) &&
              (p.id.startsWith("prod-cafe-") || p.id.startsWith("cp-")),
          ).length
        : products.filter(
            (p) => p.isActive && subIds.includes(p.categoryId),
          ).length;
      out.set(root.id, count);
    }
    return out;
  }, [
    productCategories,
    productRootMenuCategories,
    productSubRowsByMenuSlug,
    products,
  ]);

  const productMenuTitle = selectedProductMenuCategory?.name ?? "Products";
  const productMenuCountLabel = selectedProductMenuCategory
    ? `${productsInSelectedMenu.length} products`
    : `${products.filter((p) => p.isActive).length} products`;
  const selectedProductMenuCanonicalSlug = useMemo(() => {
    if (!selectedProductMenuCategory) return null;
    return effectiveProductCategoryCatalogSlug(selectedProductMenuCategory);
  }, [selectedProductMenuCategory]);

  const isSelectedProductMenuGifts = selectedProductMenuCanonicalSlug === "gifts";
  const isSelectedProductMenuCafeAndFood =
    selectedProductMenuCanonicalSlug === "cafe-food";
  const isSelectedProductMenuRentals =
    selectedProductMenuCanonicalSlug === "rentals";
  const isSelectedProductMenuShop = selectedProductMenuCanonicalSlug === "shop";

  const catalogTitle = useMemo(() => {
    if (serviceCategoryFilterId === "ALL") {
      return "Catalog";
    }
    return (
      sortedCategories.find(
        (category) => category.id === serviceCategoryFilterId,
      )?.name ?? "Catalog"
    );
  }, [serviceCategoryFilterId, sortedCategories]);

  const categoryPlacedPackages = useMemo(
    () => resolveAdminCategoryPlacedPackages(serviceCategoryFilterId),
    [serviceCategoryFilterId],
  );

  const topLevelCount = useMemo(() => {
    return SCHEDULING_TOP_LEVEL_ORDER.filter(
      (topLevelId) => categoriesByTopLevel[topLevelId].length > 0,
    ).length;
  }, [categoriesByTopLevel]);

  const catalogCountLabel = useMemo(() => {
    if (serviceCategoryFilterId !== "ALL") {
      return `${filtered.length} services`;
    }
    return `${topLevelCount}/${alignedServices.length} services`;
  }, [
    serviceCategoryFilterId,
    filtered.length,
    topLevelCount,
    alignedServices.length,
  ]);

  const createServiceCategoryId =
    serviceCategoryFilterId !== "ALL" ? serviceCategoryFilterId : categoryId;

  const createServiceFormHref = useMemo(() => {
    if (isLearnCategoryId(createServiceCategoryId)) {
      return buildAdminLearnServiceFormHref({
        categoryId: createServiceCategoryId,
        returnTo: contextualReturnTo,
      });
    }
    return `/admin/scheduling/services/new?categoryId=${encodeURIComponent(createServiceCategoryId)}&returnTo=${encodeURIComponent(contextualReturnTo)}`;
  }, [contextualReturnTo, createServiceCategoryId]);

  function resolveEditServiceFormHref(service: (typeof filtered)[number]): string {
    if (isLearnSchedulingService(service)) {
      return buildAdminLearnServiceFormHref({
        serviceId: service.id,
        returnTo: contextualReturnTo,
      });
    }
    return `/admin/scheduling/services/new?serviceId=${encodeURIComponent(service.id)}&returnTo=${encodeURIComponent(contextualReturnTo)}`;
  }

  const selectedLive = useMemo(() => {
    if (!selected) return null;
    return alignedServices.find((s) => s.id === selected.id) ?? selected;
  }, [selected, alignedServices]);

  function persistEdit() {
    if (!selected) return;
    const basePrice = parseFloat(editDraft.basePrice);
    const capacity = parseInt(editDraft.capacity, 10);
    const durationMinutes = parseInt(editDraft.durationMinutes, 10);
    const subscriptionPrice = parseOptionalFloat(editDraft.subscriptionPrice);
    const ageMin = parseOptionalInt(editDraft.ageMin);
    const ageMax = parseOptionalInt(editDraft.ageMax);
    const minDurationMinutes = parseOptionalInt(editDraft.minDurationMinutes);
    const maxDurationMinutes = parseOptionalInt(editDraft.maxDurationMinutes);
    const slotIncrementMinutes = slotIncrementMinutesFromAdminValue(
      editDraft.slotIncrementMinutes,
    );
    const maxConcurrent = parseOptionalInt(editDraft.maxConcurrent);
    const minAdvanceHours = parseOptionalInt(editDraft.minAdvanceHours);
    const maxAdvanceHours = parseOptionalInt(editDraft.maxAdvanceHours);
    const freeAdultParsed = parseOptionalInt(editDraft.freeAdultCount);
    const freeAdultCount =
      freeAdultParsed != null && freeAdultParsed >= 0 && freeAdultParsed <= 20
        ? freeAdultParsed
        : 2;
    const minSeatsParsed = parseOptionalInt(editDraft.minSeats);
    const minSeats =
      minSeatsParsed != null && minSeatsParsed >= 1 ? minSeatsParsed : 1;
    const minChildSeats = parseOptionalInt(editDraft.minChildSeats);
    const maxChildSeats = parseOptionalInt(editDraft.maxChildSeats);
    const minAdultSeats = parseOptionalInt(editDraft.minAdultSeats);
    const maxAdultSeats = parseOptionalInt(editDraft.maxAdultSeats);
    if (
      !editDraft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return;
    }
    const selectedCategory =
      sortedCategories.find((category) => category.id === editDraft.categoryId) ??
      null;
    if (!selectedCategory) {
      return;
    }
    const servicePatch: Partial<SchedulingService> = {
      categoryId: selectedCategory.id,
      category: { ...selectedCategory },
      locationId: editDraft.locationId.trim() || null,
      name: editDraft.name.trim(),
      description: editDraft.description.trim() || null,
      subscriptionPrice,
      requiresWaiver: editDraft.requiresWaiver,
      requiredDocumentIds: editDraft.requiresWaiver
        ? editDraft.requiredDocumentIds.slice()
        : [],
      ageMin,
      ageMax,
      basePrice,
      capacity,
      durationMinutes,
      isActive: editDraft.isActive,
      eventType: editDraft.eventType,
      minDurationMinutes,
      maxDurationMinutes,
      slotIncrementMinutes,
      maxConcurrent,
      minAdvanceHours,
      maxAdvanceHours,
      siblingPrice: editDraft.siblingPrice.trim() || undefined,
      freeAdultCount,
      maxPassCount: (() => {
        const parsed = parseOptionalInt(editDraft.maxPassCount);
        return parsed != null && parsed >= 1 ? parsed : undefined;
      })(),
      additionalAdultPrice: editDraft.additionalAdultPrice.trim() || undefined,
      minSeats,
      pricePerHour: editDraft.pricePerHour.trim() || undefined,
      minChildSeats: minChildSeats ?? undefined,
      maxChildSeats: maxChildSeats ?? undefined,
      minAdultSeats: minAdultSeats ?? undefined,
      maxAdultSeats: maxAdultSeats ?? undefined,
      additionalChildPrice: editDraft.additionalChildPrice.trim() || undefined,
      isPackageService: editDraft.isPackageService,
      ...eventBookingSchedulePatchFromDraft(editDraft),
    };
    updateService(selected.id, servicePatch);
    if (isAdminApiReady()) {
      updateSchedulingService(selected.id, {
        categoryId: servicePatch.categoryId,
        locationId: servicePatch.locationId,
        name: servicePatch.name,
        description: servicePatch.description ?? undefined,
        subscriptionPrice: servicePatch.subscriptionPrice,
        requiresWaiver: servicePatch.requiresWaiver,
        ageMin: servicePatch.ageMin,
        ageMax: servicePatch.ageMax,
        basePrice: servicePatch.basePrice,
        capacity: servicePatch.capacity,
        durationMinutes: servicePatch.durationMinutes,
        isActive: servicePatch.isActive,
        minDurationMinutes: servicePatch.minDurationMinutes,
        maxDurationMinutes: servicePatch.maxDurationMinutes,
        slotIncrementMinutes: servicePatch.slotIncrementMinutes,
        maxConcurrent: servicePatch.maxConcurrent,
        minAdvanceHours: servicePatch.minAdvanceHours,
        maxAdvanceHours: servicePatch.maxAdvanceHours,
        siblingPrice: servicePatch.siblingPrice,
        freeAdultCount: servicePatch.freeAdultCount,
        maxPassCount: servicePatch.maxPassCount,
        additionalAdultPrice: servicePatch.additionalAdultPrice,
        minSeats: servicePatch.minSeats,
        pricePerHour: servicePatch.pricePerHour,
        minChildSeats: servicePatch.minChildSeats,
        maxChildSeats: servicePatch.maxChildSeats,
        minAdultSeats: servicePatch.minAdultSeats,
        maxAdultSeats: servicePatch.maxAdultSeats,
        additionalChildPrice: servicePatch.additionalChildPrice,
        isPackageService: servicePatch.isPackageService,
      }).catch(() => {
        toast({ title: "Sync error", description: "Service update failed to save.", variant: "destructive" });
      });
    }
    setSelected(null);
  }

  function buildServiceForCategory(input: {
    id: string;
    category: SchedulingCategory;
    categoryId: string;
    serviceType: SchedulingServiceType;
    bookingMode: SchedulingBookingMode;
    eventType: EventVisibility;
    locationId: string | null;
    name: string;
    description: string;
    subscriptionPrice: number | null;
    requiresWaiver: boolean;
    requiredDocumentIds: string[];
    ageMin: number | null;
    ageMax: number | null;
    basePrice: number;
    capacity: number;
    durationMinutes: number;
    imageUrl: string | null;
    isActive: boolean;
    minDurationMinutes: number | null;
    maxDurationMinutes: number | null;
    slotIncrementMinutes: number | null;
    maxConcurrent: number | null;
    minAdvanceHours: number | null;
    maxAdvanceHours: number | null;
    siblingPrice?: string;
    freeAdultCount: number;
    additionalAdultPrice?: string;
    minSeats: number;
    pricePerHour?: string;
    minChildSeats?: number;
    maxChildSeats?: number;
    minAdultSeats?: number;
    maxAdultSeats?: number;
    additionalChildPrice?: string;
    isPackageService: boolean;
    maxPassCount?: number | null;
    pendingServiceAddOnLinks: {
      addOnId: string;
      addOnName?: string;
      isFree: boolean;
      quantity: string;
      unitPrice: string;
      chargeFrequency: CategoryAddOnChargeFrequency;
    }[];
  } & EventBookingScheduleDraft): SchedulingService {
    const pricingModel = input.bookingMode === "OPEN" ? "per_hour" : "flat";
    const linkedAddOns = input.pendingServiceAddOnLinks.map((l) => ({
      id: newAdminEntityId("cao"),
      categoryId: input.id,
      addOnId: l.addOnId,
      addOnName: l.addOnName,
      isOptional: true,
      isFree: l.isFree,
      quantity: Number.parseInt(l.quantity, 10),
      unitPrice: Number.parseFloat(l.unitPrice),
      chargeFrequency: l.chargeFrequency,
    }));
    return {
      id: input.id,
      locationId: input.locationId,
      categoryId: input.categoryId,
      category: { ...input.category },
      serviceType: input.serviceType,
      bookingMode: input.bookingMode,
      eventType: input.eventType,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      capacity: input.capacity,
      basePrice: input.basePrice,
      subscriptionPrice: input.subscriptionPrice,
      requiresWaiver: input.requiresWaiver,
      requiredDocumentIds: input.requiredDocumentIds.slice(),
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      isActive: input.isActive,
      minDurationMinutes: input.minDurationMinutes,
      maxDurationMinutes: input.maxDurationMinutes,
      slotIncrementMinutes: input.slotIncrementMinutes,
      maxConcurrent: input.maxConcurrent,
      minAdvanceHours: input.minAdvanceHours,
      maxAdvanceHours: input.maxAdvanceHours,
      pricingModel,
      imageUrl: input.imageUrl,
      tags: [],
      addOns: [],
      siblingPrice: input.siblingPrice,
      freeAdultCount: input.freeAdultCount,
      additionalAdultPrice: input.additionalAdultPrice,
      minSeats: input.minSeats,
      pricePerHour: input.pricePerHour,
      minChildSeats: input.minChildSeats,
      maxChildSeats: input.maxChildSeats,
      minAdultSeats: input.minAdultSeats,
      maxAdultSeats: input.maxAdultSeats,
      additionalChildPrice: input.additionalChildPrice,
      isPackageService: input.isPackageService,
      maxPassCount: input.maxPassCount,
      ...eventBookingSchedulePatchFromDraft(input),
      linkedAddOns,
    };
  }

  async function persistCreate() {
    const basePrice = parseFloat(createDraft.basePrice);
    const capacity = parseInt(createDraft.capacity, 10);
    const durationMinutes = parseInt(createDraft.durationMinutes, 10);
    const subscriptionPrice = parseOptionalFloat(createDraft.subscriptionPrice);
    const ageMin = parseOptionalInt(createDraft.ageMin);
    const ageMax = parseOptionalInt(createDraft.ageMax);
    const minDurationMinutes = parseOptionalInt(createDraft.minDurationMinutes);
    const maxDurationMinutes = parseOptionalInt(createDraft.maxDurationMinutes);
    const slotIncrementMinutes = slotIncrementMinutesFromAdminValue(
      createDraft.slotIncrementMinutes,
    );
    const maxConcurrent = parseOptionalInt(createDraft.maxConcurrent);
    const minAdvanceHours = parseOptionalInt(createDraft.minAdvanceHours);
    const maxAdvanceHours = parseOptionalInt(createDraft.maxAdvanceHours);
    const freeAdultParsedC = parseOptionalInt(createDraft.freeAdultCount);
    const freeAdultCountC =
      freeAdultParsedC != null &&
      freeAdultParsedC >= 0 &&
      freeAdultParsedC <= 20
        ? freeAdultParsedC
        : 2;
    const minSeatsParsedC = parseOptionalInt(createDraft.minSeats);
    const minSeatsC =
      minSeatsParsedC != null && minSeatsParsedC >= 1 ? minSeatsParsedC : 1;
    const minChildSeatsC = parseOptionalInt(createDraft.minChildSeats);
    const maxChildSeatsC = parseOptionalInt(createDraft.maxChildSeats);
    const minAdultSeatsC = parseOptionalInt(createDraft.minAdultSeats);
    const maxAdultSeatsC = parseOptionalInt(createDraft.maxAdultSeats);
    if (
      !createDraft.name.trim() ||
      !Number.isFinite(basePrice) ||
      !Number.isFinite(capacity) ||
      !Number.isFinite(durationMinutes)
    ) {
      return;
    }
    const category =
      sortedCategories.find(
        (c) => c.id === (createDraft.categoryId || categoryId),
      ) ?? selectedCategory;
    if (!category) return;

    let serviceId = newAdminEntityId("svc");
    if (isAdminApiReady()) {
      try {
        const saved = await createSchedulingService({
          categoryId: category.id,
          serviceType: createDraft.serviceType,
          bookingMode: createDraft.bookingMode,
          eventVisibility: createDraft.eventType,
          locationId: createDraft.locationId.trim() || null,
          name: createDraft.name.trim(),
          description: createDraft.description.trim() || undefined,
          subscriptionPrice,
          requiresWaiver: createDraft.requiresWaiver,
          ageMin,
          ageMax,
          basePrice,
          capacity,
          durationMinutes,
          isActive: createDraft.isActive,
          minDurationMinutes: createDraft.bookingMode === "OPEN" ? (minDurationMinutes ?? 60) : minDurationMinutes,
          maxDurationMinutes: createDraft.bookingMode === "OPEN" ? (maxDurationMinutes ?? 240) : maxDurationMinutes,
          slotIncrementMinutes,
          maxConcurrent: createDraft.bookingMode === "OPEN" ? (maxConcurrent ?? 3) : maxConcurrent,
          minAdvanceHours: minAdvanceHours ?? 0,
          maxAdvanceHours: maxAdvanceHours ?? 168,
          siblingPrice: createDraft.siblingPrice.trim() || undefined,
          freeAdultCount: freeAdultCountC,
          maxPassCount: (() => { const p = parseOptionalInt(createDraft.maxPassCount); return p != null && p >= 1 ? p : undefined; })(),
          additionalAdultPrice: createDraft.additionalAdultPrice.trim() || undefined,
          minSeats: minSeatsC,
          pricePerHour: createDraft.pricePerHour.trim() || undefined,
          minChildSeats: minChildSeatsC,
          maxChildSeats: maxChildSeatsC,
          minAdultSeats: minAdultSeatsC,
          maxAdultSeats: maxAdultSeatsC,
          additionalChildPrice: createDraft.additionalChildPrice.trim() || undefined,
          isPackageService: createDraft.isPackageService,
        });
        serviceId = saved.id;
      } catch {
        toast({ title: "Save failed", description: "Could not create service. Please try again.", variant: "destructive" });
        return;
      }
    }
    const created = buildServiceForCategory({
      id: serviceId,
      categoryId: category.id,
      category,
      serviceType: createDraft.serviceType,
      bookingMode: createDraft.bookingMode,
      eventType: createDraft.eventType,
      locationId: createDraft.locationId.trim() || null,
      name: createDraft.name.trim(),
      description: createDraft.description.trim() || "—",
      subscriptionPrice,
      requiresWaiver: createDraft.requiresWaiver,
      requiredDocumentIds: createDraft.requiresWaiver
        ? createDraft.requiredDocumentIds.slice()
        : [],
      ageMin,
      ageMax,
      basePrice,
      capacity,
      durationMinutes,
      imageUrl: "/images/hero-sports.jpg",
      isActive: createDraft.isActive,
      minDurationMinutes:
        createDraft.bookingMode === "OPEN"
          ? (minDurationMinutes ?? 60)
          : minDurationMinutes,
      maxDurationMinutes:
        createDraft.bookingMode === "OPEN"
          ? (maxDurationMinutes ?? 240)
          : maxDurationMinutes,
      slotIncrementMinutes,
      maxConcurrent:
        createDraft.bookingMode === "OPEN"
          ? (maxConcurrent ?? 3)
          : maxConcurrent,
      minAdvanceHours: minAdvanceHours ?? 0,
      maxAdvanceHours: maxAdvanceHours ?? 168,
      siblingPrice: createDraft.siblingPrice.trim() || undefined,
      freeAdultCount: freeAdultCountC,
      maxPassCount: (() => {
        const parsed = parseOptionalInt(createDraft.maxPassCount);
        return parsed != null && parsed >= 1 ? parsed : undefined;
      })(),
      additionalAdultPrice:
        createDraft.additionalAdultPrice.trim() || undefined,
      minSeats: minSeatsC,
      pricePerHour: createDraft.pricePerHour.trim() || undefined,
      minChildSeats: minChildSeatsC ?? undefined,
      maxChildSeats: maxChildSeatsC ?? undefined,
      minAdultSeats: minAdultSeatsC ?? undefined,
      maxAdultSeats: maxAdultSeatsC ?? undefined,
      additionalChildPrice:
        createDraft.additionalChildPrice.trim() || undefined,
      isPackageService: createDraft.isPackageService,
      pendingServiceAddOnLinks: createDraft.pendingServiceAddOnLinks.slice(),
      eventBookingScheduleMode: createDraft.eventBookingScheduleMode,
    });
    addService(created);
    setCreateOpen(false);
    setCreateDraft({
      categoryId:
        categoryId === ALL_CATEGORIES_VALUE ? category.id : categoryId,
      serviceType: "GYM_CLASS",
      bookingMode: "SCHEDULED",
      eventType: "PUBLIC",
      locationId: locations[0]?.id ?? "loc-1",
      name: "",
      description: "",
      subscriptionPrice: "",
      requiresWaiver: false,
      requiredDocumentIds: [],
      ageMin: "",
      ageMax: "",
      basePrice: "",
      capacity: "",
      durationMinutes: "60",
      isActive: true,
      minDurationMinutes: "",
      maxDurationMinutes: "",
      slotIncrementMinutes: "none",
      maxConcurrent: "",
      minAdvanceHours: "",
      maxAdvanceHours: "",
      siblingPrice: "",
      freeAdultCount: "2",
      maxPassCount: "",
      additionalAdultPrice: "",
      minSeats: "1",
      pricePerHour: "",
      minChildSeats: "",
      maxChildSeats: "",
      minAdultSeats: "",
      maxAdultSeats: "",
      additionalChildPrice: "",
      isPackageService: false,
      eventBookingScheduleMode: EventBookingScheduleModeEnum.PER_EVENT,
      pendingServiceAddOnLinks: [],
    });
    const redirectParams = new URLSearchParams({
      serviceId: serviceId,
      returnTo: contextualReturnTo,
    });
    router.push(`/admin/scheduling/new/recurring?${redirectParams.toString()}`);
  }

  function openCustomerNavSettings(
    navKey: CustomerNavLabelKey,
    sectionLabel: string,
  ): void {
    setCustomerNavModal({ navKey, sectionLabel });
  }

  function openNewCategory(topLevelId: SchedulingTopLevelId) {
    const query = new URLSearchParams({
      topLevelId,
      returnTo: contextualReturnTo,
    });
    router.push(
      `/admin/scheduling/services/categories/new?${query.toString()}`,
    );
  }

  function openEditCategory(category: SchedulingCategory) {
    const menuSlug =
      normalizeCatalogSlug(category.placementCatalogSlug ?? null) ??
      catalogSlugFromSchedulingCategoryId(category.id);
    setEditingCategoryId(category.id);
    setCategoryDraft({
      menuCatalogSlug: menuSlug,
      parentTopLevelId: getSchedulingTopLevelIdFromCategory(category),
      name: category.name,
      icon: category.icon ?? "",
      imageUrl: category.imageUrl ?? "",
      displayOrder: String(category.displayOrder),
      isActive: category.isActive,
      description: category.description ?? "",
      requiresAttendee: category.requiresAttendee ?? false,
      membersOnly: category.membersOnly ?? false,
      freeInfantMonths:
        category.freeInfantMonths != null
          ? String(category.freeInfantMonths)
          : "",
      depositPercent:
        category.depositPercent != null ? String(category.depositPercent) : "",
      specialInstructionsEnabled: category.specialInstructionsEnabled ?? false,
      waitlistEnabled: category.waitlistEnabled ?? true,
      allowFamilyMember: category.allowFamilyMember ?? false,
      requireCheckInBeforeRebook: category.requireCheckInBeforeRebook ?? false,
      pendingAddOnLinks: (category.linkedAddOns ?? []).map((link) => ({
        addOnId: link.addOnId,
        addOnName: link.addOnName,
        isFree: link.isFree,
        quantity: String(link.quantity ?? 1),
        unitPrice: link.unitPrice != null ? String(link.unitPrice) : "0",
        chargeFrequency: link.chargeFrequency ?? "ONE_TIME",
      })),
    });
    setCategoryOpen(true);
  }

  function reorderCategoriesByDrag(
    menuSlug: CatalogSlug,
    sourceCategoryId: string,
    targetCategoryId: string,
  ) {
    if (sourceCategoryId === targetCategoryId) return;
    const siblings = schedulingRowsByMenuSlug[menuSlug] ?? [];
    const sourceIndex = siblings.findIndex(
      (category) => category.id === sourceCategoryId,
    );
    const targetIndex = siblings.findIndex(
      (category) => category.id === targetCategoryId,
    );
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reordered = siblings.slice();
    const [moved] = reordered.splice(sourceIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const orderedDisplaySlots = siblings
      .map((category) => category.displayOrder)
      .slice()
      .sort((a, b) => a - b);

    reordered.forEach((category, index) => {
      const nextDisplayOrder = orderedDisplaySlots[index] ?? index + 1;
      if (category.displayOrder !== nextDisplayOrder) {
        updateCategory(category.id, { displayOrder: nextDisplayOrder });
      }
    });
  }

  function applySchedulingCategoryBucketMove(
    categoryId: string,
    menuSlug: SchedulingCatalogSlug,
    normalizedPatch: Partial<SchedulingCategory>,
    linkedAddOns: SchedulingCategory["linkedAddOns"],
  ) {
    const categoryPrefixByTopLevel: Record<SchedulingTopLevelId, string> = {
      GYM: "cat-gym-",
      PLAY: "cat-play-",
      EVENT: "cat-event-",
      LEARN: "cat-learn-",
    };
    const targetTopLevel = catalogSlugToSchedulingTopLevel(menuSlug);
    const existing = sortedCategories.find((row) => row.id === categoryId);
    const categorySlug =
      slugifyCategoryName(existing?.name ?? categoryId) ||
      newAdminEntityId("cat").slice(4);
    const idBase = `${categoryPrefixByTopLevel[targetTopLevel]}${categorySlug}`;
    const nextCategoryId = categories.some(
      (category) => category.id !== categoryId && category.id === idBase,
    )
      ? `${idBase}-${newAdminEntityId("cat").slice(4)}`
      : idBase;

    addCategory({
      id: nextCategoryId,
      name: existing?.name ?? categoryId,
      icon: existing?.icon ?? null,
      displayOrder: existing?.displayOrder ?? 1,
      isActive: existing?.isActive ?? true,
      description: existing?.description,
      requiresAttendee: existing?.requiresAttendee,
      membersOnly: existing?.membersOnly,
      freeInfantMonths: existing?.freeInfantMonths,
      depositPercent: existing?.depositPercent,
      specialInstructionsEnabled: existing?.specialInstructionsEnabled,
      waitlistEnabled: existing?.waitlistEnabled,
      allowFamilyMember: existing?.allowFamilyMember,
      requireCheckInBeforeRebook: existing?.requireCheckInBeforeRebook,
      catalogSlug: menuSlug,
      placementCatalogSlug: undefined,
      placementParentId: null,
      linkedAddOns: (linkedAddOns ?? []).map((link) => ({
        ...link,
        categoryId: nextCategoryId,
      })),
      ...normalizedPatch,
    });

    services
      .filter((service) => service.categoryId === categoryId)
      .forEach((service) => {
        updateService(service.id, { categoryId: nextCategoryId });
      });

    removeCategory(categoryId);

    setCategoryId((current) =>
      current === categoryId ? nextCategoryId : current,
    );
    setServiceCategoryFilterId((current) =>
      current === categoryId ? nextCategoryId : current,
    );
    setCreateDraft((draft) =>
      draft.categoryId === categoryId
        ? { ...draft, categoryId: nextCategoryId }
        : draft,
    );
  }

  function moveSchedulingSubCategoryToMenu(
    categoryId: string,
    menuSlug: CatalogSlug,
  ) {
    const existing = sortedCategories.find((row) => row.id === categoryId);
    if (!existing) return;
    const productRootId = isProductCatalogSlug(menuSlug)
      ? (productRootBySlug[menuSlug] ?? null)
      : null;
    const target = resolveCatalogMenuTarget({
      catalogSlug: menuSlug,
      productRootId,
    });

    if (isProductCatalogSlug(menuSlug)) {
      updateCategory(
        categoryId,
        patchSchedulingCategoryPlacement(existing, target),
      );
      return;
    }

    updateCategory(
      categoryId,
      patchSchedulingCategoryPlacement(
        existing,
        resolveCatalogMenuTarget({
          catalogSlug: menuSlug,
          productRootId: null,
        }),
      ),
    );
  }

  function moveProductSubCategoryToMenu(categoryId: string, menuSlug: CatalogSlug) {
    const existing = productCategoryById.get(categoryId);
    if (!existing || (existing.parentId ?? null) === null) return;
    const productRootId = isProductCatalogSlug(menuSlug)
      ? (productRootBySlug[menuSlug] ?? null)
      : null;
    const target = resolveCatalogMenuTarget({
      catalogSlug: menuSlug,
      productRootId,
    });
    const nativeParentId = existing.parentId ?? null;
    updateProductCategory(
      categoryId,
      patchProductSubCategoryPlacement(existing, target, nativeParentId),
    );
  }

  function reorderProductSubCategoriesByDrag(
    menuSlug: CatalogSlug,
    sourceId: string,
    targetId: string,
  ) {
    if (sourceId === targetId) return;

    const siblings = (productSubRowsByMenuSlug[menuSlug] ?? []).slice();

    const sourceIndex = siblings.findIndex((entry) => entry.id === sourceId);
    const targetIndex = siblings.findIndex((entry) => entry.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reordered = siblings.slice();
    const [moved] = reordered.splice(sourceIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const orderedDisplaySlots = siblings
      .map((entry) => entry.displayOrder)
      .slice()
      .sort((a, b) => a - b);

    reordered.forEach((entry, index) => {
      const nextDisplayOrder = orderedDisplaySlots[index] ?? index + 1;
      if (entry.displayOrder !== nextDisplayOrder) {
        updateProductCategory(entry.id, { displayOrder: nextDisplayOrder });
      }
    });
  }

  function promoteFromRow(p: Product) {
    if (p.linkedAddOnId) return;
    const result = promoteProductToAddOn(p.id, p);
    if (!result.ok) {
      toast({
        title: "Add-on link failed",
        description: result.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Linked as add-on",
      description: `${p.name} is now available as add-on.`,
    });
  }

  function delinkFromRow(p: Product) {
    const linkedId = p.linkedAddOnId;
    if (!linkedId) return;
    delinkBookingAddOnFromProduct(linkedId);
    toast({
      title: "Add-on de-linked",
      description: `${p.name} is no longer linked as add-on.`,
    });
  }

  function openProductSubCategoryCreate(parentId: string) {
    const parentRow = productCategoryById.get(parentId) ?? null;
    const menuSlug = parentRow
      ? catalogSlugFromProductType(parentRow.productType ?? "shop")
      : "shop";
    const isRentals = menuSlug === "rentals";
    setProductSubCategoryMenuSlug(menuSlug);
    setProductSubCategoryParentId(parentId);
    setProductSubCategoryName("");
    setProductSubCategoryImageUrl("");
    setProductSubCategoryIsActive(true);
    setEditingProductSubCategoryId(null);
    setProductSubCategoryAcknowledgmentRows(
      isRentals ? [{ text: "", detailUrl: "" }] : [],
    );
    setProductSubCategoryFormOpen(true);
  }

  function openProductSubCategoryEdit(categoryId: string) {
    const category = productCategoryById.get(categoryId) ?? null;
    if (!category) return;
    const menuSlug = effectiveProductPlacementSlug(category);
    const isRentals = effectiveProductCategoryCatalogSlug(category) === "rentals";
    setProductSubCategoryMenuSlug(menuSlug);
    setProductSubCategoryParentId(
      category.placementParentId ?? category.parentId ?? null,
    );
    setProductSubCategoryName(category.name);
    setProductSubCategoryImageUrl(category.imageUrl ?? "");
    setProductSubCategoryIsActive(category.isActive ?? true);
    setEditingProductSubCategoryId(category.id);
    setProductSubCategoryAcknowledgmentRows(
      isRentals ? rentalAcknowledgmentsToFormRows(category.rentalAcknowledgments) : [],
    );
    setProductSubCategoryFormOpen(true);
  }

  function persistProductSubCategory() {
    const trimmedName = productSubCategoryName.trim();
    if (!trimmedName) return;

    const trimmedImage = productSubCategoryImageUrl.trim();
    if (trimmedImage && isInlineImageDataUrl(trimmedImage)) {
      toast({
        title: "Image saved in this browser",
        description: isAdminApiReady()
          ? "Uploaded photos are stored locally until you use an https:// image URL."
          : "Saved with your catalog. Consumer pages will show it after you close this dialog.",
      });
    }

    const menuSlug = productSubCategoryMenuSlug;
    const nativeRootId = isProductCatalogSlug(menuSlug)
      ? (productRootBySlug[menuSlug] ?? productSubCategoryParentId)
      : null;
    const nativeParent = nativeRootId
      ? (productCategoryById.get(nativeRootId) ?? null)
      : null;
    if (!nativeParent && !editingProductSubCategoryId) return;

    const isRentalSubCategory =
      (editingProductSubCategoryId
        ? effectiveProductCategoryCatalogSlug(
            productCategoryById.get(editingProductSubCategoryId) ?? {
              productType: "shop",
            },
          )
        : effectiveProductCategoryCatalogSlug(nativeParent ?? { productType: "shop" })) ===
      "rentals";
    const normalizedAcks = isRentalSubCategory
      ? normalizeRentalAcknowledgmentFormRows(productSubCategoryAcknowledgmentRows)
      : [];

    const target = resolveCatalogMenuTarget({
      catalogSlug: menuSlug,
      productRootId: nativeRootId,
    });

    if (editingProductSubCategoryId) {
      const existing =
        productCategoryById.get(editingProductSubCategoryId) ?? null;
      if (!existing) return;
      updateProductCategory(editingProductSubCategoryId, {
        name: trimmedName,
        imageUrl: trimmedImage || undefined,
        isActive: productSubCategoryIsActive,
        ...(isRentalSubCategory ? { rentalAcknowledgments: normalizedAcks } : {}),
        ...patchProductSubCategoryPlacement(
          existing,
          target,
          existing.parentId ?? null,
        ),
      });
      setProductSubCategoryFormOpen(false);
      setProductSubCategoryName("");
      setProductSubCategoryIsActive(true);
      setProductSubCategoryParentId(null);
      setEditingProductSubCategoryId(null);
      setProductSubCategoryAcknowledgmentRows([]);
      return;
    }

    if (!nativeRootId) return;

    const created = addProductCategory({
      name: trimmedName,
      productType: nativeParent?.productType ?? "shop",
      parentId: nativeRootId,
      imageUrl: trimmedImage || undefined,
      isActive: productSubCategoryIsActive,
      ...(isRentalSubCategory ? { rentalAcknowledgments: normalizedAcks } : {}),
    });
    updateProductCategory(
      created.id,
      patchProductSubCategoryPlacement(created, target, nativeRootId),
    );

    setProductSubCategoryFormOpen(false);
    setProductSubCategoryName("");
    setProductSubCategoryImageUrl("");
    setProductSubCategoryIsActive(true);
    setProductSubCategoryParentId(null);
    setEditingProductSubCategoryId(null);
    setProductSubCategoryAcknowledgmentRows([]);

    setCatalogView("products");
    setSelectedProductMenuCategoryId(created.id);
  }

  function confirmDeleteProductSubCategory() {
    if (!deleteProductSubCategoryId) return;
    const result = deleteProductCategory(deleteProductSubCategoryId);
    if (!result.ok) {
      toast({
        title: "Delete failed",
        description: result.message,
        variant: "destructive",
      });
      return;
    }
    if (selectedProductMenuCategoryId === deleteProductSubCategoryId) {
      setSelectedProductMenuCategoryId(null);
    }
    setDeleteProductSubCategoryId(null);
  }

  function confirmDeleteProduct() {
    if (!deleteProductId) return;
    const existing = products.find((p) => p.id === deleteProductId) ?? null;
    if (!existing) {
      setDeleteProductId(null);
      return;
    }
    deleteProduct(deleteProductId);
    toast({
      title: "Product deleted",
      description: `${existing.name} has been removed.`,
    });
    setDeleteProductId(null);
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryId) return;
    const assignedServiceCount = countByCategory.get(deleteCategoryId) ?? 0;
    if (assignedServiceCount > 0) {
      setDeleteCategoryId(null);
      return;
    }
    if (isAdminApiReady()) {
      try {
        await deleteServiceCategory(deleteCategoryId);
      } catch {
        toast({ title: "Delete failed", description: "Could not delete category. Please try again.", variant: "destructive" });
        setDeleteCategoryId(null);
        return;
      }
    }
    removeCategory(deleteCategoryId);
    if (categoryId === deleteCategoryId) {
      const deletedTopLevelId = getSchedulingTopLevelId(deleteCategoryId);
      const fallbackCategory = categoriesByTopLevel[deletedTopLevelId].find(
        (entry) => entry.id !== deleteCategoryId,
      );
      if (fallbackCategory) {
        setCategoryId(fallbackCategory.id);
      }
    }
    setDeleteCategoryId(null);
  }

  async function persistCategory() {
    const displayOrder = parseInt(categoryDraft.displayOrder, 10);
    if (!categoryDraft.name.trim() || !Number.isFinite(displayOrder)) return;

    const toastLocalCategoryImage = (): void => {
      const trimmedImage = categoryDraft.imageUrl.trim();
      if (!trimmedImage || !isInlineImageDataUrl(trimmedImage)) {
        return;
      }
      toast({
        title: "Image saved in this browser",
        description: isAdminApiReady()
          ? "Uploaded photos are stored locally until you use an https:// image URL."
          : "Saved with your catalog. Consumer pages will show it after you close this dialog.",
      });
    };

    const freeInfantMonths =
      categoryDraft.freeInfantMonths.trim().length > 0
        ? Number.parseInt(categoryDraft.freeInfantMonths.trim(), 10)
        : undefined;
    const depositPercent =
      categoryDraft.depositPercent.trim().length > 0
        ? Number.parseFloat(categoryDraft.depositPercent.trim())
        : undefined;
    const categoryPrefixByTopLevel: Record<SchedulingTopLevelId, string> = {
      GYM: "cat-gym-",
      PLAY: "cat-play-",
      EVENT: "cat-event-",
      LEARN: "cat-learn-",
    };

    if (editingCategoryId) {
      const existing =
        sortedCategories.find((row) => row.id === editingCategoryId) ?? null;
      const menuSlug = categoryDraft.menuCatalogSlug;
      const normalizedPatch = {
        name: categoryDraft.name.trim(),
        icon: categoryDraft.icon.trim() || null,
        imageUrl: categoryDraft.imageUrl.trim() || undefined,
        displayOrder,
        isActive: categoryDraft.isActive,
        description: categoryDraft.description.trim() || undefined,
        requiresAttendee: categoryDraft.requiresAttendee,
        membersOnly: categoryDraft.membersOnly,
        freeInfantMonths: Number.isFinite(freeInfantMonths ?? Number.NaN)
          ? freeInfantMonths
          : undefined,
        depositPercent: Number.isFinite(depositPercent ?? Number.NaN)
          ? depositPercent
          : undefined,
        specialInstructionsEnabled: categoryDraft.specialInstructionsEnabled,
        waitlistEnabled: categoryDraft.waitlistEnabled,
        allowFamilyMember: categoryDraft.allowFamilyMember,
        requireCheckInBeforeRebook: categoryDraft.requireCheckInBeforeRebook,
      };
      const linkedAddOns = categoryDraft.pendingAddOnLinks.map((l) => ({
        id: newAdminEntityId("cao"),
        categoryId: editingCategoryId,
        addOnId: l.addOnId,
        addOnName: l.addOnName,
        isOptional: true,
        isFree: l.isFree,
        quantity: Number.parseInt(l.quantity, 10),
        unitPrice: Number.parseFloat(l.unitPrice),
        chargeFrequency: l.chargeFrequency,
      }));

      if (isProductCatalogSlug(menuSlug) && existing) {
        const productRootId = productRootBySlug[menuSlug] ?? null;
        updateCategory(editingCategoryId, {
          ...normalizedPatch,
          linkedAddOns,
          ...patchSchedulingCategoryPlacement(
            existing,
            resolveCatalogMenuTarget({
              catalogSlug: menuSlug,
              productRootId,
            }),
          ),
        });
        if (isAdminApiReady()) {
          const apiImageUrl = imageUrlForApiPayload(categoryDraft.imageUrl)
          updateServiceCategory(editingCategoryId, {
            ...normalizedPatch,
            ...(apiImageUrl !== undefined ? { imageUrl: apiImageUrl } : {}),
          }).catch(() => {
            toast({ title: "Sync error", description: "Category update failed to save.", variant: "destructive" });
          });
        }
        toastLocalCategoryImage();
        setCategoryOpen(false);
        setEditingCategoryId(null);
        return;
      }

      if (existing) {
        updateCategory(editingCategoryId, {
          ...normalizedPatch,
          linkedAddOns,
          ...patchSchedulingCategoryPlacement(
            existing,
            resolveCatalogMenuTarget({
              catalogSlug: menuSlug,
              productRootId: null,
            }),
          ),
        });
        if (isAdminApiReady()) {
          const apiImageUrl = imageUrlForApiPayload(categoryDraft.imageUrl)
          updateServiceCategory(editingCategoryId, {
            ...normalizedPatch,
            ...(apiImageUrl !== undefined ? { imageUrl: apiImageUrl } : {}),
          }).catch(() => {
            toast({ title: "Sync error", description: "Category update failed to save.", variant: "destructive" });
          });
        }
      }
      toastLocalCategoryImage();
      setCategoryOpen(false);
      setEditingCategoryId(null);
      return;
    }

    const menuSlug = categoryDraft.menuCatalogSlug;
    const targetTopLevel = isSchedulingCatalogSlug(menuSlug)
      ? catalogSlugToSchedulingTopLevel(menuSlug)
      : categoryDraft.parentTopLevelId;
    const categorySlug =
      slugifyCategoryName(categoryDraft.name) ||
      newAdminEntityId("cat").slice(4);
    const idBase = `${categoryPrefixByTopLevel[targetTopLevel]}${categorySlug}`;
    let catId = categories.some((category) => category.id === idBase)
      ? `${idBase}-${newAdminEntityId("cat").slice(4)}`
      : idBase;
    if (isAdminApiReady()) {
      try {
        const apiImageUrl = imageUrlForApiPayload(categoryDraft.imageUrl)
        const saved = await createServiceCategory({
          name: categoryDraft.name.trim(),
          icon: categoryDraft.icon.trim() || undefined,
          ...(apiImageUrl !== undefined ? { imageUrl: apiImageUrl } : {}),
          displayOrder: String(displayOrder),
          isActive: categoryDraft.isActive,
          catalogSlug: isSchedulingCatalogSlug(menuSlug) ? menuSlug : undefined,
        });
        catId = saved.id;
      } catch {
        toast({ title: "Save failed", description: "Could not create category. Please try again.", variant: "destructive" });
        return;
      }
    }
    const linkedAddOns = categoryDraft.pendingAddOnLinks.map((l) => ({
      id: newAdminEntityId("cao"),
      categoryId: catId,
      addOnId: l.addOnId,
      addOnName: l.addOnName,
      isOptional: true,
      isFree: l.isFree,
      quantity: Number.parseInt(l.quantity, 10),
      unitPrice: Number.parseFloat(l.unitPrice),
      chargeFrequency: l.chargeFrequency,
    }));
    const productRootId = isProductCatalogSlug(menuSlug)
      ? (productRootBySlug[menuSlug] ?? null)
      : null;
    const created: SchedulingCategory = {
      id: catId,
      name: categoryDraft.name.trim(),
      icon: categoryDraft.icon.trim() || null,
      imageUrl: categoryDraft.imageUrl.trim() || undefined,
      displayOrder,
      isActive: categoryDraft.isActive,
      description: categoryDraft.description.trim() || undefined,
      requiresAttendee: categoryDraft.requiresAttendee,
      membersOnly: categoryDraft.membersOnly,
      freeInfantMonths: Number.isFinite(freeInfantMonths ?? Number.NaN)
        ? freeInfantMonths
        : undefined,
      depositPercent: Number.isFinite(depositPercent ?? Number.NaN)
        ? depositPercent
        : undefined,
      specialInstructionsEnabled: categoryDraft.specialInstructionsEnabled,
      waitlistEnabled: categoryDraft.waitlistEnabled,
      allowFamilyMember: categoryDraft.allowFamilyMember,
      requireCheckInBeforeRebook: categoryDraft.requireCheckInBeforeRebook,
      catalogSlug: isSchedulingCatalogSlug(menuSlug) ? menuSlug : undefined,
      placementCatalogSlug: isProductCatalogSlug(menuSlug) ? menuSlug : undefined,
      placementParentId: productRootId,
      linkedAddOns,
    };
    addCategory(created);
    setCategoryId(created.id);
    setCreateDraft((d) => ({ ...d, categoryId: created.id }));
    toastLocalCategoryImage();
    setCategoryOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {LABELS.service} catalog
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage {LABELS.serviceCategory.toLowerCase()} settings and{" "}
          {LABELS.services.toLowerCase()}.
        </p>
        {categoriesLoadError ? (
          <p className="text-sm text-muted-foreground mt-2">
            Category API unavailable. Showing saved categories.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              {LABELS.serviceCategory}
            </CardTitle>
            <CardDescription>
              Browse by top-level groups and category sections.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-2">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {CATALOG_MENU_ORDER.filter((entry) => entry.kind === "scheduling").map(
                (menuEntry) => {
                const menuSlug = menuEntry.slug;
                const topLevelId = catalogSlugToSchedulingTopLevel(
                  menuSlug as SchedulingCatalogSlug,
                );
                const rows = schedulingRowsByMenuSlug[menuSlug] ?? [];
                const productSubsOnMenu = productSubRowsByMenuSlug[menuSlug] ?? [];
                if (rows.length === 0 && productSubsOnMenu.length === 0) {
                  return null;
                }
                return (
                  <AccordionItem
                    key={menuSlug}
                    value={menuSlug}
                    className="overflow-hidden rounded-lg border border-border bg-muted/20 px-3 last:border-b"
                  >
                    <div className="flex min-w-0 items-center gap-0 [&>h3]:flex [&>h3]:min-w-0 [&>h3]:flex-1">
                      <AccordionTrigger className="w-full min-w-0 flex-1 items-center py-2 text-sm font-semibold text-foreground hover:no-underline">
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase tracking-wide"
                          >
                            Type
                          </Badge>
                          <span>{getSchedulingTopLevelLabel(topLevelId)}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {totalServicesByTopLevel[topLevelId]}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label={`Edit ${getSchedulingTopLevelLabel(topLevelId)} customer navbar`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              openCustomerNavSettings(
                                schedulingTopLevelToNavKey(topLevelId),
                                getSchedulingTopLevelLabel(topLevelId),
                              )
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <AccordionContent
                      className={cn(
                        "space-y-2 pb-3",
                        dragOverMenuSlug === menuSlug && "rounded-md bg-accent/5",
                      )}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverMenuSlug(menuSlug);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggingCategoryId) {
                          moveSchedulingSubCategoryToMenu(
                            draggingCategoryId,
                            menuSlug,
                          );
                        }
                        if (draggingProductMenuCategoryId) {
                          moveProductSubCategoryToMenu(
                            draggingProductMenuCategoryId,
                            menuSlug,
                          );
                        }
                        setDraggingCategoryId(null);
                        setDragOverCategoryId(null);
                        setDraggingProductMenuCategoryId(null);
                        setDragOverProductMenuCategoryId(null);
                        setDragOverMenuSlug(null);
                      }}
                    >
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => openNewCategory(topLevelId)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New sub-category
                        </Button>
                      </div>
                      {rows.map((category) => {
                        const isActiveCategory =
                          category.id === serviceCategoryFilterId;
                        const serviceCount =
                          countByCategory.get(category.id) ?? 0;
                        return (
                          <div
                            key={category.id}
                            draggable
                            onDragStart={() => {
                              setDraggingCategoryId(category.id);
                              setDragOverCategoryId(category.id);
                            }}
                            onDragEnter={(event) => {
                              event.preventDefault();
                              setDragOverCategoryId(category.id);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              if (dragOverCategoryId !== category.id) {
                                setDragOverCategoryId(category.id);
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (!draggingCategoryId) return;
                              if (draggingCategoryId === category.id) return;
                              reorderCategoriesByDrag(
                                menuSlug,
                                draggingCategoryId,
                                category.id,
                              );
                              setDraggingCategoryId(null);
                              setDragOverCategoryId(null);
                            }}
                            onDragEnd={() => {
                              setDraggingCategoryId(null);
                              setDragOverCategoryId(null);
                            }}
                            className={cn(
                              "flex min-w-0 items-center gap-2 rounded-md px-2 py-2 transition-colors",
                              dragOverCategoryId === category.id &&
                                draggingCategoryId !== category.id &&
                                "bg-accent/10",
                              isActiveCategory
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )}
                          >
                            <span
                              className="shrink-0 cursor-grab text-muted-foreground/90"
                              aria-label={`Drag ${category.name}`}
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogView("services");
                                setSelectedProductMenuCategoryId(null);
                                setCategoryId(category.id);
                                setServiceCategoryFilterId(category.id);
                              }}
                              className="min-w-0 flex-1 overflow-hidden text-left text-sm font-medium"
                              title={category.name}
                            >
                              <span className="block truncate">{category.name}</span>
                            </button>
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-5 shrink-0 text-[10px]",
                                isActiveCategory
                                  ? "border-sidebar-accent-foreground/30 bg-sidebar-accent/40 text-sidebar-accent-foreground"
                                  : "",
                              )}
                            >
                              {serviceCount}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  aria-label={`${category.name} actions`}
                                  onClick={(event) => event.stopPropagation()}
                                  onPointerDown={(event) => event.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => openEditCategory(category)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={serviceCount > 0}
                                  onSelect={() =>
                                    setDeleteCategoryId(category.id)
                                  }
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                      {productSubsOnMenu.map((sub) => {
                        const isCafeSub =
                          (sub.productType ?? "").toLowerCase() === "cafe&food";
                        const subCount = isCafeSub
                          ? countCafeFoodProductsForInventoryCategory(
                              products,
                              sub.id,
                              productCategories,
                            )
                          : products.filter(
                              (p) => p.isActive && p.categoryId === sub.id,
                            ).length;
                        const active =
                          effectiveCatalogView === "products" &&
                          effectiveSelectedProductMenuCategoryId === sub.id;
                        return (
                          <div
                            key={`product-${sub.id}`}
                            draggable
                            onDragStart={() => {
                              setDraggingProductMenuCategoryId(sub.id);
                              setDragOverProductMenuCategoryId(sub.id);
                            }}
                            onDragEnter={(event) => {
                              event.preventDefault();
                              setDragOverProductMenuCategoryId(sub.id);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              if (dragOverProductMenuCategoryId !== sub.id) {
                                setDragOverProductMenuCategoryId(sub.id);
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (!draggingProductMenuCategoryId) return;
                              if (draggingProductMenuCategoryId === sub.id) {
                                return;
                              }
                              reorderProductSubCategoriesByDrag(
                                menuSlug,
                                draggingProductMenuCategoryId,
                                sub.id,
                              );
                              setDraggingProductMenuCategoryId(null);
                              setDragOverProductMenuCategoryId(null);
                            }}
                            onDragEnd={() => {
                              setDraggingProductMenuCategoryId(null);
                              setDragOverProductMenuCategoryId(null);
                            }}
                            className={cn(
                              "flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors",
                              dragOverProductMenuCategoryId === sub.id &&
                                draggingProductMenuCategoryId !== sub.id &&
                                "bg-accent/10",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )}
                          >
                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/90" />
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogView("products");
                                setSelectedProductMenuCategoryId(sub.id);
                              }}
                              className="min-w-0 flex-1 overflow-hidden truncate text-left font-medium"
                              title={sub.name}
                            >
                              {sub.name}
                            </button>
                            <Badge variant="outline" className="h-5 shrink-0 text-[10px]">
                              {subCount}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  aria-label={`${sub.name} actions`}
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    openProductSubCategoryEdit(sub.id)
                                  }
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() =>
                                    setDeleteProductSubCategoryId(sub.id)
                                  }
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                );
              },
              )}
            </Accordion>

            <div className="my-6 h-[2px] bg-gray-400 dark:bg-gray-600" />
            <h3 className="text-base text-foreground">Product Categories</h3>
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-2 pt-0"
            >
              {CATALOG_MENU_ORDER.filter((entry) => entry.kind === "product").map(
                (menuEntry) => {
                const menuSlug = menuEntry.slug;
                const root =
                  productRootMenuCategories.find(
                    (row) =>
                      catalogSlugFromProductType(row.productType ?? "shop") ===
                      menuSlug,
                  ) ?? null;
                if (!root) return null;
                const rootCount =
                  productTypeProductCountsByRootId.get(root.id) ?? 0;
                const rootTypeLabel = menuEntry.label;
                const subRows = productSubRowsByMenuSlug[menuSlug] ?? [];
                const schedulingOnMenu = schedulingRowsByMenuSlug[menuSlug] ?? [];

                return (
                  <AccordionItem
                    key={menuSlug}
                    value={menuSlug}
                    className="overflow-hidden rounded-lg border border-border bg-muted/20 px-3 last:border-b"
                  >
                    <div className="flex min-w-0 items-center gap-0 [&>h3]:flex [&>h3]:min-w-0 [&>h3]:flex-1">
                      <AccordionTrigger className="w-full min-w-0 flex-1 items-center py-2 text-sm font-semibold text-foreground hover:no-underline">
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase tracking-wide"
                          >
                            TYPE
                          </Badge>
                          <span>{rootTypeLabel}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {rootCount}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label={`Edit ${rootTypeLabel} customer navbar`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              const navKey =
                                productTypeToCustomerNavKey(
                                  root.productType ?? "shop",
                                ) ?? "shop";
                              openCustomerNavSettings(navKey, rootTypeLabel);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <AccordionContent
                      className={cn(
                        "space-y-2 pb-3",
                        dragOverMenuSlug === menuSlug && "rounded-md bg-accent/5",
                      )}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverMenuSlug(menuSlug);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggingCategoryId) {
                          moveSchedulingSubCategoryToMenu(
                            draggingCategoryId,
                            menuSlug,
                          );
                        }
                        if (draggingProductMenuCategoryId) {
                          moveProductSubCategoryToMenu(
                            draggingProductMenuCategoryId,
                            menuSlug,
                          );
                        }
                        setDraggingCategoryId(null);
                        setDragOverCategoryId(null);
                        setDraggingProductMenuCategoryId(null);
                        setDragOverProductMenuCategoryId(null);
                        setDragOverMenuSlug(null);
                      }}
                    >
                      {schedulingOnMenu.map((category) => {
                        const serviceCount =
                          countByCategory.get(category.id) ?? 0;
                        const isActiveCategory =
                          category.id === serviceCategoryFilterId;
                        return (
                          <div
                            key={`sched-${category.id}`}
                            className={cn(
                              "mb-1 flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                              isActiveCategory
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogView("services");
                                setSelectedProductMenuCategoryId(null);
                                setCategoryId(category.id);
                                setServiceCategoryFilterId(category.id);
                              }}
                              className="min-w-0 flex-1 overflow-hidden truncate text-left"
                              title={category.name}
                            >
                              {category.name}
                            </button>
                            <Badge variant="outline" className="h-5 shrink-0 text-[10px]">
                              {serviceCount}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  aria-label={`${category.name} actions`}
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => openEditCategory(category)}
                                >
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                      <div className="rounded-md border border-border bg-card p-2 shadow-sm">
                        <div className="flex justify-end px-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() =>
                              openProductSubCategoryCreate(root.id)
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                            New sub-category
                          </Button>
                        </div>
                        <div className="mt-2 space-y-1 pl-2">
                          {subRows.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              No sub-categories yet.
                            </p>
                          ) : null}
                          {subRows.map((sub) => {
                            const isCafeRoot =
                              (root.productType ?? "").toLowerCase() ===
                              "cafe&food";
                            const subCount = isCafeRoot
                              ? countCafeFoodProductsForInventoryCategory(
                                  products,
                                  sub.id,
                                  productCategories,
                                )
                              : products.filter(
                                  (p) =>
                                    p.isActive && p.categoryId === sub.id,
                                ).length;
                            const active =
                              effectiveCatalogView === "products" &&
                              effectiveSelectedProductMenuCategoryId === sub.id;

                            return (
                              <div
                                key={sub.id}
                                draggable
                                onDragStart={() => {
                                  setDraggingProductMenuCategoryId(sub.id);
                                  setDragOverProductMenuCategoryId(sub.id);
                                }}
                                onDragEnter={(event) => {
                                  event.preventDefault();
                                  setDragOverProductMenuCategoryId(sub.id);
                                }}
                                onDragOver={(event) => {
                                  event.preventDefault();
                                  if (
                                    dragOverProductMenuCategoryId !== sub.id
                                  ) {
                                    setDragOverProductMenuCategoryId(sub.id);
                                  }
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (!draggingProductMenuCategoryId) return;
                                  if (draggingProductMenuCategoryId === sub.id) {
                                    return;
                                  }
                                  reorderProductSubCategoriesByDrag(
                                    menuSlug,
                                    draggingProductMenuCategoryId,
                                    sub.id,
                                  );
                                  setDraggingProductMenuCategoryId(null);
                                  setDragOverProductMenuCategoryId(null);
                                }}
                                onDragEnd={() => {
                                  setDraggingProductMenuCategoryId(null);
                                  setDragOverProductMenuCategoryId(null);
                                }}
                                className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                                  dragOverProductMenuCategoryId === sub.id &&
                                  draggingProductMenuCategoryId !== sub.id
                                    ? "bg-accent/10"
                                    : ""
                                } ${
                                  active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className="shrink-0 cursor-grab text-muted-foreground/90">
                                    <GripVertical className="h-3.5 w-3.5" />
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCatalogView("products");
                                      setSelectedProductMenuCategoryId(sub.id);
                                    }}
                                    className="min-w-0 flex-1 overflow-hidden text-left"
                                    title={sub.name}
                                  >
                                    <span className="block truncate">
                                      {sub.name}
                                    </span>
                                  </button>
                                  <Badge
                                    variant="outline"
                                    className={`h-5 shrink-0 text-[10px] ${
                                      active
                                        ? "border-sidebar-accent-foreground/30 bg-sidebar-accent/40 text-sidebar-accent-foreground"
                                        : ""
                                    }`}
                                  >
                                    {subCount}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        aria-label={`${sub.name} actions`}
                                        onClick={(event) =>
                                          event.stopPropagation()
                                        }
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          openProductSubCategoryEdit(sub.id)
                                        }
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() =>
                                          setDeleteProductSubCategoryId(sub.id)
                                        }
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              },
              )}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="lg:col-span-9">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  {effectiveCatalogView === "services"
                    ? catalogTitle
                    : productMenuTitle}
                </CardTitle>
                <CardDescription>
                  {effectiveCatalogView === "services"
                    ? catalogCountLabel
                    : productMenuCountLabel}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {effectiveCatalogView === "services" ? (
                  <>
                    {catalogSupportsSlotCreation ? (
                      <Button asChild variant="secondary">
                        <Link
                          href={`/admin/scheduling/new/recurring?returnTo=${encodeURIComponent(contextualReturnTo)}`}
                        >
                          Create slot
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      asChild
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Link href={createServiceFormHref}>
                        {LABELS.createService}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Link
                      href={
                        isSelectedProductMenuCafeAndFood
                          ? `/admin/inventory/products/new?productType=cafe%26food&categoryId=${encodeURIComponent(selectedProductMenuCategoryId ?? "")}&returnTo=${encodeURIComponent(contextualReturnTo)}`
                          : isSelectedProductMenuGifts
                          ? `/admin/inventory/products/new?productType=gifts&categoryId=${encodeURIComponent(selectedProductMenuCategoryId ?? "")}&returnTo=${encodeURIComponent(contextualReturnTo)}`
                          : isSelectedProductMenuRentals
                            ? `/admin/inventory/products/new?productType=rentals&categoryId=${encodeURIComponent(selectedProductMenuCategoryId ?? "")}&returnTo=${encodeURIComponent(contextualReturnTo)}`
                          : isSelectedProductMenuShop
                            ? `/admin/inventory/products/new?productType=shop&categoryId=${encodeURIComponent(selectedProductMenuCategoryId ?? "")}&returnTo=${encodeURIComponent(contextualReturnTo)}`
                          : `/admin/inventory/products/new?returnTo=${encodeURIComponent(contextualReturnTo)}`
                      }
                    >
                      New product
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {effectiveCatalogView === "services" ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filtered.map((service) => (
                    <Card key={service.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-32 bg-secondary">
                          {service.imageUrl ? (
                            <Image
                              src={service.imageUrl}
                              alt={service.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                              {service.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {service.description ?? "—"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <ServiceTypeBadge
                              serviceType={service.serviceType}
                            />
                            <EventTypeBadge eventType={service.eventType} />
                            <BookingModeBadge mode={service.bookingMode} />
                            <span className="text-xs font-semibold text-muted-foreground">
                              {formatPrice(service.basePrice)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getAgeRangeLabel(service.ageMin, service.ageMax)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                            {serviceSupportsAdminSlotCreation(service) ? (
                              <Button asChild variant="secondary" size="sm">
                                <Link
                                  href={`/admin/scheduling/new/recurring?serviceId=${encodeURIComponent(service.id)}&returnTo=${encodeURIComponent(contextualReturnTo)}`}
                                >
                                  Create slot
                                </Link>
                              </Button>
                            ) : null}
                            <Button asChild variant="outline" size="sm">
                              <Link href={resolveEditServiceFormHref(service)}>
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filtered.length === 0 &&
                  serviceCategoryFilterId !== "cat-open-play" ? (
                    <Card className="sm:col-span-2">
                      <CardContent className="pb-10 pt-10 text-center text-muted-foreground">
                        No matching {LABELS.services.toLowerCase()} for this
                        category.
                      </CardContent>
                    </Card>
                  ) : null}
                </div>

                {serviceCategoryFilterId === "cat-open-play" ? (
                  <OpenPlayMembershipAdminSection className="pt-2" />
                ) : null}

                {categoryPlacedPackages ? (
                  <CategoryPlacedPackagesSection
                    page={categoryPlacedPackages.page}
                    categoryId={categoryPlacedPackages.categoryId}
                    categoryName={catalogTitle}
                    className="pt-2"
                  />
                ) : null}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {productsInSelectedMenu.map((product) => {
                  const category =
                    productCategoryById.get(product.categoryId) ?? null;
                  const parent = category?.parentId
                    ? (productCategoryById.get(category.parentId) ?? null)
                    : null;
                  const description =
                    plainTextFromHtml(product.description) ??
                    product.description ??
                    "—";

                  const productTypeKey = (
                    category?.productType ?? "shop"
                  ).toLowerCase();
                  const productTypeLabel = getCatalogMenuLabel(
                    catalogSlugFromProductType(category?.productType ?? "shop"),
                  );
                  const isGiftCardProduct = productTypeKey === "gifts";
                  const isCafeAndFoodCardProduct = productTypeKey === "cafe&food";
                  const isRentalCardProduct = productTypeKey === "rentals";
                  const editProductHref = isCafeAndFoodCardProduct
                    ? `/admin/inventory/products/${product.id}/edit?returnTo=${encodeURIComponent(contextualReturnTo)}`
                    : `/admin/inventory/products/${product.id}/edit?returnTo=${encodeURIComponent(contextualReturnTo)}`;
                  const displayCategoryName = parent
                    ? `${parent.name} > ${category?.name ?? "—"}`
                    : (category?.name ?? "—");

                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-32 bg-secondary">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">
                                {product.name}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {description}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {displayCategoryName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isGiftCardProduct ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAdjustProduct(product)}
                                >
                                  Stock
                                </Button>
                              ) : null}
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={editProductHref}
                                >
                                  Edit
                                </Link>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteProductId(product.id)}
                              >
                                Delete
                              </Button>
                              {!isGiftCardProduct && !isRentalCardProduct ? (
                                product.linkedAddOnId ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => delinkFromRow(product)}
                                  >
                                    De-link
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={Boolean(product.linkedAddOnId)}
                                    onClick={() => promoteFromRow(product)}
                                  >
                                    Link add-on
                                  </Button>
                                )
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wide"
                            >
                              Type
                            </Badge>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {productTypeLabel}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {formatPrice(
                                product.memberPrice ?? product.price,
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Stock: {product.stockCount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {productsInSelectedMenu.length === 0 ? (
                  <Card className="sm:col-span-2">
                    <CardContent className="pb-10 pt-10 text-center text-muted-foreground">
                      No matching products for this menu.
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {adjustProduct ? (
        <StockAdjustmentModal
          product={adjustProduct}
          open={true}
          onClose={() => setAdjustProduct(null)}
        />
      ) : null}

      <CustomerNavSettingsModal
        open={customerNavModal != null}
        onOpenChange={(open) => {
          if (!open) {
            setCustomerNavModal(null);
          }
        }}
        navKey={customerNavModal?.navKey ?? null}
        sectionLabel={customerNavModal?.sectionLabel ?? ""}
      />

      <CrudModal
        open={productSubCategoryFormOpen}
        onOpenChange={(open) => {
          setProductSubCategoryFormOpen(open);
          if (!open) {
            setProductSubCategoryName("");
            setProductSubCategoryImageUrl("");
            setProductSubCategoryIsActive(true);
            setProductSubCategoryParentId(null);
            setEditingProductSubCategoryId(null);
            setProductSubCategoryAcknowledgmentRows([]);
          }
        }}
        title={
          editingProductSubCategoryId ? "Edit sub-category" : "New sub-category"
        }
        description={
          editingProductSubCategoryId
            ? isRentalProductSubCategoryModal
              ? "Update name and rental checkout acknowledgments."
              : "Update sub-category name and customer visibility."
            : isRentalProductSubCategoryModal
              ? "Create a sub-category and optional checkout acknowledgments for rentals."
              : "Create a sub-category under the selected category."
        }
        size="md"
        variant={editingProductSubCategoryId ? "edit" : "create"}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProductSubCategoryFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={persistProductSubCategory}
              disabled={productSubCategoryName.trim().length === 0}
            >
              {editingProductSubCategoryId ? "Save" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="product-subcategory-menu">Menu placement</Label>
            <Select
              value={productSubCategoryMenuSlug}
              onValueChange={(value) => {
                const slug = value as CatalogSlug;
                setProductSubCategoryMenuSlug(slug);
                if (isProductCatalogSlug(slug)) {
                  const rootId = productRootBySlug[slug] ?? null;
                  if (rootId) setProductSubCategoryParentId(rootId);
                }
              }}
            >
              <SelectTrigger id="product-subcategory-menu">
                <SelectValue placeholder="Select menu" />
              </SelectTrigger>
              <SelectContent>
                {CATALOG_MENU_ORDER.map((entry) => (
                  <SelectItem key={entry.slug} value={entry.slug}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Move this sub-category between menus without changing product type
              (rental, gift, shop, etc.).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-subcategory-name">Name</Label>
            <Input
              id="product-subcategory-name"
              value={productSubCategoryName}
              onChange={(event) => setProductSubCategoryName(event.target.value)}
              placeholder="Sub-category name"
            />
          </div>
          <SchedulingCategoryImageField
            value={productSubCategoryImageUrl}
            onChange={setProductSubCategoryImageUrl}
            helpText="Shown on Cafe & Food, Shop, Gifts, and Rentals category cards and hero banners. Uploads are automatically compressed. For production APIs, prefer an https:// image URL."
          />
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm font-medium text-foreground">
              Active
            </span>
            <Switch
              checked={productSubCategoryIsActive}
              onCheckedChange={setProductSubCategoryIsActive}
              aria-label="Sub-category active"
            />
          </div>
          {isRentalProductSubCategoryModal ? (
            <div className="space-y-2">
              <Label>Rental checkout acknowledgments</Label>
              <p className="text-xs text-muted-foreground">
                Shown as checkboxes on the cart and rental checkout. Summary text is
                required per row; add an optional link so customers can open the full
                policy or waiver in a new tab.
              </p>
              <div className="space-y-3">
                {productSubCategoryAcknowledgmentRows.map((row, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 sm:flex-row sm:items-start"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        value={row.text}
                        onChange={(event) => {
                          const next = [...productSubCategoryAcknowledgmentRows];
                          next[index] = { ...next[index], text: event.target.value };
                          setProductSubCategoryAcknowledgmentRows(next);
                        }}
                        placeholder="e.g. Adult supervision required during use"
                        aria-label={`Acknowledgment summary ${index + 1}`}
                      />
                      <Input
                        value={row.detailUrl}
                        onChange={(event) => {
                          const next = [...productSubCategoryAcknowledgmentRows];
                          next[index] = { ...next[index], detailUrl: event.target.value };
                          setProductSubCategoryAcknowledgmentRows(next);
                        }}
                        placeholder="Optional detail link (https://…)"
                        aria-label={`Acknowledgment detail URL ${index + 1}`}
                      />
                    </div>
                    {productSubCategoryAcknowledgmentRows.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 self-start"
                        onClick={() => {
                          setProductSubCategoryAcknowledgmentRows((rows) =>
                            rows.filter((_, i) => i !== index),
                          );
                        }}
                        aria-label={`Remove acknowledgment ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    setProductSubCategoryAcknowledgmentRows((rows) => [
                      ...rows,
                      { text: "", detailUrl: "" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add another
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CrudModal>

      <AlertDialog
        open={deleteProductSubCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteProductSubCategoryId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected product sub-category only if it has no
              products and no nested sub-categories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProductSubCategory}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteProductId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteProductId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CrudModal
        open={linkAddOnModalOpen}
        onOpenChange={setLinkAddOnModalOpen}
        title="Link add-on"
        description={
          selectedLinkAddOn
            ? `Configure how "${selectedLinkAddOn.name}" is priced for this link.`
            : "Configure add-on pricing before linking."
        }
        size="sm"
        variant="create"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkAddOnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmLinkAddOnFlow}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Add-on</Label>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm font-medium">
              {selectedLinkAddOn?.name ?? "Select an add-on first"}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-addon-quantity-shared">Quantity</Label>
            <Input
              id="link-addon-quantity-shared"
              type="number"
              min={1}
              value={linkAddOnQuantity}
              onChange={(event) => setLinkAddOnQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-addon-price-shared">Price</Label>
            <Input
              id="link-addon-price-shared"
              type="number"
              min={0}
              step="0.01"
              value={linkAddOnUnitPrice}
              disabled={linkAddOnIsFree}
              onChange={(event) => setLinkAddOnUnitPrice(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-sm font-medium text-foreground">Free</span>
            <Switch
              checked={linkAddOnIsFree}
              onCheckedChange={(value) => setLinkAddOnIsFree(value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Charge frequency</Label>
            <Select
              value={linkAddOnChargeFrequency}
              onValueChange={(value) =>
                setLinkAddOnChargeFrequency(
                  value as CategoryAddOnChargeFrequency,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ADD_ON_CHARGE_FREQUENCIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>

      <CrudModal
        open={categoryOpen && Boolean(editingCategoryId)}
        onOpenChange={(open) => {
          setCategoryOpen(open);
          if (!open) {
            setEditingCategoryId(null);
          }
        }}
        title={`Edit ${LABELS.serviceCategory}`}
        description={`Update ${LABELS.serviceCategory.toLowerCase()} details and rules.`}
        size="sm"
        variant="edit"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={persistCategory}>
              {`Save ${LABELS.serviceCategory.toLowerCase()}`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-parent-menu">Menu placement</Label>
            <Select
              value={categoryDraft.menuCatalogSlug}
              onValueChange={(value) => {
                const slug = value as CatalogSlug;
                setCategoryDraft((draft) => ({
                  ...draft,
                  menuCatalogSlug: slug,
                  parentTopLevelId: isSchedulingCatalogSlug(slug)
                    ? catalogSlugToSchedulingTopLevel(slug)
                    : draft.parentTopLevelId,
                }));
              }}
            >
              <SelectTrigger id="cat-parent-menu">
                <SelectValue placeholder="Select menu" />
              </SelectTrigger>
              <SelectContent>
                {CATALOG_MENU_ORDER.map((entry) => (
                  <SelectItem key={entry.slug} value={entry.slug}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which catalog menu shows this sub-category. Product menus
              only change placement; Gym, Play, Events, and Learn keep the same id.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={categoryDraft.name}
              onChange={(e) =>
                setCategoryDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="Court Sports"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display order</Label>
              <Input
                id="cat-order"
                type="number"
                value={categoryDraft.displayOrder}
                onChange={(e) =>
                  setCategoryDraft((d) => ({
                    ...d,
                    displayOrder: e.target.value,
                  }))
                }
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon</Label>
              <Input
                id="cat-icon"
                value={categoryDraft.icon}
                onChange={(e) =>
                  setCategoryDraft((d) => ({ ...d, icon: e.target.value }))
                }
                placeholder="Activity"
              />
            </div>
          </div>
          <SchedulingCategoryImageField
            value={categoryDraft.imageUrl}
            onChange={(imageUrl) => setCategoryDraft((draft) => ({ ...draft, imageUrl }))}
          />
          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Active</Label>
            <Switch
              id="cat-active"
              checked={categoryDraft.isActive}
              onCheckedChange={(v) =>
                setCategoryDraft((d) => ({ ...d, isActive: v }))
              }
            />
          </div>

          <Accordion type="single" collapsible defaultValue={undefined}>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced settings</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="cat-desc">Description (optional)</Label>
                    <Textarea
                      id="cat-desc"
                      value={categoryDraft.description}
                      onChange={(e) =>
                        setCategoryDraft((d) => ({
                          ...d,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Optional description shown to customers…"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-requires">
                          Child must attend with an adult
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          The child being booked must be accompanied by a
                          responsible adult (you or another adult on the
                          booking).
                        </p>
                      </div>
                      <Switch
                        id="cat-requires"
                        checked={categoryDraft.requiresAttendee}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            requiresAttendee: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-members">Members only</Label>
                        <p className="text-xs text-muted-foreground">
                          Only customers with an active membership can book.
                        </p>
                      </div>
                      <Switch
                        id="cat-members"
                        checked={categoryDraft.membersOnly}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({ ...d, membersOnly: v }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cat-infant">
                        Free infant age (months)
                      </Label>
                      <Input
                        id="cat-infant"
                        type="number"
                        min={0}
                        max={24}
                        value={categoryDraft.freeInfantMonths}
                        onChange={(e) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            freeInfantMonths: e.target.value,
                          }))
                        }
                        placeholder="e.g. 6"
                      />
                      <p className="text-xs text-muted-foreground">
                        Under X months is free.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-deposit">Deposit required (%)</Label>
                      <Input
                        id="cat-deposit"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={categoryDraft.depositPercent}
                        onChange={(e) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            depositPercent: e.target.value,
                          }))
                        }
                        placeholder="e.g. 25"
                      />
                      <p className="text-xs text-muted-foreground">
                        {categoryDraft.depositPercent.trim()
                          ? `e.g. ${categoryDraft.depositPercent}% deposit on a $100 booking = $${Math.round(Number.parseFloat(categoryDraft.depositPercent) || 0)} upfront`
                          : "Customers pay this percentage upfront to confirm the booking."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-special">
                          Allow special instructions
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Customers can add notes during booking (e.g. dietary
                          needs, preferences).
                        </p>
                      </div>
                      <Switch
                        id="cat-special"
                        checked={categoryDraft.specialInstructionsEnabled}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            specialInstructionsEnabled: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-waitlist">Enable waitlist</Label>
                        <p className="text-xs text-muted-foreground">
                          When a session is full, customers can join the
                          waitlist.
                        </p>
                      </div>
                      <Switch
                        id="cat-waitlist"
                        checked={categoryDraft.waitlistEnabled}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            waitlistEnabled: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-family">
                          Participating children: same household only
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Every child on the play session must be from the same
                          household or your linked family list — outside
                          children cannot be added.
                        </p>
                      </div>
                      <Switch
                        id="cat-family"
                        checked={categoryDraft.allowFamilyMember}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            allowFamilyMember: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-checkin-gate">
                          Require check-in before next booking
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Contact must have checked in before making another
                          booking in this category.
                        </p>
                      </div>
                      <Switch
                        id="cat-checkin-gate"
                        checked={categoryDraft.requireCheckInBeforeRebook}
                        onCheckedChange={(v) =>
                          setCategoryDraft((d) => ({
                            ...d,
                            requireCheckInBeforeRebook: v,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="addons">
              <AccordionTrigger>Linked add-ons (optional)</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="text-xs text-muted-foreground">
                    Add-ons customers can select when booking this category.
                  </p>
                  {categoryDraft.pendingAddOnLinks.map((row) => {
                    const addon = addOnCatalog.find(
                      (a) => a.id === row.addOnId,
                    );
                    return (
                      <div
                        key={row.addOnId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {addon?.name ?? row.addOnName ?? row.addOnId}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Free</Label>
                            <Switch
                              checked={row.isFree}
                              onCheckedChange={(v) =>
                                setCategoryDraft((d) => ({
                                  ...d,
                                  pendingAddOnLinks: d.pendingAddOnLinks.map(
                                    (x) =>
                                      x.addOnId === row.addOnId
                                        ? { ...x, isFree: v }
                                        : x,
                                  ),
                                }))
                              }
                            />
                          </div>
                          {!row.isFree && addon ? (
                            <Badge variant="secondary">
                              {formatPrice(addon.price)}
                            </Badge>
                          ) : null}
                          <Badge variant="outline">{`Qty ${row.quantity}`}</Badge>
                          <Badge variant="outline">{`$${row.unitPrice}`}</Badge>
                          <Badge variant="outline">
                            {
                              CATEGORY_ADD_ON_CHARGE_FREQUENCIES.find(
                                (option) =>
                                  option.value === row.chargeFrequency,
                              )?.label
                            }
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setCategoryDraft((d) => ({
                                ...d,
                                pendingAddOnLinks: d.pendingAddOnLinks.filter(
                                  (x) => x.addOnId !== row.addOnId,
                                ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Popover
                      open={categoryAddOnOpen}
                      onOpenChange={setCategoryAddOnOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between sm:flex-1"
                        >
                          {categoryPendingAddOnId
                            ? (addOnCatalog.find(
                                (entry) => entry.id === categoryPendingAddOnId,
                              )?.name ?? "Link add-on")
                            : "Link add-on"}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search add-ons…" />
                          <CommandList>
                            <CommandEmpty>No add-ons found.</CommandEmpty>
                            <CommandGroup>
                              {addOnCatalog
                                .filter(
                                  (a) =>
                                    !categoryDraft.pendingAddOnLinks.some(
                                      (p) => p.addOnId === a.id,
                                    ),
                                )
                                .map((a) => (
                                  <CommandItem
                                    key={a.id}
                                    value={a.name}
                                    onSelect={() => {
                                      setCategoryPendingAddOnId(a.id);
                                      setCategoryAddOnOpen(false);
                                    }}
                                  >
                                    {a.name}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {formatPrice(a.price)}
                                    </span>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openLinkModalForTarget("category")}
                      disabled={!categoryPendingAddOnId}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CrudModal>

      <CrudModal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={`Edit ${LABELS.service.toLowerCase()}`}
        description={selected?.name ?? undefined}
        size="lg"
        variant="edit"
        footer={
          selected ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={persistEdit}>
                Save changes
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editProgramArea}
                  onValueChange={(value) =>
                    handleEditProgramAreaChange(value as SchedulingTopLevelId)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => (
                      <SelectItem key={topLevelId} value={topLevelId}>
                        {getSchedulingTopLevelLabel(topLevelId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-category</Label>
                <Select
                  value={editDraft.categoryId}
                  onValueChange={(value) =>
                    setEditDraft((draft) => ({ ...draft, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {editSubCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={editDraft.locationId}
                onValueChange={(v) =>
                  setEditDraft((d) => ({ ...d, locationId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editDraft.name}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDraft.description}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Base price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editDraft.basePrice}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, basePrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cap">Capacity</Label>
                <Input
                  id="edit-cap"
                  type="number"
                  value={editDraft.capacity}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, capacity: e.target.value }))
                  }
                />
              </div>
            </div>

            <Accordion
              type="single"
              collapsible
              className="border border-border rounded-lg px-3"
            >
              <AccordionItem value="pricing-seats">
                <AccordionTrigger className="text-sm font-semibold">
                  Pricing &amp; seat rules
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-sibling">
                        Sibling price (per additional family child)
                      </Label>
                      <Input
                        id="edit-sibling"
                        type="number"
                        step="0.01"
                        value={editDraft.siblingPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            siblingPrice: e.target.value,
                          }))
                        }
                        placeholder="e.g. 10.00 — leave blank to charge base price for all children"
                      />
                      <p className="text-xs text-muted-foreground">
                        2nd and further children from the same family pay this
                        rate.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-free-adults">
                        Free adults per family
                      </Label>
                      <Input
                        id="edit-free-adults"
                        type="number"
                        min={0}
                        max={20}
                        value={editDraft.freeAdultCount}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            freeAdultCount: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Adults included at no extra charge per booking.
                      </p>
                    </div>
                    {selected != null && showMaxPassCountAdminField(selected) ? (
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="edit-max-passes">Max passes per booking</Label>
                        <Input
                          id="edit-max-passes"
                          type="number"
                          min={1}
                          max={99}
                          value={editDraft.maxPassCount}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              maxPassCount: e.target.value,
                            }))
                          }
                          placeholder="Leave blank for no limit"
                        />
                        <p className="text-xs text-muted-foreground">
                          Customer “No of passes” stepper. Set 1 to fix at one pass
                          (no +/−). Set 2 to allow up to two passes, and so on.
                        </p>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="edit-extra-adult">
                        Price per extra adult (beyond free count)
                      </Label>
                      <Input
                        id="edit-extra-adult"
                        type="number"
                        step="0.01"
                        value={editDraft.additionalAdultPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            additionalAdultPrice: e.target.value,
                          }))
                        }
                        placeholder="e.g. 10.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-seats">
                        Minimum participants
                      </Label>
                      <Input
                        id="edit-min-seats"
                        type="number"
                        min={1}
                        value={editDraft.minSeats}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            minSeats: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Booking stays pending until this many participants join.
                      </p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-price-hour">
                        Hourly rate (duration-based billing)
                      </Label>
                      <Input
                        id="edit-price-hour"
                        type="number"
                        step="0.01"
                        value={editDraft.pricePerHour}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            pricePerHour: e.target.value,
                          }))
                        }
                        placeholder="e.g. 75.00 — overrides per-participant pricing"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use for room rentals. Total = rate × hours.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-child">Min children</Label>
                      <Input
                        id="edit-min-child"
                        type="number"
                        min={0}
                        value={editDraft.minChildSeats}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            minChildSeats: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-child">Max children</Label>
                      <Input
                        id="edit-max-child"
                        type="number"
                        min={0}
                        value={editDraft.maxChildSeats}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            maxChildSeats: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-adult-seat">Min adults</Label>
                      <Input
                        id="edit-min-adult-seat"
                        type="number"
                        min={0}
                        value={editDraft.minAdultSeats}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            minAdultSeats: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-adult-seat">Max adults</Label>
                      <Input
                        id="edit-max-adult-seat"
                        type="number"
                        min={0}
                        value={editDraft.maxAdultSeats}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            maxAdultSeats: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-extra-child-price">
                        Price per extra child (beyond max child seats)
                      </Label>
                      <Input
                        id="edit-extra-child-price"
                        type="number"
                        step="0.01"
                        value={editDraft.additionalChildPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            additionalChildPrice: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-pkg-only">Package-only service</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, customers must select an event package to book.
                </p>
              </div>
              <Switch
                id="edit-pkg-only"
                checked={editDraft.isPackageService}
                onCheckedChange={(v) => {
                  if (
                    !v &&
                    selected &&
                    packages.some((p) => p.serviceId === selected.id)
                  ) {
                    setPackageDisableConfirmOpen(true);
                    return;
                  }
                  setEditDraft((d) => ({ ...d, isPackageService: v }));
                }}
              />
            </div>
            {editDraft.isPackageService ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTitle className="text-amber-950 dark:text-amber-100">
                  Package-only
                </AlertTitle>
                <AlertDescription className="text-amber-900/90 dark:text-amber-50/90">
                  Customers will not be able to book this service directly. They
                  must choose an event package.
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-sub-price">
                  Subscription price (optional)
                </Label>
                <Input
                  id="edit-sub-price"
                  type="number"
                  value={editDraft.subscriptionPrice}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      subscriptionPrice: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-waiver">Requires waiver</Label>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Require waiver at checkout
                  </span>
                  <Switch
                    id="edit-waiver"
                    checked={editDraft.requiresWaiver}
                    onCheckedChange={(v) =>
                      setEditDraft((d) => ({
                        ...d,
                        requiresWaiver: v,
                        requiredDocumentIds: v ? d.requiredDocumentIds : [],
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            {editDraft.requiresWaiver ? (
              <div className="space-y-2">
                <Label>Required waivers</Label>
                {waiverDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No waiver documents exist yet. Create them in Admin →
                    Waivers.
                  </p>
                ) : (
                  <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                    {waiverDocs.map((doc) => {
                      const checked = editDraft.requiredDocumentIds.includes(
                        doc.id,
                      );
                      return (
                        <label key={doc.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(e) => {
                              const nextChecked = e.target.checked;
                              setEditDraft((d) => ({
                                ...d,
                                requiredDocumentIds: nextChecked
                                  ? Array.from(
                                      new Set([
                                        ...d.requiredDocumentIds,
                                        doc.id,
                                      ]),
                                    )
                                  : d.requiredDocumentIds.filter(
                                      (id) => id !== doc.id,
                                    ),
                              }));
                            }}
                          />
                          <span className="min-w-0">
                            <span className="text-sm font-semibold text-foreground">
                              {doc.title}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              v{doc.version}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select one or more waivers the customer must sign before
                  booking.
                </p>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-age-min">Min age (optional)</Label>
                <Input
                  id="edit-age-min"
                  type="number"
                  min={0}
                  value={editDraft.ageMin}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, ageMin: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age-max">Max age (optional)</Label>
                <Input
                  id="edit-age-max"
                  type="number"
                  min={0}
                  value={editDraft.ageMax}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, ageMax: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dur">Duration (minutes)</Label>
              <Input
                id="edit-dur"
                type="number"
                value={editDraft.durationMinutes}
                onChange={(e) =>
                  setEditDraft((d) => ({
                    ...d,
                    durationMinutes: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event visibility</Label>
                <EventTypeSelector
                  value={editDraft.eventType}
                  onChange={(v) => setEditDraft((d) => ({ ...d, eventType: v }))}
                />
              </div>

            <EventBookingScheduleFields
              draft={{
                eventBookingScheduleMode: editDraft.eventBookingScheduleMode,
              }}
              onChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))}
            />
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="booking">
                <AccordionTrigger>Booking rules</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-dur">Min duration (mins)</Label>
                      <Input
                        id="edit-min-dur"
                        type="number"
                        value={editDraft.minDurationMinutes}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            minDurationMinutes: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-dur">Max duration (mins)</Label>
                      <Input
                        id="edit-max-dur"
                        type="number"
                        value={editDraft.maxDurationMinutes}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            maxDurationMinutes: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-inc">Slot increment</Label>
                      <Select
                        value={editDraft.slotIncrementMinutes}
                        onValueChange={(value) =>
                          setEditDraft((d) => ({
                            ...d,
                            slotIncrementMinutes: value,
                          }))
                        }
                      >
                        <SelectTrigger id="edit-inc" className="w-full">
                          <SelectValue placeholder="Select increment" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPEN_BOOKING_SLOT_INCREMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.label} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-conc">Max concurrent</Label>
                      <Input
                        id="edit-max-conc"
                        className="w-full"
                        type="number"
                        value={editDraft.maxConcurrent}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            maxConcurrent: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-min-adv">Min advance (hours)</Label>
                      <Input
                        id="edit-min-adv"
                        type="number"
                        value={editDraft.minAdvanceHours}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            minAdvanceHours: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-adv">Max advance (hours)</Label>
                      <Input
                        id="edit-max-adv"
                        type="number"
                        value={editDraft.maxAdvanceHours}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            maxAdvanceHours: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Accordion
              type="single"
              collapsible
              className="border border-border rounded-lg px-3"
            >
              <AccordionItem value="svc-addons">
                <AccordionTrigger className="text-sm font-semibold">
                  Linked add-ons (optional)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <p className="text-xs text-muted-foreground">
                      Add-ons customers can select when booking this{" "}
                      {LABELS.service.toLowerCase()}.
                    </p>
                    {(selectedLive?.linkedAddOns ?? []).map((row) => {
                      const addon = addOnCatalog.find(
                        (a) => a.id === row.addOnId,
                      );
                      return (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {addon?.name ?? row.addOnName ?? row.addOnId}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Free</Label>
                              <Switch
                                checked={row.isFree}
                                onCheckedChange={(v) => {
                                  if (!selected) return;
                                  setSchedulingAddOnFree(
                                    "service",
                                    selected.id,
                                    row.addOnId,
                                    v,
                                  );
                                }}
                              />
                            </div>
                            {!row.isFree && addon ? (
                              <Badge variant="secondary">
                                {formatPrice(addon.price)}
                              </Badge>
                            ) : null}
                            {row.quantity != null ? (
                              <Badge variant="outline">{`Qty ${row.quantity}`}</Badge>
                            ) : null}
                            {row.unitPrice != null ? (
                              <Badge variant="outline">{`$${row.unitPrice}`}</Badge>
                            ) : null}
                            {row.chargeFrequency ? (
                              <Badge variant="outline">
                                {
                                  CATEGORY_ADD_ON_CHARGE_FREQUENCIES.find(
                                    (option) =>
                                      option.value === row.chargeFrequency,
                                  )?.label
                                }
                              </Badge>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() =>
                                selected &&
                                unlinkSchedulingAddOn(
                                  "service",
                                  selected.id,
                                  row.addOnId,
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Popover
                        open={editAddOnOpen}
                        onOpenChange={setEditAddOnOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between sm:flex-1"
                          >
                            {editPendingAddOnId
                              ? (addOnCatalog.find(
                                  (entry) => entry.id === editPendingAddOnId,
                                )?.name ?? "Link add-on")
                              : "Link add-on"}
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search add-ons…" />
                            <CommandList>
                              <CommandEmpty>No add-ons found.</CommandEmpty>
                              <CommandGroup>
                                {addOnCatalog
                                  .filter(
                                    (a) =>
                                      !(selectedLive?.linkedAddOns ?? []).some(
                                        (p) => p.addOnId === a.id,
                                      ),
                                  )
                                  .map((a) => (
                                    <CommandItem
                                      key={a.id}
                                      value={a.name}
                                      onSelect={() => {
                                        setEditPendingAddOnId(a.id);
                                        setEditAddOnOpen(false);
                                      }}
                                    >
                                      {a.name}
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {formatPrice(a.price)}
                                      </span>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openLinkModalForTarget("edit")}
                        disabled={!editPendingAddOnId}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={editDraft.isActive}
                onCheckedChange={(v) =>
                  setEditDraft((d) => ({ ...d, isActive: v }))
                }
              />
            </div>
          </div>
        ) : null}
      </CrudModal>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={`New ${LABELS.service.toLowerCase()}`}
        description={`Add a catalog ${LABELS.service.toLowerCase()} for the selected ${LABELS.serviceCategory.toLowerCase()}.`}
        size="lg"
        variant="create"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={persistCreate}>
              Create {LABELS.service.toLowerCase()}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={createProgramArea}
                onValueChange={(value) =>
                  handleCreateProgramAreaChange(value as SchedulingTopLevelId)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => (
                    <SelectItem key={topLevelId} value={topLevelId}>
                      {getSchedulingTopLevelLabel(topLevelId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sub-category</Label>
              <Select
                value={createDraft.categoryId}
                onValueChange={(value) =>
                  setCreateDraft((draft) => ({ ...draft, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {createSubCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={createDraft.locationId}
              onValueChange={(v) =>
                setCreateDraft((d) => ({ ...d, locationId: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Booking mode</Label>
            <Select
              value={createDraft.bookingMode}
              onValueChange={(v) =>
                setCreateDraft((d) => ({
                  ...d,
                  bookingMode: v as SchedulingBookingMode,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event visibility</Label>
              <EventTypeSelector
                value={createDraft.eventType}
                onChange={(v) => setCreateDraft((d) => ({ ...d, eventType: v }))}
              />
              <p className="text-xs text-muted-foreground">
                Private and host-only events are not shown here.
              </p>
            </div>

            <EventBookingScheduleFields
              draft={{
                eventBookingScheduleMode: createDraft.eventBookingScheduleMode,
              }}
              onChange={(patch) => setCreateDraft((d) => ({ ...d, ...patch }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{LABELS.serviceType}</Label>
            <Select
              value={createDraft.serviceType}
              onValueChange={(v) =>
                setCreateDraft((d) => ({
                  ...d,
                  serviceType: v as SchedulingServiceType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {allServiceTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              value={createDraft.name}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-desc">Description</Label>
            <Textarea
              id="new-desc"
              value={createDraft.description}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-price">Base price</Label>
              <Input
                id="new-price"
                type="number"
                value={createDraft.basePrice}
                onChange={(e) =>
                  setCreateDraft((d) => ({ ...d, basePrice: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cap">Capacity</Label>
              <Input
                id="new-cap"
                type="number"
                value={createDraft.capacity}
                onChange={(e) =>
                  setCreateDraft((d) => ({ ...d, capacity: e.target.value }))
                }
              />
            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border border-border rounded-lg px-3"
          >
            <AccordionItem value="new-pricing-seats">
              <AccordionTrigger className="text-sm font-semibold">
                Pricing &amp; seat rules
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-sibling">
                      Sibling price (per additional family child)
                    </Label>
                    <Input
                      id="new-sibling"
                      type="number"
                      step="0.01"
                      value={createDraft.siblingPrice}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          siblingPrice: e.target.value,
                        }))
                      }
                      placeholder="e.g. 10.00 — leave blank to charge base price for all children"
                    />
                    <p className="text-xs text-muted-foreground">
                      2nd and further children from the same family pay this
                      rate.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-free-adults">
                      Free adults per family
                    </Label>
                    <Input
                      id="new-free-adults"
                      type="number"
                      min={0}
                      max={20}
                      value={createDraft.freeAdultCount}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          freeAdultCount: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Adults included at no extra charge per booking.
                    </p>
                  </div>
                  {showMaxPassCountAdminField({
                    id: "",
                    categoryId: createDraft.categoryId,
                  }) ? (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="new-max-passes">Max passes per booking</Label>
                      <Input
                        id="new-max-passes"
                        type="number"
                        min={1}
                        max={99}
                        value={createDraft.maxPassCount}
                        onChange={(e) =>
                          setCreateDraft((d) => ({
                            ...d,
                            maxPassCount: e.target.value,
                          }))
                        }
                        placeholder="Leave blank for no limit"
                      />
                      <p className="text-xs text-muted-foreground">
                        Customer “No of passes” stepper. Set 1 to fix at one pass
                        (no +/−). Set 2 to allow up to two passes, and so on.
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="new-extra-adult">
                      Price per extra adult (beyond free count)
                    </Label>
                    <Input
                      id="new-extra-adult"
                      type="number"
                      step="0.01"
                      value={createDraft.additionalAdultPrice}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          additionalAdultPrice: e.target.value,
                        }))
                      }
                      placeholder="e.g. 10.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-seats">Minimum participants</Label>
                    <Input
                      id="new-min-seats"
                      type="number"
                      min={1}
                      value={createDraft.minSeats}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          minSeats: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Booking stays pending until this many participants join.
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-price-hour">
                      Hourly rate (duration-based billing)
                    </Label>
                    <Input
                      id="new-price-hour"
                      type="number"
                      step="0.01"
                      value={createDraft.pricePerHour}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          pricePerHour: e.target.value,
                        }))
                      }
                      placeholder="e.g. 75.00 — overrides per-participant pricing"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use for room rentals. Total = rate × hours.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-child">Min children</Label>
                    <Input
                      id="new-min-child"
                      type="number"
                      min={0}
                      value={createDraft.minChildSeats}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          minChildSeats: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-child">Max children</Label>
                    <Input
                      id="new-max-child"
                      type="number"
                      min={0}
                      value={createDraft.maxChildSeats}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          maxChildSeats: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-adult-seat">Min adults</Label>
                    <Input
                      id="new-min-adult-seat"
                      type="number"
                      min={0}
                      value={createDraft.minAdultSeats}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          minAdultSeats: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-adult-seat">Max adults</Label>
                    <Input
                      id="new-max-adult-seat"
                      type="number"
                      min={0}
                      value={createDraft.maxAdultSeats}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          maxAdultSeats: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-extra-child-price">
                      Price per extra child (beyond max child seats)
                    </Label>
                    <Input
                      id="new-extra-child-price"
                      type="number"
                      step="0.01"
                      value={createDraft.additionalChildPrice}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          additionalChildPrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="new-pkg-only">Package-only service</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, customers must select an event package to book.
              </p>
            </div>
            <Switch
              id="new-pkg-only"
              checked={createDraft.isPackageService}
              onCheckedChange={(v) =>
                setCreateDraft((d) => ({ ...d, isPackageService: v }))
              }
            />
          </div>
          {createDraft.isPackageService ? (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTitle className="text-amber-950 dark:text-amber-100">
                Package-only
              </AlertTitle>
              <AlertDescription className="text-amber-900/90 dark:text-amber-50/90">
                Manage package tiers from Scheduling → Packages and assign them to
                this service there.
              </AlertDescription>
            </Alert>
          ) : null}

          <Accordion
            type="single"
            collapsible
            className="border border-border rounded-lg px-3"
          >
            <AccordionItem value="new-svc-addons">
              <AccordionTrigger className="text-sm font-semibold">
                Linked add-ons (optional)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="text-xs text-muted-foreground">
                    Add-ons customers can select when booking this{" "}
                    {LABELS.service.toLowerCase()}.
                  </p>
                  {createDraft.pendingServiceAddOnLinks.map((row) => {
                    const addon = addOnCatalog.find(
                      (a) => a.id === row.addOnId,
                    );
                    return (
                      <div
                        key={row.addOnId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {addon?.name ?? row.addOnName ?? row.addOnId}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Free</Label>
                            <Switch
                              checked={row.isFree}
                              onCheckedChange={(v) =>
                                setCreateDraft((d) => ({
                                  ...d,
                                  pendingServiceAddOnLinks:
                                    d.pendingServiceAddOnLinks.map((x) =>
                                      x.addOnId === row.addOnId
                                        ? { ...x, isFree: v }
                                        : x,
                                    ),
                                }))
                              }
                            />
                          </div>
                          {!row.isFree && addon ? (
                            <Badge variant="secondary">
                              {formatPrice(addon.price)}
                            </Badge>
                          ) : null}
                          <Badge variant="outline">{`Qty ${row.quantity}`}</Badge>
                          <Badge variant="outline">{`$${row.unitPrice}`}</Badge>
                          <Badge variant="outline">
                            {
                              CATEGORY_ADD_ON_CHARGE_FREQUENCIES.find(
                                (option) =>
                                  option.value === row.chargeFrequency,
                              )?.label
                            }
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setCreateDraft((d) => ({
                                ...d,
                                pendingServiceAddOnLinks:
                                  d.pendingServiceAddOnLinks.filter(
                                    (x) => x.addOnId !== row.addOnId,
                                  ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Popover
                      open={createAddOnOpen}
                      onOpenChange={setCreateAddOnOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between sm:flex-1"
                        >
                          {createPendingAddOnId
                            ? (addOnCatalog.find(
                                (entry) => entry.id === createPendingAddOnId,
                              )?.name ?? "Link add-on")
                            : "Link add-on"}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search add-ons…" />
                          <CommandList>
                            <CommandEmpty>No add-ons found.</CommandEmpty>
                            <CommandGroup>
                              {addOnCatalog
                                .filter(
                                  (a) =>
                                    !createDraft.pendingServiceAddOnLinks.some(
                                      (p) => p.addOnId === a.id,
                                    ),
                                )
                                .map((a) => (
                                  <CommandItem
                                    key={a.id}
                                    value={a.name}
                                    onSelect={() => {
                                      setCreatePendingAddOnId(a.id);
                                      setCreateAddOnOpen(false);
                                    }}
                                  >
                                    {a.name}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {formatPrice(a.price)}
                                    </span>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openLinkModalForTarget("create")}
                      disabled={!createPendingAddOnId}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-sub-price">
                Subscription price (optional)
              </Label>
              <Input
                id="new-sub-price"
                type="number"
                value={createDraft.subscriptionPrice}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    subscriptionPrice: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-waiver">Requires waiver</Label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Require waiver at checkout
                </span>
                <Switch
                  id="new-waiver"
                  checked={createDraft.requiresWaiver}
                  onCheckedChange={(v) =>
                    setCreateDraft((d) => ({
                      ...d,
                      requiresWaiver: v,
                      requiredDocumentIds: v ? d.requiredDocumentIds : [],
                    }))
                  }
                />
              </div>
            </div>
          </div>
          {createDraft.requiresWaiver ? (
            <div className="space-y-2">
              <Label>Required waivers</Label>
              {waiverDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No waiver documents exist yet. Create them in Admin → Waivers.
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                  {waiverDocs.map((doc) => {
                    const checked = createDraft.requiredDocumentIds.includes(
                      doc.id,
                    );
                    return (
                      <label key={doc.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={(e) => {
                            const nextChecked = e.target.checked;
                            setCreateDraft((d) => ({
                              ...d,
                              requiredDocumentIds: nextChecked
                                ? Array.from(
                                    new Set([...d.requiredDocumentIds, doc.id]),
                                  )
                                : d.requiredDocumentIds.filter(
                                    (id) => id !== doc.id,
                                  ),
                            }));
                          }}
                        />
                        <span className="min-w-0">
                          <span className="text-sm font-semibold text-foreground">
                            {doc.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            v{doc.version}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Select one or more waivers the customer must sign before
                booking.
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-age-min">Min age (optional)</Label>
              <Input
                id="new-age-min"
                type="number"
                min={0}
                value={createDraft.ageMin}
                onChange={(e) =>
                  setCreateDraft((d) => ({ ...d, ageMin: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-age-max">Max age (optional)</Label>
              <Input
                id="new-age-max"
                type="number"
                min={0}
                value={createDraft.ageMax}
                onChange={(e) =>
                  setCreateDraft((d) => ({ ...d, ageMax: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-dur">Duration (minutes)</Label>
            <Input
              id="new-dur"
              type="number"
              value={createDraft.durationMinutes}
              onChange={(e) =>
                setCreateDraft((d) => ({
                  ...d,
                  durationMinutes: e.target.value,
                }))
              }
            />
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="booking">
              <AccordionTrigger>Booking rules</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-min-dur">Min duration (mins)</Label>
                    <Input
                      id="new-min-dur"
                      type="number"
                      value={createDraft.minDurationMinutes}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          minDurationMinutes: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-dur">Max duration (mins)</Label>
                    <Input
                      id="new-max-dur"
                      type="number"
                      value={createDraft.maxDurationMinutes}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          maxDurationMinutes: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-inc">Slot increment</Label>
                    <Select
                      value={createDraft.slotIncrementMinutes}
                      onValueChange={(value) =>
                        setCreateDraft((d) => ({
                          ...d,
                          slotIncrementMinutes: value,
                        }))
                      }
                    >
                      <SelectTrigger id="new-inc" className="w-full">
                        <SelectValue placeholder="Select increment" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPEN_BOOKING_SLOT_INCREMENT_OPTIONS.map((option) => (
                          <SelectItem key={option.label} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-conc">Max concurrent</Label>
                    <Input
                      id="new-max-conc"
                      className="w-full"
                      type="number"
                      value={createDraft.maxConcurrent}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          maxConcurrent: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-adv">Min advance (hours)</Label>
                    <Input
                      id="new-min-adv"
                      type="number"
                      value={createDraft.minAdvanceHours}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          minAdvanceHours: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-max-adv">Max advance (hours)</Label>
                    <Input
                      id="new-max-adv"
                      type="number"
                      value={createDraft.maxAdvanceHours}
                      onChange={(e) =>
                        setCreateDraft((d) => ({
                          ...d,
                          maxAdvanceHours: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex items-center justify-between">
            <Label htmlFor="new-active">Active</Label>
            <Switch
              id="new-active"
              checked={createDraft.isActive}
              onCheckedChange={(v) =>
                setCreateDraft((d) => ({ ...d, isActive: v }))
              }
            />
          </div>
        </div>
      </CrudModal>

      <AlertDialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCategoryId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategoryId
                ? `This will permanently remove “${
                    sortedCategories.find(
                      (category) => category.id === deleteCategoryId,
                    )?.name ?? "this category"
                  }”.`
                : "This will permanently remove the selected category."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={packageDisableConfirmOpen}
        onOpenChange={setPackageDisableConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off package-only?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers can book this service directly without a package. Linked
              packages remain but are no longer required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditDraft((d) => ({ ...d, isPackageService: false }));
                setPackageDisableConfirmOpen(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
