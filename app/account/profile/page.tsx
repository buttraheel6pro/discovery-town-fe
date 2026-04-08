/** Account profile page — edit basic contact details and preferences. */
"use client";

import { useState } from "react";
import Link from "next/link";

import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useClients } from "@/lib/client-store";
import type { CmContact, ContactMetadata } from "@/lib/types";

type ContactGender = NonNullable<CmContact["gender"]>;
type PreferredChannel = NonNullable<ContactMetadata["preferredChannel"]>;

function toContactGender(value: string): ContactGender {
  switch (value) {
    case "MALE":
    case "FEMALE":
    case "OTHER":
    case "PREFER_NOT_TO_SAY":
      return value;
    default:
      return "PREFER_NOT_TO_SAY";
  }
}

function toPreferredChannel(value: string): PreferredChannel {
  switch (value) {
    case "EMAIL":
    case "SMS":
    case "WHATSAPP":
      return value;
    default:
      return "EMAIL";
  }
}

export default function AccountProfilePage() {
  const { contacts, updateContact } = useClients();
  const primary =
    contacts.find((c) => c.contactType === "CUSTOMER") ?? contacts[0];

  const [firstName, setFirstName] = useState(primary.firstName);
  const [lastName, setLastName] = useState(primary.lastName);
  const [phone, setPhone] = useState(primary.phone ?? "");
  const [addressLine1, setAddressLine1] = useState(primary.addressLine1 ?? "");
  const [city, setCity] = useState(primary.city ?? "");
  const [postcode, setPostcode] = useState(primary.postcode ?? "");
  const [gender, setGender] = useState(primary.gender ?? "PREFER_NOT_TO_SAY");
  const [preferredChannel, setPreferredChannel] = useState(
    primary.metadata?.preferredChannel ?? "EMAIL",
  );
  const [marketingOptIn, setMarketingOptIn] = useState(
    primary.metadata?.marketingOptIn ?? true,
  );

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    updateContact(primary.id, {
      firstName,
      lastName,
      phone,
      addressLine1,
      city,
      postcode,
      gender,
      metadata: {
        ...(primary.metadata ?? { marketingOptIn }),
        preferredChannel,
        marketingOptIn,
      },
    });
  }

  return (
    <>
      <CustomerNavbar />
      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                Account profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Keep your personal details and contact preferences up to date.
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
                Personal details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSave}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="space-y-1">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={gender}
                    onValueChange={(next) => setGender(toContactGender(next))}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="address1">Address</Label>
                  <Input
                    id="address1"
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={postcode}
                    onChange={(event) => setPostcode(event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="preferredChannel">Preferred channel</Label>
                  <Select
                    value={preferredChannel}
                    onValueChange={(next) =>
                      setPreferredChannel(toPreferredChannel(next))
                    }
                  >
                    <SelectTrigger id="preferredChannel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox
                    id="marketingOptIn"
                    checked={marketingOptIn}
                    onCheckedChange={(value) =>
                      setMarketingOptIn(value === true)
                    }
                  />
                  <Label htmlFor="marketingOptIn" className="text-sm">
                    I would like to receive news and offers from Discovery Town.
                  </Label>
                </div>

                <div className="md:col-span-2 flex justify-end mt-4">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}

