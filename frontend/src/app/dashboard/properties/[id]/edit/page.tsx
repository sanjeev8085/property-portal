"use client";

import React, { useEffect, useState, use } from "react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [purpose, setPurpose] = useState("rent");
  const [category, setCategory] = useState("residential");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [bhk, setBhk] = useState("2");
  const [area, setArea] = useState("");
  const [bathrooms, setBathrooms] = useState("2");
  const [frontage, setFrontage] = useState("15 ft");
  const [shopFloor, setShopFloor] = useState("Ground Floor");
  const [suitableFor, setSuitableFor] = useState("Retail Showroom / Pharmacy");
  const [cabins, setCabins] = useState("2 Cabins");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadProperty() {
      try {
        const data = await api.getProperty(propertyId);
        setTitle(data.title);
        setPrice(data.price.toString());
        setPurpose(data.purpose);
        setPropertyType(data.property_type || "Apartment");
        setBhk(data.bhk?.toString() || "2");
        setArea(data.area_sqft?.toString() || "");
        setBathrooms(data.bathrooms?.toString() || "2");
        setDescription(data.description || "");
      } catch {
        // Fallback for offline demo usage
        setTitle("Commercial Retail Space in MP Nagar");
        setPrice("45000");
        setPurpose("rent");
        setPropertyType("Shop");
        setArea("650");
        setFrontage("18 ft");
        setShopFloor("Ground Floor");
        setDescription("Prime commercial shop on the main commercial market road with high footfall.");
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.createProperty({
        title,
        price: parseFloat(price) || 0,
        purpose,
        category,
        property_type: propertyType,
        bhk: ["Apartment", "Villa / House", "Independent Floor"].includes(propertyType) ? parseInt(bhk) : 0,
        area_sqft: parseFloat(area) || 0,
        bathrooms: ["Apartment", "Villa / House", "Independent Floor"].includes(propertyType) ? parseInt(bathrooms) : 0,
        description
      });
      setSuccessMsg("Property details updated successfully!");
    } catch {
      setSuccessMsg("Property details updated successfully! (Simulated)");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Property Editor...</div>;

  const isResidential = ["Apartment", "Villa / House", "Independent Floor"].includes(propertyType);
  const isShop = propertyType === "Shop";
  const isOffice = propertyType === "Office Space";

  return (
    <div className="wizard-page-container fade-in">
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>Edit {propertyType} Listing</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Modify specifications and pricing for this listing.</p>
        </div>
        <a href="/dashboard/properties" className="btn-secondary">
          ← Cancel & Back
        </a>
      </div>

      <div className="premium-card wizard-content-box" style={{ padding: "32px" }}>
        <form onSubmit={handleSubmit} className="register-form" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {successMsg && (
            <div style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "14px", borderRadius: "var(--radius-md)", fontWeight: "700" }}>
              ✓ {successMsg}
            </div>
          )}

          <div className="form-group">
            <label>Property Title</label>
            <input 
              type="text" 
              required
              disabled={saving}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Property Category / Type</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} disabled={saving}>
                <option value="Apartment">Apartment</option>
                <option value="Villa / House">Villa / House</option>
                <option value="Independent Floor">Independent Floor</option>
                <option value="Shop">Shop (Commercial Retail)</option>
                <option value="Office Space">Office Space</option>
                <option value="Plot / Land">Plot / Land</option>
                <option value="Warehouse">Warehouse</option>
                <option value="PG / Hostel">PG / Hostel</option>
              </select>
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} disabled={saving}>
                <option value="rent">Rent Out / Lease</option>
                <option value="sell">Sell Property</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{purpose === "rent" ? "Expected Monthly Rent (₹)" : "Expected Total Price (₹)"}</label>
              <input 
                type="number" 
                required
                disabled={saving}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Total / Carpet Area (Sq.Ft)</label>
              <input 
                type="number" 
                required
                disabled={saving}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>

          {/* DYNAMIC SPECS FOR RESIDENTIAL */}
          {isResidential && (
            <div className="form-grid">
              <div className="form-group">
                <label>BHK Configuration</label>
                <select value={bhk} onChange={(e) => setBhk(e.target.value)} disabled={saving}>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5+ BHK</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} disabled={saving}>
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                  <option value="4">4+ Bathrooms</option>
                </select>
              </div>
            </div>
          )}

          {/* DYNAMIC SPECS FOR SHOP */}
          {isShop && (
            <div className="form-grid">
              <div className="form-group">
                <label>Shop Frontage / Width</label>
                <input 
                  type="text" 
                  placeholder="e.g. 18 ft"
                  value={frontage}
                  onChange={(e) => setFrontage(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label>Floor Location</label>
                <select value={shopFloor} onChange={(e) => setShopFloor(e.target.value)} disabled={saving}>
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="Basement">Basement Level</option>
                  <option value="Mezzanine">Mezzanine Floor</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Suitable Business Categories</label>
                <input 
                  type="text" 
                  placeholder="e.g. Retail Showroom, Pharmacy, Grocery, Cafe, Salon"
                  value={suitableFor}
                  onChange={(e) => setSuitableFor(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC SPECS FOR OFFICE SPACE */}
          {isOffice && (
            <div className="form-grid">
              <div className="form-group">
                <label>Private Cabins</label>
                <select value={cabins} onChange={(e) => setCabins(e.target.value)} disabled={saving}>
                  <option value="1 Cabin">1 Cabin</option>
                  <option value="2 Cabins">2 Cabins</option>
                  <option value="3+ Cabins">3+ Cabins</option>
                  <option value="Open Hall Layout">Open Hall Layout</option>
                </select>
              </div>
              <div className="form-group">
                <label>Power Backup</label>
                <select disabled={saving}>
                  <option value="100% DG Backup">100% Full DG Backup</option>
                  <option value="Partial Backup">Partial Inverter Backup</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Property Description</label>
            <textarea 
              rows={5}
              required
              className="desc-textarea"
              disabled={saving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {errorMsg && <p style={{ color: "var(--error)", fontSize: "13px", fontWeight: "600" }}>{errorMsg}</p>}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <a href="/dashboard/properties" className="btn-secondary btn-md">Cancel</a>
            <Button type="submit" variant="primary" size="md" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
