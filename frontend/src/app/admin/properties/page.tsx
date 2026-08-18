"use client";

import React, { useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/lib/useToast";

type PropStatus = "Pending Approval" | "Published" | "Rejected" | "Featured";

interface AdminProp {
  id: string;
  title: string;
  price: string;
  location: string;
  purpose: string;
  status: PropStatus;
  is_verified: boolean;
  is_featured: boolean;
  owner: string;
  posted: string;
}

const INITIAL: AdminProp[] = [
  { id: "1", title: "Luxury Penthouse Arera Colony", price: "₹1.4 Cr", location: "Arera Colony, Bhopal", purpose: "sell", status: "Pending Approval", is_verified: false, is_featured: false, owner: "Rahul Sharma", posted: "2h ago" },
  { id: "2", title: "Furnished Studio near MP Nagar", price: "₹15,000 / Mo", location: "MP Nagar, Bhopal", purpose: "rent", status: "Published", is_verified: true, is_featured: true, owner: "Neha Joshi", posted: "1d ago" },
  { id: "3", title: "2 BHK Spacious Apartment Kolar", price: "₹12,000 / Mo", location: "Kolar Road, Bhopal", purpose: "rent", status: "Pending Approval", is_verified: false, is_featured: false, owner: "Vikram Rao", posted: "3h ago" },
  { id: "4", title: "4 BHK Villa Vijay Nagar Indore", price: "₹2.2 Cr", location: "Vijay Nagar, Indore", purpose: "sell", status: "Published", is_verified: true, is_featured: false, owner: "Priya Singh", posted: "5d ago" },
  { id: "5", title: "Commercial Shop MP Nagar", price: "₹45,000 / Mo", location: "MP Nagar, Bhopal", purpose: "rent", status: "Rejected", is_verified: false, is_featured: false, owner: "Sagar Gupta", posted: "7d ago" },
];

const STATUS_COLOR: Record<string, string> = {
  "Pending Approval": "#f59e0b",
  "Published": "#10b981",
  "Rejected": "#ef4444",
  "Featured": "#8b5cf6",
};

export default function AdminPropertiesPage() {
  const [props, setProps] = useState<AdminProp[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPurpose, setFilterPurpose] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const filtered = useMemo(() => {
    return props.filter((p) => {
      const q = search.toLowerCase();
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q);
      const matchS = filterStatus === "all" || p.status === filterStatus;
      const matchP = filterPurpose === "all" || p.purpose === filterPurpose;
      return matchQ && matchS && matchP;
    });
  }, [props, search, filterStatus, filterPurpose]);

  const approve = async (id: string) => {
    setLoading(id);
    try { await api.approveProperty(id); } catch { /* mock ok */ }
    setProps((p) => p.map((x) => x.id === id ? { ...x, status: "Published" } : x));
    success("Property approved and published");
    setLoading(null);
  };

  const doReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    setLoading(rejectingId);
    try { await api.rejectProperty(rejectingId, rejectReason); } catch { /* mock ok */ }
    setProps((p) => p.map((x) => x.id === rejectingId ? { ...x, status: "Rejected" } : x));
    success("Property rejected. Owner notified.");
    setLoading(null); setRejectingId(null); setRejectReason("");
  };

  const toggleVerify = async (id: string) => {
    setLoading(id);
    try { await api.verifyProperty(id); } catch { /* mock ok */ }
    setProps((p) => p.map((x) => x.id === id ? { ...x, is_verified: !x.is_verified } : x));
    success("Verified status toggled");
    setLoading(null);
  };

  const toggleFeatured = (id: string) => {
    setProps((p) => p.map((x) => x.id === id ? { ...x, is_featured: !x.is_featured } : x));
    const prop = props.find((x) => x.id === id);
    success(prop?.is_featured ? "Removed from featured" : "Added to featured ⭐");
  };

  const deleteProp = (id: string) => {
    if (!confirm("Permanently delete this property? This cannot be undone.")) return;
    setProps((p) => p.filter((x) => x.id !== id));
    showError("Property deleted");
  };

  return (
    <AdminLayout title="Property Management" subtitle="Review, approve, reject, feature and moderate all listings">
      {/* Toolbar */}
      <div className="ap-toolbar">
        <input className="ap-search" type="text" placeholder="🔍  Search by title, location or owner…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="ap-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Pending Approval">Pending</option>
          <option value="Published">Published</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select className="ap-filter" value={filterPurpose} onChange={(e) => setFilterPurpose(e.target.value)}>
          <option value="all">All Purposes</option>
          <option value="rent">Rent</option>
          <option value="sell">Sale</option>
        </select>
        <span className="ap-count">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Cards */}
      <div className="ap-list">
        {filtered.map((p) => (
          <div key={p.id} className="ap-card">
            <div className="ap-card-left">
              <div className="ap-badges">
                <span className="ap-badge" style={{ background: STATUS_COLOR[p.status] + "18", color: STATUS_COLOR[p.status], border: `1px solid ${STATUS_COLOR[p.status]}44` }}>{p.status}</span>
                {p.is_verified && <span className="ap-badge" style={{ background: "#10b98118", color: "#10b981", border: "1px solid #10b98144" }}>✓ Verified</span>}
                {p.is_featured && <span className="ap-badge" style={{ background: "#8b5cf618", color: "#8b5cf6", border: "1px solid #8b5cf644" }}>⭐ Featured</span>}
              </div>
              <h3 className="ap-title">{p.title}</h3>
              <div className="ap-meta">
                <span>📍 {p.location}</span>
                <span>·</span>
                <span>💰 {p.price}</span>
                <span>·</span>
                <span>👤 {p.owner}</span>
                <span>·</span>
                <span>🕐 {p.posted}</span>
              </div>
            </div>
            <div className="ap-card-actions">
              {p.status !== "Published" && p.status !== "Featured" && (
                <Button variant="primary" size="sm" disabled={loading === p.id} onClick={() => approve(p.id)}>Approve</Button>
              )}
              {p.status !== "Rejected" && (
                <Button variant="outline" size="sm" disabled={loading === p.id} onClick={() => setRejectingId(p.id)} style={{ color: "var(--error)", borderColor: "var(--error)" }}>Reject</Button>
              )}
              <Button variant="outline" size="sm" disabled={loading === p.id} onClick={() => toggleVerify(p.id)}>
                {p.is_verified ? "Unverify" : "Verify ✓"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleFeatured(p.id)}>
                {p.is_featured ? "Unfeature" : "Feature ⭐"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteProp(p.id)} style={{ color: "var(--error)" }}>Delete</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>No listings match your filters</div>
        )}
      </div>

      {/* Reject modal */}
      {rejectingId && (
        <div className="ap-modal-overlay">
          <form onSubmit={doReject} className="ap-modal">
            <div className="ap-modal-header">
              <h3>Reject Listing</h3>
              <button type="button" onClick={() => setRejectingId(null)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>Provide a rejection reason. The owner will be notified via email.</p>
            <textarea required rows={4} className="ap-reason" placeholder="e.g. Duplicate listing / Incorrect pricing / Misleading images…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="outline" type="button" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ background: "var(--error)" }}>Confirm Rejection</Button>
            </div>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .ap-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .ap-search { flex: 1; min-width: 240px; padding: 10px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-md); font-size: 13px; font-family: var(--font-body); outline: none; background: white; }
        .ap-search:focus { border-color: var(--primary); }
        .ap-filter { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-md); font-size: 13px; background: white; color: var(--text-primary); cursor: pointer; }
        .ap-count { font-size: 13px; color: var(--text-muted); white-space: nowrap; font-weight: 500; }
        .ap-list { display: flex; flex-direction: column; gap: 12px; }
        .ap-card { background: white; border-radius: 12px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); transition: box-shadow 0.15s; }
        .ap-card:hover { box-shadow: var(--shadow-md); }
        .ap-card-left { flex: 1; min-width: 0; }
        .ap-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .ap-badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 99px; }
        .ap-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ap-meta { display: flex; gap: 8px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; align-items: center; }
        .ap-card-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; flex-shrink: 0; }
        .ap-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 24px; }
        .ap-modal { background: white; border-radius: 16px; padding: 28px; max-width: 440px; width: 100%; box-shadow: var(--shadow-xl); }
        .ap-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .ap-modal-header h3 { font-size: 18px; font-weight: 700; }
        .ap-reason { width: 100%; padding: 12px; border: 1.5px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px; resize: vertical; outline: none; }
        .ap-reason:focus { border-color: var(--primary); }
        @media (max-width: 768px) {
          .ap-card { flex-direction: column; }
          .ap-card-actions { justify-content: flex-start; }
        }
      `}} />
    </AdminLayout>
  );
}
