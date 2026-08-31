"use client";

import React, { useState } from "react";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const { success, error } = useToast();

  const [step, setStep] = useState<"REQUEST_OTP" | "ENTER_NEW_PASSWORD">("REQUEST_OTP");
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      error("Please enter your registered mobile number or email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.requestPasswordReset(identifier.trim());
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setStep("ENTER_NEW_PASSWORD");
      success("📩 Verification code dispatched! Please check your mobile or email.");
    } catch (err: any) {
      error(err?.message || "No registered account found with this email or mobile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() && !resetToken) {
      error("Please enter the 6-digit verification code sent to your contact.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("New password and confirm password do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword({
        mobile_or_email: identifier.trim(),
        new_password: newPassword,
        otp: otpCode.trim(),
        reset_token: resetToken || undefined,
      });

      setIsSuccess(true);
      success("🎉 Password reset successfully! You can now log in.");
    } catch (err: any) {
      error(err?.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-container fade-in">
      <div className="reset-card premium-card">
        <div className="reset-header">
          <div className="reset-icon">🔑</div>
          <h1>Reset Account Password</h1>
          <p>
            {step === "REQUEST_OTP"
              ? "Enter your registered email or phone to receive a secure verification code."
              : `Enter the code sent to ${identifier} and choose your new password.`}
          </p>
        </div>

        {isSuccess ? (
          <div className="success-state-box fade-in">
            <div className="success-icon">✅</div>
            <h3>Password Changed Successfully!</h3>
            <p>Your account password has been securely updated. Please log in with your new credentials.</p>
            <a href="/login" className="btn-primary full-width-btn" style={{ marginTop: "16px", textAlign: "center", textDecoration: "none" }}>
              Proceed to Login →
            </a>
          </div>
        ) : step === "REQUEST_OTP" ? (
          <form onSubmit={handleRequestOtp} className="reset-form">
            <div className="form-group">
              <label>Registered Email or 10-digit Mobile Number</label>
              <input
                type="text"
                placeholder="e.g. 9876543210 or user@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary full-width-btn" disabled={isLoading}>
              {isLoading ? "Sending Verification Code..." : "Send Verification Code →"}
            </button>

            <div className="reset-footer-links">
              <a href="/login" className="back-link">← Back to Login</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="reset-form fade-in">
            <div className="form-group">
              <label>6-Digit Verification Code (OTP)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>New Password (Min 8 characters)</label>
              <div className="input-toggle-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="btn-primary full-width-btn" disabled={isLoading}>
              {isLoading ? "Verifying & Updating..." : "Verify OTP & Update Password"}
            </button>

            <div className="reset-footer-links" style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                className="text-btn"
                onClick={() => setStep("REQUEST_OTP")}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "14px" }}
              >
                ← Change Number/Email
              </button>
              <a href="/login" className="back-link">Back to Login</a>
            </div>
          </form>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .reset-container {
          min-height: calc(100vh - 140px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .reset-card {
          max-width: 460px;
          width: 100%;
          padding: 36px 30px;
          border-radius: var(--radius-xl, 20px);
        }
        .reset-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .reset-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }
        .reset-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .reset-header p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .reset-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-md, 10px);
          border: 1px solid var(--border-color);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 15px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .input-toggle-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .eye-btn:hover {
          opacity: 1;
        }
        .full-width-btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          margin-top: 8px;
          border-radius: var(--radius-md, 10px);
        }
        .reset-footer-links {
          text-align: center;
          margin-top: 8px;
        }
        .back-link {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--primary);
        }
        .success-state-box {
          text-align: center;
          padding: 20px 0;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .success-state-box h3 {
          font-size: 20px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .success-state-box p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}} />
    </div>
  );
}
