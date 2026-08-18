"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function DashboardPage() {
  const stats = [
    { label: "Active Listings", value: "3", icon: "🏢", change: "+1 this week" },
    { label: "Total Views", value: "482", icon: "👁️", change: "+18% vs last month" },
    { label: "Contact Unlocks", value: "12", icon: "🔑", change: "+3 today" },
    { label: "Conversion Rate", value: "2.4%", icon: "📈", change: "Stable" }
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
            <div className="lead-item">
              <span className="lead-avatar">👤</span>
              <div className="lead-info">
                <h4>Priya Singh</h4>
                <p>Unlocked contact details for "Luxury Penthouse in Arera Colony"</p>
                <span className="lead-time">10 mins ago</span>
              </div>
              <span className="lead-credit-used">-1 Credit</span>
            </div>

            <div className="lead-item">
              <span className="lead-avatar">👤</span>
              <div className="lead-info">
                <h4>Aman Verma</h4>
                <p>Unlocked contact details for "Semi-Furnished 3 BHK in MP Nagar"</p>
                <span className="lead-time">2 hours ago</span>
              </div>
              <span className="lead-credit-used">-1 Credit</span>
            </div>
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
