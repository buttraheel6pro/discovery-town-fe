"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";

import { CafeProductDetailClient } from "@/components/customer/cafe-product-detail-client";
import { CustomerFooter } from "@/components/customer/footer";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerNavProductRouteGuard } from "@/components/customer/customer-nav-route-guard";
import { RentalAvailabilityCalendar } from "@/components/customer/rental-availability-calendar";
import { ShopProductDetailClient } from "@/components/customer/shop-product-detail-client";
import { useCafe } from "@/lib/cafe-store";
import { mergedCafeProductsForCustomer } from "@/lib/cafe-utils";
import { useInventory } from "@/lib/inventory-store";
import {
  buildProductCategoryById,
  isConsumerVisibleProduct,
  isGiftAddOnVisibleProduct,
} from "@/lib/product-visibility";
import { isRentalProduct } from "@/lib/rental-product";
import { cn } from "@/lib/utils";

interface ShopProductPageProps {
  readonly params: Promise<{ productId: string }>;
}

export default function ShopProductPage({
  params,
}: Readonly<ShopProductPageProps>) {
  const { products, productCategories, coupons } = useInventory();
  const { cafeProducts, modifierGroups, attributeGroups } = useCafe();
  const [rentalFromDate, setRentalFromDate] = useState("");
  const [rentalToDate, setRentalToDate] = useState("");
  const [rentalSlotStartAt, setRentalSlotStartAt] = useState("");
  const [rentalSlotEndAt, setRentalSlotEndAt] = useState("");
  const { productId } = use(params);
  const customerCafeProducts = mergedCafeProductsForCustomer(
    cafeProducts,
    products,
    productCategories,
  );

  useEffect(() => {
    setRentalFromDate("");
    setRentalToDate("");
    setRentalSlotStartAt("");
    setRentalSlotEndAt("");
  }, [productId]);

  const handleDateRangeChange = useCallback((fromDate: string, toDate: string) => {
    setRentalFromDate(fromDate);
    setRentalToDate(toDate);
  }, []);

  const handleRentalSlotChange = useCallback((startIso: string, endIso: string) => {
    setRentalSlotStartAt(startIso);
    setRentalSlotEndAt(endIso);
  }, []);
  const categoryById = useMemo(
    () => buildProductCategoryById(productCategories),
    [productCategories],
  );
  const product = products.find((row) => row.id === productId) ?? null;
  const isProductVisible =
    product != null && isConsumerVisibleProduct(product, categoryById);
  const cafeProduct =
    customerCafeProducts.find((row) => row.id === productId) ?? null;
  const category = product
    ? (productCategories.find((row) => row.id === product.categoryId) ?? null)
    : null;

  const linkedProducts =
    product?.giftProductIds
      ?.map((linkedId) => products.find((row) => row.id === linkedId) ?? null)
      .filter((row): row is NonNullable<typeof row> => Boolean(row)) ?? [];
  const linkedAddOnProducts =
    product?.giftAddOnProductIds
      ?.map((linkedId) => products.find((row) => row.id === linkedId) ?? null)
      .filter((row): row is NonNullable<typeof row> => Boolean(row)) ?? [];
  const linkedCoupons =
    product?.giftVoucherCouponIds
      ?.map((linkedId) => coupons.find((row) => row.id === linkedId) ?? null)
      .filter((row): row is NonNullable<typeof row> => Boolean(row)) ?? [];
  const isGiftProduct = (category?.productType ?? "").toLowerCase() === "gifts";
  const isCafeInventoryProduct =
    (category?.productType ?? "").toLowerCase() === "cafe&food";
  const related = isGiftProduct
    ? linkedAddOnProducts
        .filter((row) => row.id !== product?.id && isGiftAddOnVisibleProduct(row))
        .slice(0, 6)
    : product
      ? products
          .filter(
            (p) =>
              p.categoryId === product.categoryId &&
              p.id !== product.id &&
              isConsumerVisibleProduct(p, categoryById),
          )
          .slice(0, 3)
      : [];
  const relatedTitle = isGiftProduct
    ? "You may also like"
    : "You might also like";
  const rentalBilling = (product?.rentalBillingType ?? "").toUpperCase();
  const hasSelectedRentalSchedule =
    (rentalBilling === "PER_DAY" &&
      rentalFromDate.trim().length > 0 &&
      rentalToDate.trim().length > 0) ||
    ((rentalBilling === "PER_HOUR" || rentalBilling === "PER_HALF_DAY") &&
      rentalSlotStartAt.trim().length > 0 &&
      rentalSlotEndAt.trim().length > 0);

  const guardProductType = useMemo(() => {
    if (product != null && isRentalProduct(product)) {
      return "rentals";
    }
    if (isCafeInventoryProduct || cafeProduct != null) {
      return "cafe&food";
    }
    return category?.productType ?? null;
  }, [cafeProduct, category?.productType, isCafeInventoryProduct, product]);

  return (
    <CustomerNavProductRouteGuard productType={guardProductType}>
      <CustomerNavbar />
      <main className="bg-background">
        <div className="mx-auto max-w-[88rem] space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          {cafeProduct && (cafeProduct.isActive ?? true) ? (
            <CafeProductDetailClient
              product={cafeProduct}
              modifierGroups={modifierGroups}
              attributeGroups={attributeGroups}
            />
          ) : isCafeInventoryProduct ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              This cafe item is not currently active for customers.
            </div>
          ) : isGiftProduct && product?.availableOnline === false ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              This gift item is not currently active for customers.
            </div>
          ) : product && !isProductVisible ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              This product is not currently available.
            </div>
          ) : (
            <ShopProductDetailClient
              product={product}
              related={related}
              relatedTitle={relatedTitle}
              categoryName={category?.name ?? null}
              isGiftProduct={isGiftProduct}
              linkedProducts={linkedProducts}
              linkedAddOnProducts={linkedAddOnProducts}
              linkedCoupons={linkedCoupons.map((coupon) => ({
                id: coupon.id,
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
              }))}
              rentalFromDate={rentalFromDate}
              rentalToDate={rentalToDate}
              rentalSlotStartAt={rentalSlotStartAt}
              rentalSlotEndAt={rentalSlotEndAt}
              shopAttributeGroups={product?.shopAttributeGroups ?? []}
            />
          )}
          {product && isRentalProduct(product) ? (
            <div
              className={cn(
                hasSelectedRentalSchedule && "xl:pr-[460px] 2xl:pr-[480px]",
              )}
            >
              <RentalAvailabilityCalendar
                productId={product.id}
                stockQuantity={product.stockCount}
                rentalBillingType={product.rentalBillingType ?? null}
                maxRentalDays={product.maxRentalDays ?? null}
                rentalSlotIncrementMinutes={product.rentalSlotIncrementMinutes ?? null}
                selectedFromDate={rentalFromDate}
                selectedToDate={rentalToDate}
                onDateRangeChange={handleDateRangeChange}
                selectedSlotStartAt={rentalSlotStartAt}
                selectedSlotEndAt={rentalSlotEndAt}
                onRentalSlotChange={handleRentalSlotChange}
              />
            </div>
          ) : null}
        </div>
      </main>
      <CustomerFooter />
    </CustomerNavProductRouteGuard>
  );
}
