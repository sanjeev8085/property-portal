"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="verify-page-container fade-in">
      <div className="verify-box premium-card">
        <div className="verify-header">
          <span style={{ fontSize: "60px" }}>🔍</span>
          <h2 style={{ marginTop: "16px" }}>Page Not Found</h2>
          <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>We couldn't find the page you are looking for.</p>
        </div>
        <div style={{ marginTop: "24px" }}>
          <Button type="button" variant="primary" fullWidth onClick={() => window.location.href = "/"}>
            Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}
