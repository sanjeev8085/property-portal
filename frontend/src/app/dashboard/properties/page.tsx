"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { getPublishedProperties, deactivatePropertyStore, reactivatePropertyStore, getDeactivatedPropertyIds } from "@/lib/propertyStore";
import { generatePropertySlug } from "@/lib/slug";
import { useToast } from "@/lib/useToast";

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, info } = useToast();

  const loadProperties = () => {
    setLoading(true);
    const published = getPublishedProperties();
    const deactIds = new Set(getDeactivatedPropertyIds());

    const userIdentifier = typeof window !== "undefined" 
      ? (localStorage.getItem("user_email") || localStorage.getItem("user_mobile") || "")
      : "";

    // Show ONLY properties listed by this specific user
    const myProps = published.filter(p => {
      if (!userIdentifier) return true; // If identifier not set, show session listings
      return p.ownerId === userIdentifier || p.ownerEmail === userIdentifier || !p.ownerId;
    });

    const mapped = myProps.map(p => ({
      ...p,
      status: deactIds.has(p.id.toString()) ? "Deactivated" : (p.status || "Published")
    }));

    setProperties(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadProperties();
    window.addEventListener("aurahomes_properties_updated", loadProperties);
    return () => window.removeEventListener("aurahomes_properties_updated", loadProperties);
  }, []);

  const handleDeactivate = (id: number | string) => {
    deactivatePropertyStore(id);
    setProperties(properties.map(p => p.id.toString() === id.toString() ? { ...p, status: "Deactivated" } : p));
    info("Property deactivated. It is now hidden from public search.");
  };

  const handleReactivate = (id: number | string) => {
    reactivatePropertyStore(id);
    setProperties(properties.map(p => p.id.toString() === id.toString() ? { ...p, status: "Published" } : p));
    success("Property reactivated! It is now live in public search.");
  };

  return (
    <div className="my-properties-container fade-in">
      <div className="header-row">
        <div>
          <h1>My Listed Properties</h1>
          <p>Manage only your own listed properties, edit specifications, or toggle availability.</p>
        </div>
        <a href="/dashboard/properties/new" className="btn-primary">
          + Post New Property
        </a>
      </div>

      {properties.length === 0 && !loading ? (
        <div className="empty-properties-card premium-card">
          <div className="empty-icon">🏠</div>
          <h2>No Properties Listed Yet</h2>
          <p>You haven&apos;t posted any properties from this account yet. Post your property in under 2 minutes to start receiving buyer inquiries.</p>
          <a href="/dashboard/properties/new" className="btn-primary" style={{ marginTop: "16px" }}>
            + Post Your First Property
          </a>
        </div>
      ) : (
        <div className="properties-list-container">
          {properties.map(prop => {
            const isDeactivated = prop.status === "Deactivated" || prop.status === "inactive";
            return (
              <div key={prop.id} className={`premium-card listing-item-card ${isDeactivated ? "listing-deactivated" : ""}`}>
                <div className="listing-details">
                  <span className={`status-badge badge-${isDeactivated ? "deactivated" : "published"}`}>
                    {isDeactivated ? "Deactivated (Hidden)" : "Published (Live)"}
                  </span>
                  <h3>{prop.title}</h3>
                  <p className="location">📍 {prop.location}</p>
                  <div className="specs-row">
                    <span>Type: {prop.purpose === "rent" ? "Rent" : "Sale"}</span>
                    <span>Price: {prop.price}</span>
                  </div>
                </div>

                <div className="listing-stats">
                  <div className="stat">
                    <span className="val">👁️ {prop.views || 1}</span>
                    <span className="lbl">Views</span>
                  </div>
                  <div className="stat">
                    <span className="val">🔑 {prop.leads || 0}</span>
                    <span className="lbl">Contacts Unlocked</span>
                  </div>
                </div>

                <div className="listing-actions">
                  <a href={`/properties/${generatePropertySlug(prop.title, prop.location, prop.id)}`} className="btn-secondary btn-sm">
                    View Listing
                  </a>
                  <a href={`/dashboard/properties/${prop.id}/edit`} className="btn-outline btn-sm">
                    Edit
                  </a>
                  {isDeactivated ? (
                    <button 
                      type="button" 
                      className="btn-primary btn-sm"
                      style={{ background: "var(--success)" }}
                      onClick={() => handleReactivate(prop.id)}
                    >
                      Activate / Relist
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn-outline btn-sm deact-btn"
                      onClick={() => handleDeactivate(prop.id)}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .empty-properties-card {
          padding: 60px 24px;
          text-align: center;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .empty-icon {
          font-size: 52px;
          margin-bottom: 16px;
        }
        .empty-properties-card h2 {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .empty-properties-card p {
          max-width: 480px;
          color: var(--text-secondary);
          font-size: 14.5px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
