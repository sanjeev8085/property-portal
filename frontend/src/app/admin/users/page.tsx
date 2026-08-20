"use client";

import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

const INITIAL_USERS: any[] = [];

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981", suspended: "#f59e0b", blocked: "#ef4444",
};
const TYPE_COLORS: Record<string, string> = {
  owner: "#3b82f6", buyer: "#8b5cf6", agent: "#f97316", admin: "#ef4444",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const { success, info } = useToast();

  useEffect(() => {
    api.getUsers()
      .then((res: any) => {
        if (Array.isArray(res)) {
          setUsers(res);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.city && u.city.toLowerCase().includes(q));
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      const matchType   = filterType   === "all" || u.type   === filterType || u.user_type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [users, search, filterStatus, filterType]);

  const changeStatus = (id: string, newStatus: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u));
    const label = newStatus === "active" ? "unblocked" : newStatus;
    success(`User ${label} successfully`);
  };

  return (
    <AdminLayout title="User Management" subtitle="Search, filter, view, and moderate registered accounts">
      {/* Toolbar */}
      <div className="au-toolbar">
        <input
          className="au-search"
          type="text"
          placeholder="🔍  Search by name, email or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="au-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
        </select>
        <select className="au-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="owner">Owner</option>
          <option value="buyer">Buyer</option>
          <option value="agent">Agent</option>
        </select>
        <span className="au-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="au-table-wrap">
        <table className="au-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>City</th>
              <th>Type</th>
              <th>Listings</th>
              <th>Joined</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={u.name} size="sm" />
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{u.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: "13px" }}>{u.email}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>+91 {u.mobile}</div>
                </td>
                <td style={{ fontSize: "13px" }}>{u.city}</td>
                <td>
                  <span className="au-badge" style={{ background: TYPE_COLORS[u.type] + "18", color: TYPE_COLORS[u.type], border: `1px solid ${TYPE_COLORS[u.type]}44` }}>
                    {u.type}
                  </span>
                </td>
                <td style={{ fontSize: "13px", fontWeight: 600 }}>{u.listings}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{u.joined}</td>
                <td>
                  <span className="au-badge" style={{ background: STATUS_COLORS[u.status] + "18", color: STATUS_COLORS[u.status], border: `1px solid ${STATUS_COLORS[u.status]}44` }}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {u.status !== "active" && (
                      <Button size="sm" variant="primary" onClick={() => changeStatus(u.id, "active")}>Unblock</Button>
                    )}
                    {u.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(u.id, "suspended")} style={{ color: "#f59e0b", borderColor: "#f59e0b" }}>Suspend</Button>
                    )}
                    {u.status !== "blocked" && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(u.id, "blocked")} style={{ color: "var(--error)", borderColor: "var(--error)" }}>Block</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No users match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .au-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .au-search {
          flex: 1;
          min-width: 240px;
          padding: 10px 16px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-family: var(--font-body);
          outline: none;
          background: white;
          transition: border-color 0.15s;
        }
        .au-search:focus { border-color: var(--primary); }
        .au-filter {
          padding: 10px 12px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-family: var(--font-body);
          background: white;
          color: var(--text-primary);
          cursor: pointer;
        }
        .au-count {
          font-size: 13px;
          color: var(--text-muted);
          white-space: nowrap;
          font-weight: 500;
        }
        .au-table-wrap {
          background: white;
          border-radius: 12px;
          overflow: auto;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
        }
        .au-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }
        .au-table th {
          padding: 14px 18px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          background: #f8fafc;
        }
        .au-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .au-table tbody tr:hover { background: #f8fafc; }
        .au-table tbody tr:last-child td { border-bottom: none; }
        .au-badge {
          display: inline-flex;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }
      `}} />
    </AdminLayout>
  );
}
