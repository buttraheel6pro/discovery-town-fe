/** Product sub-categories placed on Gym / Play / Events customer menus. */

import { productSubCategoryAppearsUnderMenuSlug } from "@/lib/catalog-placement";
import type { SchedulingCatalogSlug } from "@/lib/catalog-slugs";
import { consumerProductsForCategory } from "@/lib/consumer-category-products";
import {
  buildProductCategoryById,
  isConsumerVisibleProductCategory,
} from "@/lib/product-visibility";
import type { CafeProduct, Product, ProductCategory } from "@/lib/types";

export interface ProductSchedulingMenuSection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly products: Product[];
}

export function filterProductSubCategoriesForSchedulingMenu(
  menuSlug: SchedulingCatalogSlug,
  productCategories: readonly ProductCategory[],
): ProductCategory[] {
  const categoryById = buildProductCategoryById(productCategories);
  return productCategories
    .filter(
      (category) =>
        (category.parentId ?? null) !== null &&
        isConsumerVisibleProductCategory(category, categoryById) &&
        productSubCategoryAppearsUnderMenuSlug(
          category,
          menuSlug,
          undefined,
          true,
        ),
    )
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export function buildProductSectionsForSchedulingMenu(params: {
  readonly menuSlug: SchedulingCatalogSlug;
  readonly productCategories: readonly ProductCategory[];
  readonly products: readonly Product[];
  readonly cafeProducts?: readonly CafeProduct[];
}): ProductSchedulingMenuSection[] {
  const subCategories = filterProductSubCategoriesForSchedulingMenu(
    params.menuSlug,
    params.productCategories,
  );

  return subCategories
    .map((category) => {
      const categoryProducts = consumerProductsForCategory({
        category,
        products: params.products,
        productCategories: params.productCategories,
        cafeProducts: params.cafeProducts,
      });
      const isRentalsCategory =
        (category.productType ?? "").toLowerCase() === "rentals";
      return {
        id: category.id,
        title: category.name,
        description: isRentalsCategory
          ? (category.description ??
            "Rental products available in this category")
          : (category.description ?? "Browse available items."),
        products: categoryProducts,
      };
    })
    .filter((section) => section.products.length > 0);
}

export function productSectionsForSchedulingMenuBrowse(
  menuSlug: SchedulingCatalogSlug,
  productCategories: readonly ProductCategory[],
  products: readonly Product[],
  cafeProducts: readonly CafeProduct[] = [],
): ProductSchedulingMenuSection[] {
  return buildProductSectionsForSchedulingMenu({
    menuSlug,
    productCategories,
    products,
    cafeProducts,
  });
}
