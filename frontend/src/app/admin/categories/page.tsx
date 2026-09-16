"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/useToast";
import { api } from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  listings: number;
  active: boolean;
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "🏢" });
  const { success, error: showError, info } = useToast();

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminCategories();
      setCats(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleActive = async (id: string) => {
    try {
      const res = await api.toggleCategory(id);
      res.active ? success(`${res.name} activated`) : info(`${res.name} deactivated`);
      loadCategories();
    } catch (err: any) {
      showError(err?.message || "Failed to toggle category status.");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.updateCategory(editing.id, editing.name, editing.icon);
      success("Category updated");
      setEditing(null);
      loadCategories();
    } catch (err: any) {
      showError(err?.message || "Failed to update category.");
    }
  };

  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      await api.createCategory(newCat.name.trim(), newCat.icon.trim() || "🏠");
      success(`${newCat.name} category added`);
      setNewCat({ name: "", icon: "🏢" });
      setAdding(false);
      loadCategories();
    } catch (err: any) {
      showError(err?.message || "Failed to add category.");
    }
  };

  const deleteCat = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.deleteCategory(id);
      success(`${name} category deleted`);
      loadCategories();
    } catch (err: any) {
      showError(err?.message || "Failed to delete category.");
    }
  };

  return (
    <AdminLayout title="Property Categories" subtitle="Manage property types available in listings and search filters">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Add Category</Button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Loading categories…</div>
      ) : (
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
                <Button size="sm" variant="ghost" onClick={() => deleteCat(c.id, c.name)} style={{ color: "var(--error)" }}>
                  🗑️
                </Button>
              </div>
            </div>
          ))}
          {cats.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              No categories found. Click "+ Add Category" to create one.
            </div>
          )}
        </div>
      )}

      {(editing || adding) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}>
          <form onSubmit={editing ? saveEdit : addCat} style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "360px", width: "100%", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>{editing ? "Edit Category" : "Add Category"}</h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Category Name *</label>
              <input required value={editing ? editing.name : newCat.name}
                onChange={(e) => editing ? setEditing({ ...editing, name: e.target.value }) : setNewCat({ ...newCat, name: e.target.value })}
                placeholder="e.g. Studio Apartment"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Icon (emoji)</label>
              <input value={editing ? editing.icon : newCat.icon}
                onChange={(e) => editing ? setEditing({ ...editing, icon: e.target.value }) : setNewCat({ ...newCat, icon: e.target.value })}
                placeholder="e.g. 🏢"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
            </div>
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
