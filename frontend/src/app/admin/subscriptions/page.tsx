"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: number;
  contact_limit: number;
  validity_days: number;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  sort_order: number;
}

const ACCENT_COLORS = ["#94a3b8", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();

  useEffect(() => {
    api.getPlans().then((data: Plan[]) => {
      setPlans(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `\u20b9${price.toLocaleString("en-IN")}`;
  };

  return (
    <AdminLayout title="Subscription Plans" subtitle="View and manage contact credit plans from the database">
      <div style={{ marginBottom: "16px", padding: "14px 18px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe", fontSize: "13px", color: "#1d4ed8" }}>
        💡 Plans are managed in the <strong>PostgreSQL database</strong> via the <code>subscription_plans</code> table.
        To edit prices or credits, update the database directly using Supabase or psql.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
              <div style={{ height: 20, background: "#f1f5f9", borderRadius: 4, marginBottom: 12, width: "60%" }} />
              <div style={{ height: 36, background: "#f1f5f9", borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "40%" }} />
            </div>
          ))
        ) : plans.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
            No subscription plans found in database. Run the seed script to create default plans.
          </div>
        ) : plans.map((plan, idx) => (
          <div key={plan.id} style={{
            background: "white", borderRadius: "14px", padding: "24px",
            boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
            borderTop: `3px solid ${ACCENT_COLORS[idx % ACCENT_COLORS.length]}`,
            opacity: plan.is_active ? 1 : 0.6,
            position: "relative",
          }}>
            {plan.is_featured && (
              <span style={{ position: "absolute", top: 14, right: 14, padding: "2px 8px", background: "#fef3c7", color: "#b45309", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                ⭐ FEATURED
              </span>
            )}
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px" }}>{plan.name}</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: ACCENT_COLORS[idx % ACCENT_COLORS.length], marginBottom: "4px" }}>
              {formatPrice(plan.price)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
              {plan.price > 0 ? `per purchase` : "No payment required"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
              <div>🔑 <strong>{plan.contact_limit}</strong> Contact Credits</div>
              <div>📅 Valid for <strong>{plan.validity_days > 0 ? `${plan.validity_days} days` : "unlimited"}</strong></div>
              {plan.description && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 4 }}>ℹ️ {plan.description}</div>}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: plan.is_active ? "#dcfce7" : "#f1f5f9",
                color: plan.is_active ? "#166534" : "#64748b",
              }}>
                {plan.is_active ? "✅ Active" : "⏸ Inactive"}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Sort: #{plan.sort_order}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: "18px 20px", background: "white", borderRadius: 12, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <h3 style={{ fontWeight: 700, fontSize: "14px", marginBottom: 10 }}>📊 Plan Summary</h3>
        {!loading && (
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", flexWrap: "wrap" }}>
            <div>Total Plans: <strong>{plans.length}</strong></div>
            <div>Active: <strong>{plans.filter(p => p.is_active).length}</strong></div>
            <div>Max Credits: <strong>{plans.length > 0 ? Math.max(...plans.map(p => p.contact_limit)) : 0}</strong></div>
            <div>Price Range: <strong>
              {plans.length > 0 ? `\u20b9${Math.min(...plans.filter(p => p.price > 0).map(p => p.price))} – \u20b9${Math.max(...plans.map(p => p.price))}` : "—"}
            </strong></div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
