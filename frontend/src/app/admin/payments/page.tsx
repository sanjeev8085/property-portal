"use client";
import React, { useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

const PAYMENTS: any[] = [];

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => PAYMENTS.filter((p) => {
    const q = search.toLowerCase();
    return (!q || p.user.toLowerCase().includes(q) || p.plan.toLowerCase().includes(q))
      && (filterStatus === "all" || p.status === filterStatus);
  }), [search, filterStatus]);

  const STATUS_COLOR: Record<string, string> = { success: "#10b981", failed: "#ef4444", refunded: "#f59e0b" };
  const total = filtered.filter((p) => p.status === "success").reduce((a, p) => a + p.amount, 0);

  return (
    <AdminLayout title="Payment Records" subtitle="Browse and search all payment transactions">
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input style={{ flex: 1, minWidth: "220px", padding: "10px 16px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontFamily: "var(--font-body)", outline: "none", background: "white" }}
          placeholder="🔍  Search by user or plan…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={{ padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", background: "white", cursor: "pointer" }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <div style={{ padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, color: "#166534", whiteSpace: "nowrap" }}>
          Revenue: ₹{total.toLocaleString("en-IN")}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "12px", overflow: "auto", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Transaction ID", "User", "Plan", "Amount", "Credits", "Date", "Status"].map((h) => (
                <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "14px 18px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>#{p.id.toUpperCase()}</td>
                <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 600 }}>{p.user}</td>
                <td style={{ padding: "14px 18px", fontSize: "13px" }}>{p.plan}</td>
                <td style={{ padding: "14px 18px", fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>₹{p.amount}</td>
                <td style={{ padding: "14px 18px", fontSize: "13px" }}>{p.credits} credits</td>
                <td style={{ padding: "14px 18px", fontSize: "12px", color: "var(--text-muted)" }}>{p.date}</td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize", background: `${STATUS_COLOR[p.status]}20`, color: STATUS_COLOR[p.status] }}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No payment records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
