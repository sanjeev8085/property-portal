"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { generatePropertySlug } from "@/lib/slug";
import { useToast } from "@/lib/useToast";
import { getPublishedProperties } from "@/lib/propertyStore";

interface Property {
  id: number | string;
  title: string;
  price: string;
  priceNum: number;
  location: string;
  specs: string;
  image: string;
  type: string;
  purpose: "rent" | "sell";
  bhk: number;
  featured?: boolean;
}

const ALL_PROPERTIES: Property[] = [
  {
    id: 1,
    title: "1 BHK Studio Apartment in MP Nagar",
    price: "₹12,000 / Month",
    priceNum: 12000,
    location: "MP Nagar, Bhopal",
    specs: "1 Bed | 1 Bath | 650 sqft",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
    type: "Apartment",
    purpose: "rent",
    bhk: 1,
  },
  {
    id: 2,
    title: "2 BHK Luxury Apartment in Arera Colony",
    price: "₹22,000 / Month",
    priceNum: 22000,
    location: "Arera Colony, Bhopal",
    specs: "2 Beds | 2 Baths | 1200 sqft",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
    type: "Apartment",
    purpose: "rent",
    bhk: 2,
  },
  {
    id: 3,
    title: "Semi-Furnished 3 BHK Flat",
    price: "₹35,000 / Month",
    priceNum: 35000,
    location: "MP Nagar, Bhopal",
    specs: "3 Beds | 3 Baths | 1600 sqft",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
    type: "Apartment",
    purpose: "rent",
    bhk: 3,
  },
  {
    id: 4,
    title: "4 BHK Luxury Penthouse Kolar Road",
    price: "₹65,000 / Month",
    priceNum: 65000,
    location: "Kolar Road, Bhopal",
    specs: "4 Beds | 4 Baths | 2800 sqft",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    type: "Apartment",
    purpose: "rent",
    bhk: 4,
  },
  {
    id: 5,
    title: "Commercial Office Space in MP Nagar",
    price: "₹45,000 / Month",
    priceNum: 45000,
    location: "MP Nagar, Bhopal",
    specs: "1500 sqft | Furnished | Main Road",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    type: "Commercial",
    purpose: "rent",
    bhk: 1,
  },
  {
    id: 6,
    title: "2 BHK Affordable Home in Kolar",
    price: "₹45 Lakh",
    priceNum: 4500000,
    location: "Kolar Road, Bhopal",
    specs: "2 Beds | 2 Baths | 1100 sqft",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80",
    type: "Apartment",
    purpose: "sell",
    bhk: 2,
  },
  {
    id: 7,
    title: "3 BHK Independent Builder Floor",
    price: "₹85 Lakh",
    priceNum: 8500000,
    location: "Arera Colony, Bhopal",
    specs: "3 Beds | 3 Baths | 1850 sqft",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
    type: "Apartment",
    purpose: "sell",
    bhk: 3,
  },
  {
    id: 8,
    title: "4 BHK Luxury Villa Vijay Nagar",
    price: "₹1.45 Cr",
    priceNum: 14500000,
    location: "Vijay Nagar, Indore",
    specs: "4 Beds | 4 Baths | 3200 sqft",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
    type: "Villa",
    purpose: "sell",
    bhk: 4,
  },
  {
    id: 9,
    title: "Prime Commercial Retail Shop",
    price: "₹2.2 Cr",
    priceNum: 22000000,
    location: "Vijay Nagar, Indore",
    specs: "1200 sqft | Ground Floor | High Footfall",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    type: "Commercial",
    purpose: "sell",
    bhk: 1,
  }
];

function SearchContent() {
  const searchParams = useSearchParams();
  const rawPurpose = searchParams?.get("purpose") || "all";
  const initialPurpose = rawPurpose === "buy" ? "sell" : rawPurpose;
  const initialLocation = searchParams?.get("location") || "";
  const initialType = searchParams?.get("type") || searchParams?.get("category") || "all";

  const [purpose, setPurpose] = useState<string>(initialPurpose);
  const [searchLocation, setSearchLocation] = useState<string>(initialLocation);
  const [type, setType] = useState<string>(initialType);
  const [bhk, setBhk] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<(number | string)[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>(ALL_PROPERTIES);
  const { success } = useToast();

  // Load published properties from persistent store and merge dynamically
  useEffect(() => {
    const loadProps = () => {
      const published = getPublishedProperties();
      if (published.length > 0) {
        const publishedIds = new Set(published.map(p => p.id));
        const filteredDefaults = ALL_PROPERTIES.filter(p => !publishedIds.has(p.id));
        setAllProperties([...(published as Property[]), ...filteredDefaults]);
      } else {
        setAllProperties(ALL_PROPERTIES);
      }
    };

    loadProps();
    window.addEventListener("aurahomes_properties_updated", loadProps);
    return () => window.removeEventListener("aurahomes_properties_updated", loadProps);
  }, []);

  // Price range settings based on purpose
  const isRentMode = purpose === "rent";
  const minSliderPrice = isRentMode ? 5000 : (purpose === "sell" ? 1000000 : 5000);
  const maxSliderLimit = isRentMode ? 100000 : (purpose === "sell" ? 25000000 : 25000000);
  const sliderStep = isRentMode ? 2500 : 500000;

  const [maxPrice, setMaxPrice] = useState<number>(maxSliderLimit);

  // Sync slider limit when purpose changes
  useEffect(() => {
    if (purpose === "rent") {
      setMaxPrice(100000);
    } else if (purpose === "sell") {
      setMaxPrice(25000000);
    } else {
      setMaxPrice(25000000);
    }
  }, [purpose]);

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
    setSearchLocation("");
    setMaxPrice(25000000);
    setSortBy("newest");
  };

  const handleToggleLike = (id: number | string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(x => x !== id));
      success("Removed from saved properties.");
    } else {
      setSavedIds([...savedIds, id]);
      success("Saved to your wishlist! ❤️");
    }
  };

  // Format currency display
  const formatPriceDisplay = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(0)} Lakh`;
    }
    return `₹${amount.toLocaleString("en-IN")}${purpose === "rent" ? " / Mo" : ""}`;
  };

  // Filter properties
  const filtered = allProperties.filter(prop => {
    const propPurpose = (prop.purpose as string) === "buy" ? "sell" : prop.purpose;
    const currentPurpose = purpose === "buy" ? "sell" : purpose;
    if (currentPurpose !== "all" && propPurpose !== currentPurpose) return false;
    if (type !== "all" && prop.type.toLowerCase() !== type.toLowerCase()) return false;
    if (bhk.length > 0 && !bhk.includes(prop.bhk)) return false;
    if (prop.priceNum > maxPrice) return false;
    if (
      searchLocation.trim() &&
      !prop.location.toLowerCase().includes(searchLocation.toLowerCase().trim()) &&
      !prop.title.toLowerCase().includes(searchLocation.toLowerCase().trim())
    ) {
      return false;
    }
    return true;
  });

  // Sort properties
  const sortedProperties = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.priceNum - b.priceNum;
    if (sortBy === "price_desc") return b.priceNum - a.priceNum;
    return Number(b.id) - Number(a.id);
  });

  const activeFilterCount =
    (purpose !== "all" ? 1 : 0) +
    (type !== "all" ? 1 : 0) +
    (bhk.length > 0 ? 1 : 0) +
    (searchLocation.trim() ? 1 : 0) +
    (maxPrice < maxSliderLimit ? 1 : 0);

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
                Reset All
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

          {/* Location Search Input */}
          <div className="filter-group">
            <label>Location / Locality</label>
            <input
              type="text"
              placeholder="e.g. Arera Colony, Indore..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="filter-text-input"
            />
          </div>
          
          {/* Purpose Filter */}
          <div className="filter-group">
            <label>Looking To</label>
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

          {/* Property Type Filter */}
          <div className="filter-group">
            <label>Property Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All Property Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa / House</option>
              <option value="Commercial">Commercial / Office</option>
            </select>
          </div>

          {/* BHK Size Filter */}
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

          {/* Max Price / Rent Range Filter */}
          <div className="filter-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label>
                {purpose === "rent" ? "Max Monthly Rent" : (purpose === "sell" ? "Max Purchase Budget" : "Max Budget")}
              </label>
              <span className="price-val" suppressHydrationWarning>
                {formatPriceDisplay(maxPrice)}
              </span>
            </div>

            <input 
              type="range" 
              min={minSliderPrice} 
              max={maxSliderLimit} 
              step={sliderStep} 
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="price-range-slider"
              aria-label="Max price range slider"
            />
            <div className="range-labels">
              <span>{formatPriceDisplay(minSliderPrice)}</span>
              <span>{formatPriceDisplay(maxSliderLimit)}</span>
            </div>
          </div>

          <div className="mobile-apply-btn-container">
            <button 
              type="button" 
              className="btn-apply-filters-mobile" 
              onClick={() => setMobileFilterOpen(false)}
            >
              Show {sortedProperties.length} Properties
            </button>
          </div>
        </aside>

        {/* Results Stream */}
        <section className="search-results-section">
          <div className="results-header">
            <div className="results-title-group">
              <h2>{sortedProperties.length} Properties Found</h2>
              {searchLocation && (
                <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "6px" }}>
                  in &ldquo;{searchLocation}&rdquo;
                </span>
              )}
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
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort properties"
                >
                  <option value="newest">Newest Listings</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="results-grid">
            {sortedProperties.length === 0 ? (
              <div className="no-results-box premium-card">
                <span style={{ fontSize: "44px" }}>🔍</span>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>No Properties Match Your Filter Criteria</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "400px" }}>
                  Try increasing your maximum budget range slider or clearing specific BHK and locality filters.
                </p>
                <button type="button" className="btn-primary-sm" onClick={handleResetFilters} style={{ marginTop: "10px" }}>
                  Reset All Filters
                </button>
              </div>
            ) : (
              sortedProperties.map(prop => (
                <div key={prop.id} className="premium-card search-property-card">
                  <div className="prop-img">
                    <img src={prop.image} alt={prop.title} loading="lazy" />
                    <span className="badge-tag">{prop.purpose === "rent" ? "For Rent" : "For Sale"}</span>
                  </div>
                  <div className="prop-content">
                    <div className="price-like">
                      <span className="prop-price">{prop.price}</span>
                      <button 
                        type="button" 
                        className="like-btn" 
                        onClick={() => handleToggleLike(prop.id)}
                        aria-label="Save property"
                        style={{ color: savedIds.includes(prop.id) ? "#ef4444" : "var(--text-muted)" }}
                      >
                        {savedIds.includes(prop.id) ? "❤️" : "🤍"}
                      </button>
                    </div>
                    <h3 className="prop-title">{prop.title}</h3>
                    <p className="prop-loc">📍 {prop.location}</p>
                    <p className="prop-specs">{prop.specs}</p>
                    <div className="prop-card-footer">
                      <span className="posted-time">Verified Listing</span>
                      <a href={`/properties/${generatePropertySlug(prop.title, prop.location, prop.id)}`} className="btn-primary-sm">
                        View Details
                      </a>
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
          max-width: 1240px;
          margin: 0 auto;
          padding: 36px 20px;
        }
        .search-layout {
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 30px;
          position: relative;
        }
        
        .filter-sidebar {
          padding: 24px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          font-size: 17px;
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
          margin-top: 8px;
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
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .filter-text-input {
          padding: 10px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .filter-text-input:focus {
          border-color: var(--primary);
        }
        .filter-group select {
          padding: 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
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
          border: none;
          border-right: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.15s;
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
          transition: all 0.15s;
        }
        .bhk-btn.active {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }

        .price-range-slider {
          width: 100%;
          accent-color: var(--primary);
          cursor: pointer;
          height: 6px;
        }
        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .price-val {
          color: var(--primary);
          font-weight: 700;
          font-size: 13px;
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
          font-weight: 800;
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
          cursor: pointer;
          border: none;
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px 20px", textAlign: "center" }}>Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}
