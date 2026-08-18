"use client";

import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "800px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px" }}>
        <h1>Privacy Policy</h1>
        <p style={{ margin: "16px 0", color: "var(--text-secondary)", lineHeight: "1.7" }}>
          At AuraHomes, we prioritize user trust and details security. This policy outlines how we collect, store, and process your listing and payment details.
        </p>
        <h3 style={{ marginTop: "24px" }}>Information Collection</h3>
        <p style={{ margin: "8px 0", color: "var(--text-secondary)", lineHeight: "1.7" }}>
          We collect registered names, mobile numbers, and listings details to facilitate direct unlocks. Financial information is processed via secure gateway links (Razorpay).
        </p>
      </div>
    </div>
  );
}
