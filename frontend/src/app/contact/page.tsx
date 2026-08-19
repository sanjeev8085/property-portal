"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";

export default function ContactPage() {
  const { success } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    success("Thank you! Your message has been received. Our team will contact you within 24 hours. 🚀");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "620px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "36px 24px" }}>
        <h1>Contact & Support</h1>
        <p style={{ margin: "8px 0 24px", color: "var(--text-secondary)" }}>
          Have questions or need assistance with property verification, plans, or technical support? We are here to help!
        </p>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <span style={{ fontSize: "48px" }}>✅</span>
            <h3 style={{ marginTop: "12px", fontSize: "20px", fontWeight: 700 }}>Message Sent Successfully!</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "14px" }}>
              Our support team will reply to your registered email shortly.
            </p>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <Button variant="secondary" onClick={() => setSubmitted(false)}>Send Another Message</Button>
              <Button variant="primary" onClick={() => window.location.href = "/"}>Back to Home</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Sanjeev Tyagi" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. sanjeev@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Message / Inquiry Details</label>
              <textarea 
                rows={4} 
                className="desc-textarea" 
                placeholder="How can our support team assist you today?" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" variant="primary" fullWidth size="lg">Send Message</Button>
          </form>
        )}

        <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", justifyContent: "space-around", textAlign: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "20px" }}>📧</span>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>support@aurahomes.in</p>
          </div>
          <div>
            <span style={{ fontSize: "20px" }}>📍</span>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Arera Colony, Bhopal, MP</p>
          </div>
          <div>
            <span style={{ fontSize: "20px" }}>⏰</span>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Mon–Sat: 9AM – 8PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
