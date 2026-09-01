/**
 * Direct Backend API Client for Cross-Verification in Browser Tests.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://aurahomes-backend-tz1c.onrender.com";
const CLEAN_API_BASE = API_BASE.replace(/\/+$/, "").endsWith("/api/v1")
  ? API_BASE.replace(/\/+$/, "")
  : `${API_BASE.replace(/\/+$/, "")}/api/v1`;

export class QAAPIClient {
  static async getCreditBalance(token: string): Promise<number> {
    try {
      const res = await fetch(`${CLEAN_API_BASE}/contacts/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.credits_balance ?? 0;
    } catch {
      return 0;
    }
  }

  static async verifyUnlockStatus(token: string, propertyId: string): Promise<boolean> {
    try {
      const res = await fetch(`${CLEAN_API_BASE}/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !data.contact_phone?.includes("XXXXX");
    } catch {
      return false;
    }
  }
}
