"use client";

import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/lib/useToast";
import { savePublishedProperty } from "@/lib/propertyStore";
import { api } from "@/lib/api";

export default function NewPropertyWizard() {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { success, info } = useToast();

  // Authentication Guard — User must be logged in to post a property
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      window.location.href = `/login?next=/dashboard/properties/new`;
    }
  }, []);
  
  // Step 1 & 2: Purpose & Type
  const [purpose, setPurpose] = useState<"rent" | "sell">("rent");
  const [propertyType, setPropertyType] = useState("Apartment");

  // Step 3: Location
  const [city, setCity] = useState("Bhopal");
  const [area, setArea] = useState("");
  const [locality, setLocality] = useState("");

  // Step 4: Residential Specs
  const [bhk, setBhk] = useState(2);
  const [size, setSize] = useState("");
  const [bathrooms, setBathrooms] = useState(2);
  const [furnished, setFurnished] = useState("Fully Furnished");
  const [parking, setParking] = useState("1 Covered Car Parking");
  const [floor, setFloor] = useState("1st Floor");
  const [balconies, setBalconies] = useState(1);

  // Step 4: Commercial Shop Specs
  const [frontage, setFrontage] = useState("15 ft");
  const [shopFloor, setShopFloor] = useState("Ground Floor");
  const [roadFacing, setRoadFacing] = useState("Main Road Facing (High Visibility)");
  const [suitableFor, setSuitableFor] = useState("Retail Store / Showroom / Pharmacy");
  const [shopWashroom, setShopWashroom] = useState("Private Washroom");

  // Step 4: Office Space Specs
  const [cabins, setCabins] = useState("2 Cabins");
  const [workstations, setWorkstations] = useState("15-25 Workstations");
  const [conferenceRoom, setConferenceRoom] = useState("Yes");
  const [pantry, setPantry] = useState("Dry Pantry");
  const [powerBackup, setPowerBackup] = useState("100% Full Power Backup");

  // Step 4: Plot / Land Specs
  const [dimensions, setDimensions] = useState("30 × 50 ft");
  const [boundaryWall, setBoundaryWall] = useState("Yes (Constructed)");
  const [cornerPlot, setCornerPlot] = useState("Corner Plot (Dual Road)");
  const [facing, setFacing] = useState("East Facing");

  // Step 4: Warehouse Specs
  const [ceilingHeight, setCeilingHeight] = useState("24 ft");
  const [loadingDocks, setLoadingDocks] = useState("2 Loading Bays");
  const [truckAccess, setTruckAccess] = useState("Direct 40ft Container Access");

  // Step 4: PG / Hostel Specs
  const [pgFor, setPgFor] = useState("Any (Boys / Girls / Working)");
  const [roomType, setRoomType] = useState("Single & Double Sharing");
  const [foodIncluded, setFoodIncluded] = useState("Breakfast & Dinner Included");

  // Step 5: Pricing
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [maintenance, setMaintenance] = useState("");

  // Step 6: Photos
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Step 7: Description
  const [description, setDescription] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Step 8: Contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

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

  // Photo handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newUrls].slice(0, 10));
      success(`Added ${newFiles.length} photo(s) successfully! 📸`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      if (newFiles.length > 0) {
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        setPhotos(prev => [...prev, ...newUrls].slice(0, 10));
        success(`Added ${newFiles.length} photo(s) from drag & drop! 📸`);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    info("Photo removed.");
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setPhotos(prev => {
      const item = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [item, ...rest];
    });
    success("Set as primary cover photo! ⭐");
  };

  const handleAddSamplePhotos = () => {
    let samples: string[] = [];
    if (propertyType === "Shop") {
      samples = [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80",
      ];
    } else if (propertyType === "Office Space") {
      samples = [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      ];
    } else if (propertyType === "Plot / Land") {
      samples = [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&w=800&q=80",
      ];
    } else if (propertyType === "Warehouse") {
      samples = [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80",
      ];
    } else {
      samples = [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      ];
    }
    setPhotos(samples);
    success(`Loaded ${samples.length} high-resolution ${propertyType} sample photos! 📸`);
  };

  const handleAiGenerate = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      let generatedText = "";

      if (propertyType === "Shop") {
        generatedText = `Prime commercial retail shop with ${size || "650"} sqft carpet area situated in the prime high-footfall commercial corridor of ${area || "MP Nagar"}, ${city}. Features ${frontage} frontage on the ${shopFloor.toLowerCase()} with ${roadFacing.toLowerCase()}. Equipped with ${shopWashroom.toLowerCase()}, ideal for ${suitableFor.toLowerCase()}. Excellent visibility and customer footfall guaranteed.`;
      } else if (propertyType === "Office Space") {
        generatedText = `Modern commercial office space spanning ${size || "1500"} sqft in the prestigious business hub of ${area || "Arera Colony"}, ${city}. Fully setup with ${cabins}, ${workstations}, ${conferenceRoom === "Yes" ? "dedicated conference room" : "meeting zone"}, ${pantry.toLowerCase()}, and ${powerBackup.toLowerCase()}. Ready for immediate corporate setup.`;
      } else if (propertyType === "Plot / Land") {
        generatedText = `Premium residential / commercial plot measuring ${size || "1500"} sqft (${dimensions}) in the rapidly developing area of ${area || "Kolar Road"}, ${city}. Features ${facing}, ${boundaryWall === "Yes (Constructed)" ? "secure boundary wall" : "clear demarcation"}, and ${cornerPlot.toLowerCase()}. Clear legal titles, RERA compliant, ready for immediate registration & construction.`;
      } else if (propertyType === "Warehouse") {
        generatedText = `High-capacity industrial warehouse offering ${size || "5000"} sqft covered storage in ${area || "Industrial Area"}, ${city}. Features ${ceilingHeight} clear height, ${loadingDocks}, heavy-duty concrete flooring, and ${truckAccess.toLowerCase()}. Ideal for logistics, FMCG distribution, and 3PL operations.`;
      } else if (propertyType === "PG / Hostel") {
        generatedText = `Comfortable and fully-managed PG / Coliving space in ${area || "Indrapuri"}, ${city} available for ${pgFor.toLowerCase()}. Offers ${roomType.toLowerCase()} with ${foodIncluded.toLowerCase()}, high-speed Wi-Fi, 24/7 security, power backup, and daily housekeeping.`;
      } else {
        generatedText = `Stunning modern ${bhk} BHK ${propertyType} located in the premium residential locality of ${area || "Arera Colony"}, ${city}. Spans a spacious ${size || "1200"} sqft with ${furnished.toLowerCase()} finishes, ${bathrooms} bathrooms, ${balconies} balcony, positioned on the ${floor.toLowerCase()}. Excellent ventilation, 24/7 water supply, reserved parking, and close to top schools & shopping.`;
      }

      setDescription(generatedText);
      setIsAiGenerating(false);
    }, 1200);
  };

  const handlePublish = async () => {
    const propertyId = Date.now();
    const finalPriceNum = parseFloat(price) || (purpose === "rent" ? 25000 : 8500000);
    const finalPriceStr = purpose === "rent" 
      ? `₹${finalPriceNum.toLocaleString("en-IN")} / Month`
      : (finalPriceNum >= 10000000 
          ? `₹${(finalPriceNum / 10000000).toFixed(2)} Cr` 
          : `₹${(finalPriceNum / 100000).toFixed(0)} Lakh`);

    let specsSummary = "";
    if (propertyType === "Shop") {
      specsSummary = `${size || "650"} sqft | ${frontage} Front | ${shopFloor} | ${parking || "Roadside Parking"}`;
    } else if (propertyType === "Office Space") {
      specsSummary = `${size || "1500"} sqft | ${cabins} | ${workstations} | ${parking}`;
    } else if (propertyType === "Plot / Land") {
      specsSummary = `${size || "1500"} sqft | ${dimensions} | ${facing}`;
    } else {
      specsSummary = `${bhk} Beds | ${bathrooms} Baths | ${size || "1200"} sqft | ${parking}`;
    }

    const userIdentifier = typeof window !== "undefined" ? localStorage.getItem("user_email") || localStorage.getItem("user_mobile") || "my_account" : "my_account";

    const newPropertyObj = {
      id: propertyId,
      ownerId: userIdentifier,
      ownerEmail: userIdentifier,
      title: getPreviewTitle(),
      price: finalPriceStr,
      priceNum: finalPriceNum,
      purpose: purpose,
      type: propertyType,
      bhk: ["Apartment", "Villa / House", "Independent Floor"].includes(propertyType) ? bhk : 0,
      bathrooms: bathrooms,
      furnished: furnished,
      parking: parking,
      size: size || (purpose === "rent" ? "1200" : "1500"),
      location: `${locality ? locality + ", " : ""}${area || "Arera Colony"}, ${city}`,
      specs: specsSummary,
      image: photos[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      photos: photos,
      description: description || "Verified listing posted by owner on AuraHomes portal.",
      contactName: contactName || "Property Owner",
      contactPhone: contactPhone || "9893024190",
      created_at: new Date().toISOString(),
      views: 1,
      leads: 0,
      status: "published",
    };

    // Save to persistent client store so it appears in Search, Buy, Rent, and Dashboard
    savePublishedProperty(newPropertyObj);

    // Send full payload including images and location to cloud database
    try {
      await api.createProperty({
        title: newPropertyObj.title,
        price: finalPriceNum,
        purpose: purpose,
        category: ["Shop", "Office Space", "Warehouse"].includes(propertyType) ? "commercial" : "residential",
        property_type: propertyType,
        bhk: newPropertyObj.bhk,
        area_sqft: parseFloat(size) || 1200,
        bathrooms: bathrooms,
        description: newPropertyObj.description,
        images: photos,
        image: photos[0] || newPropertyObj.image,
        city: city,
        locality: locality || area,
        contact_name: contactName || "Property Owner",
        contact_phone: contactPhone || "9893024190",
      });
    } catch (err) {
      console.warn("Cloud database sync note:", err);
    }

    success("🎉 Property published successfully! It is now live in the search & buy listings.");
    setTimeout(() => {
      window.location.href = `/search?purpose=${purpose === "sell" ? "sell" : "rent"}`;
    }, 1200);
  };

  const getPreviewTitle = () => {
    if (propertyType === "Shop") {
      return `${size || "650"} sqft Commercial Retail Shop in ${area || "MP Nagar"}, ${city}`;
    }
    if (propertyType === "Office Space") {
      return `${size || "1500"} sqft Commercial Office Space in ${area || "Arera Colony"}, ${city}`;
    }
    if (propertyType === "Plot / Land") {
      return `${size || "1500"} sqft ${facing} Plot / Land in ${area || "Kolar Road"}, ${city}`;
    }
    if (propertyType === "Warehouse") {
      return `${size || "5000"} sqft Industrial Warehouse in ${area || "Industrial Area"}, ${city}`;
    }
    if (propertyType === "PG / Hostel") {
      return `Premium PG / Coliving Space (${roomType}) in ${area || "Indrapuri"}, ${city}`;
    }
    return `${bhk} BHK ${propertyType} in ${area || "Arera Colony"}, ${city}`;
  };

  return (
    <div className="wizard-page-container fade-in">
      {/* Hidden File Picker Input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        accept="image/jpeg,image/png,image/webp,image/jpg" 
        onChange={handleFileSelect} 
        style={{ display: "none" }} 
      />

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
        {/* Step 1: Purpose */}
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

        {/* Step 2: Property Type */}
        {step === 2 && (
          <div className="step-content fade-in">
            <h2>Step 2 — Property Type</h2>
            <p className="step-intro-text">Select your property category to customize the listing specifications.</p>
            <div className="type-grid">
              {["Apartment", "Villa / House", "Independent Floor", "Shop", "Office Space", "Plot / Land", "Warehouse", "PG / Hostel"].map((t) => (
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

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="step-content fade-in">
            <h2>Step 3 — Location Details</h2>
            <p className="step-intro-text">Specify where your {propertyType} is situated.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bhopal" />
              </div>
              <div className="form-group">
                <label>Area / Main Locality</label>
                <input type="text" placeholder="e.g. Arera Colony, MP Nagar, Vijay Nagar" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Locality Sub-area / Sector</label>
                <input type="text" placeholder="e.g. Zone-II, Sector E-5, Main Market" value={locality} onChange={(e) => setLocality(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: DYNAMIC SPECIFICATIONS */}
        {step === 4 && (
          <div className="step-content fade-in">
            <h2>Step 4 — {propertyType} Specifications</h2>
            <p className="step-intro-text">
              Provide exact dimensions and features tailored for <strong>{propertyType}</strong>.
            </p>

            {/* RETAIL SHOP FORM */}
            {propertyType === "Shop" && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Carpet Area (sqft)</label>
                  <input type="text" placeholder="e.g. 650" value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Frontage / Shop Width</label>
                  <input type="text" placeholder="e.g. 15 ft, 20 ft" value={frontage} onChange={(e) => setFrontage(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Floor Location</label>
                  <select value={shopFloor} onChange={(e) => setShopFloor(e.target.value)}>
                    <option value="Ground Floor">Ground Floor (Prime Access)</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="Basement">Basement Level</option>
                    <option value="Mezzanine">Mezzanine Floor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Road / Market Orientation</label>
                  <select value={roadFacing} onChange={(e) => setRoadFacing(e.target.value)}>
                    <option value="Main Road Facing (High Visibility)">Main Road Facing (High Visibility)</option>
                    <option value="Inside Commercial Mall">Inside Commercial Mall / Complex</option>
                    <option value="Market Lane / Corner">Market Lane / Corner Location</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Suitable Business Categories</label>
                  <input type="text" placeholder="e.g. Retail Showroom, Pharmacy, Grocery, Cafe, Salon" value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Washroom Availability</label>
                  <select value={shopWashroom} onChange={(e) => setShopWashroom(e.target.value)}>
                    <option value="Private Washroom">Private Washroom Inside Shop</option>
                    <option value="Shared Complex Washroom">Shared Complex Washroom</option>
                    <option value="No Washroom">No Dedicated Washroom</option>
                  </select>
                </div>
              </div>
            )}

            {/* COMMERCIAL OFFICE SPACE FORM */}
            {propertyType === "Office Space" && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Total Office Area (sqft)</label>
                  <input type="text" placeholder="e.g. 1800" value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Private Cabins</label>
                  <select value={cabins} onChange={(e) => setCabins(e.target.value)}>
                    <option value="1 Cabin">1 Private Cabin</option>
                    <option value="2 Cabins">2 Private Cabins</option>
                    <option value="3+ Cabins">3+ Cabins</option>
                    <option value="Open Hall Layout">Open Hall / Zero Cabins</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Workstation Capacity</label>
                  <input type="text" placeholder="e.g. 15-25 Seats" value={workstations} onChange={(e) => setWorkstations(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Conference / Meeting Room</label>
                  <select value={conferenceRoom} onChange={(e) => setConferenceRoom(e.target.value)}>
                    <option value="Yes">Yes, Dedicated Conference Room</option>
                    <option value="No">No Meeting Room</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pantry & Cafeteria</label>
                  <select value={pantry} onChange={(e) => setPantry(e.target.value)}>
                    <option value="Dry Pantry">Dry Pantry (Tea/Coffee Station)</option>
                    <option value="Wet Pantry">Wet Pantry with Sink & Cabinets</option>
                    <option value="Shared Cafeteria">Shared Complex Cafeteria</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Power Backup</label>
                  <select value={powerBackup} onChange={(e) => setPowerBackup(e.target.value)}>
                    <option value="100% Full Power Backup">100% Full DG Power Backup</option>
                    <option value="Partial Backup">Partial Inverter Backup</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            )}

            {/* PLOT / LAND FORM */}
            {propertyType === "Plot / Land" && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Plot Area (sqft / sq yards)</label>
                  <input type="text" placeholder="e.g. 1500 sqft (166 sq yards)" value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Dimensions (Length × Breadth)</label>
                  <input type="text" placeholder="e.g. 30 × 50 ft" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Boundary Wall</label>
                  <select value={boundaryWall} onChange={(e) => setBoundaryWall(e.target.value)}>
                    <option value="Yes (Constructed)">Yes (Full Boundary Wall Constructed)</option>
                    <option value="Demarcated Only">Demarcated / Pillars Only</option>
                    <option value="Open Plot">Open Plot</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Corner Plot / Road Width</label>
                  <select value={cornerPlot} onChange={(e) => setCornerPlot(e.target.value)}>
                    <option value="Corner Plot (Dual Road)">Corner Plot (Dual Road Access)</option>
                    <option value="Standard Main Road Plot">Standard Plot (30ft+ Front Road)</option>
                    <option value="Gated Colony Plot">Gated Colony Plot</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Plot Facing Direction</label>
                  <select value={facing} onChange={(e) => setFacing(e.target.value)}>
                    <option value="East Facing">East Facing (Auspicious / Vastu Compliant)</option>
                    <option value="North Facing">North Facing</option>
                    <option value="West Facing">West Facing</option>
                    <option value="South Facing">South Facing</option>
                  </select>
                </div>
              </div>
            )}

            {/* INDUSTRIAL WAREHOUSE FORM */}
            {propertyType === "Warehouse" && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Covered Storage Area (sqft)</label>
                  <input type="text" placeholder="e.g. 5000" value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Clear Ceiling Height (ft)</label>
                  <input type="text" placeholder="e.g. 24 ft, 30 ft" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Loading Docks / Bays</label>
                  <select value={loadingDocks} onChange={(e) => setLoadingDocks(e.target.value)}>
                    <option value="1 Loading Bay">1 Loading Bay</option>
                    <option value="2 Loading Bays">2 Loading Bays</option>
                    <option value="4+ Loading Bays">4+ Loading Bays</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Truck & Trailer Access</label>
                  <select value={truckAccess} onChange={(e) => setTruckAccess(e.target.value)}>
                    <option value="Direct 40ft Container Access">Direct 40ft Multi-Axle Container Access</option>
                    <option value="Standard Truck Access">Standard 20ft Truck Access</option>
                  </select>
                </div>
              </div>
            )}

            {/* PG / HOSTEL FORM */}
            {propertyType === "PG / Hostel" && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Available For</label>
                  <select value={pgFor} onChange={(e) => setPgFor(e.target.value)}>
                    <option value="Any (Boys / Girls / Working)">Any (Boys / Girls / Working)</option>
                    <option value="Boys Only">Boys / Male Professionals Only</option>
                    <option value="Girls Only">Girls / Female Students Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Room Sharing Options</label>
                  <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                    <option value="Single & Double Sharing">Single & Double Sharing</option>
                    <option value="Single Private Room Only">Single Private Room Only</option>
                    <option value="Triple / Dormitory Sharing">Triple / Dormitory Sharing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Food & Mess Facilities</label>
                  <select value={foodIncluded} onChange={(e) => setFoodIncluded(e.target.value)}>
                    <option value="Breakfast & Dinner Included">Breakfast & Dinner Included</option>
                    <option value="All 3 Meals Included">All 3 Meals (Breakfast, Lunch, Dinner)</option>
                    <option value="Self Cooking / No Food">Self Cooking / Kitchen Access</option>
                  </select>
                </div>
              </div>
            )}

            {/* STANDARD RESIDENTIAL FORM */}
            {["Apartment", "Villa / House", "Independent Floor"].includes(propertyType) && (
              <div className="form-grid">
                <div className="form-group">
                  <label>BHK Configuration</label>
                  <select value={bhk} onChange={(e) => setBhk(Number(e.target.value))}>
                    <option value={1}>1 BHK</option>
                    <option value={2}>2 BHK</option>
                    <option value={3}>3 BHK</option>
                    <option value={4}>4 BHK</option>
                    <option value={5}>5+ BHK / Penthouse</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Carpet Area (sqft)</label>
                  <input type="text" placeholder="e.g. 1200" value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Number of Bathrooms</label>
                  <select value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}>
                    <option value={1}>1 Bathroom</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={3}>3 Bathrooms</option>
                    <option value={4}>4+ Bathrooms</option>
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
                <div className="form-group">
                  <label>Floor Level</label>
                  <select value={floor} onChange={(e) => setFloor(e.target.value)}>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd to 4th Floor">2nd to 4th Floor</option>
                    <option value="5th Floor and Above">5th Floor and Above</option>
                    <option value="Top Floor / Penthouse">Top Floor / Penthouse</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Balconies</label>
                  <select value={balconies} onChange={(e) => setBalconies(Number(e.target.value))}>
                    <option value={0}>0 Balconies</option>
                    <option value={1}>1 Balcony</option>
                    <option value={2}>2 Balconies</option>
                    <option value={3}>3+ Balconies</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Parking Facility</label>
                  <select value={parking} onChange={(e) => setParking(e.target.value)}>
                    <option value="1 Covered Car Parking">1 Covered Car Parking (Reserved)</option>
                    <option value="2 Covered Car Parking">2 Covered Car Parking (Reserved)</option>
                    <option value="Open Car Parking">Open Car Parking</option>
                    <option value="2-Wheeler Parking Only">2-Wheeler Parking Only</option>
                    <option value="No Dedicated Parking">No Dedicated Parking / Street</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Pricing */}
        {step === 5 && (
          <div className="step-content fade-in">
            <h2>Step 5 — Pricing & Financials</h2>
            <p className="step-intro-text">Specify details relating to expected price for your {propertyType}.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>{purpose === "rent" ? "Expected Monthly Rent (₹)" : "Expected Total Price (₹)"}</label>
                <input type="text" placeholder={purpose === "rent" ? "e.g. 25000" : "e.g. 8500000"} value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              {purpose === "rent" ? (
                <>
                  <div className="form-group">
                    <label>Security Deposit (₹)</label>
                    <input type="text" placeholder="e.g. 50000" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Monthly Maintenance (₹)</label>
                    <input type="text" placeholder="e.g. 1500" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Booking / Token Amount (₹)</label>
                    <input type="text" placeholder="e.g. 100000" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Price Negotiable?</label>
                    <select>
                      <option value="yes">Yes, Slightly Negotiable</option>
                      <option value="fixed">Fixed Price</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Photos Upload with Full Interactive Engine */}
        {step === 6 && (
          <div className="step-content fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
              <h2>Step 6 — Photos Upload</h2>
              <span className="photo-count-badge">
                📸 {photos.length} / 10 Photos Uploaded
              </span>
            </div>
            <p className="step-intro-text">Upload high-quality images of your {propertyType}. First photo is the main cover image.</p>
            
            {/* Drag & Drop Upload Zone */}
            <div 
              className={`photo-upload-zone ${isDragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <span className="upload-icon">📸</span>
              <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                Drag & drop photos here, or <span style={{ color: "var(--primary)", textDecoration: "underline" }}>browse files</span>
              </p>
              <span className="file-hint">Supported formats: JPG, PNG, WebP. High resolution photos receive 3x more contact unlocks.</span>
            </div>

            {/* Quick Demo Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                + Choose More Photos from Device
              </button>
              <button 
                type="button" 
                className="btn-outline-sm"
                onClick={handleAddSamplePhotos}
              >
                ✨ Load {propertyType} Sample Photos (Demo)
              </button>
            </div>

            {/* Uploaded Photos Grid */}
            {photos.length > 0 && (
              <div className="uploaded-photos-grid">
                {photos.map((url, idx) => (
                  <div key={idx} className={`photo-thumb-card ${idx === 0 ? "is-cover" : ""}`}>
                    <img src={url} alt={`Upload ${idx + 1}`} />
                    
                    {idx === 0 ? (
                      <span className="cover-badge">⭐ Main Cover Photo</span>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-set-cover"
                        onClick={(e) => { e.stopPropagation(); handleSetCover(idx); }}
                        title="Set as cover photo"
                      >
                        Set as Cover
                      </button>
                    )}

                    <button 
                      type="button" 
                      className="btn-delete-photo"
                      onClick={(e) => { e.stopPropagation(); handleRemovePhoto(idx); }}
                      title="Remove this photo"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 7: Description */}
        {step === 7 && (
          <div className="step-content fade-in">
            <h2>Step 7 — Description</h2>
            <p className="step-intro-text">Write a detailed summary of your {propertyType}.</p>
            
            <div className="ai-assist-box">
              <button type="button" className="btn-secondary" onClick={handleAiGenerate} disabled={isAiGenerating}>
                {isAiGenerating ? "Generating description..." : `✨ Generate ${propertyType} Description with AI`}
              </button>
              <span className="ai-hint">Converts your specifications into a high-converting property write-up.</span>
            </div>

            <textarea 
              rows={6}
              className="desc-textarea"
              placeholder={`Tell buyers/tenants about unique points of your ${propertyType}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {/* Step 8: Contact */}
        {step === 8 && (
          <div className="step-content fade-in">
            <h2>Step 8 — Contact Details</h2>
            <p className="step-intro-text">Confirm owner / agent profile details for lead unlocks.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>Contact Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Mobile Number (For verification)</label>
                <input type="tel" placeholder="e.g. 9893024190" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Preview & Publish */}
        {step === 9 && (
          <div className="step-content fade-in">
            <h2>Step 9 — Preview & Publish</h2>
            <p className="step-intro-text">Your property listing is ready to go live! Review summary below.</p>
            
            <div className="preview-summary-card premium-card">
              {/* Preview Photos Carousel / Row */}
              {photos.length > 0 && (
                <div className="preview-photos-strip">
                  {photos.slice(0, 4).map((img, i) => (
                    <div key={i} className="preview-thumb">
                      <img src={img} alt="Preview thumbnail" />
                      {i === 0 && <span className="cover-tag">Cover</span>}
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ marginTop: "16px", fontSize: "18px", fontWeight: 700 }}>{getPreviewTitle()}</h3>
              
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "12px 0" }}>
                <span style={{ background: "var(--surface)", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--border)" }}>
                  📐 {size || "1200"} Sq.Ft
                </span>
                <span style={{ background: "var(--surface)", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--border)" }}>
                  🛋️ {furnished}
                </span>
                <span style={{ background: "var(--surface)", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--border)" }}>
                  🚿 {bathrooms} Baths
                </span>
                <span style={{ background: "var(--surface)", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--border)" }}>
                  🚗 {parking}
                </span>
              </div>

              <p className="preview-price">
                {purpose === "rent" ? "Expected Rent:" : "Expected Price:"} ₹{price || (purpose === "rent" ? "25,000 / Month" : "85,00,000")}
              </p>
              <p className="preview-desc-snippet">{description || "No description generated yet."}</p>
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
        
        .wizard-content-box {
          padding: 40px;
        }
        .step-content h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .step-intro-text {
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        
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
          cursor: pointer;
          background: var(--surface);
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
          cursor: pointer;
        }
        .type-btn:hover, .type-btn.selected {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
        }
        
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
          font-size: 14px;
          outline: none;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary);
        }

        /* Photo Upload Zone & Grid */
        .photo-count-badge {
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 4px 12px;
          border-radius: 99px;
        }
        .photo-upload-zone {
          padding: 40px 24px;
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          text-align: center;
          background: var(--surface-hover);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .photo-upload-zone:hover, .photo-upload-zone.dragging {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .upload-icon {
          font-size: 44px;
          margin-bottom: 12px;
          display: block;
        }
        .file-hint {
          font-size: 11.5px;
          color: var(--text-muted);
          display: block;
          margin-top: 8px;
        }

        .uploaded-photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 14px;
          margin-top: 20px;
        }
        .photo-thumb-card {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 2px solid var(--border);
          background: #000;
        }
        .photo-thumb-card.is-cover {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary);
        }
        .photo-thumb-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cover-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background: var(--primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .btn-set-cover {
          position: absolute;
          bottom: 6px;
          left: 6px;
          background: rgba(0,0,0,0.7);
          color: white;
          border: none;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-set-cover:hover {
          background: var(--primary);
        }
        .btn-delete-photo {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .btn-delete-photo:hover {
          transform: scale(1.1);
        }

        .btn-outline-sm {
          padding: 6px 14px;
          background: none;
          border: 1px solid var(--primary);
          color: var(--primary);
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-outline-sm:hover {
          background: var(--primary-light);
        }

        /* Step 9 Preview Photos */
        .preview-photos-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .preview-thumb {
          position: relative;
          height: 80px;
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .preview-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cover-tag {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: var(--primary);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 3px;
        }

        .ai-assist-box {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
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
          font-size: 14px;
          line-height: 1.6;
          outline: none;
        }
        .desc-textarea:focus {
          border-color: var(--primary);
        }
        
        .preview-summary-card {
          padding: 24px;
          background: var(--primary-light);
          border-color: var(--primary);
          border-radius: var(--radius-md);
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
          color: var(--text-secondary);
        }
        .publish-disclosures {
          margin-top: 24px;
          font-size: 12px;
          color: var(--text-muted);
        }
        
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
            padding: 28px 14px;
          }
          .uploaded-photos-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .purpose-select-grid,
          .type-grid,
          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px;
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
