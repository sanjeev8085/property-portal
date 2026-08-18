"use client";

import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "800px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px" }}>
        <h1>Terms of Service</h1>
        <p style={{ margin: "16px 0", color: "var(--text-secondary)", lineHeight: "1.7" }}>
          By creating an account on AuraHomes, you agree to comply with our listing validation rules and monetization plans terms.
        </p>
        <h3 style={{ marginTop: "24px" }}>Account Verification</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.7" }}>
          Owners and agents must provide accurate contact and location information. Suspicious, duplicate, or misleading listings are subject to deletion and account suspension.
        </p>
      </div>
    </div>
  );
}
