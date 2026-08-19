"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { getPublishedProperties, deactivatePropertyStore, reactivatePropertyStore, getDeactivatedPropertyIds } from "@/lib/propertyStore";
import { generatePropertySlug } from "@/lib/slug";
import { useToast } from "@/lib/useToast";

const DEFAULT_PROPERTIES = [
  {
    id: 1,
    title: "Sleek 2 BHK Modern Apartment",
    purpose: "rent",
    price: "₹22,000 / Mo",
    location: "Arera Colony, Bhopal",
    status: "Published",
    views: 182,
    leads: 5,
  },
  {
    id: 2,
    title: "Premium Semi-Furnished Villa",
    purpose: "sell",
    price: "₹1.2 Cr",
    location: "Vijay Nagar, Indore",
    status: "Published",
    views: 300,
    leads: 7,
  }
];

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<any[]>(DEFAULT_PROPERTIES);
  const { success, info } = useToast();

  const loadProperties = () => {
    const published = getPublishedProperties();
    const deactIds = new Set(getDeactivatedPropertyIds());

    const baseList = published.length > 0
      ? [...published, ...DEFAULT_PROPERTIES.filter(p => !published.some(pub => pub.id === p.id))]
      : DEFAULT_PROPERTIES;

    const mapped = baseList.map(p => ({
      ...p,
      status: deactIds.has(p.id.toString()) ? "Deactivated" : (p.status || "Published")
    }));

    setProperties(mapped);
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
          <p>Add new properties, edit active entries, or mark spaces as rented/sold.</p>
        </div>
        <a href="/dashboard/properties/new" className="btn-primary">
          + Post New Property
        </a>
      </div>

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
    </div>
  );
}
