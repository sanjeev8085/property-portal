"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

const WEEKLY_USERS  = [12, 19, 8, 24, 31, 18, 27];
const WEEKLY_PROPS  = [3, 7, 5, 11, 8, 14, 9];
const WEEKLY_REV    = [0, 199, 398, 199, 597, 199, 796];

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "40px" }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            background: color,
            borderRadius: "3px 3px 0 0",
            opacity: i === values.length - 1 ? 1 : 0.5 + (i / values.length) * 0.5,
            minHeight: "4px",
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard()
      .then((d) => setStats(d.stats ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Users",        value: stats.total_users        ?? "—", icon: "👥", color: "#3b82f6", sub: "registered accounts" },
    { label: "Total Properties",   value: stats.total_properties   ?? "—", icon: "🏢", color: "#8b5cf6", sub: "all listings" },
    { label: "Pending Approval",   value: stats.pending_properties ?? "—", icon: "⏳", color: "#f59e0b", sub: "awaiting review" },
    { label: "Published",          value: stats.published_properties ?? "—", icon: "✅", color: "#10b981", sub: "live listings" },
    { label: "Contact Unlocks",    value: stats.total_unlocks      ?? "—", icon: "🔑", color: "#f97316", sub: "all time" },
    { label: "Total Revenue",      value: stats.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString("en-IN")}` : "₹0", icon: "💰", color: "#06b6d4", sub: "all time" },
    { label: "Today Revenue",      value: stats.today_revenue ? `₹${Number(stats.today_revenue).toLocaleString("en-IN")}` : "₹0", icon: "📅", color: "#ec4899", sub: "today" },
    { label: "Active Subscriptions", value: stats.active_subscriptions ?? "—", icon: "📦", color: "#6366f1", sub: "paid plans" },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="System overview and management shortcuts">
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
                <span className="adm-chart-total">{WEEKLY_USERS.reduce((a,b)=>a+b,0)} total</span>
              </div>
              <MiniBar values={WEEKLY_USERS} color="#3b82f6" />
              <div className="adm-chart-days">M T W T F S S</div>
            </div>
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <span className="adm-chart-title">Properties Posted (7 days)</span>
                <span className="adm-chart-total">{WEEKLY_PROPS.reduce((a,b)=>a+b,0)} total</span>
              </div>
              <MiniBar values={WEEKLY_PROPS} color="#8b5cf6" />
              <div className="adm-chart-days">M T W T F S S</div>
            </div>
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <span className="adm-chart-title">Revenue (7 days)</span>
                <span className="adm-chart-total">₹{WEEKLY_REV.reduce((a,b)=>a+b,0).toLocaleString("en-IN")}</span>
              </div>
              <MiniBar values={WEEKLY_REV} color="#06b6d4" />
              <div className="adm-chart-days">M T W T F S S</div>
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
