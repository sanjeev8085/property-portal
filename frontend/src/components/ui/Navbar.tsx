"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useLocationSearch } from "@/lib/useLocationSearch";
import { useNotificationCount } from "@/lib/useNotificationCount";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { count: notifCount } = useNotificationCount();

  const { query, setQuery, suggestions, isOpen, selectSuggestion, inputRef } =
    useLocationSearch("", (loc) => {
      window.location.href = `/search?location=${encodeURIComponent(loc)}`;
    });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    setUserType(localStorage.getItem("user_type"));
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    window.location.href = "/";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (query.trim()) {
      window.location.href = `/search?location=${encodeURIComponent(query.trim())}`;
    } else {
      window.location.href = "/search";
    }
  };

  return (
    <>
      <header className="header">
        <div className="nav-container">
          {/* Logo */}
          <a href="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="logo-icon">🏠</span>
            <span className="logo-text">AuraHomes</span>
          </a>

          {/* Center: Desktop Nav Links + Search */}
          <div className="nav-center">
            <nav className="desktop-nav">
              <a href="/search?purpose=rent">Rent</a>
              <a href="/search?purpose=sell">Buy</a>
              <a href="/search?category=commercial">Commercial</a>
              <a href="/plans">Pricing Plans</a>
            </nav>

            {/* Global Search Bar */}
            <div className="nav-search-wrapper" ref={dropdownRef}>
              <form onSubmit={handleSearchSubmit} className="nav-search-form">
                <span className="nav-search-icon">🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="nav-search-input"
                  placeholder="Search city, area…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  aria-label="Search location"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    className="nav-search-clear"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </form>

              {/* Suggestions Dropdown */}
              {isOpen && searchOpen && (
                <ul className="nav-search-dropdown" role="listbox">
                  {suggestions.map((loc) => (
                    <li
                      key={loc}
                      role="option"
                      className="nav-search-option"
                      onMouseDown={() => selectSuggestion(loc)}
                    >
                      <span className="option-pin">📍</span>
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: Desktop Actions */}
          <div className="nav-actions">
            {/* Notification Bell */}
            {isLoggedIn && (
              <a
                href="/dashboard/notifications"
                className="nav-bell"
                aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ""}`}
              >
                🔔
                {notifCount > 0 && (
                  <span className="nav-bell-badge">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </a>
            )}

            {isLoggedIn ? (
              <>
                <a href="/account/profile" className="btn-login">👤 Profile</a>
                <a href="/dashboard" className="btn-login">Dashboard</a>
                <button type="button" className="btn-login" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <a href="/login" className="btn-login">Login</a>
            )}
            <a href="/dashboard/properties/new" className="btn-post-nav">
              <span className="plus">+</span> Post Property
            </a>
          </div>

          {/* Mobile Right Controls (Notification + Hamburger Toggle) */}
          <div className="mobile-header-actions">
            {isLoggedIn && (
              <a
                href="/dashboard/notifications"
                className="mobile-nav-bell"
                aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ""}`}
              >
                🔔
                {notifCount > 0 && (
                  <span className="mobile-nav-bell-badge">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </a>
            )}

            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Navigation Menu"
          >
            <div className="mobile-drawer-header">
              <a href="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
                <span className="logo-icon">🏠</span>
                <span className="logo-text">AuraHomes</span>
              </a>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Mobile Search In Drawer */}
            <form onSubmit={handleSearchSubmit} className="mobile-drawer-search">
              <input
                type="text"
                className="mobile-drawer-search-input"
                placeholder="Search Bhopal, Arera Colony..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="mobile-drawer-search-btn">
                🔍
              </button>
            </form>

            <nav className="mobile-drawer-nav">
              <div className="mobile-drawer-group-title">EXPLORE PROPERTIES</div>
              <a href="/search?purpose=rent" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                <span>🏢</span> Flats & Homes for Rent
              </a>
              <a href="/search?purpose=sell" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                <span>🏡</span> Properties for Sale
              </a>
              <a href="/search?category=commercial" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                <span>🏬</span> Commercial Spaces & Offices
              </a>
              <a href="/plans" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                <span>💎</span> Pricing & Unlock Plans
              </a>

              <div className="mobile-drawer-group-title">ACCOUNT & DASHBOARD</div>
              {isLoggedIn ? (
                <>
                  <a href="/account/profile" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>👤</span> My Profile & Password
                  </a>
                  <a href="/dashboard" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>📊</span> My Dashboard
                  </a>
                  <a href="/dashboard/properties" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>📁</span> My Listings
                  </a>
                  <a href="/dashboard/notifications" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>🔔</span> Notifications {notifCount > 0 && `(${notifCount})`}
                  </a>
                  {userType === "admin" && (
                    <a href="/admin/dashboard" className="mobile-drawer-link admin-link" onClick={() => setMobileMenuOpen(false)}>
                      <span>🛡️</span> Admin Panel
                    </a>
                  )}
                  <button type="button" className="mobile-drawer-link logout-link" onClick={handleLogout}>
                    <span>🚪</span> Log Out
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>🔑</span> Log In
                  </a>
                  <a href="/register" className="mobile-drawer-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>✨</span> Create Free Account
                  </a>
                </>
              )}

              <div className="mobile-drawer-group-title">ABOUT & LEGAL</div>
              <a href="/about" className="mobile-drawer-link-sub" onClick={() => setMobileMenuOpen(false)}>About AuraHomes</a>
              <a href="/contact" className="mobile-drawer-link-sub" onClick={() => setMobileMenuOpen(false)}>Contact & Support</a>
              <a href="/privacy-policy" className="mobile-drawer-link-sub" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</a>
              <a href="/terms-of-service" className="mobile-drawer-link-sub" onClick={() => setMobileMenuOpen(false)}>Terms of Service</a>
            </nav>

            <div className="mobile-drawer-footer">
              <a
                href="/dashboard/properties/new"
                className="mobile-drawer-post-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                + Post Free Property Ad
              </a>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--glass-bg);
          border-bottom: 1px solid var(--glass-border);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          height: 70px;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .nav-container {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 800;
          color: var(--primary);
          flex-shrink: 0;
          text-decoration: none;
        }
        .logo-icon { font-size: 26px; }
        .logo-text {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Center area */
        .nav-center {
          display: flex;
          align-items: center;
          gap: 24px;
          flex: 1;
          justify-content: center;
        }
        .desktop-nav {
          display: flex;
          gap: 24px;
          font-weight: 500;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .desktop-nav a {
          text-decoration: none;
          color: var(--text-secondary);
          transition: color 0.15s;
        }
        .desktop-nav a:hover { color: var(--primary); }

        /* Search */
        .nav-search-wrapper {
          position: relative;
          max-width: 280px;
          width: 100%;
        }
        .nav-search-form {
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          gap: 8px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .nav-search-form:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .nav-search-icon { font-size: 14px; flex-shrink: 0; }
        .nav-search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          font-family: var(--font-body);
          color: var(--text-primary);
          width: 100%;
          min-width: 0;
        }
        .nav-search-input::placeholder { color: var(--text-muted); }
        .nav-search-clear {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 11px;
          color: var(--text-muted);
          padding: 0;
          flex-shrink: 0;
          line-height: 1;
        }
        .nav-search-clear:hover { color: var(--text-primary); }

        /* Dropdown */
        .nav-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-xl);
          z-index: 300;
          overflow: hidden;
          list-style: none;
          margin: 0;
          padding: 4px 0;
          animation: fade-down 0.15s ease;
        }
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-search-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          color: var(--text-primary);
          transition: background 0.1s;
        }
        .nav-search-option:hover { background: var(--surface-hover); }
        .option-pin { flex-shrink: 0; }

        /* Bell */
        .nav-bell {
          position: relative;
          font-size: 20px;
          line-height: 1;
          padding: 6px;
          border-radius: var(--radius-sm);
          transition: background 0.15s;
          flex-shrink: 0;
          text-decoration: none;
        }
        .nav-bell:hover { background: var(--surface-hover); }
        .nav-bell-badge {
          position: absolute;
          top: -2px;
          right: -4px;
          background: var(--error);
          color: white;
          font-size: 9px;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          border: 1.5px solid var(--surface);
          font-family: var(--font-body);
        }

        /* Nav Actions */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .btn-login {
          font-weight: 600;
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          white-space: nowrap;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .btn-login:hover { background: var(--surface-hover); }
        .btn-post-nav {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: #ffffff !important;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.2);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          white-space: nowrap;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-post-nav:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px 0 rgba(37, 99, 235, 0.3);
        }

        /* Mobile Header Controls */
        .mobile-header-actions {
          display: none;
          align-items: center;
          gap: 10px;
        }
        .mobile-nav-bell {
          position: relative;
          font-size: 20px;
          padding: 8px;
          border-radius: var(--radius-sm);
          text-decoration: none;
        }
        .mobile-nav-bell-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: var(--error);
          color: white;
          font-size: 9px;
          font-weight: 800;
          min-width: 15px;
          height: 15px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 2px;
        }
        .hamburger-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          width: 42px;
          height: 42px;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-primary);
          transition: background 0.15s;
        }
        .hamburger-btn:hover { background: var(--surface-hover); }

        /* Mobile Drawer */
        .mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 999;
          animation: fade-in 0.2s ease;
        }
        .mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(85vw, 360px);
          background: var(--surface);
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
        }
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .mobile-drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        .mobile-drawer-close {
          background: var(--surface-hover);
          border: 1px solid var(--border);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-primary);
        }
        .mobile-drawer-search {
          padding: 14px 16px;
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          background: var(--background);
        }
        .mobile-drawer-search-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 14px;
          background: var(--surface);
          color: var(--text-primary);
          outline: none;
        }
        .mobile-drawer-search-btn {
          background: var(--primary);
          border: none;
          color: white;
          padding: 0 14px;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 16px;
        }
        .mobile-drawer-nav {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .mobile-drawer-group-title {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin: 14px 0 6px 6px;
        }
        .mobile-drawer-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.15s;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }
        .mobile-drawer-link:hover { background: var(--surface-hover); }
        .mobile-drawer-link span { font-size: 18px; }
        .mobile-drawer-link-sub {
          padding: 8px 14px;
          color: var(--text-secondary);
          font-size: 13px;
          text-decoration: none;
          transition: color 0.15s;
        }
        .mobile-drawer-link-sub:hover { color: var(--primary); }
        .admin-link { color: var(--secondary) !important; font-weight: 700; }
        .logout-link { color: var(--error) !important; font-weight: 700; }
        .mobile-drawer-footer {
          padding: 16px;
          border-top: 1px solid var(--border);
          background: var(--background);
        }
        .mobile-drawer-post-btn {
          display: block;
          text-align: center;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white !important;
          padding: 14px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }

        @media (max-width: 1024px) {
          .desktop-nav { display: none; }
          .nav-search-wrapper { max-width: 220px; }
        }
        @media (max-width: 768px) {
          .nav-center, .nav-actions { display: none; }
          .mobile-header-actions { display: flex; }
          .nav-container { padding: 0 16px; }
        }
      `}} />
    </>
  );
}
