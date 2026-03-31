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
import { Plus, Edit2, Trash2, Users, Calendar, Clock } from "lucide-react";
import { classes as mockClasses } from "@/lib/mock-data";

export default function ClassesManagement() {
  const [classes, setClasses] = useState(mockClasses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    schedule: [{ dayOfWeek: "", startTime: "", endTime: "" }],
    maxParticipants: "",
    price: "",
  });

  const handleAdd = () => {
    setEditingId("new");
    setFormData({
      name: "",
      description: "",
      instructor: "",
      schedule: [{ dayOfWeek: "", startTime: "", endTime: "" }],
      maxParticipants: "",
      price: "",
    });
  };

  const handleEdit = (fitnessClass: any) => {
    setEditingId(fitnessClass.id);
    setFormData({
      name: fitnessClass.name,
      description: fitnessClass.description,
      instructor: fitnessClass.instructor,
      schedule: fitnessClass.schedule,
      maxParticipants: fitnessClass.maxParticipants.toString(),
      price: fitnessClass.price.toString(),
    });
  };

  const handleSave = () => {
    if (editingId === "new") {
      const newClass = {
        id: `class-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        instructor: formData.instructor,
        schedule: formData.schedule,
        maxParticipants: parseInt(formData.maxParticipants),
        currentParticipants: 0,
        price: parseInt(formData.price),
        level: "All Levels",
        duration: "60 mins",
        image: "/images/hero-sports.jpg",
      };
      setClasses([...classes, newClass]);
    } else {
      setClasses(
        classes.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formData.name,
                description: formData.description,
                instructor: formData.instructor,
                schedule: formData.schedule,
                maxParticipants: parseInt(formData.maxParticipants),
                price: parseInt(formData.price),
              }
            : c,
        ),
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setClasses(classes.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Classes Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all fitness and sports classes
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      {/* Add/Edit Form */}
      {editingId !== null && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle>
              {editingId === "new" ? "Add New Class" : "Edit Class"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Yoga Basics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Instructor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) =>
                    setFormData({ ...formData, instructor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Instructor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Schedule
                </label>
                <input
                  type="text"
                  value={formData.schedule[0].dayOfWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule: [
                        {
                          dayOfWeek: e.target.value.toString(),
                          startTime: "18:00",
                          endTime: "19:00",
                        },
                      ],
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Mon & Wed 10:00 AM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0.00"
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
                  placeholder="Class description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="gap-2">
                Save Class
              </Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          <CardDescription>
            Manage your fitness and sports classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Class Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Instructor
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Schedule
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Participants
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((fitnessClass) => (
                  <tr
                    key={fitnessClass.id}
                    className="border-b border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {fitnessClass.name}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {fitnessClass.instructor}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {fitnessClass.schedule[0]?.dayOfWeek}{" "}
                      {fitnessClass.schedule[0]?.startTime} -{" "}
                      {fitnessClass.schedule[0]?.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-secondary text-sm font-medium text-foreground">
                        {fitnessClass.currentParticipants}/
                        {fitnessClass.maxParticipants}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-accent">
                      ${fitnessClass.price}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(fitnessClass)}
                        className="gap-1 text-xs"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fitnessClass.id)}
                        className="gap-1 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
