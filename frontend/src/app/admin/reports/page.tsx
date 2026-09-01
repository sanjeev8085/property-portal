"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", resolved: "#10b981", dismissed: "#94a3b8",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { success, info } = useToast();

  useEffect(() => {
    api.getReports().then((data: any[]) => {
      setReports(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const act = async (id: string, action: "resolved" | "dismissed") => {
    try {
      await api.resolveReport(id, action);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
      action === "resolved" ? success("Report resolved successfully.") : info("Report dismissed.");
    } catch {
      success("Status updated locally.");
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
    }
  };

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
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ height: 16, background: "#f1f5f9", borderRadius: 4, marginBottom: 8, width: "60%" }} />
              <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, width: "40%" }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "14px" }}>
            {reports.length === 0 ? "✅ No reports submitted yet." : "No reports match this filter."}
          </div>
        ) : filtered.map((r) => (
          <div key={r.id} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ padding: "2px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, background: STATUS_COLOR[r.status] + "22", color: STATUS_COLOR[r.status] || "#64748b", textTransform: "capitalize" }}>
                  {r.status || "pending"}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                Reason: {r.reason || "Not specified"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                {r.description || "No description provided."}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                Property: {r.property_id ? r.property_id.slice(0, 16) + "…" : "—"} | Reporter: {r.reporter_id ? r.reporter_id.slice(0, 8) + "…" : "—"}
              </div>
            </div>
            {r.status === "pending" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="sm" variant="primary" onClick={() => act(r.id, "resolved")}>✅ Resolve</Button>
                <Button size="sm" variant="ghost" onClick={() => act(r.id, "dismissed")}>Dismiss</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
