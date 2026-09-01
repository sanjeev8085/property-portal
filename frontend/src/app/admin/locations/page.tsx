"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

const INITIAL_CITIES = [
  { id: "1", city: "Bhopal",     state: "Madhya Pradesh", listings: 0, active: true },
  { id: "2", city: "Indore",     state: "Madhya Pradesh", listings: 0,  active: true },
  { id: "3", city: "Jaipur",     state: "Rajasthan",      listings: 0,  active: true },
  { id: "4", city: "Pune",       state: "Maharashtra",    listings: 0,  active: true },
  { id: "5", city: "Bengaluru",  state: "Karnataka",      listings: 0,  active: true },
  { id: "6", city: "Hyderabad",  state: "Telangana",      listings: 0, active: true },
];

export default function AdminLocationsPage() {
  const [cities, setCities] = useState(INITIAL_CITIES);
  const [editing, setEditing] = useState<(typeof INITIAL_CITIES)[0] | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCity, setNewCity] = useState({ city: "", state: "" });
  const { success, info } = useToast();

  React.useEffect(() => {
    api.getAdminProperties().then((props: any[]) => {
      if (Array.isArray(props) && props.length > 0) {
        const counts: Record<string, number> = {};
        props.forEach(p => {
          const cityStr = (p.city || p.locality || "").toLowerCase();
          if (cityStr) counts[cityStr] = (counts[cityStr] || 0) + 1;
        });
        setCities(prev => prev.map(c => {
          const key = c.city.toLowerCase();
          const matchCount = Object.keys(counts).reduce((acc, k) => {
            if (k.includes(key)) return acc + counts[k];
            return acc;
          }, 0);
          return { ...c, listings: matchCount };
        }));
      }
    }).catch(() => {});
  }, []);

  const toggleActive = (id: string) => {
    setCities((p) => p.map((c) => c.id === id ? { ...c, active: !c.active } : c));
    const city = cities.find((c) => c.id === id);
    city?.active ? info(`${city.city} hidden from search`) : success(`${city?.city} enabled`);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setCities((p) => p.map((c) => c.id === editing.id ? editing : c));
    success("Location updated");
    setEditing(null);
  };

  const addCity = (e: React.FormEvent) => {
    e.preventDefault();
    setCities((p) => [...p, { ...newCity, id: Date.now().toString(), listings: 0, active: true }]);
    success(`${newCity.city} added`);
    setNewCity({ city: "", state: "" });
    setAdding(false);
  };

  return (
    <AdminLayout title="Locations" subtitle="Manage cities and areas available in property search">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Add City</Button>
      </div>

      <div style={{ background: "white", borderRadius: "12px", overflow: "auto", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            {["City", "State", "Listings", "Status", "Actions"].map((h) => (
              <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", opacity: c.active ? 1 : 0.55 }}>
                <td style={{ padding: "14px 18px", fontWeight: 700, fontSize: "14px" }}>📍 {c.city}</td>
                <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--text-secondary)" }}>{c.state}</td>
                <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 600 }}>{c.listings}</td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: c.active ? "#10b98118" : "#94a3b818", color: c.active ? "#10b981" : "#94a3b8", border: `1px solid ${c.active ? "#10b98144" : "#94a3b844"}` }}>
                    {c.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(c.id)} style={{ color: c.active ? "var(--error)" : "var(--success)" }}>
                      {c.active ? "Hide" : "Show"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Add modal */}
      {(editing || adding) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}>
          <form onSubmit={editing ? saveEdit : addCity} style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "380px", width: "100%", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "Edit City" : "Add New City"}</h3>
            {[{ label: "City Name", key: "city" }, { label: "State", key: "state" }].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>{label}</label>
                <input required value={editing ? (editing as unknown as Record<string,string>)[key] : (newCity as unknown as Record<string,string>)[key]}
                  onChange={(e) => editing ? setEditing({ ...editing, [key]: e.target.value }) : setNewCity({ ...newCity, [key]: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button variant="outline" type="button" onClick={() => { setEditing(null); setAdding(false); }}>Cancel</Button>
              <Button variant="primary" type="submit">{editing ? "Save" : "Add City"}</Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
