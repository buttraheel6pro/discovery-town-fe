"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, MapPin, Users, Clock } from "lucide-react";
import { facilities as mockFacilities } from "@/lib/mock-data";

export default function FacilitiesManagement() {
  const [facilities, setFacilities] = useState(mockFacilities);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    hourlyRate: "",
  });

  const handleAdd = () => {
    setEditingId("new");
    setFormData({ name: "", description: "", capacity: "", hourlyRate: "" });
  };

  const handleEdit = (facility: any) => {
    setEditingId(facility.id);
    setFormData({
      name: facility.name,
      description: facility.description,
      capacity: facility.capacity.toString(),
      hourlyRate: facility.hourlyRate.toString(),
    });
  };

  const handleSave = () => {
    if (editingId === "new") {
      const newFacility = {
        id: `facility-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        capacity: parseInt(formData.capacity),
        hourlyRate: parseInt(formData.hourlyRate),
        image: "/images/hero-sports.jpg",
        amenities: ["Parking", "Locker Rooms"],
        availability: [
          { day: "Monday", openTime: "06:00", closeTime: "22:00" },
          { day: "Tuesday", openTime: "06:00", closeTime: "22:00" },
        ],
      };
      setFacilities([...facilities, newFacility]);
    } else {
      setFacilities(
        facilities.map((f) =>
          f.id === editingId
            ? {
                ...f,
                name: formData.name,
                description: formData.description,
                capacity: parseInt(formData.capacity),
                hourlyRate: parseInt(formData.hourlyRate),
              }
            : f,
        ),
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setFacilities(facilities.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Facilities Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all sports facilities and their details
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Facility
        </Button>
      </div>

      {/* Add/Edit Form */}
      {editingId !== null && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle>
              {editingId === "new" ? "Add New Facility" : "Edit Facility"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Facility name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Facility description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="gap-2">
                Save Facility
              </Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facilities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {facilities.map((facility) => (
          <Card key={facility.id} className="hover:shadow-lg transition-shadow">
            <div className="h-40 bg-gradient-to-br from-accent to-primary relative overflow-hidden">
              <img
                src={facility.imageUrl}
                alt={facility.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{facility.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {facility.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{facility.capacity} people</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>${facility.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(facility)}
                  className="flex-1 gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(facility.id)}
                  className="flex-1 gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
