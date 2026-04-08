/** Account documents page — review and sign waivers and terms. */
"use client";

import { useState } from "react";
import Link from "next/link";

import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignDocumentWidget } from "@/components/customer/sign-document-widget";
import { useClients } from "@/lib/client-store";
import { isDocumentSignedAndValid } from "@/lib/utils";

export default function AccountDocumentsPage() {
  const { contacts, documents, signDocument } = useClients();
  const primary =
    contacts.find((c) => c.contactType === "CUSTOMER") ?? contacts[0];

  const [activeId, setActiveId] = useState<string | null>(null);

  const unsigned = documents.filter(
    (doc) => !isDocumentSignedAndValid(primary.documents, doc.id),
  );
  const signed = documents.filter((doc) =>
    isDocumentSignedAndValid(primary.documents, doc.id),
  );

  const activeDoc = documents.find((d) => d.id === activeId) ?? null;

  function handleSigned(dataUrl: string) {
    if (!activeDoc) return;
    // In a real app the dataUrl would be uploaded; here we just record signature.
    signDocument(primary.id, activeDoc.id);
    setActiveId(null);
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
                Documents & waivers
              </h1>
              <p className="text-sm text-muted-foreground">
                Review important terms and complete any outstanding waivers.
              </p>
            </div>
            <Link href="/account">
              <Button variant="ghost" size="sm">
                Back to dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Action required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unsigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no documents that require your attention.
                  </p>
                ) : (
                  unsigned.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setActiveId(doc.id)}
                      >
                        Review & sign
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Already signed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have not signed any documents yet.
                  </p>
                ) : (
                  <ScrollArea className="max-h-64 pr-2">
                    <div className="space-y-3">
                      {signed.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.description}
                            </p>
                          </div>
                          <span className="text-[11px] rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 font-medium">
                            Signed
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <CustomerFooter />

      <Dialog open={Boolean(activeDoc)} onOpenChange={() => setActiveId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeDoc ? activeDoc.title : "Document"}
            </DialogTitle>
          </DialogHeader>
          {activeDoc ? (
            <SignDocumentWidget
              documentTitle={activeDoc.title}
              documentHtml={activeDoc.description ?? ""}
              onSubmit={handleSigned}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

