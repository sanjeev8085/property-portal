"use client";
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";

const REVENUE_7D = [1196, 398, 797, 199, 996, 498, 199];
const TOP_CITIES = [
  { city: "Bhopal",     count: 142, pct: 100 },
  { city: "Indore",     count: 98,  pct: 69  },
  { city: "Pune",       count: 76,  pct: 54  },
  { city: "Jaipur",     count: 61,  pct: 43  },
  { city: "Bengaluru",  count: 44,  pct: 31  },
];
const PROP_TYPES = [
  { type: "Apartment",   count: 210, pct: 55 },
  { type: "Villa/House", count: 98,  pct: 26 },
  { type: "Commercial",  count: 52,  pct: 14 },
  { type: "Plot/Land",   count: 20,  pct: 5  },
];
const FUNNEL = [
  { stage: "Property Views",     count: 4820 },
  { stage: "Contact Page Seen",  count: 1240 },
  { stage: "Unlock Attempted",   count: 410  },
  { stage: "Credits Purchased",  count: 183  },
  { stage: "Contact Unlocked",   count: 168  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const maxRev = Math.max(...REVENUE_7D);

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout title="Analytics" subtitle="Revenue, funnels, popular locations and property type insights">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
        {[
          { label: "Total Views (7d)", value: "4,820", icon: "👁️", color: "#3b82f6" },
          { label: "Contact Unlocks (7d)", value: "168", icon: "🔑", color: "#f97316" },
          { label: "Revenue (7d)", value: `₹${REVENUE_7D.reduce((a, b) => a + b, 0).toLocaleString("en-IN")}`, icon: "💰", color: "#10b981" },
        ].map((c) => (
          <div key={c.label} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "var(--shadow-sm)", borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>{c.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{c.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Revenue chart */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "20px" }}>Daily Revenue (7 days)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
            {REVENUE_7D.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>₹{v}</div>
                <div style={{ width: "100%", height: `${(v / maxRev) * 80}px`, background: "linear-gradient(to top, #3b82f6, #60a5fa)", borderRadius: "4px 4px 0 0", minHeight: "4px", transition: "height 0.3s" }} />
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion funnel */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "20px" }}>Contact Unlock Funnel</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FUNNEL.map((f, i) => {
              const pct = Math.round((f.count / FUNNEL[0].count) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 500 }}>{f.stage}</span>
                    <span style={{ fontWeight: 700, color: "var(--primary)" }} suppressHydrationWarning>{f.count.toLocaleString("en-IN")} ({pct}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `hsl(${220 - i * 20}, 80%, 55%)`, borderRadius: "99px", transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Top cities */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "20px" }}>Top Cities by Listings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {TOP_CITIES.map((c) => (
              <div key={c.city}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                  <span style={{ fontWeight: 600 }}>📍 {c.city}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{c.count} listings</span>
                </div>
                <div style={{ height: "8px", background: "var(--surface-hover)", borderRadius: "99px" }}>
                  <div style={{ height: "100%", width: `${c.pct}%`, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", borderRadius: "99px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property types */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "20px" }}>Property Type Distribution</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Type", "Count", "Share"].map((h) => <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {PROP_TYPES.map((p) => (
                <tr key={p.type}>
                  <td style={{ padding: "12px 0", fontWeight: 600, fontSize: "13px", borderBottom: "1px solid var(--border)" }}>{p.type}</td>
                  <td style={{ padding: "12px 0", fontSize: "13px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>{p.count}</td>
                  <td style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "6px", background: "var(--surface-hover)", borderRadius: "99px" }}>
                        <div style={{ height: "100%", width: `${p.pct}%`, background: "var(--primary)", borderRadius: "99px" }} />
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", minWidth: "30px" }}>{p.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
