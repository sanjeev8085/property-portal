"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { getPublishedProperties } from "@/lib/propertyStore";
import { api } from "@/lib/api";

const FEATURED: any[] = [];

export default function AdminFeaturedPage() {
  const [items, setItems] = useState<any[]>(FEATURED);
  const [newExpiry, setNewExpiry] = useState<Record<string, string>>({});
  const { success, info } = useToast();

  useEffect(() => {
    const loadProps = async () => {
      const published = getPublishedProperties();
      let cloudProps: any[] = [];
      try {
        const cloudData = await api.getAdminProperties();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          cloudProps = cloudData;
        } else {
          const publicProps = await api.getProperties();
          if (Array.isArray(publicProps)) cloudProps = publicProps;
        }
      } catch {
        // Fallback
      }

      const merged = [...cloudProps, ...published];
      const seen = new Set();
      const unique = merged.filter(p => {
        if (!p || !p.id) return false;
        const idStr = p.id.toString();
        if (seen.has(idStr)) return false;
        seen.add(idStr);
        return true;
      });

      setItems(unique.map(p => ({
        id: p.id.toString(),
        title: p.title,
        owner: p.contactName || p.ownerEmail || p.owner?.name || "Verified Owner",
        location: p.location || p.locality || p.city || "Bhopal",
        price: typeof p.price === "number" ? `₹${p.price.toLocaleString("en-IN")}` : p.price,
        expiry: p.is_featured ? "2026-12-31" : null,
        is_featured: Boolean(p.is_featured),
      })));
    };

    loadProps();
  }, []);

  const toggle = async (id: string) => {
    try { await api.featureProperty(id); } catch { /* fallback ok */ }
    setItems((p) => p.map((x) => x.id === id ? { ...x, is_featured: !x.is_featured, expiry: !x.is_featured ? (newExpiry[id] || "2026-12-31") : null } : x));
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
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⭐</div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>No featured listings yet</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Properties promoted for homepage and search spotlights will appear here.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
