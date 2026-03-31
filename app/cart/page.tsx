"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { products } from "@/lib/mock-data";

const initialCart = [
  { productId: "prod-2", quantity: 2 },
  { productId: "prod-3", quantity: 1 },
];

export default function CartPage() {
  const [cart, setCart] = useState(initialCart);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  const cartItems = cart
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId)!,
    }))
    .filter((item) => item.product);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.2;
  const total = subtotal - discount + tax;

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  if (checkedOut) {
    return (
      <>
        <CustomerNavbar />
        <main className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6 max-w-sm mx-auto px-4">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                ORDER CONFIRMED!
              </h1>
              <p className="text-muted-foreground mt-2">
                Thank you for your purchase. You&apos;ll receive a confirmation
                email shortly.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/account/orders">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  View Order History
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <CustomerFooter />
      </>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/shop"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1
            className="text-3xl font-black text-foreground mb-8"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            YOUR CART
          </h1>

          {cart.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-xl font-bold text-muted-foreground">
                Your cart is empty
              </p>
              <Link href="/shop">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Cart items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-bold text-sm text-foreground">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.product.category}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQty(item.productId, -1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQty(item.productId, 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-sm">
                          £{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <aside className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <h2 className="font-bold text-lg">Order Summary</h2>
                  <Separator />

                  {/* Promo code */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => promoCode && setPromoApplied(true)}
                    >
                      Apply
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-green-600 font-semibold">
                      10% discount applied!
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount (10%)</span>
                        <span>-£{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (20%)</span>
                      <span>£{tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-black text-base">
                      <span>Total</span>
                      <span className="text-accent">£{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                    onClick={() => setCheckedOut(true)}
                  >
                    Checkout
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment. 30-day returns policy.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}
