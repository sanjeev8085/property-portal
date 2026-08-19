"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";

export default function ProfilePage() {
  const { success, error } = useToast();
  const [fullName, setFullName] = useState("Sanjeev Tyagi");
  const [email, setEmail] = useState("sanjeevtyagi8085@gmail.com");
  const [phone, setPhone] = useState("+91 9893024190");
  const [city, setCity] = useState("Bhopal");
  const [userType, setUserType] = useState("owner");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    const savedEmail = localStorage.getItem("user_email");
    const savedType = localStorage.getItem("user_type");
    if (savedName) setFullName(savedName);
    if (savedEmail) setEmail(savedEmail);
    if (savedType) setUserType(savedType);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("user_name", fullName);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_type", userType);
      setIsSaving(false);
      success("Profile details updated successfully! 🎉");
    }, 600);
  };

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header-row">
        <div>
          <h1>My Profile & Settings</h1>
          <p>Manage your contact details, preferred city, and account preferences.</p>
        </div>
        <a href="/dashboard" className="btn-secondary">
          ← Back to Dashboard
        </a>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Main Profile Form */}
        <div className="premium-card" style={{ padding: "32px 24px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "20px", fontWeight: 700 }}>Personal Information</h3>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary City</label>
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Indore">Indore</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Delhi">Delhi / NCR</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Account Role</label>
              <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                <option value="buyer">Buyer / Renter</option>
                <option value="owner">Individual Owner</option>
                <option value="agent">Real Estate Agent / Broker</option>
                <option value="builder">Property Builder / Developer</option>
              </select>
            </div>

            <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Saving Changes..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="premium-card" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>👤</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{fullName}</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{email}</p>
            <div style={{ marginTop: "12px" }}>
              <span className="status-badge badge-published" style={{ textTransform: "capitalize" }}>
                {userType} Account
              </span>
            </div>
          </div>

          <div className="premium-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Quick Shortcuts</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <a href="/dashboard/properties" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                📁 Manage My Listings →
              </a>
              <a href="/plans" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                💎 View Unlock Credits & Plans →
              </a>
              <a href="/dashboard/notifications" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                🔔 Notifications & Alerts →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
