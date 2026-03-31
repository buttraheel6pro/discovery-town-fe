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
import { Plus, Edit2, Trash2, Calendar, MapPin, Users } from "lucide-react";
import { events as mockEvent } from "@/lib/mock-data";

export default function EventsManagement() {
  const [events, setEvents] = useState(mockEvent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    capacity: "",
    ticketPrice: "",
  });

  const handleAdd = () => {
    setEditingId("new");
    setFormData({
      name: "",
      description: "",
      date: "",
      location: "",
      capacity: "",
      ticketPrice: "",
    });
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setFormData({
      name: event.name,
      description: event.description,
      date: event.date,
      location: event.location,
      capacity: event.capacity.toString(),
      ticketPrice: event.ticketPrice.toString(),
    });
  };

  const handleSave = () => {
    if (editingId === "new") {
      const newEvent = {
        id: `event-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        date: formData.date,
        time: "10:00 AM",
        location: formData.location,
        capacity: parseInt(formData.capacity),
        ticketsAvailable: parseInt(formData.capacity),
        ticketPrice: parseInt(formData.ticketPrice),
        image: "/images/hero-sports.jpg",
        category: "Tournament",
        status: "Upcoming",
      };
      setEvents([...events, newEvent]);
    } else {
      setEvents(
        events.map((e) =>
          e.id === editingId
            ? {
                ...e,
                name: formData.name,
                description: formData.description,
                date: formData.date,
                location: formData.location,
                capacity: parseInt(formData.capacity),
                ticketPrice: parseInt(formData.ticketPrice),
              }
            : e,
        ),
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Events Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage sports events and tournaments
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {/* Add/Edit Form */}
      {editingId !== null && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle>
              {editingId === "new" ? "Add New Event" : "Edit Event"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Summer Tournament"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Event location"
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ticket Price ($)
                </label>
                <input
                  type="number"
                  value={formData.ticketPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, ticketPrice: e.target.value })
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
                  placeholder="Event description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="gap-2">
                Save Event
              </Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>Manage upcoming and past events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Event Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Tickets
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {event.name}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm">
                      {event.location}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-secondary text-sm font-medium text-foreground">
                        {event.ticketsAvailable || event.capacity}/
                        {event.capacity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-accent">
                      ${event.ticketPrice}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          event.status === "Upcoming"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="gap-1 text-xs"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
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
