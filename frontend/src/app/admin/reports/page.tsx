"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";

const REPORTS: any[] = [];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>(REPORTS);
  const [filter, setFilter] = useState("all");
  const { success, info } = useToast();

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const act = (id: string, action: "resolved" | "dismissed") => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
    action === "resolved" ? success("Report resolved — listing removed") : info("Report dismissed");
  };

  const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", resolved: "#10b981", dismissed: "#94a3b8" };

  return (
    <AdminLayout title="Property Reports" subtitle="Review flagged listings and take action">
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all", "pending", "resolved", "dismissed"].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)}
            style={{ padding: "8px 16px", borderRadius: "99px", border: `1.5px solid ${filter === s ? "var(--primary)" : "var(--border)"}`, background: filter === s ? "var(--primary-light)" : "white", color: filter === s ? "var(--primary)" : "var(--text-secondary)", fontWeight: 600, fontSize: "13px", cursor: "pointer", textTransform: "capitalize" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ background: "white", borderRadius: "12px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: STATUS_COLOR[r.status] + "18", color: STATUS_COLOR[r.status], border: `1px solid ${STATUS_COLOR[r.status]}44`, textTransform: "capitalize" }}>{r.status}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>🏢 {r.property}</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Reported by: <strong>{r.reporter}</strong></div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Reason: {r.reason}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>📅 {r.date}</div>
            </div>
            {r.status === "pending" && (
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <Button size="sm" variant="outline" onClick={() => act(r.id, "dismissed")}>Dismiss</Button>
                <Button size="sm" variant="primary" onClick={() => act(r.id, "resolved")} style={{ background: "var(--error)", borderColor: "var(--error)" }}>Remove Listing</Button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>No reports filed</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>All listings are in good standing.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
