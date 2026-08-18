const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// Helper to fetch wrapper with token injection
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Something went wrong.");
  }

  return response.json();
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

  // Properties API
  async getProperties(filters: string = "") {
    // Falls back to generic list if search endpoint stubbed
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

  async createProperty(payload: any) {
    return apiFetch("/properties", {
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
  }
};
