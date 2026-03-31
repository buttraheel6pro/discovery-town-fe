"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Plus, Check } from "lucide-react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products } from "@/lib/mock-data";

const categories = ["All", "Apparel", "Accessories", "Equipment"];

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const filtered =
    category === "All"
      ? products.filter((p) => p.isActive)
      : products.filter(
          (p) => p.isActive && p.category && p.category?.name === category,
        );

  const handleAdd = (id: string) => {
    setAddedIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        // next.delete(id);
        return next;
      });
    }, 2000);
  };

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end justify-between">
            <div>
              <p className="text-accent text-sm font-bold uppercase tracking-widest mb-3">
                Apex Gear
              </p>
              <h1
                className="text-4xl sm:text-5xl font-black text-white text-balance"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                SHOP
              </h1>
              <p className="text-white/70 mt-3 max-w-xl leading-relaxed">
                Official Discovery Town merchandise and equipment. Quality kit
                for training and beyond.
              </p>
            </div>
            <Link href="/cart">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-2">
                <ShoppingCart className="w-4 h-4" />
                Cart (2)
              </Button>
            </Link>
          </div>
        </section>

        <div className="bg-card border-b border-border py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  category === cat
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => {
                const added = addedIds.has(product.id);
                return (
                  <article
                    key={product.id}
                    className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="relative h-56 overflow-hidden bg-secondary">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <Badge className="absolute top-3 left-3 bg-background text-foreground text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-lg text-foreground">
                          £{product.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.stockLevel} in stock
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className={`w-full font-semibold transition-all ${
                          added
                            ? "bg-green-600 text-white hover:bg-green-600"
                            : "bg-accent text-accent-foreground hover:bg-accent/90"
                        }`}
                        onClick={() => handleAdd(product.id)}
                      >
                        {added ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5" /> Added to
                            Cart
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  );
}
