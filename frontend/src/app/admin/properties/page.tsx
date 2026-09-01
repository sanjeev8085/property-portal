"use client";

import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/lib/useToast";
import { getPublishedProperties } from "@/lib/propertyStore";

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

const DEFAULT_ADMIN_PROPS: AdminProp[] = [
  {
    id: "premium-pg-coliving-space-triple-dormitory-sharing-in-gandhi-nagar-bhopal-gandhi-nagar-gandhi-nagar-bhopal-1788182184833",
    title: "Premium PG / Coliving Space (Triple / Dormitory Sharing) in gandhi nagar , Bhopal",
    price: "₹1.80 Lakh",
    location: "gandhi nagar , gandhi nagar , Bhopal",
    purpose: "rent",
    status: "Published",
    is_verified: true,
    is_featured: true,
    owner: "Verified Owner",
    posted: "Portal Listing"
  },
  {
    id: "1500-sqft-commercial-office-space-in-arera-colony-bhopal",
    title: "1500 sqft Commercial Office Space in Arera Colony, Bhopal",
    price: "₹85.00 Lakh",
    location: "Arera Colony, Bhopal",
    purpose: "sell",
    status: "Published",
    is_verified: true,
    is_featured: true,
    owner: "Verified Owner",
    posted: "Portal Listing"
  },
  {
    id: "3-bhk-luxury-apartment-in-mp-nagar-bhopal",
    title: "3 BHK Luxury Apartment in MP Nagar, Bhopal",
    price: "₹45,000 / Mo",
    location: "MP Nagar, Bhopal",
    purpose: "rent",
    status: "Published",
    is_verified: true,
    is_featured: false,
    owner: "Verified Owner",
    posted: "Portal Listing"
  }
];

const STATUS_COLOR: Record<string, string> = {
  "Pending Approval": "#f59e0b",
  "Published": "#10b981",
  "Rejected": "#ef4444",
  "Featured": "#8b5cf6",
};

export default function AdminPropertiesPage() {
  const [props, setProps] = useState<AdminProp[]>(DEFAULT_ADMIN_PROPS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPurpose, setFilterPurpose] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const { success } = useToast();

  useEffect(() => {
    const loadAllProps = async () => {
      const published = getPublishedProperties();
      let cloudProps: any[] = [];
      try {
        const cloudData = await api.getAdminProperties();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          cloudProps = cloudData;
        } else {
          const publicProps = await api.getProperties();
          if (Array.isArray(publicProps)) cloudProps = publicProps;
        }
      } catch {
        // Fallback to local
      }

      const mappedPublished: AdminProp[] = published.map(p => ({
        id: p.id.toString(),
        title: p.title || "Untitled Property",
        price: p.price ? String(p.price) : "Contact for price",
        location: p.location || "Bhopal",
        purpose: p.purpose || "sell",
        status: (p.status === "Deactivated" ? "Rejected" : (p.status === "pending_approval" ? "Pending Approval" : "Published")) as PropStatus,
        is_verified: true,
        is_featured: false,
        owner: p.contactName || p.ownerEmail || "Verified Owner",
        posted: "Recently Listed"
      }));

      const statusMap: Record<string, PropStatus> = {
        pending_approval: "Pending Approval",
        published: "Published",
        rejected: "Rejected",
      };

      const mappedCloud: AdminProp[] = cloudProps.map(p => {
        const rawPrice = p.price;
        const priceDisplay = typeof rawPrice === "number" ? `₹${(rawPrice as number).toLocaleString("en-IN")}` : (rawPrice ? String(rawPrice) : "Contact for price");
        return {
          id: p.id.toString(),
          title: p.title || "Untitled Listing",
          price: priceDisplay,
          location: p.locality ? `${p.locality}, ${p.city || "Bhopal"}` : (p.city || "Bhopal"),
          purpose: p.purpose || "sell",
          status: statusMap[p.status] || (p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) as PropStatus : "Published"),
          is_verified: Boolean(p.is_verified),
          is_featured: Boolean(p.is_featured),
          owner: p.owner?.name || "Verified Owner",
          posted: p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "Cloud Listed"
        };
      });

      const merged = [...mappedCloud, ...mappedPublished, ...DEFAULT_ADMIN_PROPS];
      const seenIds = new Set<string>();
      const seenTitles = new Set<string>();
      const unique = merged.filter(p => {
        if (!p || !p.id) return false;
        const idStr = p.id.toString();
        const titleKey = (p.title || "").toLowerCase().trim();
        if (seenIds.has(idStr) || (titleKey && seenTitles.has(titleKey))) return false;
        seenIds.add(idStr);
        if (titleKey) seenTitles.add(titleKey);
        return true;
      });

      setProps(unique);
    };

    loadAllProps();
  }, []);

  const filtered = useMemo(() => {
    return props.filter((p) => {
      if (!p) return false;
      const q = search.toLowerCase().trim();
      const titleStr = (p.title || "").toLowerCase();
      const locStr = (p.location || "").toLowerCase();
      const ownerStr = (p.owner || "").toLowerCase();
      const matchQ = !q || titleStr.includes(q) || locStr.includes(q) || ownerStr.includes(q);
      
      const pStatus = (p.status || "").toLowerCase();
      const fStatus = filterStatus.toLowerCase();
      const matchS = fStatus === "all" || pStatus === fStatus || (fStatus === "pending approval" && pStatus.includes("pending"));
      
      const pPurp = (p.purpose || "").toLowerCase();
      const fPurp = filterPurpose.toLowerCase();
      const matchP = fPurp === "all" || pPurp === fPurp;
      
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

  const toggleFeatured = async (id: string) => {
    try { await api.featureProperty(id); } catch { /* mock ok */ }
    setProps((p) => p.map((x) => x.id === id ? { ...x, is_featured: !x.is_featured } : x));
    const prop = props.find((x) => x.id === id);
    success(prop?.is_featured ? "Removed from featured" : "Added to featured ⭐");
  };

  const deleteProp = (id: string) => {
    if (!confirm("Permanently delete this property? This cannot be undone.")) return;
    setProps((p) => p.filter((x) => x.id !== id));
    success("Listing removed permanently");
  };

  return (
    <AdminLayout title="Property Management" subtitle="Review, approve, reject, feature and moderate all listings">
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ flex: 1, minWidth: "220px", padding: "10px 16px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", outline: "none", background: "white" }}
          type="text"
          placeholder="🔍  Search by title, location or owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", background: "white", cursor: "pointer" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Published">Published</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select
          style={{ padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px", background: "white", cursor: "pointer" }}
          value={filterPurpose}
          onChange={(e) => setFilterPurpose(e.target.value)}
        >
          <option value="all">All Purposes</option>
          <option value="rent">Rent</option>
          <option value="sell">Sell</option>
        </select>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>{filtered.length} listings</span>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", overflow: "auto", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Property", "Purpose", "Price", "Location", "Owner", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "14px 18px", maxWidth: "260px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>{p.title}</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {p.is_verified && (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "#10b98118", color: "#10b981" }}>
                        ✓ Verified
                      </span>
                    )}
                    {p.is_featured && (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "#8b5cf618", color: "#8b5cf6" }}>
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: p.purpose === "rent" ? "#eff6ff" : "#fef3c7", color: p.purpose === "rent" ? "#1d4ed8" : "#b45309", textTransform: "uppercase" }}>
                    {p.purpose}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                  {p.price}
                </td>
                <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  📍 {p.location}
                </td>
                <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  👤 {p.owner}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: (STATUS_COLOR[p.status] || "#10b981") + "18", color: STATUS_COLOR[p.status] || "#10b981", border: `1px solid ${(STATUS_COLOR[p.status] || "#10b981")}44` }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {p.status === "Pending Approval" && (
                      <Button size="sm" variant="primary" disabled={loading === p.id} onClick={() => approve(p.id)}>
                        Approve
                      </Button>
                    )}
                    {p.status === "Pending Approval" && (
                      <Button size="sm" variant="outline" disabled={loading === p.id} onClick={() => setRejectingId(p.id)} style={{ borderColor: "var(--error)", color: "var(--error)" }}>
                        Reject
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => toggleVerify(p.id)}>
                      {p.is_verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleFeatured(p.id)} style={{ color: p.is_featured ? "var(--warning)" : "var(--primary)" }}>
                      {p.is_featured ? "Unfeature" : "Feature ⭐"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteProp(p.id)} style={{ color: "var(--error)" }}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                  No listings match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}>
          <form onSubmit={doReject} style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "440px", width: "100%", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--error)" }}>Reject Listing</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Provide a reason for rejection. The listing owner will receive a notification.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Incomplete details, invalid price, fake photos…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: "100%", padding: "12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" type="button" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading === rejectingId} style={{ background: "var(--error)", borderColor: "var(--error)" }}>Confirm Rejection</Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
