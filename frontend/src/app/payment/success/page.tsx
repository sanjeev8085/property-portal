"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const credits = searchParams?.get("credits") || "15";

  return (
    <div className="verify-page-container fade-in">
      <div className="verify-box premium-card">
        <div className="verify-header">
          <span style={{ fontSize: "60px" }}>✅</span>
          <h2 style={{ color: "var(--success)", marginTop: "16px" }}>Payment Successful!</h2>
          <p style={{ marginTop: "8px" }}>Your plan has been activated successfully.</p>
          <div className="success-credits-badge" style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "16px", borderRadius: "var(--radius-md)", margin: "24px 0", fontWeight: "700" }}>
            🔑 +{credits} Contact Unlock Credits Added
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Button type="button" variant="primary" fullWidth size="lg" onClick={() => window.location.href = "/search"}>
            Start Unlocking Properties
          </Button>
          <a href="/dashboard" className="btn-secondary btn-lg" style={{ display: "inline-flex", justifyContent: "center" }}>
            Go to Owner Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading success details...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
