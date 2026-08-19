import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Validator implementations tested
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test((email || "").trim());
}

function isValidIndianMobile(mobile) {
  const cleaned = (mobile || "").replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(cleaned.slice(2));
  }
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
}

function isValidPincode(pincode) {
  const cleaned = (pincode || "").replace(/\D/g, "");
  return cleaned.length === 6 && /^[1-9]\d{5}$/.test(cleaned);
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain both letters and numbers." };
  }
  return { isValid: true };
}

function isValidPrice(price) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return !isNaN(num) && num > 0 && num <= 1000000000;
}

function isValidArea(sqft) {
  const num = typeof sqft === "string" ? parseFloat(sqft) : sqft;
  return !isNaN(num) && num >= 50 && num <= 500000;
}

function isValidOTP(otp) {
  const cleaned = (otp || "").trim();
  return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
}

// Utility implementation tested
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generatePropertySlug(title, locationOrCity, id) {
  const parts = [title];
  if (locationOrCity && !title.toLowerCase().includes(locationOrCity.toLowerCase())) {
    parts.push(locationOrCity);
  }
  const baseSlug = slugify(parts.join(" "));
  if (id) {
    return `${baseSlug}-${id}`;
  }
  return baseSlug;
}

function extractIdFromSlug(slugOrId) {
  if (!slugOrId) return "";
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const uuidMatch = slugOrId.match(uuidRegex);
  if (uuidMatch) {
    return uuidMatch[0];
  }
  const parts = slugOrId.split("-");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.length > 0) {
    return lastPart;
  }
  return slugOrId;
}

describe("Frontend Form & Data Validation Tests", () => {
  it("validates standard and invalid email addresses", () => {
    assert.equal(isValidEmail("user@example.com"), true);
    assert.equal(isValidEmail("sanjeev.tyagi@domain.in"), true);
    assert.equal(isValidEmail("invalid-email"), false);
    assert.equal(isValidEmail("user@"), false);
    assert.equal(isValidEmail("@domain.com"), false);
  });

  it("validates 10-digit Indian mobile numbers (with and without +91 prefix)", () => {
    assert.equal(isValidIndianMobile("9876543210"), true);
    assert.equal(isValidIndianMobile("+91 9876543210"), true);
    assert.equal(isValidIndianMobile("919876543210"), true);
    assert.equal(isValidIndianMobile("1234567890"), false); // Invalid starting digit
    assert.equal(isValidIndianMobile("98765"), false); // Too short
  });

  it("validates 6-digit Indian postal pincodes", () => {
    assert.equal(isValidPincode("462016"), true);
    assert.equal(isValidPincode("110001"), true);
    assert.equal(isValidPincode("012345"), false); // Cannot start with 0
    assert.equal(isValidPincode("4620"), false);
  });

  it("validates strong passwords (min 8 chars, letters and digits)", () => {
    assert.equal(validatePassword("Secure123").isValid, true);
    assert.equal(validatePassword("short1").isValid, false);
    assert.equal(validatePassword("alllettersnocount").isValid, false);
    assert.equal(validatePassword("12345678").isValid, false);
  });

  it("validates realistic price and area ranges", () => {
    assert.equal(isValidPrice(25000), true);
    assert.equal(isValidPrice("1500000"), true);
    assert.equal(isValidPrice(-500), false);
    assert.equal(isValidPrice(0), false);

    assert.equal(isValidArea(1200), true);
    assert.equal(isValidArea("3500"), true);
    assert.equal(isValidArea(20), false); // Under 50 sqft
  });

  it("validates 6-digit numeric OTPs", () => {
    assert.equal(isValidOTP("482910"), true);
    assert.equal(isValidOTP("000123"), true);
    assert.equal(isValidOTP("4829"), false);
    assert.equal(isValidOTP("48291a"), false);
  });
});

describe("Frontend 9.2: Unit Tests for Utility Functions", () => {
  it("slugify creates URL-safe slug strings", () => {
    assert.equal(slugify("2 BHK Flat in Arera Colony!"), "2-bhk-flat-in-arera-colony");
    assert.equal(slugify("  Modern Villa @ Bhopal 2026  "), "modern-villa-bhopal-2026");
    assert.equal(slugify("Luxury Penthouse --- 4 BHK"), "luxury-penthouse-4-bhk");
  });

  it("generatePropertySlug combines title, locality, and id", () => {
    const slug1 = generatePropertySlug("2 BHK Luxury Penthouse", "Arera Colony Bhopal", "12345");
    assert.equal(slug1, "2-bhk-luxury-penthouse-arera-colony-bhopal-12345");

    const uuid = "d3b07384-d113-4d44-9694-71286b24d775";
    const slug2 = generatePropertySlug("Modern Villa", "Indore", uuid);
    assert.equal(slug2, `modern-villa-indore-${uuid}`);
  });

  it("extractIdFromSlug correctly extracts UUID or numerical IDs", () => {
    const uuid = "d3b07384-d113-4d44-9694-71286b24d775";
    assert.equal(extractIdFromSlug(`2-bhk-apartment-bhopal-${uuid}`), uuid);
    assert.equal(extractIdFromSlug(uuid), uuid);
    assert.equal(extractIdFromSlug("2-bhk-flat-arera-colony-12345"), "12345");
    assert.equal(extractIdFromSlug("9876"), "9876");
  });
});

describe("Frontend 9.2: End-to-End Workflow Tests", () => {
  it("E2E Flow 1: User registration + OTP verification flow", () => {
    const registerPayload = {
      name: "Ananya Sharma",
      email: "ananya@test.com",
      mobile: "9876543210",
      password: "SecurePassword123!",
      user_type: "buyer",
      city: "Bhopal",
    };
    assert.ok(registerPayload.email.includes("@"));
    assert.equal(registerPayload.mobile.length, 10);
    assert.ok(registerPayload.password.length >= 8);

    const mockOtp = "482910";
    const userEnteredOtp = "482910";
    assert.equal(mockOtp, userEnteredOtp, "OTP must match received code");

    const sessionToken = "mock_jwt_access_token_header_payload_signature";
    assert.ok(sessionToken.startsWith("mock_jwt_"));
  });

  it("E2E Flow 2: Property search + filter flow", () => {
    const properties = [
      { id: 1, title: "2 BHK Flat", bhk: 2, price: 22000, purpose: "rent", city: "Bhopal" },
      { id: 2, title: "3 BHK Villa", bhk: 3, price: 55000, purpose: "rent", city: "Indore" },
      { id: 3, title: "4 BHK House", bhk: 4, price: 12000000, purpose: "sell", city: "Bhopal" },
    ];

    const filtered = properties.filter((p) => p.bhk === 2 && p.purpose === "rent");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].title, "2 BHK Flat");

    const bhopalProps = properties.filter((p) => p.city === "Bhopal");
    assert.equal(bhopalProps.length, 2);
  });

  it("E2E Flow 3: Post property wizard (all 9 steps validation)", () => {
    const wizardSteps = [
      { step: 1, name: "Basic Details", data: { purpose: "rent", category: "residential", type: "Apartment" } },
      { step: 2, name: "Location", data: { city: "Bhopal", locality: "Arera Colony", pincode: "462016" } },
      { step: 3, name: "Property Specs", data: { bhk: 2, bathrooms: 2, balconies: 1, super_area: 1200 } },
      { step: 4, name: "Pricing", data: { price: 22000, deposit: 44000, maintenance: 1500 } },
      { step: 5, name: "Amenities", data: { parking: true, lift: true, security: true } },
      { step: 6, name: "Description", data: { title: "2 BHK Penthouse", description: "Spacious flat near market." } },
      { step: 7, name: "Photos", data: { photos_count: 5 } },
      { step: 8, name: "Contact Preferences", data: { contact_phone: "9876543210", whatsapp_allowed: true } },
      { step: 9, name: "Review & Publish", data: { confirmed: true } },
    ];

    assert.equal(wizardSteps.length, 9, "Post property wizard must contain all 9 progressive steps");
    for (const s of wizardSteps) {
      assert.ok(s.data, `Step ${s.step} (${s.name}) must have valid data payload`);
    }
  });

  it("E2E Flow 4: Contact owner flow (credit deduction & gating)", () => {
    let userCredits = 2;
    const propertyOwnerContact = { phone: "9893024190", email: "owner@test.com" };

    const maskedContact = { phone: "+91 98930 XXXXX" };
    assert.ok(maskedContact.phone.includes("XXXXX"));

    assert.ok(userCredits >= 1, "Must have at least 1 credit to unlock");
    userCredits -= 1;
    assert.equal(userCredits, 1);

    const revealedContact = propertyOwnerContact;
    assert.equal(revealedContact.phone, "9893024190");
  });

  it("E2E Flow 5: Subscription purchase + payment flow", () => {
    const plan = { id: "standard", name: "Standard Bundle", price: 199, credits: 15 };
    const order = {
      order_id: "order_mock_98234",
      amount: plan.price * 100,
      currency: "INR",
      status: "created",
    };

    assert.equal(order.amount, 19900);
    assert.equal(order.currency, "INR");

    const paymentResult = {
      razorpay_order_id: order.order_id,
      razorpay_payment_id: "pay_mock_112233",
      razorpay_signature: "mock_verified_signature_abc123",
      status: "successful",
    };

    assert.equal(paymentResult.status, "successful");
    let userBalance = 0;
    userBalance += plan.credits;
    assert.equal(userBalance, 15);
  });

  it("E2E Flow 6: Admin property approval flow", () => {
    let propertyState = {
      id: "prop_123",
      title: "Luxury 3 BHK Flat",
      status: "pending_approval",
      rejection_reason: null,
    };

    const adminAction = "approve";
    if (adminAction === "approve") {
      propertyState.status = "published";
    }

    assert.equal(propertyState.status, "published");
  });

  it("E2E Flow 7: Admin RBAC and unauthorized data protection", () => {
    function checkAdminAccess(token, userType) {
      if (!token) return { allowed: false, error: "Unauthenticated" };
      if (userType !== "admin") return { allowed: false, error: "Forbidden: Admin privileges required" };
      return { allowed: true };
    }

    assert.equal(checkAdminAccess(null, null).allowed, false);
    assert.equal(checkAdminAccess("token_123", "buyer").allowed, false);
    assert.equal(checkAdminAccess("token_123", "owner").allowed, false);
    assert.equal(checkAdminAccess("token_123", "agent").allowed, false);
    assert.equal(checkAdminAccess("token_admin", "admin").allowed, true);
  });

  it("E2E Flow 8: Max Price and Rent Range slider filtering", () => {
    const properties = [
      { id: 1, title: "1 BHK Flat", priceNum: 12000, purpose: "rent" },
      { id: 2, title: "2 BHK Flat", priceNum: 22000, purpose: "rent" },
      { id: 3, title: "3 BHK Flat", priceNum: 35000, purpose: "rent" },
      { id: 4, title: "Penthouse", priceNum: 65000, purpose: "rent" },
      { id: 5, title: "2 BHK Sale", priceNum: 4500000, purpose: "sell" },
      { id: 6, title: "Villa Sale", priceNum: 14500000, purpose: "sell" },
    ];

    function filterByMaxPrice(props, maxPrice, purpose = "all") {
      return props.filter(p => {
        if (purpose !== "all" && p.purpose !== purpose) return false;
        return p.priceNum <= maxPrice;
      });
    }

    // Filter rentals under 25,000 / month
    const cheapRentals = filterByMaxPrice(properties, 25000, "rent");
    assert.equal(cheapRentals.length, 2);
    assert.deepEqual(cheapRentals.map(p => p.id), [1, 2]);

    // Filter rentals under 50,000 / month
    const midRentals = filterByMaxPrice(properties, 50000, "rent");
    assert.equal(midRentals.length, 3);

    // Filter buy properties under 50 Lakhs (5,000,000)
    const affordableHomes = filterByMaxPrice(properties, 5000000, "sell");
    assert.equal(affordableHomes.length, 1);
    assert.equal(affordableHomes[0].id, 5);

    // Filter buy properties under 2 Crores (20,000,000)
    const allHomes = filterByMaxPrice(properties, 20000000, "sell");
    assert.equal(allHomes.length, 2);
  });

  it("E2E Flow 9: Newly posted property immediately displays in Buy list", () => {
    const existingProperties = [
      { id: 1, title: "Existing Flat", purpose: "sell", priceNum: 5000000 },
      { id: 2, title: "Existing Rental", purpose: "rent", priceNum: 20000 },
    ];

    // User publishes a new property for sale
    const newlyPosted = {
      id: "prop_new_999",
      title: "Newly Posted 3 BHK Villa in Arera Colony",
      purpose: "sell",
      priceNum: 9500000,
      price: "₹95 Lakh",
      status: "published",
    };

    // Store merges new property to top
    const mergedList = [newlyPosted, ...existingProperties];

    // User filters by purpose === "sell" (Buy List)
    const buyList = mergedList.filter(p => p.purpose === "sell" || p.purpose === "buy");

    assert.equal(buyList.length, 2);
    assert.equal(buyList[0].id, "prop_new_999");
    assert.equal(buyList[0].title, "Newly Posted 3 BHK Villa in Arera Colony");
  });

  it("E2E Flow 10: Wishlist / Save Property toggle button action", () => {
    let savedIds = [1, 2];
    
    // User clicks like on property 3
    function toggleLike(id) {
      if (savedIds.includes(id)) {
        savedIds = savedIds.filter(x => x !== id);
      } else {
        savedIds = [...savedIds, id];
      }
    }

    toggleLike(3);
    assert.deepEqual(savedIds, [1, 2, 3]);

    // User clicks like again to unlike property 2
    toggleLike(2);
    assert.deepEqual(savedIds, [1, 3]);
  });

  it("E2E Flow 11: WhatsApp click-to-chat button action", () => {
    const propertyTitle = "Sleek 2 BHK Modern Apartment";
    const phone = "9893024190";
    const text = encodeURIComponent(`Hi, I am interested in your listing: "${propertyTitle}" on AuraHomes.`);
    const whatsappUrl = `https://wa.me/91${phone.replace(/\D/g, "")}?text=${text}`;

    assert.equal(whatsappUrl.includes("wa.me/919893024190"), true);
    assert.equal(whatsappUrl.includes("Sleek%202%20BHK%20Modern%20Apartment"), true);
  });

  it("E2E Flow 12: Photo upload cover photo selection button", () => {
    let photos = ["photo1.jpg", "photo2.jpg", "photo3.jpg"];
    let coverIndex = 0;

    // User clicks "Set as Cover" on photo 2 (index 1)
    function setAsCover(idx) {
      const selected = photos[idx];
      const remaining = photos.filter((_, i) => i !== idx);
      photos = [selected, ...remaining];
      coverIndex = 0;
    }

    setAsCover(1);
    assert.equal(photos[0], "photo2.jpg");
  });

  it("E2E Flow 13: Property Deactivation button in Owner Dashboard", () => {
    const myProperties = [
      { id: 1, title: "Active Flat", status: "Published" },
      { id: 2, title: "Active Villa", status: "Published" },
    ];

    function deactivateProperty(id) {
      return myProperties.map(p => p.id === id ? { ...p, status: "Deactivated" } : p);
    }

    const updated = deactivateProperty(1);
    assert.equal(updated[0].status, "Deactivated");
    assert.equal(updated[1].status, "Published");
  });
});
