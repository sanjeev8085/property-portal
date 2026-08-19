"use client";

import React, { useState } from "react";
import { generatePropertySlug } from "@/lib/slug";

export default function SearchPage() {
  const [bhk, setBhk] = useState<number[]>([]);
  const [purpose, setPurpose] = useState("all");
  const [type, setType] = useState("all");
  const [price, setPrice] = useState(100000);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  const properties = [
    {
      id: 1,
      title: "2 BHK Luxury Apartment in Arera Colony",
      price: "₹22,000 / Month",
      location: "Arera Colony, Bhopal",
      specs: "2 Beds | 2 Baths | 1200 sqft",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
      type: "Apartment",
      purpose: "rent",
      bhk: 2,
    },
    {
      id: 2,
      title: "4 BHK Luxury Villa Vijay Nagar",
      price: "₹1.2 Cr",
      location: "Vijay Nagar, Indore",
      specs: "4 Beds | 4 Baths | 3200 sqft",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
      type: "Villa",
      purpose: "sell",
      bhk: 4,
    },
    {
      id: 3,
      title: "Semi-Furnished 3 BHK flat",
      price: "₹28,000 / Month",
      location: "MP Nagar, Bhopal",
      specs: "3 Beds | 3 Baths | 1600 sqft",
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
      type: "Apartment",
      purpose: "rent",
      bhk: 3,
    }
  ];

  const handleBhkToggle = (val: number) => {
    if (bhk.includes(val)) {
      setBhk(bhk.filter(x => x !== val));
    } else {
      setBhk([...bhk, val]);
    }
  };

  const handleResetFilters = () => {
    setBhk([]);
    setPurpose("all");
    setType("all");
    setPrice(100000);
  };

  const filteredProperties = properties.filter(prop => {
    if (purpose !== "all" && prop.purpose !== purpose) return false;
    if (type !== "all" && prop.type !== type) return false;
    if (bhk.length > 0 && !bhk.includes(prop.bhk)) return false;
    return true;
  });

  const activeFilterCount = (purpose !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0) + (bhk.length > 0 ? 1 : 0);

  return (
    <div className="search-page-container fade-in">
      <div className="search-layout">
        {/* Mobile Filter Backdrop */}
        {mobileFilterOpen && (
          <div className="mobile-filter-backdrop" onClick={() => setMobileFilterOpen(false)} />
        )}

        {/* Filter Sidebar */}
        <aside className={`filter-sidebar premium-card ${mobileFilterOpen ? "mobile-filter-drawer-open" : ""}`}>
          <div className="filter-sidebar-header">
            <h3>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</h3>
            {activeFilterCount > 0 && (
              <button type="button" className="btn-reset-filters" onClick={handleResetFilters}>
                Reset
              </button>
            )}
            <button 
              type="button" 
              className="btn-close-filter-mobile" 
              onClick={() => setMobileFilterOpen(false)}
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>
          
          <div className="filter-group">
            <label>Purpose</label>
            <div className="radio-group">
              <button 
                type="button" 
                className={purpose === "all" ? "active" : ""} 
                onClick={() => setPurpose("all")}
              >
                All
              </button>
              <button 
                type="button" 
                className={purpose === "rent" ? "active" : ""} 
                onClick={() => setPurpose("rent")}
              >
                Rent
              </button>
              <button 
                type="button" 
                className={purpose === "sell" ? "active" : ""} 
                onClick={() => setPurpose("sell")}
              >
                Buy
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Property Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa / House</option>
              <option value="Commercial">Office / Shop</option>
            </select>
          </div>

          <div className="filter-group">
            <label>BHK Size</label>
            <div className="bhk-grid">
              {[1, 2, 3, 4].map(num => (
                <button 
                  key={num}
                  type="button"
                  className={bhk.includes(num) ? "bhk-btn active" : "bhk-btn"}
                  onClick={() => handleBhkToggle(num)}
                >
                  {num} BHK
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Max Price/Rent Range</label>
            <input 
              type="range" 
              min="10000" 
              max="200000" 
              step="5000" 
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <div className="range-labels">
              <span>₹10,000</span>
              <span className="price-val" suppressHydrationWarning>₹{price.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="mobile-apply-btn-container">
            <button 
              type="button" 
              className="btn-apply-filters-mobile" 
              onClick={() => setMobileFilterOpen(false)}
            >
              Show {filteredProperties.length} Properties
            </button>
          </div>
        </aside>

        {/* Results Stream */}
        <section className="search-results-section">
          <div className="results-header">
            <div className="results-title-group">
              <h2>{filteredProperties.length} Properties Found</h2>
            </div>

            <div className="results-controls">
              {/* Mobile Filter Toggle Button */}
              <button 
                type="button" 
                className="btn-mobile-filter-toggle"
                onClick={() => setMobileFilterOpen(true)}
              >
                ⚡ Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>

              <div className="sort-group">
                <label>Sort By:</label>
                <select aria-label="Sort properties">
                  <option>Newest Listings</option>
                  <option>Price: Low → High</option>
                  <option>Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="results-grid">
            {filteredProperties.length === 0 ? (
              <div className="no-results-box premium-card">
                <span style={{ fontSize: "40px" }}>🔍</span>
                <h3>No Properties Match Your Filters</h3>
                <p>Try resetting filters or adjusting your budget and location.</p>
                <button type="button" className="btn-primary-sm" onClick={handleResetFilters}>
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredProperties.map(prop => (
                <div key={prop.id} className="premium-card search-property-card">
                  <div className="prop-img">
                    <img src={prop.image} alt={prop.title} loading="lazy" />
                    <span className="badge-tag">Verified</span>
                  </div>
                  <div className="prop-content">
                    <div className="price-like">
                      <span className="prop-price">{prop.price}</span>
                      <button type="button" className="like-btn" aria-label="Save property">❤️</button>
                    </div>
                    <h3 className="prop-title">{prop.title}</h3>
                    <p className="prop-loc">📍 {prop.location}</p>
                    <p className="prop-specs">{prop.specs}</p>
                    <div className="prop-card-footer">
                      <span className="posted-time">Posted 2 hours ago</span>
                      <a href={`/properties/${generatePropertySlug(prop.title, prop.location, prop.id)}`} className="btn-primary-sm">Details</a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .search-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 30px;
          position: relative;
        }
        
        /* Filter Sidebar — sticky on desktop */
        .filter-sidebar {
          padding: 24px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 22px;
          position: sticky;
          top: 86px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .filter-sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .filter-sidebar-header h3 {
          font-size: 18px;
          font-weight: 700;
        }
        .btn-reset-filters {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-close-filter-mobile {
          display: none;
          background: var(--surface-hover);
          border: 1px solid var(--border);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
        }
        .mobile-apply-btn-container {
          display: none;
          margin-top: 10px;
        }
        .btn-apply-filters-mobile {
          width: 100%;
          padding: 12px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .filter-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .filter-group select, .filter-group input[type="range"] {
          width: 100%;
        }
        .filter-group select {
          padding: 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
        }
        .radio-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .radio-group button {
          padding: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--surface);
          border-right: 1px solid var(--border);
          border-top: none;
          border-bottom: none;
          border-left: none;
          cursor: pointer;
        }
        .radio-group button:last-child {
          border-right: none;
        }
        .radio-group button.active {
          background: var(--primary);
          color: white;
        }
        .bhk-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .bhk-btn {
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--surface);
          text-align: center;
          cursor: pointer;
        }
        .bhk-btn.active {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }
        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
        }
        .price-val {
          color: var(--primary);
          font-weight: 600;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .results-header h2 {
          font-size: 20px;
        }
        .results-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-mobile-filter-toggle {
          display: none;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid #bfdbfe;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .sort-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .sort-group select {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
        }
        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .search-property-card {
          display: grid;
          grid-template-columns: 240px 1fr;
          overflow: hidden;
          border-radius: var(--radius-lg);
        }
        .prop-img {
          position: relative;
          height: 100%;
          min-height: 180px;
        }
        .prop-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .prop-content {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
        }
        .price-like {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .prop-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
        }
        .prop-title {
          font-size: 17px;
          margin-bottom: 6px;
          font-weight: 700;
        }
        .prop-loc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .prop-specs {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .prop-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .posted-time {
          font-size: 12px;
          color: var(--text-muted);
        }
        .btn-primary-sm {
          padding: 8px 16px;
          background: var(--primary);
          color: white !important;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          text-decoration: none;
        }
        .btn-primary-sm:hover {
          background: var(--primary-hover);
        }
        .no-results-box {
          text-align: center;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        /* ─── Responsive Media Queries ─── */
        @media (max-width: 900px) {
          .search-layout {
            grid-template-columns: 1fr;
          }
          .btn-mobile-filter-toggle {
            display: flex;
          }
          .btn-close-filter-mobile, .mobile-apply-btn-container {
            display: block;
          }
          .mobile-filter-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 299;
          }
          .filter-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(85vw, 360px);
            z-index: 300;
            max-height: 100vh;
            border-radius: 0;
            box-shadow: 10px 0 30px rgba(0,0,0,0.3);
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .mobile-filter-drawer-open {
            transform: translateX(0);
          }
        }

        @media (max-width: 640px) {
          .search-page-container {
            padding: 20px 14px;
          }
          .results-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .results-controls {
            width: 100%;
            justify-content: space-between;
          }
          .search-property-card {
            grid-template-columns: 1fr;
          }
          .prop-img {
            height: 180px;
          }
          .prop-content {
            padding: 16px;
          }
          .prop-title {
            font-size: 15px;
          }
          .prop-price {
            font-size: 18px;
          }
        }
      `}} />
    </div>
  );
}
