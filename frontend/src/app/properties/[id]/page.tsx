"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/lib/useToast";
import { extractIdFromSlug } from "@/lib/slug";
import { getPublishedProperties, StoredProperty } from "@/lib/propertyStore";
import { api } from "@/lib/api";

const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=750&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&h=750&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=750&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&h=750&q=80",
];

export default function PropertyDetailsPage() {
  const params = useParams();
  const rawParam = (params?.id as string) || "";
  const propertyId = extractIdFromSlug(rawParam);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [credits, setCredits] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [customProp, setCustomProp] = useState<StoredProperty | null>(null);
  const { success, info } = useToast();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

  useEffect(() => {
    const loadDetails = async () => {
      const published = getPublishedProperties();
      const found = published.find(p => p.id.toString() === propertyId.toString());
      if (found) {
        setCustomProp(found);
        return;
      }

      // Fetch from cloud database for cross-device links (mobile -> laptop)
      try {
        const remote = await api.getProperty(propertyId);
        if (remote && remote.title) {
          setCustomProp({
            id: remote.id,
            title: remote.title,
            price: remote.purpose === "rent"
              ? `₹${Number(remote.price).toLocaleString("en-IN")} / Month`
              : (Number(remote.price) >= 10000000 
                  ? `₹${(Number(remote.price) / 10000000).toFixed(2)} Cr` 
                  : (Number(remote.price) >= 100000 
                      ? `₹${(Number(remote.price) / 100000).toFixed(2)} Lakh` 
                      : `₹${Number(remote.price).toLocaleString("en-IN")}`)),
            priceNum: Number(remote.price) || 0,
            location: remote.locality ? `${remote.locality}, ${remote.city || "Bhopal"}` : (remote.city || "Bhopal"),
            specs: `${remote.bhk || 2} Beds | ${remote.bathrooms || 2} Baths | ${remote.area_sqft || 1200} sqft`,
            image: remote.images?.[0] || remote.image || DEFAULT_GALLERY_IMAGES[0],
            photos: remote.images && remote.images.length > 0 ? remote.images : (remote.image ? [remote.image] : DEFAULT_GALLERY_IMAGES),
            type: remote.property_type || "Apartment",
            purpose: remote.purpose === "rent" ? "rent" : "sell",
            bhk: remote.bhk || 2,
            bathrooms: remote.bathrooms || 2,
            size: `${remote.area_sqft || 1200}`,
            description: remote.description,
            contactName: remote.owner?.name || remote.contact_name || "Verified Owner",
            contactPhone: remote.owner?.mobile || remote.contact_phone || "",
            ownerEmail: remote.owner?.email || remote.contact_email || "",
            ownerId: remote.owner_id || "",
          });
        }
      } catch {
        // Fallback handled
      }
    };

    loadDetails();
  }, [propertyId]);

  const rawPhotos = (customProp?.photos && customProp.photos.length > 0)
    ? customProp.photos
    : (customProp?.image ? [customProp.image, ...DEFAULT_GALLERY_IMAGES.slice(1)] : DEFAULT_GALLERY_IMAGES);

  const loggedInEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") || "" : "";
  const loggedInPhone = typeof window !== "undefined" ? localStorage.getItem("user_mobile") || "" : "";
  const loggedInName = typeof window !== "undefined" ? localStorage.getItem("user_name") || "" : "";
  const loggedInUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") || "" : "";

  const isOwner = Boolean(
    (customProp?.ownerId && loggedInUserId && customProp.ownerId === loggedInUserId) ||
    (customProp?.ownerEmail && loggedInEmail && customProp.ownerEmail.toLowerCase() === loggedInEmail.toLowerCase()) ||
    (customProp?.contactPhone && loggedInPhone && customProp.contactPhone.replace(/\D/g, "") === loggedInPhone.replace(/\D/g, "")) ||
    (customProp?.contactName && loggedInName && customProp.contactName.trim().toLowerCase() === loggedInName.trim().toLowerCase())
  );

  const resolvedOwnerName = customProp?.contactName || "Verified Owner";
  const resolvedOwnerEmail = customProp?.ownerEmail || (customProp?.contactName ? `${customProp.contactName.toLowerCase().replace(/\s+/g, '')}@gmail.com` : "contact.owner@aurahomes.in");
  const resolvedPhone = customProp?.contactPhone ? `+91 ${customProp.contactPhone}` : "";
  const maskedPhone = customProp?.contactPhone ? `+91 ${customProp.contactPhone.slice(0, 5)} XXXXX` : "+91 XXXXX XXXXX";
  const maskedEmail = resolvedOwnerEmail.includes("@") 
    ? `${resolvedOwnerEmail.slice(0, 3)}***@${resolvedOwnerEmail.split("@")[1]}` 
    : "owner***@aurahomes.in";

  const propType = customProp?.type || (customProp?.title?.toLowerCase().includes("plot") ? "Plot / Land" : (customProp?.title?.toLowerCase().includes("shop") ? "Shop" : (customProp?.title?.toLowerCase().includes("office") ? "Office Space" : (customProp?.title?.toLowerCase().includes("warehouse") ? "Warehouse" : (customProp?.title?.toLowerCase().includes("pg") ? "PG / Hostel" : "Apartment")))));
  const isPlot = propType === "Plot / Land" || (customProp?.title?.toLowerCase().includes("plot") ?? false) || (customProp?.title?.toLowerCase().includes("land") ?? false);
  const isShop = propType === "Shop" || (customProp?.title?.toLowerCase().includes("shop") ?? false);
  const isOffice = propType === "Office Space" || (customProp?.title?.toLowerCase().includes("office") ?? false);
  const isWarehouse = propType === "Warehouse" || (customProp?.title?.toLowerCase().includes("warehouse") ?? false);
  const isPG = propType === "PG / Hostel" || (customProp?.title?.toLowerCase().includes("pg") ?? false) || (customProp?.title?.toLowerCase().includes("hostel") ?? false);

  const defaultAmenities = isPlot ? [
    { name: "Boundary Wall", icon: "🧱" },
    { name: "30ft Wide Road", icon: "🛣️" },
    { name: "Electricity Connection", icon: "⚡" },
    { name: "Water Supply Line", icon: "🚰" },
    { name: "Gated Layout", icon: "🛡️" },
    { name: "Street Lights", icon: "💡" },
    { name: "Clear Title / Registry", icon: "📜" },
    { name: "Vastu Compliant", icon: "🧭" }
  ] : isShop ? [
    { name: "Main Road Frontage", icon: "🏪" },
    { name: "High Footfall Zone", icon: "👥" },
    { name: "Power Backup", icon: "⚡" },
    { name: "CCTV Surveillance", icon: "📹" },
    { name: "Private Washroom", icon: "🚻" },
    { name: "Water Supply", icon: "🚰" },
    { name: "Fire Safety Equipment", icon: "🧯" },
    { name: "Customer Parking", icon: "🚗" }
  ] : isOffice ? [
    { name: "High Speed Elevators", icon: "🛗" },
    { name: "100% Power Backup", icon: "⚡" },
    { name: "Central Air Conditioning", icon: "❄️" },
    { name: "24x7 Security & CCTV", icon: "🛡️" },
    { name: "Conference Room Setup", icon: "📽️" },
    { name: "Pantry & Cafeteria", icon: "☕" },
    { name: "Reserved Staff Parking", icon: "🚗" },
    { name: "Fire Safety Certified", icon: "🧯" }
  ] : isWarehouse ? [
    { name: "24ft Clear Ceiling Height", icon: "🏗️" },
    { name: "Dedicated Loading Bays", icon: "🚛" },
    { name: "40ft Container Access", icon: "🛣️" },
    { name: "Heavy Industrial Flooring", icon: "🧱" },
    { name: "3-Phase Industrial Power", icon: "⚡" },
    { name: "Gated & Guarded Compound", icon: "🛡️" },
    { name: "Fire Hydrant System", icon: "🧯" },
    { name: "Office / Staff Quarters", icon: "🏢" }
  ] : [
    { name: "Covered Parking", icon: "🚗" },
    { name: "24x7 Security", icon: "🛡️" },
    { name: "Full Power Backup", icon: "⚡" },
    { name: "High-Speed Lift", icon: "🛗" },
    { name: "CCTV Surveillance", icon: "📹" },
    { name: "Fitness Center / Gym", icon: "🏋️" },
    { name: "Children Play Area", icon: "🛝" },
    { name: "Vastu Compliant", icon: "🧭" }
  ];

  const propertyDetails = {
    id: customProp?.id || propertyId || "12345",
    title: customProp?.title || "Sleek 2 BHK Modern Apartment in Arera Colony",
    price: customProp?.price || "₹22,000 / Month",
    rawPrice: customProp?.priceNum || 22000,
    purpose: customProp?.purpose || "rent",
    propertyType: propType,
    currency: "INR",
    deposit: customProp?.purpose === "rent" ? "₹50,000" : "₹1,00,000",
    maintenance: isPlot ? "₹0 / mo" : (customProp?.purpose === "rent" ? "₹1,500 / mo" : "₹2,500 / mo"),
    location: customProp?.location || "Arera Colony, Bhopal",
    city: "Bhopal",
    state: "Madhya Pradesh",
    postalCode: "462016",
    size: customProp?.size ? `${customProp.size} Sq Ft` : (isPlot ? "1500 Sq Ft" : "1200 Sq Ft"),
    facing: customProp?.facing || "East Facing",
    dimensions: customProp?.dimensions || "30 × 50 ft",
    boundaryWall: customProp?.boundaryWall || "Yes (Constructed)",
    cornerPlot: customProp?.cornerPlot || "Corner Plot",
    frontage: customProp?.frontage || "15 ft Frontage",
    shopFloor: customProp?.shopFloor || "Ground Floor",
    shopWashroom: customProp?.shopWashroom || "Private Washroom",
    cabins: customProp?.cabins || "2 Cabins",
    workstations: customProp?.workstations || "15-25 Workstations",
    pgFor: customProp?.pgFor || "Any (Boys / Girls / Working)",
    roomType: customProp?.roomType || "Single & Double Sharing",
    foodIncluded: customProp?.foodIncluded || "Breakfast & Dinner Included",
    furnished: isPlot ? "" : (customProp?.furnished || "Fully Furnished"),
    bathrooms: isPlot ? 0 : (customProp?.bathrooms || 2),
    bedrooms: isPlot || isShop || isOffice || isWarehouse ? 0 : (customProp?.bhk || 2),
    parking: isPlot ? "" : (customProp?.parking || "1 Covered Car Parking"),
    posted: "Just Listed",
    description: customProp?.description || (isPlot 
      ? "Clear title, RERA approved plot ready for immediate registry and construction in a prime locality with road access and electricity."
      : "Located in a prime locality, this property features excellent construction, high-quality finishes, 24x7 security, and convenient access to key city hubs."),
    photos: rawPhotos,
    amenities: defaultAmenities,
    owner: {
      name: resolvedOwnerName,
      status: isOwner ? "Your Listing" : "Verified Owner",
      memberSince: "Member since 2026",
      phone: maskedPhone,
      unlockedPhone: resolvedPhone,
      rawPhone: customProp?.contactPhone || "",
      email: resolvedOwnerEmail,
      maskedEmail: maskedEmail,
    }
  };

  const currentPhoto = propertyDetails.photos[activePhotoIdx] || propertyDetails.photos[0];

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % propertyDetails.photos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + propertyDetails.photos.length) % propertyDetails.photos.length);
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
      text: `Check out this property on AuraHomes: ${propertyDetails.title} — ${propertyDetails.price}`,
      url: window.location.href,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        info("Link copied to clipboard! 📋");
      } catch {
        info("URL: " + window.location.href);
      }
    }
  };

  const whatsappMsg = encodeURIComponent(
    `Hi ${propertyDetails.owner.name}, I am interested in your property "${propertyDetails.title}" listed on AuraHomes (${propertyDetails.price}). Could you please share more details?`
  );
  const whatsappUrl = `https://wa.me/91${propertyDetails.owner.rawPhone.replace(/\D/g, "")}?text=${whatsappMsg}`;

  return (
    <div className="detail-page-container fade-in">
      {/* Mobile Top Navigation Bar */}
      <div className="mobile-top-bar">
        <a href="/search" className="back-circle-btn" aria-label="Back to search">
          ←
        </a>
        <div className="top-bar-actions">
          <button type="button" className="share-circle-btn" onClick={handleShare} aria-label="Share property">
            🔗
          </button>
        </div>
      </div>

      {/* Desktop Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="detail-breadcrumbs desktop-only">
        <a href="/">Home</a> <span>/</span>
        <a href="/search">Properties</a> <span>/</span>
        <a href={`/search?location=${encodeURIComponent(propertyDetails.city)}`}>{propertyDetails.city}</a> <span>/</span>
        <span className="current-crumb">{propertyDetails.title}</span>
      </nav>

      {/* Main Grid Layout */}
      <div className="detail-layout">
        {/* Main Column */}
        <div className="info-column">
          {/* Photo Gallery with Touch Navigation & Thumbnails */}
          <div className="gallery-wrapper">
            <div className="image-gallery-card premium-card">
              {!imgLoaded && <div className="gallery-shimmer" aria-hidden="true" />}
              <img 
                src={currentPhoto}
                alt={propertyDetails.title}
                width={1200}
                height={750}
                className="main-gallery-img"
                loading="eager"
                decoding="async"
                style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.25s ease" }}
                onLoad={() => setImgLoaded(true)}
              />

              {/* Photo Counter Pill */}
              <div className="gallery-counter-pill">
                📷 {activePhotoIdx + 1} / {propertyDetails.photos.length}
              </div>

              {/* Verified Ribbon */}
              <div className="gallery-verified-pill">
                🛡️ Verified
              </div>

              {/* Photo Prev/Next Touch Controls */}
              {propertyDetails.photos.length > 1 && (
                <>
                  <button type="button" className="gallery-nav-btn prev" onClick={handlePrevPhoto} aria-label="Previous photo">
                    ‹
                  </button>
                  <button type="button" className="gallery-nav-btn next" onClick={handleNextPhoto} aria-label="Next photo">
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {propertyDetails.photos.length > 1 && (
              <div className="thumbnail-strip">
                {propertyDetails.photos.map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`thumb-btn ${index === activePhotoIdx ? "active" : ""}`}
                    onClick={() => {
                      setActivePhotoIdx(index);
                      setImgLoaded(false);
                    }}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <img src={photo} alt={`Thumbnail ${index + 1}`} width={100} height={70} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Title & Price Header */}
          <div className="property-main-header">
            <div className="header-badges">
              <span className={`purpose-pill ${propertyDetails.purpose === "rent" ? "rent" : "sale"}`}>
                {propertyDetails.purpose === "rent" ? "FOR RENT" : "FOR SALE"}
              </span>
              <span className="type-pill">{propertyDetails.propertyType}</span>
              <span className="listed-pill">{propertyDetails.posted}</span>
            </div>

            <h1 className="detail-title">{propertyDetails.title}</h1>
            
            <div className="price-location-box">
              <div className="price-wrapper">
                <span className="price-tag">{propertyDetails.price}</span>
                {propertyDetails.purpose === "rent" && (
                  <span className="deposit-tag">Deposit: {propertyDetails.deposit}</span>
                )}
              </div>
              <p className="location-tag">📍 {propertyDetails.location}</p>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="quick-specs-grid">
            {isPlot ? (
              <>
                <div className="spec-card">
                  <span className="spec-icon">📐</span>
                  <div className="spec-text">
                    <span className="spec-label">Plot Area</span>
                    <span className="spec-value">{propertyDetails.size}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🧭</span>
                  <div className="spec-text">
                    <span className="spec-label">Facing</span>
                    <span className="spec-value">{propertyDetails.facing}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">📏</span>
                  <div className="spec-text">
                    <span className="spec-label">Dimensions</span>
                    <span className="spec-value">{propertyDetails.dimensions}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🧱</span>
                  <div className="spec-text">
                    <span className="spec-label">Boundary Wall</span>
                    <span className="spec-value">{propertyDetails.boundaryWall}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛣️</span>
                  <div className="spec-text">
                    <span className="spec-label">Corner Plot</span>
                    <span className="spec-value">{propertyDetails.cornerPlot}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">📜</span>
                  <div className="spec-text">
                    <span className="spec-label">Ownership</span>
                    <span className="spec-value">Freehold / Verified</span>
                  </div>
                </div>
              </>
            ) : isShop ? (
              <>
                <div className="spec-card">
                  <span className="spec-icon">📐</span>
                  <div className="spec-text">
                    <span className="spec-label">Carpet Area</span>
                    <span className="spec-value">{propertyDetails.size}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🏪</span>
                  <div className="spec-text">
                    <span className="spec-label">Frontage</span>
                    <span className="spec-value">{propertyDetails.frontage}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🏢</span>
                  <div className="spec-text">
                    <span className="spec-label">Floor</span>
                    <span className="spec-value">{propertyDetails.shopFloor}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚻</span>
                  <div className="spec-text">
                    <span className="spec-label">Washroom</span>
                    <span className="spec-value">{propertyDetails.shopWashroom}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚗</span>
                  <div className="spec-text">
                    <span className="spec-label">Parking</span>
                    <span className="spec-value">{propertyDetails.parking || "Roadside Parking"}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">⚡</span>
                  <div className="spec-text">
                    <span className="spec-label">Power Backup</span>
                    <span className="spec-value">Available</span>
                  </div>
                </div>
              </>
            ) : isOffice ? (
              <>
                <div className="spec-card">
                  <span className="spec-icon">📐</span>
                  <div className="spec-text">
                    <span className="spec-label">Carpet Area</span>
                    <span className="spec-value">{propertyDetails.size}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚪</span>
                  <div className="spec-text">
                    <span className="spec-label">Cabins</span>
                    <span className="spec-value">{propertyDetails.cabins}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">💻</span>
                  <div className="spec-text">
                    <span className="spec-label">Workstations</span>
                    <span className="spec-value">{propertyDetails.workstations}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">⚡</span>
                  <div className="spec-text">
                    <span className="spec-label">Power Backup</span>
                    <span className="spec-value">100% Full Backup</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚗</span>
                  <div className="spec-text">
                    <span className="spec-label">Parking</span>
                    <span className="spec-value">{propertyDetails.parking || "Reserved Parking"}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">☕</span>
                  <div className="spec-text">
                    <span className="spec-label">Pantry</span>
                    <span className="spec-value">Dry Pantry</span>
                  </div>
                </div>
              </>
            ) : isWarehouse ? (
              <>
                <div className="spec-card">
                  <span className="spec-icon">📐</span>
                  <div className="spec-text">
                    <span className="spec-label">Covered Area</span>
                    <span className="spec-value">{propertyDetails.size}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🏗️</span>
                  <div className="spec-text">
                    <span className="spec-label">Clear Height</span>
                    <span className="spec-value">24 ft</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚛</span>
                  <div className="spec-text">
                    <span className="spec-label">Loading Bays</span>
                    <span className="spec-value">2 Loading Docks</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛣️</span>
                  <div className="spec-text">
                    <span className="spec-label">Container Access</span>
                    <span className="spec-value">40ft Direct</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">⚡</span>
                  <div className="spec-text">
                    <span className="spec-label">Power Load</span>
                    <span className="spec-value">Industrial 3-Phase</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛡️</span>
                  <div className="spec-text">
                    <span className="spec-label">Security</span>
                    <span className="spec-value">24x7 Guarded</span>
                  </div>
                </div>
              </>
            ) : isPG ? (
              <>
                <div className="spec-card">
                  <span className="spec-icon">👥</span>
                  <div className="spec-text">
                    <span className="spec-label">PG For</span>
                    <span className="spec-value">{propertyDetails.pgFor}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛏️</span>
                  <div className="spec-text">
                    <span className="spec-label">Room Type</span>
                    <span className="spec-value">{propertyDetails.roomType}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🍲</span>
                  <div className="spec-text">
                    <span className="spec-label">Food Status</span>
                    <span className="spec-value">{propertyDetails.foodIncluded}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛋️</span>
                  <div className="spec-text">
                    <span className="spec-label">Furnishing</span>
                    <span className="spec-value">Fully Furnished</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚿</span>
                  <div className="spec-text">
                    <span className="spec-label">Bathrooms</span>
                    <span className="spec-value">Attached</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">📶</span>
                  <div className="spec-text">
                    <span className="spec-label">Wi-Fi</span>
                    <span className="spec-value">High-Speed Free</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="spec-card">
                  <span className="spec-icon">📐</span>
                  <div className="spec-text">
                    <span className="spec-label">Carpet Area</span>
                    <span className="spec-value">{propertyDetails.size}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛏️</span>
                  <div className="spec-text">
                    <span className="spec-label">Configuration</span>
                    <span className="spec-value">{propertyDetails.bedrooms} BHK</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚿</span>
                  <div className="spec-text">
                    <span className="spec-label">Bathrooms</span>
                    <span className="spec-value">{propertyDetails.bathrooms} Baths</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛋️</span>
                  <div className="spec-text">
                    <span className="spec-label">Furnishing</span>
                    <span className="spec-value">{propertyDetails.furnished}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🚗</span>
                  <div className="spec-text">
                    <span className="spec-label">Parking</span>
                    <span className="spec-value">{propertyDetails.parking}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">⚡</span>
                  <div className="spec-text">
                    <span className="spec-label">Maintenance</span>
                    <span className="spec-value">{propertyDetails.maintenance}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Description Section */}
          <div className="details-card premium-card">
            <h2>About This Property</h2>
            <p className="desc-text">{propertyDetails.description}</p>
          </div>

          {/* Amenities & Highlights */}
          <div className="details-card premium-card">
            <h2>Amenities & Highlights</h2>
            <div className="amenities-grid">
              {propertyDetails.amenities.map((amenity, i) => (
                <div key={i} className="amenity-chip">
                  <span className="amenity-icon">{amenity.icon}</span>
                  <span className="amenity-name">{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct In-Page Owner & Contact Card (Visible on Mobile & Desktop) */}
          <div className="details-card premium-card owner-inpage-card">
            <div className="owner-avatar-info">
              <Avatar name={propertyDetails.owner.name} size="lg" />
              <div>
                <div className="owner-name-row">
                  <h3>{propertyDetails.owner.name}</h3>
                  <span className="verified-check">✓</span>
                </div>
                <span className="owner-badge">
                  {isOwner ? "Your Property Listing" : "Verified Owner • Fast Responder"}
                </span>
              </div>
            </div>

            <div className="divider" style={{ margin: "16px 0" }}></div>

            {isOwner ? (
              <div className="unlocked-contact-box fade-in">
                <div style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, marginBottom: "14px", fontSize: "13px" }}>
                  👤 This is your property listing (Owner View)
                </div>
                <div className="contact-info-grid">
                  <div className="contact-item">
                    <span className="contact-item-label">📞 Your Contact Number:</span>
                    <span className="contact-item-val">{propertyDetails.owner.unlockedPhone}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-item-label">✉️ Your Contact Email:</span>
                    <span className="contact-item-val">{propertyDetails.owner.email}</span>
                  </div>
                </div>
                <a href="/dashboard/properties" className="btn-call-direct" style={{ textDecoration: "none" }}>
                  📁 Manage Listing in Dashboard →
                </a>
              </div>
            ) : isUnlocked ? (
              <div className="unlocked-contact-box fade-in">
                <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, marginBottom: "14px", fontSize: "13px" }}>
                  ✓ Owner Contact Unlocked (Verified Direct Lead)
                </div>
                <div className="contact-info-grid">
                  <div className="contact-item">
                    <span className="contact-item-label">📞 Direct Phone:</span>
                    <a href={`tel:${propertyDetails.owner.unlockedPhone}`} className="contact-item-val link-phone">
                      {propertyDetails.owner.unlockedPhone}
                    </a>
                  </div>
                  <div className="contact-item">
                    <span className="contact-item-label">✉️ Owner Email:</span>
                    <span className="contact-item-val">{propertyDetails.owner.email}</span>
                  </div>
                </div>

                <div className="contact-action-buttons-row">
                  <a href={`tel:${propertyDetails.owner.unlockedPhone}`} className="btn-call-direct">
                    📞 Call Owner Now
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-whatsapp-direct">
                    💬 WhatsApp Chat
                  </a>
                </div>
              </div>
            ) : (
              <div className="locked-contact-box">
                <div className="contact-info-grid">
                  <div className="contact-item">
                    <span className="contact-item-label">📞 Owner Phone:</span>
                    <span className="contact-item-val" style={{ letterSpacing: "1px", color: "var(--text-muted)" }}>
                      {propertyDetails.owner.phone}
                    </span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-item-label">✉️ Owner Email:</span>
                    <span className="contact-item-val" style={{ color: "var(--text-muted)" }}>
                      {propertyDetails.owner.maskedEmail}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
                  🔒 Unlock direct verified owner phone number and WhatsApp chat with 1 credit.
                </p>
                <div className="contact-action-buttons-row">
                  <button type="button" className="btn-call-direct" onClick={handleContactOwner}>
                    🔓 Unlock Owner Contact (1 Credit)
                  </button>
                  <button type="button" className="btn-whatsapp-direct" onClick={handleContactOwner}>
                    💬 Unlock WhatsApp Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar Column */}
        <aside className="contact-sidebar desktop-only">
          <div className="premium-card owner-widget">
            <div className="owner-avatar-info">
              <Avatar name={propertyDetails.owner.name} size="lg" />
              <div>
                <div className="owner-name-row">
                  <h3>{propertyDetails.owner.name}</h3>
                  <span className="verified-check">✓</span>
                </div>
                <span className="owner-badge">{propertyDetails.owner.status}</span>
              </div>
            </div>

            <div className="owner-meta-row">
              <span>⚡ Fast Responder</span>
              <span>⭐ Verified Listing</span>
            </div>

            <div className="divider"></div>

            {/* Credit Info */}
            <div className="credit-display">
              <span>Available Contact Credits:</span>
              <span className="credit-badge">{credits} Credits</span>
            </div>

            {isOwner ? (
              <div className="unlocked-contact-info fade-in">
                <p className="unlock-success-msg" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" }}>
                  👤 Your Property Listing
                </p>
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
                <a href="/dashboard/properties" className="btn-primary full-width-btn" style={{ textAlign: "center", textDecoration: "none" }}>
                  Manage Listing →
                </a>
              </div>
            ) : isUnlocked ? (
              <div className="unlocked-contact-info fade-in">
                <p className="unlock-success-msg">✓ Owner Contact Unlocked</p>
                <div className="contact-details">
                  <div className="contact-row">
                    <span className="label">Phone:</span>
                    <a href={`tel:${propertyDetails.owner.unlockedPhone}`} className="value-link">
                      {propertyDetails.owner.unlockedPhone}
                    </a>
                  </div>
                  <div className="contact-row">
                    <span className="label">Email:</span>
                    <span className="value">{propertyDetails.owner.email}</span>
                  </div>
                </div>
                <a 
                  href={whatsappUrl}
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
                  <span>📞 {propertyDetails.owner.phone}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-primary full-width-btn"
                  onClick={handleContactOwner}
                >
                  Unlock Owner Contact (1 Credit)
                </button>
                <p className="gating-disclosure">🔒 Verified Direct Owner Phone & WhatsApp Number</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Sticky Mobile Floating Bottom Action Bar */}
      <div className="mobile-floating-action-bar">
        <div className="bar-price-col">
          <span className="bar-price">{propertyDetails.price}</span>
          <span className="bar-sub">{propertyDetails.size}</span>
        </div>
        <div className="bar-buttons-col">
          {isUnlocked ? (
            <>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-mobile-wa">
                💬 WhatsApp
              </a>
              <a href={`tel:${propertyDetails.owner.unlockedPhone}`} className="btn-mobile-call">
                📞 Call
              </a>
            </>
          ) : (
            <>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-mobile-wa">
                💬 WhatsApp
              </a>
              <button type="button" className="btn-mobile-call" onClick={handleContactOwner}>
                📞 Contact Owner
              </button>
            </>
          )}
        </div>
      </div>

      {/* Credit / Plans Modal */}
      {showPlansModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowPlansModal(false)}>
          <div className="modal-content premium-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Unlock Owner Contact</h2>
              <button type="button" className="close-modal-btn" onClick={() => setShowPlansModal(false)}>×</button>
            </div>
            <p className="modal-intro">
              You need <strong>1 Contact Credit</strong> to view verified owner contact details and WhatsApp numbers.
            </p>
            <div className="plan-comparison-card">
              <span className="plan-badge-popular">Most Popular</span>
              <h3>Buyer Pro Pack</h3>
              <div className="plan-price">₹499 <span className="period">/ 10 Contacts</span></div>
              <ul className="plan-perks">
                <li>✓ 10 Verified Owner Phone Numbers</li>
                <li>✓ Direct 1-Click WhatsApp Chat</li>
                <li>✓ Instant SMS Owner Introductions</li>
                <li>✓ Zero Brokerage Guaranteed</li>
              </ul>
              <a href="/plans" className="btn-primary full-width-btn">
                Get Contact Credits
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Page Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px 100px;
        }

        .mobile-top-bar {
          display: none;
        }

        .detail-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 20px;
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

        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 36px;
        }

        /* Gallery */
        .gallery-wrapper {
          margin-bottom: 28px;
        }
        .image-gallery-card {
          border-radius: var(--radius-xl, 20px);
          overflow: hidden;
          aspect-ratio: 16 / 9;
          position: relative;
          background: #0f172a;
          box-shadow: 0 10px 30px -5px rgba(0,0,0,0.12);
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
          background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gallery-counter-pill {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .gallery-verified-pill {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(16, 185, 129, 0.9);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gallery-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gallery-nav-btn:hover {
          background: rgba(15, 23, 42, 0.95);
          transform: translateY(-50%) scale(1.05);
        }
        .gallery-nav-btn.prev { left: 16px; }
        .gallery-nav-btn.next { right: 16px; }

        .thumbnail-strip {
          display: flex;
          gap: 12px;
          margin-top: 14px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }
        .thumb-btn {
          flex: 0 0 90px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
          background: #1e293b;
          transition: all 0.2s ease;
        }
        .thumb-btn.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
        }
        .thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Property Header */
        .property-main-header {
          margin-bottom: 28px;
        }
        .header-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .purpose-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .purpose-pill.sale { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .purpose-pill.rent { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .type-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          background: var(--surface-hover, #f1f5f9);
          color: var(--text-secondary);
        }
        .listed-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .detail-title {
          font-size: 26px;
          font-weight: 800;
          line-height: 1.3;
          margin-bottom: 16px;
          color: var(--text-primary);
        }
        .price-location-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .price-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .price-tag {
          font-size: 30px;
          font-weight: 900;
          color: var(--primary);
          letter-spacing: -0.5px;
        }
        .deposit-tag {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .location-tag {
          font-size: 15px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* Quick Specs Grid */
        .quick-specs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 32px;
          width: 100%;
          box-sizing: border-box;
        }
        .spec-card {
          padding: 14px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 16px);
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          transition: transform 0.15s ease;
        }
        .spec-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary-light);
        }
        .spec-icon {
          font-size: 22px;
          background: var(--surface-hover, #f8fafc);
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .spec-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .spec-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .spec-value {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
          white-space: normal;
          word-break: break-word;
          line-height: 1.3;
        }

        /* Cards */
        .details-card {
          padding: 24px;
          margin-bottom: 24px;
          border-radius: var(--radius-lg, 16px);
        }
        .details-card h2 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .desc-text {
          font-size: 15px;
          line-height: 1.75;
          color: var(--text-secondary);
        }

        /* Amenities */
        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .amenity-chip {
          padding: 12px 14px;
          background: var(--surface-hover, #f8fafc);
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 600;
        }
        .amenity-icon {
          font-size: 18px;
        }

        /* Owner Sidebar */
        .owner-widget {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          border-radius: var(--radius-xl, 20px);
          position: sticky;
          top: 90px;
        }
        .owner-avatar-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .owner-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .owner-name-row h3 {
          font-size: 17px;
          font-weight: 800;
        }
        .verified-check {
          color: #10b981;
          font-weight: 900;
          font-size: 14px;
        }
        .owner-badge {
          display: inline-block;
          margin-top: 3px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .owner-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .divider {
          height: 1px;
          background: var(--border);
        }
        .credit-display {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: var(--text-secondary);
        }
        .credit-badge {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .locked-phone-display {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          background: var(--surface-hover);
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
          margin-bottom: 12px;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 1px;
          color: var(--text-muted);
        }
        .full-width-btn {
          width: 100%;
          justify-content: center;
          padding: 14px;
          border-radius: var(--radius-md);
          font-size: 14.5px;
          font-weight: 800;
        }
        .gating-disclosure {
          margin-top: 8px;
          font-size: 11.5px;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.4;
        }

        .unlocked-contact-info {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .unlock-success-msg {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          font-weight: 800;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 8px;
          text-align: center;
        }
        .contact-details {
          padding: 14px;
          background: var(--surface-hover);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 10px;
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
          font-weight: 800;
        }
        .value-link {
          font-weight: 800;
          color: var(--primary);
          text-decoration: none;
        }
        .btn-whatsapp {
          background: #25d366;
          color: white;
          padding: 14px;
          border-radius: var(--radius-md);
          text-align: center;
          font-weight: 800;
          box-shadow: 0 4px 14px 0 rgba(37, 211, 102, 0.25);
          text-decoration: none;
          transition: transform 0.15s ease;
        }
        .btn-whatsapp:hover {
          transform: translateY(-2px);
        }

        /* Floating Sticky Mobile Bottom Action Bar */
        .mobile-floating-action-bar {
          display: none;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
        }
        .modal-content {
          max-width: 440px;
          width: 100%;
          padding: 28px;
          border-radius: var(--radius-xl, 20px);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .modal-header h2 {
          font-size: 20px;
          font-weight: 800;
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
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .plan-comparison-card {
          padding: 20px;
          border: 1px solid var(--primary);
          border-radius: var(--radius-lg, 16px);
          background: var(--primary-light);
          position: relative;
        }
        .plan-badge-popular {
          position: absolute;
          top: -10px;
          right: 20px;
          background: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .plan-price {
          font-size: 28px;
          font-weight: 900;
          color: var(--primary);
          margin: 10px 0;
        }
        .plan-price .period {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .plan-perks {
          list-style: none;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        /* In-Page Owner Contact Card */
        .owner-inpage-card {
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: var(--radius-lg, 16px);
          padding: 24px;
        }
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
          background: var(--surface-hover, #f8fafc);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .contact-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .contact-item-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .contact-item-val {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .link-phone {
          color: var(--primary);
          text-decoration: none;
        }
        .link-phone:hover {
          text-decoration: underline;
        }
        .contact-action-buttons-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-call-direct {
          flex: 1;
          min-width: 180px;
          background: var(--primary, #6366f1);
          color: white;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.25);
          transition: transform 0.15s ease;
        }
        .btn-call-direct:hover {
          transform: translateY(-2px);
        }
        .btn-whatsapp-direct {
          flex: 1;
          min-width: 180px;
          background: #25d366;
          color: white;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px 0 rgba(37, 211, 102, 0.25);
          transition: transform 0.15s ease;
        }
        .btn-whatsapp-direct:hover {
          transform: translateY(-2px);
        }

        /* ─── Responsive Media Queries ─────────────────────────────────────── */
        @media (max-width: 900px) {
          .detail-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .quick-specs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px;
          }
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }

          .detail-page-container {
            padding: 0 0 120px 0;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .detail-layout, .info-column {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }

          /* Mobile Top Bar */
          .mobile-top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            z-index: 20;
          }
          .back-circle-btn, .share-circle-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            border: 1px solid rgba(255,255,255,0.2);
            text-decoration: none;
            cursor: pointer;
          }

          /* Hero Gallery on Mobile */
          .gallery-wrapper {
            margin-bottom: 18px;
            width: 100%;
            box-sizing: border-box;
          }
          .image-gallery-card {
            border-radius: 0;
            aspect-ratio: 4 / 3;
            max-height: 340px;
            width: 100%;
          }
          .thumbnail-strip {
            padding: 0 16px;
            margin-top: 10px;
          }
          .thumb-btn {
            flex: 0 0 75px;
            height: 52px;
          }

          /* Content spacing on mobile */
          .property-main-header,
          .details-card {
            padding-left: 16px;
            padding-right: 16px;
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
          }

          .detail-title {
            font-size: 20px;
            line-height: 1.4;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .price-tag {
            font-size: 22px;
          }
          .location-tag {
            font-size: 13.5px;
          }

          .quick-specs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
            padding: 0 16px !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .spec-card {
            padding: 10px 10px !important;
            border-radius: 12px !important;
            gap: 8px !important;
            min-width: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .spec-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 16px !important;
            border-radius: 8px !important;
            flex-shrink: 0 !important;
          }
          .spec-text {
            min-width: 0 !important;
            flex: 1 !important;
          }
          .spec-label {
            font-size: 9.5px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .spec-value {
            font-size: 12.5px !important;
            white-space: normal !important;
            word-break: break-word !important;
            line-height: 1.25 !important;
          }

          .details-card {
            border-radius: 0;
            border-left: none;
            border-right: none;
            margin-bottom: 12px;
          }
          .details-card h2 {
            font-size: 17px;
          }
          .amenities-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            padding: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .amenity-chip {
            padding: 10px 10px !important;
            font-size: 12px !important;
            min-width: 0 !important;
            box-sizing: border-box;
          }

          /* Floating Mobile Action Bar (Positioned above bottom nav) */
          .mobile-floating-action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: fixed;
            bottom: 64px;
            left: 0;
            right: 0;
            z-index: 990;
            background: rgba(15, 23, 42, 0.96);
            backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            padding: 10px 14px;
            box-shadow: 0 -8px 20px -4px rgba(0,0,0,0.3);
          }
          .bar-price-col {
            display: flex;
            flex-direction: column;
          }
          .bar-price {
            font-size: 17px;
            font-weight: 900;
            color: #ffffff;
          }
          .bar-sub {
            font-size: 10.5px;
            color: #94a3b8;
          }
          .bar-buttons-col {
            display: flex;
            gap: 8px;
          }
          .btn-mobile-wa {
            background: #25d366;
            color: white;
            padding: 9px 12px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 800;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
          }
          .btn-mobile-call {
            background: var(--primary, #6366f1);
            color: white;
            padding: 9px 14px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 800;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
          }
        }
      `}} />
    </div>
  );
}
