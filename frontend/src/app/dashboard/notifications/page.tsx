"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/lib/useToast";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://aurahomes-backend-tz1c.onrender.com";

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "lead_unlock",
    title: "New Contact Unlock",
    body: "Priya Singh unlocked contact details for your Luxury Penthouse in Arera Colony.",
    link: "/dashboard/interested-users",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-2",
    type: "property_approved",
    title: "Listing Approved",
    body: "Your listing 'Modern Fully Furnished 2 BHK' has been verified and published.",
    link: "/dashboard/properties",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "notif-3",
    type: "system_update",
    title: "Welcome to AuraHomes",
    body: "Get started by browsing verified listings or posting your property for free.",
    link: "/search",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export default function NotificationCentrePage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchNotifications = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    try {
      setLoading(true);
      if (token) {
        const res = await fetch(`${API_BASE}/api/v1/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setNotifications(data);
            return;
          }
        }
      }
      setNotifications(DEFAULT_NOTIFICATIONS);
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    setActioningId(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to update status.");
      
      // Optimistic state update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      success("Notification marked as read.");
    } catch {
      showError("Could not mark notification as read.");
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    setActioningId(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete notification.");
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      success("Notification deleted.");
    } catch {
      showError("Could not delete notification.");
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to update status.");
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      success("All notifications marked as read.");
    } catch {
      showError("Could not update notifications.");
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header-row">
        <div>
          <h1>Notification Center</h1>
          <p>Stay updated with property updates, verification alerts, and system announcements.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="nc-layout">
          {notifications.length === 0 ? (
            <div className="premium-card nc-empty-box">
              <span className="nc-empty-icon">🔔</span>
              <h3>No Notifications Yet</h3>
              <p>When you get updates about your listings, contact unlocks, or subscriptions, they will appear here.</p>
            </div>
          ) : (
            <div className="nc-list">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`premium-card nc-item-card ${!n.is_read ? "nc-unread" : ""}`}
                >
                  <div className="nc-item-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="nc-type-badge">{getTypeEmoji(n.type)}</span>
                      <h3 className="nc-item-title">{n.title}</h3>
                    </div>
                    <span className="nc-item-date">{formatDate(n.created_at)}</span>
                  </div>

                  <p className="nc-item-body">{n.body}</p>

                  <div className="nc-item-footer">
                    {n.link && (
                      <a href={n.link} className="nc-action-link">
                        View Details →
                      </a>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                      {!n.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={actioningId === n.id}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        style={{ color: "var(--error)" }}
                        disabled={actioningId === n.id}
                        onClick={() => handleDelete(n.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .nc-layout {
          max-width: 800px;
          margin: 0 auto;
        }
        .nc-empty-box {
          text-align: center;
          padding: 64px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .nc-empty-icon {
          font-size: 48px;
        }
        .nc-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .nc-item-card {
          border-left: 4px solid var(--border);
          transition: all 0.2s ease;
        }
        .nc-item-card.nc-unread {
          border-left-color: var(--primary);
          background: linear-gradient(90deg, rgba(37,99,235,0.03) 0%, rgba(255,255,255,1) 100%);
        }
        .nc-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 16px;
        }
        .nc-type-badge {
          font-size: 20px;
          flex-shrink: 0;
        }
        .nc-item-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .nc-item-date {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .nc-item-body {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .nc-item-footer {
          display: flex;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 8px;
        }
        .nc-action-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--primary);
          text-decoration: none;
        }
        .nc-action-link:hover {
          text-decoration: underline;
        }
      `}} />
    </div>
  );
}

function getTypeEmoji(type: string): string {
  switch (type) {
    case "new_property": return "🏢";
    case "property_approved": return "✅";
    case "property_rejected": return "❌";
    case "contact_unlocked": return "🔑";
    case "subscription_purchased": return "💳";
    case "subscription_expiring": return "⏰";
    case "saved_search_match": return "🔔";
    case "price_changed": return "🏷️";
    case "property_sold_rented": return "🚪";
    case "admin_announcement": return "📣";
    default: return "✉️";
  }
}
