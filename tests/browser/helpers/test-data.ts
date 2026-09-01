/**
 * Safe Test Data Generator for AuraHomes QA Automation.
 * Generates unique timestamp-based identifiers to prevent test collisions.
 */

export interface QAUser {
  name: string;
  email: string;
  mobile: string;
  password: string;
  userType: "buyer" | "owner" | "agent";
}

export function generateQAUser(role: "buyer" | "owner" | "agent" = "buyer"): QAUser {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);

  return {
    name: `QA Tester ${rand.toUpperCase()}`,
    email: `qa_${role}_${ts}_${rand}@example.test`,
    mobile: `98${randomDigits}`,
    password: "Password@123",
    userType: role,
  };
}

export function generateQAProperty(locality: string = "Arera Colony") {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();

  return {
    title: `QA Premium ${rand} Apartment in ${locality}`,
    purpose: "rent" as const,
    propertyType: "Apartment",
    bhk: 3,
    bathrooms: 2,
    size: 1450,
    price: 26000,
    locality: locality,
    city: "Bhopal",
    description: `Automated QA Test Listing generated at ${new Date().toISOString()}. Features full modern amenities, 24x7 security, and clear title.`,
    amenities: ["Covered Parking", "24x7 Security", "Full Power Backup", "High-Speed Lift", "Fitness Center / Gym"],
  };
}
