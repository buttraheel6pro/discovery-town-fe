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
import { Plus, Edit2, Trash2, Package, AlertCircle } from "lucide-react";
import { inventory as mockInventory } from "@/lib/mock-data";

export default function InventoryManagement() {
  const [inventory, setInventory] = useState(mockInventory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantity: "",
    price: "",
    category: "",
  });

  const handleAdd = () => {
    setEditingId("new");
    setFormData({ name: "", sku: "", quantity: "", price: "", category: "" });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      category: item.category,
    });
  };

  const handleSave = () => {
    if (editingId === "new") {
      const newItem = {
        id: `item-${Date.now()}`,
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        price: parseInt(formData.price),
      };
      setInventory([...inventory, newItem]);
    } else {
      setInventory(
        inventory.map((i) =>
          i.id === editingId
            ? {
                ...i,
                name: formData.name,
                sku: formData.sku,
                quantity: parseInt(formData.quantity),
                price: parseInt(formData.price),
                category: formData.category,
              }
            : i,
        ),
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setInventory(inventory.filter((i) => i.id !== id));
  };

  const lowStockItems = inventory.filter((item) => item.quantity < 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage products and equipment inventory
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-3">
              {lowStockItems.length} item(s) have low stock levels. Please
              reorder soon.
            </p>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {item.name}
                  </span>
                  <span className="text-destructive font-semibold">
                    {item.quantity} in stock
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {editingId !== null && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle>
              {editingId === "new" ? "Add New Item" : "Edit Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Yoga Mat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., YM-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Equipment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
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
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="gap-2">
                Save Item
              </Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Track all equipment and products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Product Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Total Value
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm font-mono">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm">
                      {item.category}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          item.quantity < 10
                            ? "bg-destructive/20 text-destructive"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-accent">
                      ${item.price}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      ${(item.quantity * item.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="gap-1 text-xs"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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
