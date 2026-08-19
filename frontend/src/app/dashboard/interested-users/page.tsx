"use client";

import React, { useState } from "react";

export default function InterestedUsersPage() {
  const [leads, setLeads] = useState([
    { id: "1", buyerName: "Priya Singh", propertyTitle: "Sleek 2 BHK Modern Apartment", phone: "9823456789", email: "priya@test.com", unlockedAt: "10 mins ago" },
    { id: "2", buyerName: "Aman Verma", propertyTitle: "Sleek 2 BHK Modern Apartment", phone: "9112233445", email: "aman@test.com", unlockedAt: "2 hours ago" },
    { id: "3", buyerName: "Kunal Sen", propertyTitle: "Premium Semi-Furnished Villa", phone: "9422334455", email: "kunal@test.com", unlockedAt: "1 day ago" }
  ]);

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header-row">
        <div>
          <h1>Interested Buyers (Leads)</h1>
          <p>Contact details of buyers who unlocked your property listings.</p>
        </div>
        <a href="/dashboard" className="btn-secondary">
          ← Back to Dashboard
        </a>
      </div>

      <div className="properties-list-container">
        <div className="leads-list">
          {leads.map(lead => (
            <div key={lead.id} className="premium-card lead-item" style={{ padding: "24px" }}>
              <span className="lead-avatar" style={{ fontSize: "28px", width: "50px", height: "50px" }}>👤</span>
              <div className="lead-info">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ fontSize: "18px" }}>{lead.buyerName}</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Unlocked {lead.unlockedAt}</span>
                </div>
                <p style={{ marginTop: "4px" }}>Property: <strong>{lead.propertyTitle}</strong></p>
                
                <div className="contact-details" style={{ display: "flex", gap: "24px", marginTop: "16px", background: "var(--surface-hover)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Phone Number</span>
                    <a href={`tel:${lead.phone}`} style={{ fontWeight: "700", color: "var(--primary)" }}>+91 {lead.phone}</a>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Email Address</span>
                    <a href={`mailto:${lead.email}`} style={{ fontWeight: "700", color: "var(--primary)" }}>{lead.email}</a>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignSelf: "center" }}>
                <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm" style={{ textDecoration: "none" }}>
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .lead-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 16px !important;
          }
          .lead-item .contact-details {
            flex-direction: column !important;
            gap: 10px !important;
            padding: 12px !important;
          }
          .lead-item .btn-whatsapp {
            width: 100%;
            text-align: center;
          }
        }
      `}} />
    </div>
  );
}
