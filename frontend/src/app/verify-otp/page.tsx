"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const mobile = searchParams?.get("mobile") || "98765 43210";
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await api.verifyOtp(mobile, otp);
      // Redirect to dashboard listings on success
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page-container fade-in">
      <div className="verify-box premium-card">
        <div className="verify-header">
          <span className="shield-icon">🛡️</span>
          <h2>Verify Mobile Number</h2>
          <p>We've sent a 6-digit verification code to:</p>
          <span className="mobile-number">+91 {mobile}</span>
        </div>

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="form-group">
            <label>Verification Code</label>
            <input 
              type="text" 
              maxLength={6}
              placeholder="e.g. 123456" 
              required
              disabled={loading}
              className="otp-input"
              value={otp}
              onChange={(e) => {
                setErrorMsg("");
                setOtp(e.target.value.replace(/\D/g, ""));
              }}
            />
          </div>

          {errorMsg && <p className="error-text">{errorMsg}</p>}

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
        </form>

        <div className="resend-container">
          <p>Didn't receive code? <button type="button" onClick={() => alert("OTP Resent! (Simulated)")}>Resend OTP</button></p>
        </div>
      </div>


    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
