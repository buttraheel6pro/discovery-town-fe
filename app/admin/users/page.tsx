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
import { Edit2, Trash2, Shield, Users } from "lucide-react";
import { users as mockUsers } from "@/lib/mock-data";
import { Users as UsersType } from "@/lib/types";

export default function UsersManagement() {
  const [users, setUsers] = useState<UsersType[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null);

  const handlePromote = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? { ...u, role: u.role === "user" ? "admin" : "user" }
          : u,
      ),
    );
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
  };

  const adminUsers = users.filter((u) => u.role === "admin").length;
  const memberUsers = users.filter((u) => u.role === "user").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all registered users and permissions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {users.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Admin users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {memberUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Regular members
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="py-3 px-4 text-foreground font-medium">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromote(user.id);
                          }}
                          className="gap-1 text-xs"
                        >
                          <Shield className="w-3 h-3" />
                          {user.role === "admin" ? "Demote" : "Promote"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user.id);
                          }}
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

        {/* User Details */}
        {selectedUser ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent-foreground">
                    {selectedUser.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  {selectedUser.name}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="text-foreground font-medium">
                      {selectedUser.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Member Since</p>
                    <p className="text-foreground font-medium">
                      {new Date(selectedUser.joinDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <p className="text-muted-foreground text-sm mb-2">Role</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedUser.role === "admin"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {selectedUser.role.charAt(0).toUpperCase() +
                    selectedUser.role.slice(1)}
                </span>
              </div>

              {/* Activity */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-foreground mb-2">Activity</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Total Bookings: 12</p>
                  <p>Active Classes: 3</p>
                  <p>Orders: 5</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handlePromote(selectedUser.id)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {selectedUser.role === "admin"
                    ? "Demote User"
                    : "Promote to Admin"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    handleDelete(selectedUser.id);
                    setSelectedUser(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <p className="text-muted-foreground text-center">
                Select a user to view profile
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
