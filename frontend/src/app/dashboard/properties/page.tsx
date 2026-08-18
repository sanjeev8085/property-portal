"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState([
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
      status: "Pending Approval",
      views: 300,
      leads: 7,
    }
  ]);

  const handleDeactivate = (id: number) => {
    setProperties(properties.map(p => p.id === id ? { ...p, status: "Deactivated" } : p));
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
        {properties.map(prop => (
          <div key={prop.id} className="premium-card listing-item-card">
            <div className="listing-details">
              <span className={`status-badge badge-${prop.status.toLowerCase().replace(" ", "-")}`}>
                {prop.status}
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
                <span className="val">👁️ {prop.views}</span>
                <span className="lbl">Views</span>
              </div>
              <div className="stat">
                <span className="val">🔑 {prop.leads}</span>
                <span className="lbl">Contacts Unlocked</span>
              </div>
            </div>

            <div className="listing-actions">
              <a href={`/properties/${prop.id}`} className="btn-secondary btn-sm">View Listing</a>
              {prop.status === "Published" && (
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
        ))}
      </div>


    </div>
  );
}
