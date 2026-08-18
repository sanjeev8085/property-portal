"use client";

import React, { useState } from "react";
import { generatePropertySlug } from "@/lib/slug";

export default function SearchPage() {
  const [bhk, setBhk] = useState<number[]>([]);
  const [purpose, setPurpose] = useState("all");
  const [type, setType] = useState("all");
  const [price, setPrice] = useState(100000);
  
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

  const filteredProperties = properties.filter(prop => {
    if (purpose !== "all" && prop.purpose !== purpose) return false;
    if (type !== "all" && prop.type !== type) return false;
    if (bhk.length > 0 && !bhk.includes(prop.bhk)) return false;
    return true;
  });

  return (
    <div className="search-page-container fade-in">
      <div className="search-layout">
        {/* Filter Sidebar */}
        <aside className="filter-sidebar premium-card">
          <h3>Filters</h3>
          
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
        </aside>

        {/* Results Stream */}
        <section className="search-results-section">
          <div className="results-header">
            <h2>{filteredProperties.length} Properties Found</h2>
            <div className="sort-group">
              <label>Sort By:</label>
              <select>
                <option>Newest Listings</option>
                <option>Price: Low → High</option>
                <option>Price: High → Low</option>
              </select>
            </div>
          </div>

          <div className="results-grid">
            {filteredProperties.map(prop => (
              <div key={prop.id} className="premium-card search-property-card">
                <div className="prop-img">
                  <img src={prop.image} alt={prop.title} />
                  <span className="badge-tag">Verified</span>
                </div>
                <div className="prop-content">
                  <div className="price-like">
                    <span className="prop-price">{prop.price}</span>
                    <button type="button" className="like-btn">❤️</button>
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
            ))}
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .search-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 30px;
        }
        
        /* Filter Sidebar — sticky on desktop */
        .filter-sidebar {
          padding: 24px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 86px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
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
          text-align: center;
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
        
        /* Results Section */
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .sort-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .sort-group select {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
        }
        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        /* Search Property Card (Horizontal layout) */
        .search-property-card {
          display: grid;
          grid-template-columns: 240px 1fr;
          overflow: hidden;
        }
        .prop-img {
          position: relative;
          height: 100%;
          min-height: 180px;
          background: #f0f0f0;
          overflow: hidden;
        }
        .prop-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease;
        }
        .prop-img-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .prop-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .price-like {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .prop-price {
          font-size: 22px;
          font-weight: 800;
          color: var(--primary);
        }
        .prop-title {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .prop-loc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        .prop-specs {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: auto;
        }
        .prop-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-top: 12px;
        }
        .posted-time {
          font-size: 12px;
          color: var(--text-muted);
        }
        .btn-primary-sm {
          background: var(--primary);
          color: white;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }
        .btn-primary-sm:hover {
          background: var(--primary-hover);
        }
        
        @media (max-width: 900px) {
          .search-layout {
            grid-template-columns: 1fr;
          }
          .search-property-card {
            grid-template-columns: 1fr;
          }
          .prop-img {
            height: 200px;
          }
        }
      `}} />
    </div>
  );
}
