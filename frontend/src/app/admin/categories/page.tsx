"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

const INITIAL_CATS = [
  { id: "1", name: "Apartment",   icon: "🏢", listings: 0, active: true  },
  { id: "2", name: "Villa/House", icon: "🏡", listings: 0,  active: true  },
  { id: "3", name: "Commercial",  icon: "🏪", listings: 0,  active: true  },
  { id: "4", name: "Plot/Land",   icon: "🌳", listings: 0,  active: true  },
  { id: "5", name: "PG/Hostel",   icon: "🛏️", listings: 0, active: true },
  { id: "6", name: "Farm House",  icon: "🌾", listings: 0,   active: true },
];

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState(INITIAL_CATS);
  const [editing, setEditing] = useState<typeof INITIAL_CATS[0] | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "" });
  const { success, info } = useToast();

  React.useEffect(() => {
    api.getAdminProperties().then((props: any[]) => {
      if (Array.isArray(props) && props.length > 0) {
        const counts: Record<string, number> = {};
        props.forEach(p => {
          const type = (p.property_type || "").toLowerCase();
          counts[type] = (counts[type] || 0) + 1;
        });
        setCats(prev => prev.map(c => {
          const key = c.name.toLowerCase();
          const matchCount = Object.keys(counts).reduce((acc, k) => {
            if (k.includes(key.split("/")[0])) return acc + counts[k];
            return acc;
          }, 0);
          return { ...c, listings: matchCount };
        }));
      }
    }).catch(() => {});
  }, []);

  const toggleActive = (id: string) => {
    setCats((p) => p.map((c) => c.id === id ? { ...c, active: !c.active } : c));
    const cat = cats.find((c) => c.id === id);
    cat?.active ? info(`${cat.name} deactivated`) : success(`${cat?.name} activated`);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setCats((p) => p.map((c) => c.id === editing.id ? editing : c));
    success("Category updated");
    setEditing(null);
  };

  const addCat = (e: React.FormEvent) => {
    e.preventDefault();
    setCats((p) => [...p, { ...newCat, id: Date.now().toString(), listings: 0, active: true }]);
    success(`${newCat.name} category added`);
    setNewCat({ name: "", icon: "" });
    setAdding(false);
  };

  return (
    <AdminLayout title="Property Categories" subtitle="Manage property types available in listings and search filters">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Add Category</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
        {cats.map((c) => (
          <div key={c.id} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", opacity: c.active ? 1 : 0.55, transition: "opacity 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <span style={{ fontSize: "32px" }}>{c.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: c.active ? "#10b98118" : "#94a3b818", color: c.active ? "#10b981" : "#94a3b8", border: `1px solid ${c.active ? "#10b98144" : "#94a3b844"}` }}>
                {c.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>{c.name}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>{c.listings} listings</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button size="sm" variant="outline" fullWidth onClick={() => setEditing({ ...c })}>Edit</Button>
              <Button size="sm" variant="ghost" fullWidth onClick={() => toggleActive(c.id)} style={{ color: c.active ? "var(--error)" : "var(--success)" }}>
                {c.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {(editing || adding) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}>
          <form onSubmit={editing ? saveEdit : addCat} style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "360px", width: "100%", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "Edit Category" : "Add Category"}</h3>
            {[{ label: "Category Name", key: "name" }, { label: "Icon (emoji)", key: "icon" }].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>{label}</label>
                <input required value={editing ? (editing as unknown as Record<string,string>)[key] : (newCat as unknown as Record<string,string>)[key]}
                  onChange={(e) => editing ? setEditing({ ...editing, [key]: e.target.value }) : setNewCat({ ...newCat, [key]: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button variant="outline" type="button" onClick={() => { setEditing(null); setAdding(false); }}>Cancel</Button>
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
