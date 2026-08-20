"use client";

import React, { useState } from "react";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const { success, error } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      error("Please enter your registered mobile number or email.");
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
      });

      setIsSuccess(true);
      success("🎉 Password reset successfully! You can now log in.");
    } catch (err: any) {
      error(err?.message || "Could not reset password. Please check your email or mobile.");
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
          <p>Enter your registered email or phone number to set a new password.</p>
        </div>

        {isSuccess ? (
          <div className="success-state-box fade-in">
            <div className="success-icon">✅</div>
            <h3>Password Changed Successfully!</h3>
            <p>Your account password has been updated. Please log in with your new credentials.</p>
            <a href="/login" className="btn-primary full-width-btn" style={{ marginTop: "16px", textAlign: "center", textDecoration: "none" }}>
              Proceed to Login →
            </a>
          </div>
        ) : (
          <form onSubmit={handleReset} className="reset-form">
            <div className="form-group">
              <label>Registered Email or 10-digit Mobile Number</label>
              <input
                type="text"
                placeholder="e.g. 9893024190 or user@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
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
              {isLoading ? "Updating Password..." : "Reset Password & Login"}
            </button>

            <div className="reset-footer-links">
              <a href="/login" className="back-link">← Back to Login</a>
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
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .reset-header p {
          font-size: 13.5px;
          color: var(--text-secondary);
          margin-top: 6px;
        }
        .reset-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .form-group input {
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        .input-toggle-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-toggle-wrapper input {
          width: 100%;
          padding-right: 42px;
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
        }
        .full-width-btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          font-weight: 800;
          border-radius: 12px;
          margin-top: 6px;
        }
        .reset-footer-links {
          text-align: center;
          margin-top: 10px;
        }
        .back-link {
          font-size: 13.5px;
          color: var(--primary);
          text-decoration: none;
          font-weight: 700;
        }
        .success-state-box {
          text-align: center;
          padding: 20px 0;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .success-state-box h3 {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .success-state-box p {
          font-size: 13.5px;
          color: var(--text-secondary);
        }
      `}} />
    </div>
  );
}
