"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useLocationSearch } from "@/lib/useLocationSearch";
import { useNotificationCount } from "@/lib/useNotificationCount";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
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
    window.location.href = "/";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?location=${encodeURIComponent(query.trim())}`;
    } else {
      window.location.href = "/search";
    }
  };

  return (
    <header className="header">
      <div className="nav-container">
        {/* Logo */}
        <a href="/" className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">AuraHomes</span>
        </a>

        {/* Center: Nav Links + Search */}
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
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
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

        {/* Right: Actions */}
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
      </div>

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
          padding: 0 24px;
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
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: background 0.15s;
          flex-shrink: 0;
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
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-post-nav:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px 0 rgba(37, 99, 235, 0.3);
        }

        @media (max-width: 1024px) {
          .desktop-nav { display: none; }
          .nav-search-wrapper { max-width: 220px; }
        }
        @media (max-width: 768px) {
          .nav-center, .nav-actions { display: none; }
        }
      `}} />
    </header>
  );
}
