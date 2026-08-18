"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
            <label>Password</label>
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
