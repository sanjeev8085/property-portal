"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";

const INITIAL_PAST_NOTIFICATIONS = [
  { id: "n1", title: "New verification process",  body: "We updated our property verification process.", target: "all",    date: "2026-08-10", sent: 1420 },
  { id: "n2", title: "Ramadan special discount",  body: "Get 20% off Standard Plan this weekend.",      target: "buyers", date: "2026-08-05", sent: 820  },
  { id: "n3", title: "Owner dashboard upgrade",   body: "Your owner dashboard has new analytics.",       target: "owners", date: "2026-08-01", sent: 340  },
];

const TARGET_OPTIONS = [
  { value: "all",    label: "All Users" },
  { value: "owners", label: "Property Owners" },
  { value: "buyers", label: "Buyers / Tenants" },
  { value: "agents", label: "Agents" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [past, setPast] = useState(INITIAL_PAST_NOTIFICATIONS);
  const { success, error: showError } = useToast();

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      showError("You must be logged in as an administrator.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/notifications/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, target }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to broadcast announcement.");
      }

      const data = await res.json();
      const sentCount = data.sent_count ?? 1;

      setPast([
        {
          id: Date.now().toString(),
          title,
          body,
          target,
          date: new Date().toISOString().slice(0, 10),
          sent: sentCount,
        },
        ...past,
      ]);

      success(`Announcement broadcasted successfully to ${sentCount} user(s)!`);
      setTitle("");
      setBody("");
      setTarget("all");
    } catch (err: any) {
      showError(err.message || "Failed to send announcement.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout title="Notifications" subtitle="Send announcements to users across the platform">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "24px" }}>
        {/* Compose */}
        <div style={{ background: "white", borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>📣 Compose Announcement</h3>
          <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Target Audience</label>
              <select value={target} onChange={(e) => setTarget(e.target.value)} required
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", background: "white" }}>
                {TARGET_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Notification Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Important platform update"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Message Body</label>
              <textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement here…"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none", resize: "vertical" }} />
            </div>
            <Button type="submit" variant="primary" disabled={sending} fullWidth>
              {sending ? "Sending…" : "Send Announcement 📣"}
            </Button>
          </form>
        </div>

        {/* History */}
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Recent Announcements</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {past.map((n) => (
              <div key={n.id} style={{ background: "white", borderRadius: "12px", padding: "16px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>{n.title}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid #bfdbfe", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {TARGET_OPTIONS.find((t) => t.value === n.target)?.label}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.5 }}>{n.body}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span>📅 {n.date}</span>
                  <span suppressHydrationWarning>✅ Sent to {n.sent.toLocaleString("en-IN")} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
