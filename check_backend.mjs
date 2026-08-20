const API_URL = "https://aurahomes-backend-tz1c.onrender.com";

async function main() {
  console.log("1. Checking Backend Health...");
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    console.log("Health status:", healthRes.status, await healthRes.json());
  } catch (e) {
    console.error("Health check error:", e.message);
  }

  console.log("\n2. Checking Live Properties in Cloud Database (/api/v1/search)...");
  try {
    const searchRes = await fetch(`${API_URL}/api/v1/search`);
    const searchData = await searchRes.json();
    console.log("HTTP status:", searchRes.status);
    console.log("Total properties in cloud database:", searchData.total);
    console.log("Results array:", searchData.results);
  } catch (e) {
    console.error("Search error:", e.message);
  }

  console.log("\n3. Testing Property Upload to Cloud Database (POST /api/v1/properties)...");
  const newPropPayload = {
    title: "Live Test 2 BHK in Arera Colony Bhopal",
    price: 35000,
    purpose: "rent",
    category: "residential",
    property_type: "Apartment",
    bhk: 2,
    area_sqft: 1250,
    bathrooms: 2,
    city: "Bhopal",
    locality: "Arera Colony",
    description: "Cloud database sync test listing",
    contact_name: "Test Owner",
    contact_phone: "9893011223"
  };

  try {
    const createRes = await fetch(`${API_URL}/api/v1/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPropPayload)
    });

    console.log("Create property response status:", createRes.status);
    const createData = await createRes.json().catch(() => ({}));
    console.log("Create property response payload:", createData);
  } catch (e) {
    console.error("Create error:", e.message);
  }

  console.log("\n4. Verifying property in Search after upload...");
  try {
    const searchRes2 = await fetch(`${API_URL}/api/v1/search`);
    const searchData2 = await searchRes2.json();
    console.log("Total properties in cloud database now:", searchData2.total);
    console.log("Results list:", JSON.stringify(searchData2.results, null, 2));
  } catch (e) {
    console.error("Search 2 error:", e.message);
  }
}

main().catch(console.error);
