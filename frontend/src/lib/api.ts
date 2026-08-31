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
    api.logout();
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_type", data.user_type);
      if (data.name) localStorage.setItem("user_name", data.name);
      if (data.email) localStorage.setItem("user_email", data.email);
      if (data.mobile) localStorage.setItem("user_mobile", data.mobile);
      if (data.city) localStorage.setItem("user_city", data.city);
      if (data.user_id) localStorage.setItem("user_id", data.user_id);
    }
    return data;
  },

  async login(payload: any) {
    // Clear previous user identity so switching accounts is 100% clean
    api.logout();
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_type", data.user_type);
      if (data.name) localStorage.setItem("user_name", data.name);
      if (data.email) localStorage.setItem("user_email", data.email);
      if (data.mobile) localStorage.setItem("user_mobile", data.mobile);
      if (data.city) localStorage.setItem("user_city", data.city);
      if (data.user_id) localStorage.setItem("user_id", data.user_id);
    }
    return data;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_type");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_mobile");
      localStorage.removeItem("user_city");
      localStorage.removeItem("user_id");
    }
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

  async updateProfile(payload: { name?: string; email?: string; mobile?: string; city?: string }) {
    return apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async changePassword(payload: { old_password: string; new_password: string }) {
    return apiFetch("/users/me/change-password", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async requestPasswordReset(mobile_or_email: string) {
    return apiFetch("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ mobile_or_email }),
    });
  },

  async resetPassword(payload: { mobile_or_email: string; new_password: string; otp?: string; reset_token?: string }) {
    return apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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

  async getDashboardStats() {
    return apiFetch("/properties/me/dashboard-stats");
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

  async createOrder(planId: string) {
    return apiFetch("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    });
  },

  async verifyPayment(payload: any) {
    return apiFetch("/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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
