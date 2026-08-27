"use client";

import React, { useState, useEffect } from "react";
import { generatePropertySlug } from "@/lib/slug";
import { getPublishedProperties, getDeactivatedPropertyIds, StoredProperty } from "@/lib/propertyStore";
import { api } from "@/lib/api";

const DEFAULT_FEATURED: any[] = [];

export default function Home() {
  const [purpose, setPurpose] = useState<"buy" | "rent" | "commercial">("buy");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [budget, setBudget] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);

  useEffect(() => {
    const loadProps = async () => {
      const published = getPublishedProperties();
      const deactSet = new Set(getDeactivatedPropertyIds());
      
      let cloudProps: any[] = [];
      try {
        const res = await api.getProperties();
        if (Array.isArray(res)) {
          cloudProps = res;
        }
      } catch {
        // Fallback to local
      }

      const merged = [...published, ...cloudProps];
      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const unique = merged.filter(p => {
        if (!p || !p.id) return false;
        const idStr = p.id.toString();
        const priceVal = Number(p.priceNum || p.price) || 0;
        const contentKey = `${(p.title || "").toLowerCase().trim()}_${priceVal}`;

        if (
          seenIds.has(idStr) ||
          seenKeys.has(contentKey) ||
          deactSet.has(idStr) ||
          p.status === "Deactivated" ||
          p.status === "inactive"
        ) {
          return false;
        }
        seenIds.add(idStr);
        seenKeys.add(contentKey);
        return true;
      });

      const formatted = unique.map(p => {
        let priceStr = p.price;
        if (typeof p.price === "number" || (typeof p.price === "string" && !p.price.includes("₹"))) {
          const num = Number(p.price) || 0;
          if (p.purpose === "rent") {
            priceStr = `₹${num.toLocaleString("en-IN")} / Mo`;
          } else if (num >= 10000000) {
            priceStr = `₹${(num / 10000000).toFixed(2)} Cr`;
          } else if (num >= 100000) {
            priceStr = `₹${(num / 100000).toFixed(2)} Lakh`;
          } else {
            priceStr = `₹${num.toLocaleString("en-IN")}`;
          }
        }
        return {
          id: p.id,
          title: p.title,
          price: priceStr,
          location: p.location || p.locality || p.city || "Bhopal",
          specs: p.specs || (
            (p.type === "Plot / Land" || (p.title || "").toLowerCase().includes("plot"))
              ? `${p.area_sqft || p.size || "1500"} sqft Plot Area`
              : (p.type === "Shop" || (p.title || "").toLowerCase().includes("shop"))
                ? `${p.area_sqft || p.size || "650"} sqft Retail Shop`
                : (p.type === "Office Space" || (p.title || "").toLowerCase().includes("office"))
                  ? `${p.area_sqft || p.size || "1500"} sqft Office`
                  : `${p.bhk || 2} BHK | ${p.area_sqft || p.size || "1200"} sqft`
          ),
          image: p.image || (p.photos && p.photos[0]) || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
          tag: "⭐ Verified",
          isFeatured: true,
        };
      });

      setFeaturedProperties(formatted);
    };

    loadProps();
    window.addEventListener("aurahomes_properties_updated", loadProps);
    return () => window.removeEventListener("aurahomes_properties_updated", loadProps);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParts = [];
    if (purpose) queryParts.push(`purpose=${purpose === "buy" ? "sell" : purpose}`);
    if (location.trim()) queryParts.push(`location=${encodeURIComponent(location.trim())}`);
    if (propertyType && propertyType !== "all") queryParts.push(`type=${encodeURIComponent(propertyType)}`);
    if (budget.trim()) queryParts.push(`budget=${encodeURIComponent(budget.trim())}`);
    window.location.href = `/search${queryParts.length > 0 ? "?" + queryParts.join("&") : ""}`;
  };

  return (
    <div className="home-container fade-in">
      {/* ─── Hero Section with Modern Search Tabs ─── */}
      <section className="hero-section">
        <div className="hero-bg-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Discover Your Perfect space</h1>
          <p className="hero-subtitle">Search verified properties for rent and sale in your local area with zero hassle.</p>

          <div className="search-widget-container premium-card">
            {/* Purpose Tabs */}
            <div className="search-tabs">
              <button 
                type="button"
                className={purpose === "buy" ? "tab-active" : ""}
                onClick={() => setPurpose("buy")}
              >
                Buy
              </button>
              <button 
                type="button"
                className={purpose === "rent" ? "tab-active" : ""}
                onClick={() => setPurpose("rent")}
              >
                Rent
              </button>
              <button 
                type="button"
                className={purpose === "commercial" ? "tab-active" : ""}
                onClick={() => setPurpose("commercial")}
              >
                Commercial
              </button>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <label>Location / Area</label>
                <input 
                  type="text" 
                  placeholder="e.g. Arera Colony, Bhopal" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Property Type</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa / House</option>
                  <option value="Commercial">Office / Shop</option>
                  <option value="Plot">Plots / Land</option>
                  <option value="PG">PG / Hostel</option>
                </select>
              </div>

              <div className="form-group">
                <label>Budget Limit</label>
                <input 
                  type="text" 
                  placeholder="e.g. ₹25,000 or ₹80 Lakh" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary hero-search-btn">
                <span>🔍</span> Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Featured Listings ─── */}
      <section className="listings-section max-width-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Listings</h2>
            <p className="section-subtitle">Exclusively verified listings with comprehensive metadata.</p>
          </div>
          <a href="/search" className="link-view-all">View All Properties →</a>
        </div>

        {featuredProperties.length > 0 ? (
          <div className="properties-grid">
            {featuredProperties.map((prop) => (
              <div key={prop.id} className="premium-card property-card">
                <div className="card-image-container">
                  <img src={prop.image} alt={prop.title} />
                  <span className="badge-tag">{prop.tag}</span>
                  <button type="button" className="like-btn">❤️</button>
                </div>
                <div className="card-info">
                  <span className="card-price">{prop.price}</span>
                  <h3 className="card-title">{prop.title}</h3>
                  <span className="card-location">📍 {prop.location}</span>
                  <div className="card-divider"></div>
                  <div className="card-footer">
                    <span className="card-specs">{prop.specs}</span>
                    <a href={`/properties/${generatePropertySlug(prop.title, prop.location, prop.id)}`} className="btn-view-details">Details</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card" style={{ padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "0 auto", borderRadius: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏡</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>No properties listed yet</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "14px" }}>
              Be the first to list your property and connect with buyers & tenants across India!
            </p>
            <a href="/dashboard/properties/new" className="btn-primary" style={{ display: "inline-flex", padding: "12px 28px", textDecoration: "none", borderRadius: "8px", fontWeight: "700" }}>
              ➕ Post Free Property
            </a>
          </div>
        )}
      </section>

      {/* ─── How it Works ─── */}
      <section className="how-it-works-section">
        <div className="max-width-container">
          <h2 className="section-title text-center">How AuraHomes Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Search & Filter</h3>
              <p>Explore hundreds of listings using filters like budget, locality, furnished status, and BHK size.</p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Purchase Contact Credits</h3>
              <p>Acquire credits or purchase active subscriptions to directly contact listing owners and agents.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Unlock & Connect</h3>
              <p>Instantly unlock details like phone number, WhatsApp chat, and coordinate site visits securely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Styling specific to Homepage */}
      <style dangerouslySetInnerHTML={{ __html: `
        .max-width-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
        }
        .text-center {
          text-align: center;
          margin-bottom: 40px;
        }
        
        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          background-image: url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80');
          background-size: cover;
          background-position: center;
        }
        .hero-bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          width: 100%;
          text-align: center;
        }
        .hero-title {
          font-size: clamp(32px, 5vw, 56px);
          color: white;
          margin-bottom: 16px;
        }
        .hero-subtitle {
          font-size: clamp(16px, 2vw, 18px);
          color: var(--text-muted);
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* Search Widget */
        .search-widget-container {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 24px;
          text-align: left;
          box-shadow: var(--shadow-xl);
        }
        .search-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }
        .search-tabs button {
          padding: 8px 20px;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          transition: var(--transition-fast);
        }
        .search-tabs button:hover {
          color: var(--primary);
          background: var(--surface-hover);
        }
        .search-tabs button.tab-active {
          background: var(--primary);
          color: white !important;
        }
        .search-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) auto;
          gap: 16px;
          align-items: flex-end;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .form-group input, .form-group select {
          width: 100%;
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 14px;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary);
          outline: none;
        }
        .hero-search-btn {
          height: 46px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          white-space: nowrap;
        }
        
        /* Featured Listings Section */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .section-subtitle {
          color: var(--text-secondary);
        }
        .link-view-all {
          font-weight: 600;
          color: var(--primary);
        }
        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 30px;
        }
        
        /* Property Card */
        .property-card {
          border-radius: var(--radius-lg);
          transition: var(--transition-normal);
        }
        .card-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .card-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition-normal);
        }
        .property-card:hover .card-image-container img {
          transform: scale(1.05);
        }
        .badge-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }
        .like-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: var(--shadow-sm);
        }
        .card-info {
          padding: 20px;
        }
        .card-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
          display: block;
          margin-bottom: 6px;
        }
        .card-title {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .card-location {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .card-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-specs {
          font-size: 12px;
          color: var(--text-muted);
        }
        .btn-view-details {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
          padding: 6px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
        }
        .btn-view-details:hover {
          background: var(--primary);
          color: white;
        }
        
        /* How It Works Section */
        .how-it-works-section {
          background: var(--surface-hover);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 40px;
        }
        .step-card {
          text-align: center;
          padding: 24px;
        }
        .step-number {
          font-size: 48px;
          font-family: var(--font-heading);
          font-weight: 800;
          color: var(--primary-light);
          display: block;
          margin-bottom: 16px;
        }
        .step-card h3 {
          font-size: 20px;
          margin-bottom: 12px;
        }
        .step-card p {
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .search-form {
            grid-template-columns: 1fr;
          }
          .hero-search-btn {
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
