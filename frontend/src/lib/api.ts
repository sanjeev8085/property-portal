const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "https://aurahomes-backend-tz1c.onrender.com";
const CLEAN_URL = RAW_URL.replace(/\/+$/, "");
const API_BASE_URL = CLEAN_URL.endsWith("/api/v1") ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

// Helper to fetch wrapper with token injection & silent auto-refresh
async function apiFetch(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<any> {
  let token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      if (networkErr.message === "Failed to fetch" && !isRetry) {
        console.warn(`Transient network error on ${endpoint}. Retrying in 1s...`);
        await new Promise(r => setTimeout(r, 1000));
        return await apiFetch(endpoint, options, true);
      }
      throw networkErr;
    }

    // On 401 Unauthorized, attempt silent token refresh once before clearing session
    if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
      if (typeof window !== "undefined") {
        const rToken = localStorage.getItem("refresh_token");
        if (rToken) {
          try {
            const refreshRes = await api.refreshToken(rToken);
            if (refreshRes && refreshRes.access_token) {
              // Retry original request with new access token
              return await apiFetch(endpoint, options, true);
            }
          } catch {
            // Refresh failed — clear stale tokens
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
        } else {
          localStorage.removeItem("access_token");
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detailStr = typeof errorData.detail === "string" ? errorData.detail : (errorData.detail?.message || `Request failed with status ${response.status}`);
      throw new Error(detailStr);
    }

    return response.json();
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  // Auth API
  async refreshToken(refreshToken?: string) {
    const rToken = refreshToken || (typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null);
    if (!rToken) throw new Error("No refresh token available");

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rToken }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Token refresh failed");
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      if (data.user_type) localStorage.setItem("user_type", data.user_type);
      if (data.user_id) localStorage.setItem("user_id", data.user_id);
    }
    return data;
  },
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
      localStorage.setItem("user_email", data.email || payload.email || "");
      if (data.name) localStorage.setItem("user_name", data.name);
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

  async searchProperties(params: any = {}) {
    try {
      const queryStr = typeof params === "string" ? params : new URLSearchParams(params).toString();
      const data = await apiFetch(`/search?${queryStr}`);
      return { items: data.results || data.items || [], total: data.total || 0 };
    } catch {
      return { items: [], total: 0 };
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

  async createProperty(payload: any, idempotencyKey?: string) {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return apiFetch("/properties", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },

  async updateProperty(propertyId: string, payload: any) {
    return apiFetch(`/properties/${propertyId}`, {
      method: "PUT",
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

  async getAdminProperties() {
    try {
      const data = await apiFetch("/admin/properties");
      return data || [];
    } catch {
      return [];
    }
  },

  async getDeactivatedIds() {
    try {
      const data = await apiFetch("/properties/deactivated");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async deleteAdminProperty(propertyId: string) {
    return apiFetch(`/admin/properties/${propertyId}`, {
      method: "DELETE",
    });
  },

  async featureProperty(propertyId: string, isFeatured?: boolean, featuredUntil?: string) {
    return apiFetch(`/admin/properties/${propertyId}/feature`, {
      method: "PATCH",
      body: JSON.stringify({
        is_featured: isFeatured,
        featured_until: featuredUntil,
      }),
    });
  },

  async updateUserStatus(userId: string, status: string) {
    return apiFetch(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async resolveReport(reportId: string, status: string) {
    return apiFetch(`/admin/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async broadcastNotification(title: string, body: string, target: string) {
    return apiFetch("/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify({ title, body, target }),
    });
  },

  async getNotificationHistory() {
    try {
      const data = await apiFetch("/admin/notifications/history");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // Locations API
  async getAdminLocations() {
    try {
      const data = await apiFetch("/admin/locations");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createLocation(city: string, state: string) {
    return apiFetch("/admin/locations", {
      method: "POST",
      body: JSON.stringify({ city, state }),
    });
  },

  async updateLocation(id: string, city: string, state: string) {
    return apiFetch(`/admin/locations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ city, state }),
    });
  },

  async toggleLocation(id: string) {
    return apiFetch(`/admin/locations/${id}/toggle`, {
      method: "PATCH",
    });
  },

  async deleteLocation(id: string) {
    return apiFetch(`/admin/locations/${id}`, {
      method: "DELETE",
    });
  },

  // Categories API
  async getAdminCategories() {
    try {
      const data = await apiFetch("/admin/categories");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createCategory(name: string, icon: string) {
    return apiFetch("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name, icon }),
    });
  },

  async updateCategory(id: string, name: string, icon: string) {
    return apiFetch(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, icon }),
    });
  },

  async toggleCategory(id: string) {
    return apiFetch(`/admin/categories/${id}/toggle`, {
      method: "PATCH",
    });
  },

  async deleteCategory(id: string) {
    return apiFetch(`/admin/categories/${id}`, {
      method: "DELETE",
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
  },

  async getAnalytics() {
    try {
      return await apiFetch("/admin/analytics");
    } catch {
      return null;
    }
  },

  // ── Image Uploads (Cloudinary CDN) ─────────────────────────────────────────
  async uploadImages(files: File[]) {
    let token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = typeof errData.detail === "string" ? errData.detail : (errData.detail?.message || "Image upload to CDN failed.");
      throw new Error(msg);
    }

    return response.json();
  },

  // ── Subscription Plans (public, no auth needed) ───────────────────────────
  async getPlans() {
    try {
      const data = await apiFetch("/payments/plans");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
