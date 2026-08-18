"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Bhopal");
  const [userType, setUserType] = useState("buyer");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await api.register({
        name,
        email,
        mobile,
        password,
        city,
        user_type: userType
      });
      // Try to send OTP automatically
      try {
        await api.sendOtp(mobile);
      } catch {}
      // Redirect to OTP verification page
      window.location.href = `/verify-otp?mobile=${encodeURIComponent(mobile)}`;
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Try a different email/mobile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container fade-in">
      <div className="register-box premium-card">
        <div className="register-header">
          <h2>Create Account</h2>
          <p>Join AuraHomes to find your dream property or list your space for free.</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Sanjeev Tyagi" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. sanjeev@example.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input 
                type="tel" 
                placeholder="e.g. 9876543210" 
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Min 8 characters" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="Bhopal">Bhopal</option>
                <option value="Indore">Indore</option>
                <option value="Jabalpur">Jabalpur</option>
                <option value="Gwalior">Gwalior</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>I want to</label>
            <div className="user-type-selector">
              <button 
                type="button" 
                className={userType === "buyer" ? "active" : ""}
                onClick={() => setUserType("buyer")}
              >
                🔍 Buy / Rent Properties
              </button>
              <button 
                type="button" 
                className={userType === "owner" ? "active" : ""}
                onClick={() => setUserType("owner")}
              >
                🏠 Post / Sell Properties
              </button>
            </div>
          </div>

          {errorMsg && <p style={{ color: "var(--error)", fontSize: "13px", fontWeight: "600" }}>{errorMsg}</p>}

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className="login-prompt">Already have an account? <a href="/login">Log In</a></p>
      </div>


    </div>
  );
}
