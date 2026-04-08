import type { Metadata } from 'next'
import Link from 'next/link'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ShopProductDetailClient } from '@/components/customer/shop-product-detail-client'
import { productCategories, products, shopProductCategories, shopProducts } from '@/lib/mock-data'

interface ShopProductPageProps {
  readonly params: Promise<{ productId: string }>
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata({ params }: ShopProductPageProps): Promise<Metadata> {
  const { productId } = await params
  const all = [...products, ...shopProducts]
  const product = all.find((p) => p.id === productId) ?? null
  const desc = product?.description ? stripHtml(product.description).slice(0, 150) : undefined

  return {
    title: product ? `${product.name} | Discovery Town Shop` : 'Product | Discovery Town Shop',
    description: desc,
    openGraph: product?.imageUrl ? { images: [product.imageUrl] } : undefined,
  }
}

export default async function ShopProductPage({ params }: ShopProductPageProps) {
  const { productId } = await params
  const allProducts = [...products, ...shopProducts]
  const product = allProducts.find((p) => p.id === productId) ?? null

  const allCategories = [...productCategories, ...shopProductCategories]
  const category = product ? allCategories.find((c) => c.id === product.categoryId) ?? null : null

  const related =
    product
      ? allProducts
          .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isActive)
          .slice(0, 3)
      : []

  return (
    <>
      <CustomerNavbar />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <nav className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/shop" className="hover:text-foreground">
                  Shop
                </Link>
              </li>
              {category ? (
                <>
                  <li>/</li>
                  <li>
                    <Link
                      href={`/shop?category=${encodeURIComponent(category.id)}`}
                      className="hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  </li>
                </>
              ) : null}
              {product ? (
                <>
                  <li>/</li>
                  <li className="text-foreground font-semibold">{product.name}</li>
                </>
              ) : null}
            </ol>
          </nav>

          <ShopProductDetailClient product={product} related={related} categoryName={category?.name ?? null} />
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}

