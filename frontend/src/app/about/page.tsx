"use client";

import React from "react";

export default function AboutPage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "800px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px" }}>
        <h1>About AuraHomes</h1>
        <p style={{ margin: "16px 0", color: "var(--text-secondary)", lineHeight: "1.7" }}>
          AuraHomes is India's premium property listing portal, connecting owners, tenants, and buyers directly. We eliminate intermediary brokerages and optimize lead unlocks through transparent monetization.
        </p>
        <h3 style={{ marginTop: "24px" }}>Our Vision</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.7" }}>
          To provide a seamless, AI-assisted real estate interface where finding or hosting spaces is fast, secure, and fully verified.
        </p>
      </div>
    </div>
  );
}
