"use client";

import React, { useState } from "react";

export default function NewPropertyWizard() {
  const [step, setStep] = useState(1);
  
  // Wizard Form States
  const [purpose, setPurpose] = useState<"rent" | "sell">("rent");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [city, setCity] = useState("Bhopal");
  const [area, setArea] = useState("");
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState(2);
  const [size, setSize] = useState("");
  const [bathrooms, setBathrooms] = useState(2);
  const [furnished, setFurnished] = useState("Fully Furnished");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const stepsList = [
    "Purpose",
    "Type",
    "Location",
    "Specs",
    "Pricing",
    "Photos",
    "Description",
    "Contact",
    "Preview"
  ];

  const handleNext = () => {
    if (step < 9) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAiGenerate = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setDescription(
        `Stunning modern ${bhk} BHK ${propertyType} located in the premium locality of ${area || "Arera Colony"}, ${city}. Fully configured with ${furnished.toLowerCase()} finishes, spacious ${bathrooms} bathrooms, independent layout size of ${size || "1200"} sqft. Conveniently positioned near key landmarks and local shopping zones. Ready to move in.`
      );
      setIsAiGenerating(false);
    }, 1500); // simulate delay
  };

  const handlePublish = () => {
    // Redirect to dashboard listings
    window.location.href = "/dashboard/properties";
  };

  return (
    <div className="wizard-page-container fade-in">
      {/* Step Indicator Header */}
      <div className="wizard-progress-bar premium-card">
        <div className="progress-steps-row">
          {stepsList.map((name, index) => (
            <div 
              key={index} 
              className={`step-indicator-dot ${step === index + 1 ? "active" : ""} ${step > index + 1 ? "completed" : ""}`}
            >
              <span className="dot-num">{index + 1}</span>
              <span className="dot-name">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content-box premium-card">
        {/* Step Content */}
        {step === 1 && (
          <div className="step-content fade-in">
            <h2>Step 1 — Property Purpose</h2>
            <p className="step-intro-text">What do you want to do with your property?</p>
            <div className="purpose-select-grid">
              <button 
                type="button" 
                className={`purpose-btn ${purpose === "rent" ? "selected" : ""}`}
                onClick={() => setPurpose("rent")}
              >
                <span className="btn-icon">🔑</span>
                Rent Out / Lease
              </button>
              <button 
                type="button" 
                className={`purpose-btn ${purpose === "sell" ? "selected" : ""}`}
                onClick={() => setPurpose("sell")}
              >
                <span className="btn-icon">💰</span>
                Sell Property
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content fade-in">
            <h2>Step 2 — Property Type</h2>
            <p className="step-intro-text">Select your property category.</p>
            <div className="type-grid">
              {["Apartment", "Villa / House", "Independent Floor", "Plot / Land", "Office Space", "Shop", "Warehouse", "PG / Hostel"].map((t) => (
                <button 
                  key={t}
                  type="button" 
                  className={`type-btn ${propertyType === t ? "selected" : ""}`}
                  onClick={() => setPropertyType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content fade-in">
            <h2>Step 3 — Location</h2>
            <p className="step-intro-text">Specify where your property is situated.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Area / Locality</label>
                <input type="text" placeholder="e.g. Arera Colony" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Locality Sub-area</label>
                <input type="text" placeholder="e.g. Sector E-5" value={locality} onChange={(e) => setLocality(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content fade-in">
            <h2>Step 4 — Specifications</h2>
            <p className="step-intro-text">Provide dimensions and layout counts.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>BHK Size</label>
                <select value={bhk} onChange={(e) => setBhk(Number(e.target.value))}>
                  <option value={1}>1 BHK</option>
                  <option value={2}>2 BHK</option>
                  <option value={3}>3 BHK</option>
                  <option value={4}>4 BHK</option>
                </select>
              </div>
              <div className="form-group">
                <label>Size (sqft)</label>
                <input type="text" placeholder="e.g. 1200" value={size} onChange={(e) => setSize(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <select value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}>
                  <option value={1}>1 Bath</option>
                  <option value={2}>2 Baths</option>
                  <option value={3}>3 Baths</option>
                </select>
              </div>
              <div className="form-group">
                <label>Furnished Status</label>
                <select value={furnished} onChange={(e) => setFurnished(e.target.value)}>
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi Furnished">Semi Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-content fade-in">
            <h2>Step 5 — Pricing</h2>
            <p className="step-intro-text">Specify details relating to expected price.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>{purpose === "rent" ? "Expected Rent / Month" : "Expected Price"}</label>
                <input type="text" placeholder="e.g. 22000" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Security Deposit</label>
                <input type="text" placeholder="e.g. 44000" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Monthly Maintenance</label>
                <input type="text" placeholder="e.g. 1500" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="step-content fade-in">
            <h2>Step 6 — Photos Upload</h2>
            <p className="step-intro-text">Upload listing photos (drag & drop simulation).</p>
            <div className="photo-upload-zone">
              <span className="upload-icon">📸</span>
              <p>Drag and drop property images here, or click to upload</p>
              <span className="file-hint">Supported formats: JPG, PNG. Max size: 5MB per file.</span>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="step-content fade-in">
            <h2>Step 7 — Description</h2>
            <p className="step-intro-text">Write a detailed summary of your listing space.</p>
            
            <div className="ai-assist-box">
              <button type="button" className="btn-secondary" onClick={handleAiGenerate} disabled={isAiGenerating}>
                {isAiGenerating ? "Generating description..." : "✨ Generate Description with AI"}
              </button>
              <span className="ai-hint">Converts your step specs into a highly converting professional write-up.</span>
            </div>

            <textarea 
              rows={6}
              className="desc-textarea"
              placeholder="Tell buyers/tenants about unique points of your property..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {step === 8 && (
          <div className="step-content fade-in">
            <h2>Step 8 — Contact Details</h2>
            <p className="step-intro-text">Confirm owner/agent profile details.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>Contact Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Mobile Number (For verification)</label>
                <input type="text" placeholder="e.g. 9893024190" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="step-content fade-in">
            <h2>Step 9 — Preview & Publish</h2>
            <p className="step-intro-text">Your property is ready to go live! Review summary below.</p>
            
            <div className="preview-summary-card premium-card">
              <h3>{bhk} BHK {propertyType} in {area || "Arera Colony"}, {city}</h3>
              <p className="preview-price">{purpose === "rent" ? "Rent:" : "Price:"} ₹{price || "22,000"} / Month</p>
              <p className="preview-desc-snippet">{description || "No description provided yet."}</p>
            </div>

            <div className="publish-disclosures">
              <p>⚠️ By publishing, you agree to show approximate location representation and consent to verified contact gating.</p>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="wizard-controls-row">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handlePrev}
            style={{ visibility: step === 1 ? "hidden" : "visible" }}
          >
            Previous
          </button>
          
          {step === 9 ? (
            <button type="button" className="btn-primary" onClick={handlePublish}>
              Publish Property Listing
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleNext}>
              Next Step
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .wizard-page-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        
        /* Progress Bar Header */
        .wizard-progress-bar {
          padding: 24px;
          margin-bottom: 30px;
        }
        .progress-steps-row {
          display: flex;
          justify-content: space-between;
          position: relative;
        }
        .step-indicator-dot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          position: relative;
          z-index: 2;
        }
        .step-indicator-dot .dot-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-hover);
          color: var(--text-secondary);
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 700;
          font-size: 13px;
          border: 2px solid var(--border);
          transition: var(--transition-fast);
        }
        .step-indicator-dot .dot-name {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .step-indicator-dot.active .dot-num {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .step-indicator-dot.completed .dot-num {
          background: var(--success);
          border-color: var(--success);
          color: white;
        }
        
        /* Wizard Content Box */
        .wizard-content-box {
          padding: 40px;
        }
        .step-content h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .step-intro-text {
          color: var(--text-secondary);
          margin-bottom: 30px;
        }
        
        /* Step 1 Purpose buttons */
        .purpose-select-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .purpose-btn {
          padding: 40px 24px;
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          transition: var(--transition-normal);
        }
        .purpose-btn:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .purpose-btn.selected {
          border-color: var(--primary);
          background: var(--primary-light);
          box-shadow: var(--shadow-md);
        }
        .purpose-btn .btn-icon {
          font-size: 36px;
        }
        
        /* Step 2 Type Button Grid */
        .type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .type-btn {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--surface);
          text-align: center;
          transition: var(--transition-fast);
        }
        .type-btn:hover, .type-btn.selected {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
        }
        
        /* Form Grids */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .form-group input, .form-group select {
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
        }
        
        /* Photo Zone */
        .photo-upload-zone {
          padding: 60px 40px;
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          text-align: center;
          background: var(--surface-hover);
          cursor: pointer;
        }
        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
        }
        .file-hint {
          font-size: 11px;
          color: var(--text-muted);
          display: block;
          margin-top: 10px;
        }
        
        /* AI Assist Box */
        .ai-assist-box {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .ai-hint {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .desc-textarea {
          width: 100%;
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-family: var(--font-body);
        }
        
        .preview-summary-card {
          padding: 24px;
          background: var(--primary-light);
          border-color: var(--primary);
        }
        .preview-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
          margin: 10px 0;
        }
        .preview-desc-snippet {
          font-size: 14px;
          line-height: 1.6;
        }
        .publish-disclosures {
          margin-top: 24px;
          font-size: 12px;
          color: var(--text-muted);
        }
        
        /* Controls Footer */
        .wizard-controls-row {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
        }

        @media (max-width: 768px) {
          .wizard-page-container {
            padding: 16px 12px;
          }
          .wizard-progress-bar {
            padding: 12px 8px;
            margin-bottom: 16px;
          }
          .progress-steps-row {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: 8px;
            padding-bottom: 6px;
            scrollbar-width: none;
          }
          .progress-steps-row::-webkit-scrollbar {
            display: none;
          }
          .step-indicator-dot {
            min-width: 62px;
            flex: none;
          }
          .dot-name {
            font-size: 9.5px;
          }
          .wizard-content-box {
            padding: 20px 16px;
          }
          .photo-upload-zone {
            padding: 36px 16px;
          }
          .purpose-select-grid,
          .type-select-grid,
          .furnishing-grid {
            grid-template-columns: 1fr !important;
            gap: 10px;
          }
          .wizard-controls-row {
            margin-top: 24px;
            padding-top: 16px;
            gap: 12px;
          }
          .wizard-controls-row button {
            flex: 1;
          }
        }
      `}} />
    </div>
  );
}
