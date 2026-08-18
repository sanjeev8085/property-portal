"use client";
import React from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
  online?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "avatar-xs",
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
  xl: "avatar-xl",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function stringToColor(str: string): string {
  const hues = [220, 250, 280, 310, 170, 195, 140, 35, 15, 50];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 65%, 52%)`;
}

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
  online,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = src && !imgError;
  const initials = getInitials(name);
  const bgColor = stringToColor(name || "?");

  return (
    <span className={`avatar ${sizeClasses[size]} ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={name ?? "Avatar"}
          className="avatar-img"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="avatar-initials"
          style={{ backgroundColor: bgColor }}
          aria-label={name ?? "Avatar"}
        >
          {initials}
        </span>
      )}
      {online !== undefined && (
        <span className={`avatar-status ${online ? "avatar-status-online" : "avatar-status-offline"}`} />
      )}
    </span>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ avatars, max = 4, size = "sm", className = "" }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={`avatar-group ${className}`}>
      {visible.map((a, i) => (
        <Avatar key={i} src={a.src} name={a.name} size={size} className="avatar-group-item" />
      ))}
      {overflow > 0 && (
        <span className={`avatar ${sizeClasses[size]} avatar-group-item avatar-overflow`}>
          +{overflow}
        </span>
      )}
    </div>
  );
}
