// test_live_demo_property.mjs
const API_URL = "https://aurahomes-backend-tz1c.onrender.com/api/v1";

async function main() {
  console.log("=== Testing Live Property Portal Cloud API ===");

  // 1. Health check
  const healthRes = await fetch("https://aurahomes-backend-tz1c.onrender.com/health");
  console.log("1. Health check status:", healthRes.status);

  // 2. Register/Login as Owner
  const testMobile = "98930" + Math.floor(10000 + Math.random() * 90000);
  const testEmail = `owner_${Date.now()}@aurahomes.in`;
  console.log(`2. Registering demo owner: ${testEmail} / ${testMobile}`);

  let token = "";
  try {
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sanjeev Tyagi",
        email: testEmail,
        mobile: testMobile,
        password: "Password@123",
        user_type: "owner"
      })
    });
    const regData = await regRes.json();
    console.log("   Registration status:", regRes.status, "Token acquired:", !!regData.access_token);
    token = regData.access_token;
  } catch (err) {
    console.error("   Registration error:", err);
  }

  if (!token) {
    console.error("Could not obtain token, aborting.");
    return;
  }

  // 3. Create a Demo Property
  console.log("3. Posting Demo Property to Cloud Database...");
  const newPropPayload = {
    title: "Luxury 3 BHK Penthouse in Arera Colony",
    purpose: "sell",
    category: "residential",
    property_type: "Apartment",
    price: 9500000,
    bhk: 3,
    area_sqft: 1850,
    bathrooms: 3,
    description: "Exclusive top-floor luxury penthouse with panoramic city views, Italian marble, modular kitchen, and 2 covered car parking slots in E-7 Arera Colony.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=750&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&h=750&q=80"
    ],
    city: "Bhopal",
    locality: "E-7 Arera Colony",
    contact_name: "Sanjeev Tyagi",
    contact_phone: testMobile
  };

  let createdPropId = "";
  try {
    const createRes = await fetch(`${API_URL}/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newPropPayload)
    });
    const createData = await createRes.json();
    console.log("   Create Property status:", createRes.status);
    console.log("   Created Property Data:", createData);
    createdPropId = createData.id;
  } catch (err) {
    console.error("   Create Property error:", err);
  }

  // 4. Test Cross-Device Search API (Simulating a Laptop querying the database)
  console.log("4. Simulating Laptop Querying Public Search API...");
  try {
    const searchRes = await fetch(`${API_URL}/search?purpose=sell`);
    const searchData = await searchRes.json();
    console.log("   Search API status:", searchRes.status, "Total results found:", searchData.total);
    const foundInSearch = searchData.results?.find(p => p.id === createdPropId || p.title.includes("Luxury 3 BHK Penthouse"));
    console.log("   Found created demo property in search?", !!foundInSearch);
    if (foundInSearch) {
      console.log("   Search Result item:", foundInSearch);
    }
  } catch (err) {
    console.error("   Search API error:", err);
  }

  // 5. Test Cross-Device Details API (Simulating another user opening the shared link)
  if (createdPropId) {
    console.log(`5. Simulating Another User opening Shared Link for property ${createdPropId}...`);
    try {
      const getRes = await fetch(`${API_URL}/properties/${createdPropId}`);
      const getData = await getRes.json();
      console.log("   Get Property status:", getRes.status);
      console.log("   Loaded Property Details on Other Device:", {
        id: getData.id,
        title: getData.title,
        price: getData.price,
        bhk: getData.bhk,
        area_sqft: getData.area_sqft,
        image: getData.image,
        images: getData.images,
        owner: getData.owner
      });
    } catch (err) {
      console.error("   Get Property error:", err);
    }
  }

  console.log("=== End of Live Test ===");
}

main();
