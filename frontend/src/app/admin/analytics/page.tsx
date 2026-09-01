"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

interface AnalyticsData {
  revenue: number;
  users_count: number;
  properties_count: number;
  unlocks_count: number;
  views_7d: number;
  unlocks_7d: number;
  revenue_7d: number;
  daily_revenue: number[];
  day_labels: string[];
  top_cities: { city: string; count: number; pct: number }[];
  property_types: { type: string; count: number; pct: number }[];
  funnel: { stage: string; count: number }[];
}

function formatCurrency(n: number): string {
  if (n >= 10000000) return `\u20b9${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `\u20b9${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `\u20b9${(n / 1000).toFixed(1)}K`;
  return `\u20b9${n.toLocaleString("en-IN")}`;
}

function SkeletonBox({ w = "100%", h = 24 }: { w?: string; h?: number }) {
  return (
    <div style={{
      width: w, height: h,
      background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      borderRadius: 6,
    }} />
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getAnalytics().then((d: AnalyticsData | null) => {
      if (!mounted) return;
      if (d) setData(d);
      else setError("Analytics data could not be loaded.");
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setError("Failed to load analytics. Please try again.");
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const maxRev = data ? Math.max(...data.daily_revenue, 1) : 1;

  const statCards = data ? [
    { label: "Total Views (7d)", value: data.views_7d.toLocaleString("en-IN"), icon: "\ud83d\udc41\ufe0f", color: "#3b82f6" },
    { label: "Contact Unlocks (7d)", value: data.unlocks_7d.toLocaleString("en-IN"), icon: "\ud83d\udd11", color: "#f97316" },
    { label: "Revenue (7d)", value: formatCurrency(data.revenue_7d), icon: "\ud83d\udcb0", color: "#10b981" },
  ] : [];

  return (
    <AdminLayout title="Analytics" subtitle="Revenue, funnels, popular locations and property type insights">

      {/* ── Style for shimmer ── */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {error && (
        <div style={{ padding: "1.5rem", background: "#fef2f2", borderRadius: 12, color: "#dc2626", marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* ── Top stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
        {loading
          ? [0, 1, 2].map(i => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "var(--shadow-sm)" }}>
              <SkeletonBox w="40px" h={32} /><div style={{ height: 8 }} />
              <SkeletonBox h={36} /><div style={{ height: 6 }} /><SkeletonBox w="70%" h={14} />
            </div>
          ))
          : statCards.map((c) => (
            <div key={c.label} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "var(--shadow-sm)", borderTop: `3px solid ${c.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
            </div>
          ))
        }
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* ── Daily Revenue Bar Chart ── */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Revenue Trend (Last 7 Days)</h3>
          {loading
            ? <SkeletonBox h={120} />
            : data && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
                {data.daily_revenue.map((amt, i) => {
                  const height = maxRev > 0 ? (amt / maxRev) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {amt > 0 ? formatCurrency(amt) : "-"}
                      </span>
                      <div style={{
                        width: "100%", height: `${Math.max(height, 2)}%`,
                        background: amt > 0 ? "linear-gradient(to top, #3b82f6, #60a5fa)" : "#e2e8f0",
                        borderRadius: 4,
                        minHeight: 4,
                      }} />
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                        {data.day_labels[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          }
          {!loading && data && data.revenue_7d === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
              No payments completed in the last 7 days.
            </p>
          )}
        </div>

        {/* ── Conversion Funnel ── */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>User Conversion Funnel</h3>
          {loading
            ? [0,1,2,3,4].map(i => <div key={i} style={{ marginBottom: 12 }}><SkeletonBox h={20} /></div>)
            : data && data.funnel.map((f, i) => {
              const topCount = data.funnel[0].count || 1;
              const pct = Math.round((f.count / topCount) * 100);
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{f.stage}</span>
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                      {f.count.toLocaleString("en-IN")} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: "var(--surface-hover)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `hsl(${220 - i * 20}, 80%, 55%)`, borderRadius: 99, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "20px" }}>
        {/* ── Top Cities ── */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Top Cities by Listings</h3>
          {loading
            ? [0,1,2,3,4].map(i => <div key={i} style={{ marginBottom: 14 }}><SkeletonBox h={28} /></div>)
            : data && data.top_cities.length === 0
              ? <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No published listings yet.</p>
              : data?.top_cities.map((c) => (
                <div key={c.city} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>\ud83d\udccd {c.city}</span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{c.count} listings</span>
                  </div>
                  <div style={{ height: 8, background: "var(--surface-hover)", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", borderRadius: 99 }} />
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── Property Type Distribution ── */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Property Type Distribution</h3>
          {loading
            ? <SkeletonBox h={120} />
            : data && data.property_types.length === 0
              ? <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No listings in database yet.</p>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Type", "Count", "Share"].map(h => (
                        <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.property_types.map(p => (
                      <tr key={p.type}>
                        <td style={{ padding: "12px 0", fontWeight: 600, fontSize: 13, borderBottom: "1px solid var(--border)" }}>{p.type}</td>
                        <td style={{ padding: "12px 0", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>{p.count}</td>
                        <td style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: "var(--surface-hover)", borderRadius: 99 }}>
                              <div style={{ height: "100%", width: `${p.pct}%`, background: "var(--primary)", borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", minWidth: 30 }}>{p.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>
      </div>
    </AdminLayout>
  );
}
