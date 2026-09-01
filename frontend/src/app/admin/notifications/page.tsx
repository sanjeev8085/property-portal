"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

const TARGET_OPTIONS = [
  { value: "all",    label: "All Users" },
  { value: "owners", label: "Property Owners" },
  { value: "buyers", label: "Buyers / Tenants" },
  { value: "agents", label: "Agents" },
];

interface SentNotif { id: string; title: string; body: string; target: string; date: string; sent: number; }

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentNotif[]>([]);
  const { success, error: showError } = useToast();

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showError("Title and message body are required.");
      return;
    }
    setSending(true);
    try {
      const res = await api.broadcastNotification(title.trim(), body.trim(), target);
      const sentCount = res?.sent_count ?? 0;
      success(`✅ Broadcast sent to ${sentCount} user${sentCount !== 1 ? "s" : ""}!`);
      setSent((prev) => [{
        id: Date.now().toString(),
        title: title.trim(),
        body: body.trim(),
        target,
        date: new Date().toLocaleDateString("en-IN"),
        sent: sentCount,
      }, ...prev]);
      setTitle("");
      setBody("");
    } catch (err: any) {
      showError(err?.message || "Failed to send broadcast. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-md)", fontSize: "14px", outline: "none",
    background: "white", fontFamily: "var(--font-body)", boxSizing: "border-box",
  };

  return (
    <AdminLayout title="Broadcast Notifications" subtitle="Send announcements to users by role or all at once">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Compose Form */}
        <div style={{ background: "white", borderRadius: "14px", padding: "28px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "20px" }}>📣 Compose Announcement</h3>
          <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Title *</label>
              <input id="notif-title" style={inputStyle} placeholder="e.g. New Feature Launched" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Message *</label>
              <textarea id="notif-body" style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} placeholder="Write your announcement message here…" value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Target Audience</label>
              <select id="notif-target" style={inputStyle} value={target} onChange={(e) => setTarget(e.target.value)}>
                {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Button type="submit" variant="primary" disabled={sending} style={{ width: "100%", padding: "13px" }}>
              {sending ? "Sending…" : "🚀 Send Broadcast"}
            </Button>
          </form>
        </div>

        {/* Sent History */}
        <div style={{ background: "white", borderRadius: "14px", padding: "28px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "20px" }}>📋 Sent This Session</h3>
          {sent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "14px" }}>
              No broadcasts sent yet this session.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sent.map((n) => (
                <div key={n.id} style={{ padding: "14px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>{n.body}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                    <span>👥 {TARGET_OPTIONS.find((t) => t.value === n.target)?.label} · {n.sent} sent</span>
                    <span>{n.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
