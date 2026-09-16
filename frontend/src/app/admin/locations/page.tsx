"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

interface CityItem {
  id: string;
  city: string;
  state: string;
  listings: number;
  active: boolean;
}

export default function AdminLocationsPage() {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CityItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCity, setNewCity] = useState({ city: "", state: "" });
  const { success, error: showError, info } = useToast();

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminLocations();
      setCities(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load locations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const toggleActive = async (id: string) => {
    try {
      const res = await api.toggleLocation(id);
      res.active ? success(`${res.city} enabled`) : info(`${res.city} hidden from search`);
      loadLocations();
    } catch (err: any) {
      showError(err?.message || "Failed to update location status.");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.updateLocation(editing.id, editing.city, editing.state);
      success("Location updated successfully");
      setEditing(null);
      loadLocations();
    } catch (err: any) {
      showError(err?.message || "Failed to update location.");
    }
  };

  const addCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.city.trim()) return;
    try {
      await api.createLocation(newCity.city.trim(), newCity.state.trim() || "Madhya Pradesh");
      success(`${newCity.city} added successfully`);
      setNewCity({ city: "", state: "" });
      setAdding(false);
      loadLocations();
    } catch (err: any) {
      showError(err?.message || "Failed to add location.");
    }
  };

  const deleteLoc = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteLocation(id);
      success(`${name} deleted`);
      loadLocations();
    } catch (err: any) {
      showError(err?.message || "Failed to delete location.");
    }
  };

  return (
    <AdminLayout title="Locations" subtitle="Manage cities and areas available in property search">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Add City</Button>
      </div>

      <div style={{ background: "white", borderRadius: "12px", overflow: "auto", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading locations…</div>
        ) : (
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
                      <Button size="sm" variant="ghost" onClick={() => deleteLoc(c.id, c.city)} style={{ color: "var(--error)" }}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {cities.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                    No locations found. Click "+ Add City" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit / Add modal */}
      {(editing || adding) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}>
          <form onSubmit={editing ? saveEdit : addCity} style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "380px", width: "100%", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "Edit City" : "Add New City"}</h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>City Name *</label>
              <input required value={editing ? editing.city : newCity.city}
                onChange={(e) => editing ? setEditing({ ...editing, city: e.target.value }) : setNewCity({ ...newCity, city: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>State</label>
              <input value={editing ? editing.state : newCity.state}
                onChange={(e) => editing ? setEditing({ ...editing, state: e.target.value }) : setNewCity({ ...newCity, state: e.target.value })}
                placeholder="e.g. Madhya Pradesh"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
            </div>
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
