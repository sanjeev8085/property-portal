"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function PaymentFailedPage() {
  return (
    <div className="verify-page-container fade-in">
      <div className="verify-box premium-card">
        <div className="verify-header">
          <span style={{ fontSize: "60px" }}>❌</span>
          <h2 style={{ color: "var(--error)", marginTop: "16px" }}>Payment Failed</h2>
          <p style={{ marginTop: "8px" }}>We couldn't process your transaction. Please try again.</p>
          <div style={{ background: "var(--surface-hover)", padding: "16px", borderRadius: "var(--radius-md)", margin: "24px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            Error Code: <strong>TRX_GATEWAY_DECLINED</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Button type="button" variant="primary" fullWidth size="lg" onClick={() => window.location.href = "/plans"}>
            Retry Plan Purchase
          </Button>
          <a href="/contact" className="btn-secondary btn-lg" style={{ display: "inline-flex", justifyContent: "center" }}>
            Contact Customer Support
          </a>
        </div>
      </div>
    </div>
  );
}
