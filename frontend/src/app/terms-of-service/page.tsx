"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function TermsOfServicePage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "860px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px 28px" }}>
        <h1>Terms of Service</h1>
        <p style={{ margin: "16px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px" }}>
          By creating an account or browsing properties on AuraHomes, you agree to comply with our listing validation guidelines and monetization policies.
        </p>

        <h3 style={{ marginTop: "24px", fontSize: "18px", fontWeight: 700 }}>1. Listing Accuracy & Fair Use</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
          Owners and real estate agents must provide genuine, accurate photos, location details, and pricing. Fraudulent, duplicate, or misleading listings are subject to immediate removal and account termination.
        </p>

        <h3 style={{ marginTop: "24px", fontSize: "18px", fontWeight: 700 }}>2. Credits & Monetization</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
          Contact unlock credits purchased through the portal are valid for the duration specified in the chosen package. Unlocked contacts remain permanently available in your dashboard leads.
        </p>

        <h3 style={{ marginTop: "24px", fontSize: "18px", fontWeight: 700 }}>3. RERA & Compliance</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
          Commercial and new project developers must provide valid RERA registration identifiers wherever mandated under applicable real estate regulations.
        </p>

        <div style={{ marginTop: "32px", display: "flex", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            ← Back to Home
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/plans"}>
            View Credit Packages
          </Button>
        </div>
      </div>
    </div>
  );
}
