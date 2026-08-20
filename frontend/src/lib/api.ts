const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "https://aurahomes-backend-tz1c.onrender.com";
const CLEAN_URL = RAW_URL.replace(/\/+$/, "");
const API_BASE_URL = CLEAN_URL.endsWith("/api/v1") ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

// Helper to fetch wrapper with token injection and graceful error handling
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  // Auth API
  async register(payload: any) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_type", data.user_type);
    }
    return data;
  },

  async login(payload: any) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_type", data.user_type);
    }
    return data;
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_type");
  },

  async sendOtp(mobile: string) {
    return apiFetch("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    });
  },

  async verifyOtp(mobile: string, otp: string) {
    return apiFetch("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ mobile, otp }),
    });
  },

  async getMe() {
    return apiFetch("/users/me");
  },

  // Properties API
  async getProperties(filters: string = "") {
    try {
      const data = await apiFetch(`/search?${filters}`);
      return data.results || [];
    } catch {
      return [];
    }
  },

  async getProperty(id: string) {
    return apiFetch(`/properties/${id}`);
  },

  async getMyProperties() {
    try {
      return await apiFetch("/properties/me/listings");
    } catch {
      return [];
    }
  },

  async createProperty(payload: any) {
    return apiFetch("/properties/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Credits API
  async getCredits() {
    return apiFetch("/contacts/credits");
  },

  async unlockContact(propertyId: string) {
    return apiFetch(`/contacts/unlock/${propertyId}`, {
      method: "POST",
    });
  },

  async listPlans() {
    return apiFetch("/payments/plans");
  },

  // Admin APIs
  async getAdminDashboard() {
    return apiFetch("/admin/dashboard");
  },

  async approveProperty(propertyId: string) {
    return apiFetch(`/admin/properties/${propertyId}/approve`, {
      method: "POST",
    });
  },

  async rejectProperty(propertyId: string, reason: string) {
    return apiFetch(`/admin/properties/${propertyId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async verifyProperty(propertyId: string) {
    return apiFetch(`/admin/properties/${propertyId}/verify`, {
      method: "POST",
    });
  },

  async getUsers() {
    try {
      const data = await apiFetch("/admin/users");
      return data || [];
    } catch {
      return [];
    }
  },

  async getPayments() {
    try {
      const data = await apiFetch("/admin/payments");
      return data || [];
    } catch {
      return [];
    }
  },

  async getReports() {
    try {
      const data = await apiFetch("/admin/reports");
      return data || [];
    } catch {
      return [];
    }
  }
};
