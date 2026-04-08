/** Account membership page — view current membership and available plans. */
"use client";

import Link from "next/link";

import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MembershipCard } from "@/components/customer/membership-card";
import { useClients } from "@/lib/client-store";
import type { ContactSubscription, MembershipPlan } from "@/lib/types";

export default function AccountMembershipPage() {
  const {
    contacts,
    membershipPlans,
    enrollContact,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
  } = useClients();
  const primary =
    contacts.find((c) => c.contactType === "CUSTOMER") ?? contacts[0];

  const activeSub = primary.subscriptions?.find(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING" || s.status === "PAUSED",
  );

  function planForSubscription(sub: ContactSubscription): MembershipPlan {
    return (
      membershipPlans.find((p) => p.id === sub.planId) ?? membershipPlans[0]
    );
  }

  function handleJoin(plan: MembershipPlan) {
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.billingCycle === "MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.billingCycle === "ANNUAL") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else if (plan.billingCycle === "WEEKLY") {
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    }
    const sub: ContactSubscription = {
      id: `sub-${primary.id}-${plan.id}-${Date.now()}`,
      tenantId: primary.tenantId,
      contactId: primary.id,
      planId: plan.id,
      plan,
      status: "ACTIVE",
      startedAt: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
    };
    enrollContact(sub);
  }

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
                Membership & credits
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your Discovery Town membership and explore available plans.
              </p>
            </div>
            <Link href="/account">
              <Button variant="ghost" size="sm">
                Back to dashboard
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Your membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSub ? (
                <MembershipCard
                  plan={planForSubscription(activeSub)}
                  subscription={activeSub}
                  onPause={(id) => pauseSubscription(id)}
                  onResume={(id) => resumeSubscription(id)}
                  onCancel={(id) => cancelSubscription(id)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  You do not currently have an active membership. Browse the plans below
                  to find the right option for your family.
                </p>
              )}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Membership plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {membershipPlans
                .filter((p) => p.isActive)
                .map((plan) => (
                  <MembershipCard
                    key={plan.id}
                    plan={plan}
                    onJoin={() => handleJoin(plan)}
                    joinDisabled={Boolean(activeSub)}
                  />
                ))}
            </div>
          </section>
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}
