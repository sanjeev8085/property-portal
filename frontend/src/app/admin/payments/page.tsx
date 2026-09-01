"use client";
import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  completed: "#10b981", failed: "#ef4444", refunded: "#f59e0b", pending: "#3b82f6",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    api.getPayments().then((data: any[]) => {
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (p.user_id && p.user_id.toLowerCase().includes(q)) ||
        (p.gateway_order_id && p.gateway_order_id.toLowerCase().includes(q)) ||
        (p.transaction_id && p.transaction_id.toLowerCase().includes(q));
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [payments, search, filterStatus]);

  const totalRevenue = filtered
    .filter((p) => p.status === "completed")
    .reduce((a, p) => a + (p.amount || 0), 0);

  return (
    <AdminLayout title="Payment Records" subtitle="Browse and search all payment transactions">
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ flex: 1, minWidth: "220px", padding: "10px 16px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", outline: "none", background: "white" }}
          placeholder="🔍  Search by user ID, order ID or transaction…"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", background: "white", cursor: "pointer" }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <div style={{ padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, color: "#166534", whiteSpace: "nowrap" }}>
          Revenue: ₹{totalRevenue.toLocaleString("en-IN")}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "12px", overflow: "auto", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Date", "User ID", "Amount", "Gateway", "Order ID", "Status"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1.5px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                {payments.length === 0 ? "No payment records found in database." : "No results match your filter."}
              </td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                  {p.user_id ? p.user_id.slice(0, 8) + "…" : "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  ₹{(p.amount || 0).toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {p.gateway || "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                  {p.gateway_order_id || p.transaction_id || "—"}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, background: STATUS_COLOR[p.status] + "22", color: STATUS_COLOR[p.status] || "#64748b", textTransform: "capitalize" }}>
                    {p.status || "unknown"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
