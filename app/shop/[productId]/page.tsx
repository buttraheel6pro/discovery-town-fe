"use client";

import { use } from "react";

import { CustomerFooter } from "@/components/customer/footer";
import { CustomerNavbar } from "@/components/customer/navbar";
import { RentalAvailabilityCalendar } from "@/components/customer/rental-availability-calendar";
import { ShopProductDetailClient } from "@/components/customer/shop-product-detail-client";
import { useInventory } from "@/lib/inventory-store";
import { isRentalProduct } from "@/lib/rental-product";

interface ShopProductPageProps {
  readonly params: Promise<{ productId: string }>;
}

export default function ShopProductPage({
  params,
}: Readonly<ShopProductPageProps>) {
  const { products, productCategories, coupons } = useInventory();
  const { productId } = use(params);
  const product = products.find((row) => row.id === productId) ?? null;
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
  const related = isGiftProduct
    ? linkedAddOnProducts.filter((row) => row.id !== product?.id).slice(0, 6)
    : product
      ? products
          .filter(
            (p) =>
              p.categoryId === product.categoryId &&
              p.id !== product.id &&
              p.isActive,
          )
          .slice(0, 3)
      : [];
  const relatedTitle = isGiftProduct
    ? "You may also like"
    : "You might also like";

  return (
    <>
      <CustomerNavbar />
      <main className="bg-background">
        <div className="mx-auto max-w-[88rem] space-y-8 px-4 py-10 sm:px-6 lg:px-8">
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
          />
          {product && isRentalProduct(product) ? (
            <RentalAvailabilityCalendar
              productId={product.id}
              stockQuantity={product.stockCount}
            />
          ) : null}
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}
