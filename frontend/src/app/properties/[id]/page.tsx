"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/lib/useToast";
import { extractIdFromSlug } from "@/lib/slug";

export default function PropertyDetailsPage() {
  const params = useParams();
  const rawParam = (params?.id as string) || "";
  const propertyId = extractIdFromSlug(rawParam);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [credits, setCredits] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { success, info } = useToast();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

  const propertyDetails = {
    id: propertyId || "12345",
    title: "Sleek 2 BHK Modern Apartment in Arera Colony",
    price: "₹22,000 / Month",
    rawPrice: 22000,
    currency: "INR",
    deposit: "₹44,000",
    maintenance: "₹1,500",
    location: "Arera Colony, Bhopal",
    city: "Bhopal",
    state: "Madhya Pradesh",
    postalCode: "462016",
    size: "1200 Sq Ft",
    furnished: "Fully Furnished",
    bathrooms: 2,
    bedrooms: 2,
    parking: 1,
    posted: "Posted 2 hours ago",
    description: "Located in the heart of Arera Colony, this stunning 2 BHK penthouse features double balconies, premium Italian marble flooring, complete teak-wood woodwork, fully integrated modular kitchen with branded chimneys, and independent secure covered parking. Just a 2-minute walk from local market and organic grocery stores. Perfect for working professionals or small families looking for high-quality, secure residential spaces.",
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=675&q=80",
    amenities: [
      { name: "Parking Space", icon: "🚗" },
      { name: "24x7 Security", icon: "🛡️" },
      { name: "Full Power Backup", icon: "⚡" },
      { name: "High-speed Lift", icon: "🛗" },
      { name: "CCTV Cameras", icon: "📹" },
      { name: "Gymnasium", icon: "🏋️" }
    ],
    owner: {
      name: "Rahul Sharma",
      status: "Verified Owner",
      memberSince: "Member since 2026",
      phone: "+91 98930 XXXXX",
      unlockedPhone: "+91 98930 24190",
      email: "rahul.sharma@example.com",
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": propertyDetails.title,
    "description": propertyDetails.description,
    "url": `${siteUrl}/properties/${rawParam}`,
    "image": [propertyDetails.imageUrl],
    "datePosted": "2026-08-18",
    "offers": {
      "@type": "Offer",
      "price": propertyDetails.rawPrice,
      "priceCurrency": propertyDetails.currency,
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-08-18",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": propertyDetails.rawPrice,
        "priceCurrency": propertyDetails.currency,
        "unitText": "MONTH"
      }
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Arera Colony",
      "addressLocality": propertyDetails.city,
      "addressRegion": propertyDetails.state,
      "postalCode": propertyDetails.postalCode,
      "addressCountry": "IN"
    },
    "numberOfRooms": propertyDetails.bedrooms,
    "numberOfBathroomsTotal": propertyDetails.bathrooms,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": 1200,
      "unitText": "SQFT"
    }
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Properties",
        "item": `${siteUrl}/search`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": propertyDetails.city,
        "item": `${siteUrl}/search?location=${encodeURIComponent(propertyDetails.city)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": propertyDetails.title,
        "item": `${siteUrl}/properties/${rawParam}`
      }
    ]
  };

  const handleContactOwner = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      window.location.href = `/login?next=/properties/${rawParam}`;
      return;
    }
    if (credits > 0) {
      setCredits(credits - 1);
      setIsUnlocked(true);
      success("Contact unlocked successfully! ✓");
    } else {
      setShowPlansModal(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: propertyDetails.title,
      text: `Check out this property: ${propertyDetails.title} — ${propertyDetails.price}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled share — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        info("Link copied to clipboard! 📋");
      } catch {
        info("Copy this URL: " + window.location.href);
      }
    }
  };

  return (
    <div className="detail-page-container fade-in">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="detail-breadcrumbs">
        <a href="/">Home</a> <span>/</span>
        <a href="/search">Properties</a> <span>/</span>
        <a href={`/search?location=${encodeURIComponent(propertyDetails.city)}`}>{propertyDetails.city}</a> <span>/</span>
        <span className="current-crumb">{propertyDetails.title}</span>
      </nav>

      {/* Back link + Share */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <a href="/search" className="back-link">← Back to search results</a>
        <button type="button" className="share-btn" onClick={handleShare} aria-label="Share property">
          🔗 Share
        </button>
      </div>

      {/* Main Grid */}
      <div className="detail-layout">
        {/* Main Info Column */}
        <div className="info-column">
          <div className="image-gallery-card premium-card">
            {!imgLoaded && <div className="gallery-shimmer" aria-hidden="true" />}
            <img 
              src={propertyDetails.imageUrl}
              alt={propertyDetails.title}
              width={1200}
              height={675}
              className="main-gallery-img"
              loading="eager"
              decoding="async"
              style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s ease" }}
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          <div className="property-main-header">
            <div className="title-price">
              <h1>{propertyDetails.title}</h1>
              <span className="price-tag">{propertyDetails.price}</span>
            </div>
            <p className="location-tag">📍 {propertyDetails.location}</p>
          </div>

          {/* Quick Specs Grid */}
          <div className="quick-specs-grid">
            <div className="spec-item premium-card">
              <span className="spec-label">Area</span>
              <span className="spec-value">{propertyDetails.size}</span>
            </div>
            <div className="spec-item premium-card">
              <span className="spec-label">Furnished</span>
              <span className="spec-value">{propertyDetails.furnished}</span>
            </div>
            <div className="spec-item premium-card">
              <span className="spec-label">Bathrooms</span>
              <span className="spec-value">{propertyDetails.bathrooms} Baths</span>
            </div>
            <div className="spec-item premium-card">
              <span className="spec-label">Parking</span>
              <span className="spec-value">{propertyDetails.parking} Covered</span>
            </div>
          </div>

          {/* Description */}
          <div className="details-section">
            <h2>Description</h2>
            <p className="desc-text">{propertyDetails.description}</p>
          </div>

          {/* Amenities */}
          <div className="details-section">
            <h2>Amenities & Features</h2>
            <div className="amenities-grid">
              {propertyDetails.amenities.map((amenity, i) => (
                <div key={i} className="amenity-item premium-card">
                  <span className="amenity-icon">{amenity.icon}</span>
                  <span className="amenity-name">{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Masked Contact Sidebar */}
        <aside className="contact-sidebar">
          <div className="premium-card owner-widget">
            <div className="owner-avatar-info">
              <Avatar name={propertyDetails.owner.name} size="lg" />
              <div>
                <h3>{propertyDetails.owner.name}</h3>
                <span className="owner-badge">✓ {propertyDetails.owner.status}</span>
              </div>
            </div>
            <p className="member-since">{propertyDetails.owner.memberSince}</p>

            <div className="divider"></div>

            {/* Credit Info */}
            <div className="credit-display">
              <span>Your Available Contact Credits:</span>
              <span className="credit-badge">{credits} Credits</span>
            </div>

            {isUnlocked ? (
              <div className="unlocked-contact-info fade-in">
                <p className="unlock-success-msg">✓ Contact Unlocked Successfully!</p>
                <div className="contact-details">
                  <div className="contact-row">
                    <span className="label">Phone:</span>
                    <span className="value">{propertyDetails.owner.unlockedPhone}</span>
                  </div>
                  <div className="contact-row">
                    <span className="label">Email:</span>
                    <span className="value">{propertyDetails.owner.email}</span>
                  </div>
                </div>
                <a 
                  href={`https://wa.me/919893024190?text=Hi%20Rahul,%20I%20am%20interested%20in%20your%202%20BHK%20property%20listed%20on%20AuraHomes.`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp"
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            ) : (
              <div className="locked-contact-info">
                <div className="locked-phone-display">
                  <span className="lock-icon">🔒</span>
                  <span className="masked-phone">{propertyDetails.owner.phone}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-primary full-width-btn"
                  onClick={handleContactOwner}
                >
                  Unlock Owner Contact
                </button>
                <p className="gating-disclosure">Unlocking this contact requires 1 Contact Credit.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ─── Upgrade Plan Modal ─── */}
      {showPlansModal && (
        <div className="modal-overlay">
          <div className="modal-content premium-card slide-up">
            <div className="modal-header">
              <h2>Purchase Credits</h2>
              <button type="button" className="close-modal-btn" onClick={() => setShowPlansModal(false)}>×</button>
            </div>
            
            <p className="modal-intro">To prevent platform spam and protect owners&apos; privacy, contacting listing owners requires paid credits.</p>

            <div className="plan-comparison-card">
              <div className="plan-badge-popular">Most Popular</div>
              <h3>Standard Bundle</h3>
              <p className="plan-price">₹199 <span className="period">/ 15 Credits</span></p>
              <ul className="plan-perks">
                <li>✓ Unlock contact details for 15 listings</li>
                <li>✓ Unlimited property browsing</li>
                <li>✓ Validity: 30 days</li>
                <li>✓ Priority support</li>
              </ul>
              <button type="button" className="btn-primary full-width-btn" onClick={() => { setCredits(5); setShowPlansModal(false); success("5 credits added! Try unlocking again."); }}>
                Purchase Package (Razorpay Mock)
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .detail-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .detail-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .detail-breadcrumbs a {
          color: var(--text-secondary);
          text-decoration: none;
        }
        .detail-breadcrumbs a:hover {
          color: var(--primary);
        }
        .detail-breadcrumbs .current-crumb {
          color: var(--text-primary);
          font-weight: 600;
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .back-link {
          color: var(--primary);
          font-weight: 600;
          display: inline-block;
          font-size: 14px;
        }
        .share-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--surface);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .share-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
        }
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
        }
        
        /* Gallery Column */
        .image-gallery-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          aspect-ratio: 16 / 9;
          margin-bottom: 30px;
          position: relative;
          background: #f0f0f0;
        }
        .main-gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gallery-shimmer {
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
        .property-main-header {
          margin-bottom: 32px;
        }
        .title-price {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .title-price h1 {
          font-size: 28px;
        }
        .price-tag {
          font-size: 26px;
          font-weight: 800;
          color: var(--primary);
          white-space: nowrap;
        }
        .location-tag {
          margin-top: 8px;
          color: var(--text-secondary);
        }
        
        /* Specs Grid */
        .quick-specs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .spec-item {
          padding: 16px;
          text-align: center;
        }
        .spec-label {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .spec-value {
          font-size: 15px;
          font-weight: 700;
        }
        
        .details-section {
          margin-bottom: 40px;
        }
        .details-section h2 {
          font-size: 22px;
          margin-bottom: 16px;
        }
        .desc-text {
          font-size: 15px;
          line-height: 1.7;
        }
        
        /* Amenities */
        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .amenity-item {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .amenity-icon {
          font-size: 24px;
        }
        .amenity-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        /* Sidebar Widget */
        .owner-widget {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .owner-avatar-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .owner-badge {
          background: var(--success);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .member-since {
          font-size: 12px;
          color: var(--text-muted);
        }
        .divider {
          height: 1px;
          background: var(--border);
        }
        .credit-display {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .credit-badge {
          color: var(--primary);
          font-weight: 700;
        }
        .locked-phone-display {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: var(--surface-hover);
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
          margin-bottom: 16px;
          font-weight: 700;
        }
        .full-width-btn {
          width: 100%;
          justify-content: center;
        }
        .gating-disclosure {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
        }
        
        .unlocked-contact-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .unlock-success-msg {
          color: var(--success);
          font-weight: 700;
          font-size: 14px;
        }
        .contact-details {
          padding: 16px;
          background: var(--primary-light);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .contact-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        .contact-row .label {
          color: var(--text-secondary);
        }
        .contact-row .value {
          font-weight: 700;
        }
        .btn-whatsapp {
          background: #25d366;
          color: white;
          padding: 12px;
          border-radius: var(--radius-md);
          text-align: center;
          font-weight: 700;
          box-shadow: 0 4px 12px 0 rgba(37, 211, 102, 0.2);
          text-decoration: none;
        }
        .btn-whatsapp:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px 0 rgba(37, 211, 102, 0.3);
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 24px;
        }
        .modal-content {
          max-width: 440px;
          width: 100%;
          padding: 32px;
          position: relative;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .close-modal-btn {
          font-size: 28px;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
        }
        .modal-intro {
          font-size: 14px;
          margin-bottom: 24px;
        }
        .plan-comparison-card {
          padding: 24px;
          border: 1px solid var(--primary);
          border-radius: var(--radius-md);
          background: var(--primary-light);
          position: relative;
        }
        .plan-badge-popular {
          position: absolute;
          top: -12px;
          right: 24px;
          background: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }
        .plan-price {
          font-size: 32px;
          font-weight: 800;
          color: var(--primary);
          margin: 12px 0;
        }
        .plan-price .period {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .plan-perks {
          list-style: none;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 13px;
        }
        
        @media (max-width: 900px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
          .quick-specs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}} />
    </div>
  );
}
