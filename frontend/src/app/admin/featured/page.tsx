"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

export default function AdminFeaturedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpiry, setNewExpiry] = useState<Record<string, string>>({});
  const { success, info, error: showError } = useToast();

  const loadProps = async () => {
    try {
      setLoading(true);
      const cloudData = await api.getAdminProperties();
      const propsArray = Array.isArray(cloudData) ? cloudData : [];

      setItems(propsArray.map((p: any) => ({
        id: p.id.toString(),
        title: p.title,
        owner: p.owner?.name || p.contact_name || "Verified Owner",
        location: p.locality ? `${p.locality}, ${p.city || ""}` : (p.city || "Bhopal"),
        price: typeof p.price === "number" ? `₹${p.price.toLocaleString("en-IN")}` : p.price,
        expiry: p.featured_until || null,
        is_featured: Boolean(p.is_featured),
      })));
    } catch (err: any) {
      showError(err?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProps();
  }, []);

  const toggle = async (id: string, currentFeatured: boolean) => {
    const targetFeatured = !currentFeatured;
    const expiryDate = newExpiry[id] || (targetFeatured ? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] : undefined);
    try {
      await api.featureProperty(id, targetFeatured, targetFeatured ? expiryDate : undefined);
      targetFeatured ? success("Added to featured ⭐") : info("Removed from featured");
      loadProps();
    } catch (err: any) {
      showError(err?.message || "Failed to update featured status.");
    }
  };

  return (
    <AdminLayout title="Featured Listings" subtitle="Manage promoted properties shown at the top of search results">
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          Loading listings…
        </div>
      ) : (
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
                  {item.is_featured && item.expiry && <> · ⏰ Expires {item.expiry}</>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                {!item.is_featured && (
                  <input type="date" value={newExpiry[item.id] || ""} onChange={(e) => setNewExpiry({ ...newExpiry, [item.id]: e.target.value })}
                    style={{ padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontFamily: "var(--font-body)" }} />
                )}
                <Button size="sm" variant={item.is_featured ? "outline" : "primary"} onClick={() => toggle(item.id, item.is_featured)}>
                  {item.is_featured ? "Remove Feature" : "Feature ⭐"}
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>⭐</div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>No listings found</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Properties promoted for homepage and search spotlights will appear here.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
