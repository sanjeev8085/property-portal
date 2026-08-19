"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function PrivacyPolicyPage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "860px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px 28px" }}>
        <h1>Privacy Policy</h1>
        <p style={{ margin: "16px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px" }}>
          At AuraHomes, we prioritize user trust, data protection, and privacy. This policy outlines how we collect, store, and process your personal and property information when using our platform.
        </p>

        <h3 style={{ marginTop: "24px", fontSize: "18px", fontWeight: 700 }}>1. Information We Collect</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
          We collect registered names, email addresses, 10-digit mobile numbers, and property specifications to facilitate direct contacts. Financial transactions are securely processed via encrypted payment gateways (Razorpay).
        </p>

        <h3 style={{ marginTop: "24px", fontSize: "18px", fontWeight: 700 }}>2. Phone Number Protection</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
          Listing owners&apos; phone numbers are masked by default to prevent spam calls and scraper bots. Direct numbers are only revealed to authenticated users through credit unlocks.
        </p>

        <h3 style={{ marginTop: "24px", fontSize: "18px", fontWeight: 700 }}>3. Cookies and Analytics</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "14px" }}>
          We use session tokens and cookies to maintain authenticated login sessions, filter preferences, and save favorite property listings.
        </p>

        <div style={{ marginTop: "32px", display: "flex", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            ← Back to Home
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/contact"}>
            Contact Privacy Officer
          </Button>
        </div>
      </div>
    </div>
  );
}
