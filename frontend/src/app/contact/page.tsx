"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <div className="wizard-page-container fade-in" style={{ maxWidth: "600px" }}>
      <div className="premium-card wizard-content-box" style={{ padding: "40px" }}>
        <h1>Contact Support</h1>
        <p style={{ margin: "8px 0 24px", color: "var(--text-secondary)" }}>Have questions? Reach out and we'll reply as soon as possible.</p>
        
        <form onSubmit={(e) => { e.preventDefault(); alert("Message submitted! (Simulated)"); }} className="register-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Your Name" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Your Email" required />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea rows={4} className="desc-textarea" placeholder="Your query details..." required />
          </div>
          <Button type="submit" variant="primary" fullWidth>Send Message</Button>
        </form>
      </div>
    </div>
  );
}
