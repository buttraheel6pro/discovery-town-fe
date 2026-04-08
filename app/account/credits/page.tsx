/** Account credits page — view active packs and credit history. */
"use client";

import Link from "next/link";

import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditPackCard } from "@/components/customer/credit-pack-card";
import { useClients } from "@/lib/client-store";

export default function AccountCreditsPage() {
  const { contacts } = useClients();
  const primary =
    contacts.find((c) => c.contactType === "CUSTOMER") ?? contacts[0];

  const activePacks = (primary.creditPacks ?? []).filter(
    (pack) => pack.status === "ACTIVE",
  );
  const ledger = primary.creditLedger ?? [];

  return (
    <>
      <CustomerNavbar />
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                Credits & class packs
              </h1>
              <p className="text-sm text-muted-foreground">
                See your active packs and how your credits have been used.
              </p>
            </div>
            <Link href="/account">
              <Button variant="ghost" size="sm">
                Back to dashboard
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Active packs
                </CardTitle>
              </div>
              <Button size="sm" variant="outline">
                Buy a class pack
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePacks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You do not currently have any active packs. Use &quot;Buy a class
                  pack&quot; to get started.
                </p>
              ) : (
                activePacks.map((purchase) => (
                  <CreditPackCard key={purchase.id} purchase={purchase} />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Credit history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have no credit transactions yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(entry.createdAt).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.transactionType}
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.description ?? "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {entry.creditsChange > 0 ? "+" : ""}
                          {entry.creditsChange}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {entry.balanceAfter}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}

