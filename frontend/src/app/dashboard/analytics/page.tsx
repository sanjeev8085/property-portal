"use client";

import React, { useState } from "react";

export default function OwnerAnalyticsPage() {
  const [performance, setPerformance] = useState([
    { id: "1", title: "Sleek 2 BHK Modern Apartment", views: 182, unlocks: 5, rate: "2.7%" },
    { id: "2", title: "Premium Semi-Furnished Villa", views: 300, unlocks: 7, rate: "2.3%" }
  ]);

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header-row">
        <div>
          <h1>Listings Analytics</h1>
          <p>Track page views, lead unlocks, and overall conversions.</p>
        </div>
        <a href="/dashboard" className="btn-secondary">
          ← Back to Dashboard
        </a>
      </div>

      <div className="stats-grid" style={{ marginBottom: "30px" }}>
        <div className="premium-card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <span className="stat-value">482</span>
          <span className="stat-label">Total Listing Views</span>
        </div>
        <div className="premium-card stat-card" style={{ borderLeft: "4px solid var(--secondary)" }}>
          <span className="stat-value">12</span>
          <span className="stat-label">Leads Unlocked</span>
        </div>
        <div className="premium-card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <span className="stat-value">2.49%</span>
          <span className="stat-label">Avg. Conversion Rate</span>
        </div>
      </div>

      <div className="properties-list-container">
        <div className="premium-card dashboard-widget">
          <h3>Individual Listings Performance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
            {performance.map(item => (
              <div key={item.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
                <h4 style={{ fontSize: "16px", marginBottom: "12px" }}>{item.title}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", background: "var(--surface-hover)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Views Count</span>
                    <strong style={{ fontSize: "18px" }}>👁️ {item.views}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Contacts Unlocked</span>
                    <strong style={{ fontSize: "18px" }}>🔑 {item.unlocks}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Conversion Rate</span>
                    <strong style={{ fontSize: "18px", color: "var(--success)" }}>📈 {item.rate}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
