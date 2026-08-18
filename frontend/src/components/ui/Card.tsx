"use client";

import React, { useState } from "react";
import Badge from "./Badge";
import { useFavorites } from "@/lib/useFavorites";
import { useToast } from "@/lib/useToast";

interface Property {
  id: string;
  title: string;
  purpose: "rent" | "sell" | string;
  property_type: string;
  price: number;
  bhk?: number;
  area_sqft?: number;
  furnished_status?: string;
  city?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  images?: { url: string }[];
}

interface CardProps {
  property: Property;
  onAction?: (id: string) => void;
  actionLabel?: string;
}

export default function Card({
  property,
  onAction,
  actionLabel = "View Details",
}: CardProps) {
  const imageUrl =
    property.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";

  const [imgLoaded, setImgLoaded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { success, info } = useToast();

  const formattedPrice =
    property.price >= 10000000
      ? `₹${(property.price / 10000000).toFixed(2)} Cr`
      : property.price >= 100000
      ? `₹${(property.price / 100000).toFixed(2)} Lakh`
      : `₹${property.price.toLocaleString("en-IN")}`;

  const favorited = isFavorite(property.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id);
    if (!favorited) {
      success("Saved to favourites ❤️");
    } else {
      info("Removed from favourites");
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group h-full">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {/* Shimmer while image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 card-img-shimmer" aria-hidden="true" />
        )}
        <img
          src={imageUrl}
          alt={property.title}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transition: "opacity 0.3s ease, transform 0.5s ease" }}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";
            setImgLoaded(true);
          }}
        />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {property.is_featured && <Badge variant="featured" label="Featured" />}
          {property.is_verified && <Badge variant="verified" label="Verified" />}
        </div>

        {/* Favourite button top-right */}
        <button
          type="button"
          aria-label={favorited ? "Remove from favourites" : "Save to favourites"}
          className={`fav-btn ${favorited ? "fav-btn-active" : ""}`}
          onClick={handleFavorite}
        >
          {favorited ? "❤️" : "🤍"}
        </button>

        {/* Purpose chip bottom-right */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md font-medium capitalize">
          For {property.purpose}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold text-gray-900">{formattedPrice}</span>
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            📍 {property.city || "Bhopal"}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 font-medium py-1 border-y border-gray-100 mt-auto">
          {property.bhk && <span>🛏️ {property.bhk} BHK</span>}
          {property.area_sqft && <span>📐 {property.area_sqft} sqft</span>}
          {property.furnished_status && (
            <span className="capitalize">🛋️ {property.furnished_status}</span>
          )}
        </div>

        {onAction && (
          <button
            onClick={() => onAction(property.id)}
            className="w-full py-2.5 text-center text-xs font-semibold bg-gray-50 hover:bg-primary hover:text-white border border-gray-200 hover:border-primary text-gray-700 rounded-lg transition-all duration-200 mt-1 cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .fav-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(4px);
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.15s;
          line-height: 1;
        }
        .fav-btn:hover { transform: scale(1.15); background: white; }
        .fav-btn-active { transform: scale(1.08); }

        .card-img-shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 37%,
            #f0f0f0 63%
          );
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
      `}} />
    </div>
  );
}
