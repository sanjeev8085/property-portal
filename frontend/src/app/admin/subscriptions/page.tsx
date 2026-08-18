"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";

interface Plan { id: string; name: string; price: number; credits: number; validity: number; active: boolean; color: string; }

const INITIAL_PLANS: Plan[] = [
  { id: "free",     name: "Free",     price: 0,   credits: 0,  validity: 0,  active: true,  color: "#94a3b8" },
  { id: "standard", name: "Standard", price: 199, credits: 15, validity: 30, active: true,  color: "#3b82f6" },
  { id: "premium",  name: "Premium",  price: 499, credits: 50, validity: 60, active: true,  color: "#8b5cf6" },
  { id: "elite",    name: "Elite",    price: 999, credits: 120,validity: 90, active: false, color: "#f59e0b" },
];

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [editing, setEditing] = useState<Plan | null>(null);
  const { success } = useToast();

  const toggleActive = (id: string) => {
    setPlans((p) => p.map((x) => x.id === id ? { ...x, active: !x.active } : x));
    const plan = plans.find((p) => p.id === id);
    success(`${plan?.name} plan ${plan?.active ? "deactivated" : "activated"}`);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setPlans((p) => p.map((x) => x.id === editing.id ? editing : x));
    success("Plan updated successfully");
    setEditing(null);
  };

  return (
    <AdminLayout title="Subscription Plans" subtitle="Configure pricing, credits, and plan availability">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        {plans.map((p) => (
          <div key={p.id} style={{ background: "white", borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-sm)", border: `2px solid ${p.active ? p.color + "44" : "var(--border)"}`, opacity: p.active ? 1 : 0.65, transition: "all 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "99px", background: p.color + "18", color: p.color, border: `1px solid ${p.color}44` }}>{p.active ? "Active" : "Inactive"}</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <Button size="sm" variant="outline" onClick={() => setEditing({ ...p })}>Edit</Button>
                <Button size="sm" variant={p.active ? "ghost" : "primary"} onClick={() => toggleActive(p.id)} style={p.active ? { color: "var(--error)", borderColor: "var(--error)" } : {}}>
                  {p.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: p.color, marginBottom: "4px" }}>{p.name}</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)" }}>
              {p.price === 0 ? "Free" : `₹${p.price}`}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>✓ {p.credits === 0 ? "No contact credits" : `${p.credits} contact credits`}</div>
              <div>✓ {p.validity === 0 ? "No expiry" : `Valid for ${p.validity} days`}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}>
          <form onSubmit={saveEdit} style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "400px", width: "100%", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Edit {editing.name} Plan</h3>
            {[
              { label: "Plan Name", key: "name", type: "text" },
              { label: "Price (₹)", key: "price", type: "number" },
              { label: "Credits", key: "credits", type: "number" },
              { label: "Validity (days, 0 = no expiry)", key: "validity", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>{label}</label>
                <input type={type} value={(editing as unknown as Record<string,unknown>)[key] as string | number}
                  onChange={(e) => setEditing({ ...editing, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button variant="outline" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
