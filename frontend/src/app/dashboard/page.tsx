"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

function formatTime(isoString: string | null) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<{ stats: any; recent_leads: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getDashboardStats()
      .then((res: any) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err.message || "Failed to load dashboard statistics.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container fade-in">
        <div className="premium-card p-8 text-center max-w-lg mx-auto mt-12 border border-red-500/20">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold mt-4 mb-2 text-red-500">Error Loading Dashboard</h2>
          <p className="text-muted mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary inline-block">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Active Listings", value: data?.stats.active_listings.toString() || "0", icon: "🏢", change: `Total: ${data?.stats.total_listings || 0}` },
    { label: "Total Views", value: data?.stats.total_views.toString() || "0", icon: "👁️", change: "Accumulated views" },
    { label: "Contact Unlocks", value: data?.stats.contact_unlocks.toString() || "0", icon: "🔑", change: "Leads generated" },
    { label: "Conversion Rate", value: data?.stats.conversion_rate || "0.0%", icon: "📈", change: "Visitor to lead ratio" }
  ];

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header-row">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Manage your listings and monitor direct lead unlocks.</p>
        </div>
        <a href="/dashboard/properties/new" className="btn-primary">
          + Post New Property
        </a>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="premium-card stat-card">
            <div className="stat-card-header">
              <span className="stat-icon">{stat.icon}</span>
              <span className="stat-change">{stat.change}</span>
            </div>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Unlocked Contacts Stream */}
        <div className="premium-card dashboard-widget">
          <h3>Recent Interested Buyers (Contact Unlocks)</h3>
          <div className="leads-list">
            {data?.recent_leads && data.recent_leads.length > 0 ? (
              data.recent_leads.map((lead, i) => (
                <div key={i} className="lead-item">
                  <span className="lead-avatar">👤</span>
                  <div className="lead-info">
                    <h4>{lead.buyer_name}</h4>
                    <p>Unlocked contact details for "{lead.property_title}"</p>
                    <span className="lead-time">{formatTime(lead.unlocked_at)}</span>
                  </div>
                  <span className="lead-credit-used">-{lead.credit_used} Credit</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-divider rounded-lg">
                <p className="text-muted">No recent buyer unlocks yet.</p>
                <p className="text-xs text-muted/60 mt-1">Listed properties with high visibility receive direct leads!</p>
              </div>
            )}
          </div>
        </div>

        {/* Short list of listings */}
        <div className="premium-card dashboard-widget">
          <h3>Quick Links</h3>
          <div className="quick-links-list">
            <a href="/dashboard/properties" className="quick-link-item">
              <span>🏢</span> My Listed Properties →
            </a>
            <a href="/plans" className="quick-link-item">
              <span>💳</span> Buy Contact Credits →
            </a>
            <a href="/account/profile" className="quick-link-item">
              <span>👤</span> Edit Profile Details →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
