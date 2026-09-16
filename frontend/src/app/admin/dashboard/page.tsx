"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

function MiniBar({ values, color, labels }: { values: number[]; color: string; labels?: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "40px" }}>
      {values.map((v, i) => (
        <div
          key={i}
          title={labels ? `${labels[i]}: ${v}` : String(v)}
          style={{
            flex: 1,
            height: `${Math.max((v / max) * 100, v > 0 ? 8 : 4)}%`,
            background: v > 0 ? color : "#e2e8f0",
            borderRadius: "3px 3px 0 0",
            opacity: i === values.length - 1 ? 1 : 0.5 + (i / values.length) * 0.5,
            minHeight: "4px",
            cursor: "default",
          }}
        />
      ))}
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/admin/properties",    icon: "🏢", label: "Properties",    desc: "Approve, reject, feature listings" },
  { href: "/admin/users",         icon: "👥", label: "Users",         desc: "View, block, suspend accounts" },
  { href: "/admin/reports",       icon: "🚩", label: "Reports",       desc: "Review and act on reports" },
  { href: "/admin/payments",      icon: "💳", label: "Payments",      desc: "Browse payment records" },
  { href: "/admin/subscriptions", icon: "📦", label: "Subscriptions", desc: "Manage plans & pricing" },
  { href: "/admin/featured",      icon: "⭐", label: "Featured",      desc: "Manage promoted listings" },
  { href: "/admin/analytics",     icon: "📈", label: "Analytics",     desc: "Revenue, funnel, popular cities" },
  { href: "/admin/locations",     icon: "📍", label: "Locations",     desc: "Cities, areas, localities" },
  { href: "/admin/categories",    icon: "🏷️", label: "Categories",   desc: "Property types config" },
  { href: "/admin/notifications", icon: "📣", label: "Notifications", desc: "Send announcements" },
];

interface DashboardData {
  stats: Record<string, number>;
  weekly_users: number[];
  weekly_props: number[];
  weekly_rev: number[];
  day_labels: string[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAdminDashboard()
      .then((d: DashboardData) => {
        if (d && d.stats) {
          setData(d);
        } else {
          setError("Failed to load dashboard data.");
        }
      })
      .catch(() => setError("Could not connect to server."))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats ?? {};
  const weeklyUsers = data?.weekly_users ?? [0,0,0,0,0,0,0];
  const weeklyProps = data?.weekly_props ?? [0,0,0,0,0,0,0];
  const weeklyRev   = data?.weekly_rev   ?? [0,0,0,0,0,0,0];
  const dayLabels   = data?.day_labels   ?? ["","","","","","",""];

  const cards = [
    { label: "Total Users",        value: stats.total_users        ?? "—", icon: "👥", color: "#3b82f6", sub: "registered accounts" },
    { label: "Total Properties",   value: stats.total_properties   ?? "—", icon: "🏢", color: "#8b5cf6", sub: "all listings" },
    { label: "Pending Approval",   value: stats.pending_properties ?? "—", icon: "⏳", color: "#f59e0b", sub: "awaiting review" },
    { label: "Published",          value: stats.published_properties ?? "—", icon: "✅", color: "#10b981", sub: "live listings" },
    { label: "Contact Unlocks",    value: stats.total_unlocks      ?? "—", icon: "🔑", color: "#f97316", sub: "all time" },
    { label: "Total Revenue",      value: stats.total_revenue != null ? `₹${Number(stats.total_revenue).toLocaleString("en-IN")}` : "₹0", icon: "💰", color: "#06b6d4", sub: "all time" },
    { label: "Today Revenue",      value: stats.today_revenue != null ? `₹${Number(stats.today_revenue).toLocaleString("en-IN")}` : "₹0", icon: "📅", color: "#ec4899", sub: "today" },
    { label: "Active Subscriptions", value: stats.active_subscriptions ?? "—", icon: "📦", color: "#6366f1", sub: "paid plans" },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="System overview — all figures pulled live from the production database">
      {error && (
        <div style={{ padding: "14px 18px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", marginBottom: 20, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}
      {loading ? (
        <div className="adm-loading">Loading stats…</div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="adm-stats-grid">
            {cards.map((c, i) => (
              <div key={i} className="adm-stat-card" style={{ borderTopColor: c.color }}>
                <div className="adm-stat-top">
                  <span className="adm-stat-icon">{c.icon}</span>
                  <span className="adm-stat-value">{c.value}</span>
                </div>
                <div className="adm-stat-label">{c.label}</div>
                <div className="adm-stat-sub">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="adm-charts-row">
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <span className="adm-chart-title">New Users (7 days)</span>
                <span className="adm-chart-total">{weeklyUsers.reduce((a,b)=>a+b,0)} total</span>
              </div>
              <MiniBar values={weeklyUsers} color="#3b82f6" labels={dayLabels} />
              <div className="adm-chart-days">{dayLabels.join(" ")}</div>
            </div>
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <span className="adm-chart-title">Properties Posted (7 days)</span>
                <span className="adm-chart-total">{weeklyProps.reduce((a,b)=>a+b,0)} total</span>
              </div>
              <MiniBar values={weeklyProps} color="#8b5cf6" labels={dayLabels} />
              <div className="adm-chart-days">{dayLabels.join(" ")}</div>
            </div>
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <span className="adm-chart-title">Revenue (7 days)</span>
                <span className="adm-chart-total">₹{weeklyRev.reduce((a,b)=>a+b,0).toLocaleString("en-IN")}</span>
              </div>
              <MiniBar values={weeklyRev} color="#06b6d4" labels={dayLabels} />
              <div className="adm-chart-days">{dayLabels.join(" ")}</div>
            </div>
          </div>

          {/* Quick links */}
          <h2 className="adm-section-title">Management Sections</h2>
          <div className="adm-quick-grid">
            {QUICK_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="adm-quick-card">
                <span className="adm-quick-icon">{link.icon}</span>
                <div>
                  <div className="adm-quick-label">{link.label}</div>
                  <div className="adm-quick-desc">{link.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .adm-loading { padding: 60px; text-align: center; color: var(--text-muted); font-size: 15px; }

        .adm-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .adm-stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border-top: 3px solid transparent;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .adm-stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .adm-stat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .adm-stat-icon { font-size: 22px; }
        .adm-stat-value { font-size: 26px; font-weight: 800; color: var(--text-primary); font-family: var(--font-heading); }
        .adm-stat-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .adm-stat-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        .adm-charts-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .adm-chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .adm-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .adm-chart-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .adm-chart-total { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .adm-chart-days {
          display: flex;
          justify-content: space-around;
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 6px;
          letter-spacing: 0.05em;
        }

        .adm-section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 16px;
        }
        .adm-quick-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .adm-quick-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          transition: all 0.15s;
        }
        .adm-quick-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .adm-quick-icon { font-size: 26px; }
        .adm-quick-label { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
        .adm-quick-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

        @media (max-width: 1200px) {
          .adm-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .adm-charts-row { grid-template-columns: repeat(2, 1fr); }
          .adm-quick-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 700px) {
          .adm-stats-grid { grid-template-columns: 1fr 1fr; }
          .adm-charts-row { grid-template-columns: 1fr; }
          .adm-quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .adm-stats-grid { grid-template-columns: 1fr; }
          .adm-quick-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </AdminLayout>
  );
}
