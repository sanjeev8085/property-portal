"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const name = localStorage.getItem("user_name");
    const userEmail = localStorage.getItem("user_email");
    if (token && (name || userEmail)) {
      setCurrentUser({ name: name || "User", email: userEmail || "" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await api.login({ email, password });
      // Redirect to dashboard on success
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container fade-in">
      <div className="login-box premium-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Login to search, post properties, and manage unlocked contact leads.</p>
        </div>

        {currentUser && (
          <div style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
            fontSize: "13px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#10b981", fontWeight: 700 }}>🟢 Currently Signed In:</span>
              <a href="/dashboard" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                Open Dashboard →
              </a>
            </div>
            <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{currentUser.name} ({currentUser.email})</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Logging in below will seamlessly switch to another account.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. buyer@example.com" 
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
              <a href="/reset-password" style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                Forgot Password?
              </a>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && <p style={{ color: "var(--error)", fontSize: "13px", fontWeight: "600" }}>{errorMsg}</p>}

          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="divider-container">
          <div className="line"></div>
          <span>OR</span>
          <div className="line"></div>
        </div>

        <button type="button" className="google-sso-btn" onClick={() => window.location.href = "/dashboard/properties"}>
          <span className="google-icon">🔑</span> Continue with Google
        </button>

        <p className="register-prompt">Don't have an account? <a href="/register">Sign Up</a></p>
      </div>


    </div>
  );
}
