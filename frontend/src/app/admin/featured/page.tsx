"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";

const FEATURED = [
  { id: "1", title: "Luxury Penthouse Arera Colony", owner: "Rahul Sharma", location: "Bhopal", price: "₹1.4 Cr",  expiry: "2026-09-01", is_featured: true },
  { id: "2", title: "Furnished Studio MP Nagar",     owner: "Neha Joshi",   location: "Bhopal", price: "₹15k/Mo", expiry: "2026-08-25", is_featured: true },
  { id: "3", title: "4 BHK Villa Vijay Nagar",       owner: "Priya Singh",  location: "Indore", price: "₹2.2 Cr", expiry: null,         is_featured: false },
];

export default function AdminFeaturedPage() {
  const [items, setItems] = useState(FEATURED);
  const [newExpiry, setNewExpiry] = useState<Record<string, string>>({});
  const { success, info } = useToast();

  const toggle = (id: string) => {
    setItems((p) => p.map((x) => x.id === id ? { ...x, is_featured: !x.is_featured, expiry: x.is_featured ? null : (newExpiry[id] || "2026-12-31") } : x));
    const item = items.find((x) => x.id === id);
    item?.is_featured ? info("Removed from featured") : success("Added to featured ⭐");
  };

  return (
    <AdminLayout title="Featured Listings" subtitle="Manage promoted properties shown at the top of search results">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: "white", borderRadius: "12px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", boxShadow: "var(--shadow-sm)", border: `1px solid ${item.is_featured ? "#8b5cf644" : "var(--border)"}`, transition: "border-color 0.2s" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                {item.is_featured && <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: "#8b5cf618", color: "#8b5cf6", border: "1px solid #8b5cf644" }}>⭐ Featured</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                👤 {item.owner} · 📍 {item.location} · 💰 {item.price}
                {item.expiry && <> · ⏰ Expires {item.expiry}</>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              {!item.is_featured && (
                <input type="date" value={newExpiry[item.id] || ""} onChange={(e) => setNewExpiry({ ...newExpiry, [item.id]: e.target.value })}
                  style={{ padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontFamily: "var(--font-body)" }} />
              )}
              <Button size="sm" variant={item.is_featured ? "outline" : "primary"} onClick={() => toggle(item.id)}>
                {item.is_featured ? "Remove Feature" : "Feature ⭐"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
