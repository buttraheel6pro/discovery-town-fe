/** Customer location mapping page — select site and store full location display names. */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { CrudModal } from "@/components/admin/crud-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocations } from "@/lib/location-store";
import type { Location } from "@/lib/types";

interface CustomerLocationRecord {
  id: string;
  locationId: string;
  fullLocationName: string;
  capacity: number;
}

interface CustomerLocationDraft {
  locationId: string;
  fullLocationName: string;
  capacity: string;
}

const EMPTY_DRAFT: CustomerLocationDraft = {
  locationId: "",
  fullLocationName: "",
  capacity: "",
};

export default function AdminCustomerLocationCrudPage() {
  const { locations, isLoading, loadError } = useLocations();
  const [records, setRecords] = useState<CustomerLocationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<CustomerLocationDraft>(EMPTY_DRAFT);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerLocationRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const locationById = useMemo(() => {
    const map = new Map<string, Location>();
    for (const location of locations) {
      map.set(location.id, location);
    }
    return map;
  }, [locations]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return records;
    }
    return records.filter((record) => {
      const location = locationById.get(record.locationId);
      const stack =
        `${record.fullLocationName} ${location?.name ?? ""} ${location?.city ?? ""}`
          .trim()
          .toLowerCase();
      return stack.includes(query);
    });
  }, [locationById, records, search]);

  const parsedCapacity = Number.parseInt(draft.capacity.trim(), 10);
  const isCapacityValid = Number.isFinite(parsedCapacity) && parsedCapacity > 0;
  const isDraftValid =
    draft.locationId.trim() !== "" &&
    draft.fullLocationName.trim() !== "" &&
    isCapacityValid;

  function resetForm(): void {
    setDraft(EMPTY_DRAFT);
    setSelected(null);
  }

  function openCreate(): void {
    resetForm();
    setCreateOpen(true);
  }

  function openEdit(record: CustomerLocationRecord): void {
    setSelected(record);
    setDraft({
      locationId: record.locationId,
      fullLocationName: record.fullLocationName,
      capacity: String(record.capacity),
    });
  }

  function requestDelete(record: CustomerLocationRecord): void {
    setSelected(record);
    setDeleteOpen(true);
  }

  function persistCreate(): void {
    if (!isDraftValid) {
      return;
    }

    const record: CustomerLocationRecord = {
      id: `customer-location-${Date.now()}`,
      locationId: draft.locationId,
      fullLocationName: draft.fullLocationName.trim(),
      capacity: parsedCapacity,
    };
    setRecords((prev) => [record, ...prev]);
    setCreateOpen(false);
    resetForm();
  }

  function persistEdit(): void {
    if (!selected || !isDraftValid) {
      return;
    }

    const updatedRecord: CustomerLocationRecord = {
      id: selected.id,
      locationId: draft.locationId,
      fullLocationName: draft.fullLocationName.trim(),
      capacity: parsedCapacity,
    };

    setRecords((prev) =>
      prev.map((record) =>
        record.id === selected.id ? updatedRecord : record,
      ),
    );
    setSelected(null);
    resetForm();
  }

  function confirmDelete(): void {
    if (!selected) {
      return;
    }

    setRecords((prev) => prev.filter((record) => record.id !== selected.id));
    setDeleteOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/scheduling/locations"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Locations
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Customer Location CRUD
          </h1>
          <p className="text-muted-foreground">
            Create and maintain customer-facing full location names from
            existing locations.
          </p>
        </div>
        <Button
          type="button"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={openCreate}
        >
          New customer location
        </Button>
      </div>

      {loadError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Failed to load locations: {loadError}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full max-w-md">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search complete locations..."
                aria-label="Search complete locations"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading... " : null}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "record" : "records"}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Selected location</TableHead>
                <TableHead>Complete location name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => {
                const location = locationById.get(record.locationId);
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-foreground whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span>{location?.name ?? "Unknown location"}</span>
                        <span className="text-xs text-muted-foreground">
                          {location?.city ?? "No city"} ·{" "}
                          {location?.postcode ?? "No postcode"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{record.fullLocationName}</TableCell>
                    <TableCell>{record.capacity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(record)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => requestDelete(record)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New customer location"
        description="Select an existing location and enter the complete customer-facing location name."
        size="sm"
        variant="create"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={persistCreate}
              disabled={!isDraftValid}
            >
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-full-location-name">
              Complete location name
            </Label>
            <Input
              id="create-full-location-name"
              value={draft.fullLocationName}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  fullLocationName: event.target.value,
                }))
              }
              placeholder="Enter complete location name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-location-capacity">Capacity</Label>
            <Input
              id="create-location-capacity"
              type="number"
              min={1}
              value={draft.capacity}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, capacity: event.target.value }))
              }
              placeholder="Enter capacity"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-customer-location-select">
              Existing location
            </Label>
            <Select
              value={draft.locationId}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, locationId: value }))
              }
              disabled={isLoading || locations.length === 0}
            >
              <SelectTrigger
                id="create-customer-location-select"
                className="w-full"
              >
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading locations..."
                      : "Select existing location"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>

      <CrudModal
        open={selected !== null && !deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
        }}
        title="Edit customer location"
        description="Update the selected existing location and complete location name."
        size="sm"
        variant="edit"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={persistEdit}
              disabled={!isDraftValid}
            >
              Save changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-full-location-name">
              Complete location name
            </Label>
            <Input
              id="edit-full-location-name"
              value={draft.fullLocationName}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  fullLocationName: event.target.value,
                }))
              }
              placeholder="Enter complete location name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location-capacity">Capacity</Label>
            <Input
              id="edit-location-capacity"
              type="number"
              min={1}
              value={draft.capacity}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, capacity: event.target.value }))
              }
              placeholder="Enter capacity"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-location-select">
              Existing location
            </Label>
            <Select
              value={draft.locationId}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, locationId: value }))
              }
              disabled={isLoading || locations.length === 0}
            >
              <SelectTrigger
                id="edit-customer-location-select"
                className="w-full"
              >
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading locations..."
                      : "Select existing location"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>

      <CrudModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        title="Delete customer location"
        description="This action cannot be undone."
        size="sm"
        variant="delete"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Delete{" "}
          <span className="font-semibold text-foreground">
            {selected?.fullLocationName ?? "record"}
          </span>
          ?
        </p>
      </CrudModal>
    </div>
  );
}
