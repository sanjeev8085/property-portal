"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "860px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px 28px" }}>
        <h1>About AuraHomes</h1>
        <p style={{ margin: "16px 0", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px" }}>
          AuraHomes is India&apos;s trusted property marketplace, connecting genuine property owners, tenants, and verified buyers directly. We eliminate intermediary brokerages and optimize lead unlocks through transparent, spam-free monetization.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", margin: "32px 0" }}>
          <div className="premium-card" style={{ padding: "20px", background: "var(--surface-hover)" }}>
            <span style={{ fontSize: "32px" }}>🛡️</span>
            <h3 style={{ fontSize: "16px", marginTop: "8px", fontWeight: 700 }}>100% Verified Listings</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Every property undergoes review and owner contact verification before going live.
            </p>
          </div>

          <div className="premium-card" style={{ padding: "20px", background: "var(--surface-hover)" }}>
            <span style={{ fontSize: "32px" }}>🤖</span>
            <h3 style={{ fontSize: "16px", marginTop: "8px", fontWeight: 700 }}>AI Description Generator</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Publish professional property listings in minutes with our built-in AI copywriting assistant.
            </p>
          </div>

          <div className="premium-card" style={{ padding: "20px", background: "var(--surface-hover)" }}>
            <span style={{ fontSize: "32px" }}>🔒</span>
            <h3 style={{ fontSize: "16px", marginTop: "8px", fontWeight: 700 }}>Zero Broker Spam</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Credit-gated contact access ensures owners only get contacted by serious, verified prospects.
            </p>
          </div>
        </div>

        <h3 style={{ marginTop: "28px", fontSize: "20px", fontWeight: 700 }}>Our Mission</h3>
        <p style={{ margin: "8px 0 24px", color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "15px" }}>
          To provide a state-of-the-art real estate interface where finding, renting, buying, and hosting residential and commercial spaces is fast, transparent, and delighting on every device.
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "24px" }}>
          <Button variant="primary" onClick={() => window.location.href = "/search"}>
            Explore Properties →
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = "/dashboard/properties/new"}>
            + Post Free Property
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/plans"}>
            View Pricing Plans
          </Button>
        </div>
      </div>
    </div>
  );
}
