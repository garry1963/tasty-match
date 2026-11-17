"use client";

import React from "react";
import type { FoodTileId } from "@/types/tastyMatch";

export function FoodTileArt({
  id,
  className = "w-full h-full",
}: {
  id: FoodTileId;
  className?: string;
}) {
  switch (id) {
    case "donut":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="34" r="22" fill="#E09F5A" stroke="#7C3F1D" strokeWidth="2.5" />
          <path
            d="M12 31c0-11 9-19 20-19s20 8 20 19c0 4-3 5-5 3s-4-2-6 1-5 2-7 0-5-2-7 1-5 2-7-1-5-1-8-4z"
            fill="#FF6FA5"
            stroke="#9D174D"
            strokeWidth="2"
          />
          <circle cx="32" cy="33" r="7.5" fill="#FFFBF2" stroke="#7C3F1D" strokeWidth="2.2" />
          <rect x="20" y="19" width="5" height="2.2" rx="1.1" transform="rotate(-25 20 19)" fill="#FDE047" />
          <rect x="37" y="17" width="5" height="2.2" rx="1.1" transform="rotate(20 37 17)" fill="#38BDF8" />
          <rect x="42" y="26" width="5" height="2.2" rx="1.1" transform="rotate(-35 42 26)" fill="#4ADE80" />
          <rect x="18" y="27" width="4.5" height="2.2" rx="1.1" transform="rotate(35 18 27)" fill="#FFF" />
        </svg>
      );

    case "burger":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M12 28c0-10 9-16 20-16s20 6 20 16H12z" fill="#F59E0B" stroke="#78350F" strokeWidth="2.4" />
          <ellipse cx="24" cy="20" rx="1.8" ry="1" fill="#FEF3C7" />
          <ellipse cx="33" cy="18" rx="1.8" ry="1" fill="#FEF3C7" />
          <ellipse cx="41" cy="21" rx="1.8" ry="1" fill="#FEF3C7" />
          <path d="M10 31c4-2 7 2 11 0s7 2 11 0 7 2 11 0 7 2 11 0v4H10v-4z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
          <polygon points="13,35 51,35 46,41 32,37 18,41" fill="#FACC15" stroke="#A16207" strokeWidth="1.8" />
          <rect x="11" y="37" width="42" height="7.5" rx="3.7" fill="#7C2D12" stroke="#451A03" strokeWidth="2.2" />
          <path d="M13 45h38v4c0 3-3 5-6 5H19c-3 0-6-2-6-5v-4z" fill="#F59E0B" stroke="#78350F" strokeWidth="2.4" />
        </svg>
      );

    case "sushi":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect x="13" y="30" width="38" height="17" rx="8" fill="#FFFFFF" stroke="#334155" strokeWidth="2.4" />
          <path d="M11 32c1-11 10-16 21-16s20 5 21 16c-5 3-13 4-21 4s-16-1-21-4z" fill="#FF7849" stroke="#9A3412" strokeWidth="2.4" />
          <path d="M20 20c3 3 5 7 6 12M30 18c3 4 5 8 6 14M40 20c2 4 4 7 4 11" stroke="#FED7AA" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <rect x="28" y="16" width="8" height="31" rx="1.5" fill="#1E293B" />
        </svg>
      );

    case "ramen":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M22 14l26 8M25 10l24 9" stroke="#92400E" strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="32" cy="31" rx="22" ry="9" fill="#FEF08A" stroke="#78350F" strokeWidth="2.2" />
          <circle cx="24" cy="29" r="5" fill="#FFF" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="24" cy="29" r="2.5" fill="#F59E0B" />
          <circle cx="38" cy="29" r="4.5" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="1.5" />
          <path d="M10 31c0 14 10 22 22 22s22-8 22-22H10z" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2.4" />
          <path d="M19 42h26" stroke="#FDE047" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case "cake":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <polygon points="12,30 50,22 52,48 12,48" fill="#FDE68A" stroke="#92400E" strokeWidth="2.4" strokeLinejoin="round" />
          <line x1="12" y1="39" x2="51" y2="35" stroke="#FB7185" strokeWidth="4" />
          <polygon points="12,30 34,18 50,22 24,33" fill="#FFF" stroke="#9D174D" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M28 19c0-5 4-8 7-8s6 3 6 7c0 4-3 6-6 6s-7-2-7-5z" fill="#E11D48" stroke="#881337" strokeWidth="2" />
          <path d="M35 11l3-4" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case "boba":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M35 8l4 14" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
          <polygon points="20,22 44,22 40,54 24,54" fill="#E9D5FF" stroke="#581C87" strokeWidth="2.4" strokeLinejoin="round" />
          <rect x="18" y="19" width="28" height="5" rx="2.5" fill="#A855F7" stroke="#581C87" strokeWidth="2" />
          <circle cx="27" cy="48" r="2.6" fill="#3B0764" />
          <circle cx="33" cy="49" r="2.6" fill="#3B0764" />
          <circle cx="38" cy="46" r="2.6" fill="#3B0764" />
          <circle cx="29" cy="42" r="2.6" fill="#3B0764" />
          <circle cx="35" cy="41" r="2.6" fill="#3B0764" />
        </svg>
      );

    case "pizza":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M12 18c13-6 27-6 40 0L32 54 12 18z" fill="#FACC15" stroke="#854D0E" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M10 18c14-7 30-7 44 0l-3 6c-12-5-26-5-38 0l-3-6z" fill="#D97706" stroke="#78350F" strokeWidth="2.2" />
          <circle cx="26" cy="29" r="4.2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
          <circle cx="37" cy="28" r="4" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
          <circle cx="32" cy="40" r="3.8" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
          <circle cx="24" cy="36" r="1.8" fill="#16A34A" />
        </svg>
      );

    case "taco":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="24" cy="26" r="6" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
          <circle cx="34" cy="24" r="6" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
          <circle cx="42" cy="27" r="5" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
          <path d="M10 44c0-13 10-21 22-21s22 8 22 21H10z" fill="#FBBF24" stroke="#92400E" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="22" cy="37" r="1.5" fill="#B45309" />
          <circle cx="32" cy="33" r="1.5" fill="#B45309" />
          <circle cx="41" cy="38" r="1.5" fill="#B45309" />
        </svg>
      );

    case "icecream":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <polygon points="22,31 42,31 32,56" fill="#F59E0B" stroke="#78350F" strokeWidth="2.4" strokeLinejoin="round" />
          <line x1="26" y1="36" x2="36" y2="44" stroke="#B45309" strokeWidth="1.8" />
          <line x1="38" y1="36" x2="28" y2="44" stroke="#B45309" strokeWidth="1.8" />
          <circle cx="25" cy="26" r="9" fill="#F472B6" stroke="#9D174D" strokeWidth="2.2" />
          <circle cx="39" cy="26" r="9" fill="#60A5FA" stroke="#1E40AF" strokeWidth="2.2" />
          <circle cx="32" cy="17" r="9.5" fill="#FEF08A" stroke="#A16207" strokeWidth="2.2" />
          <circle cx="32" cy="8" r="3" fill="#E11D48" />
        </svg>
      );

    case "croissant":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path
            d="M12 40c2-13 11-22 20-22s18 9 20 22c-6 4-13 4-20 1-7 3-14 3-20-1z"
            fill="#F59E0B"
            stroke="#78350F"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M24 20l-2 20M40 20l2 20M32 18v23" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "avocado":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path
            d="M32 10c8 0 16 14 16 26 0 10-7 18-16 18s-16-8-16-18c0-12 8-26 16-26z"
            fill="#15803D"
            stroke="#14532D"
            strokeWidth="2.4"
          />
          <path
            d="M32 14c6 0 12 12 12 22 0 8-5 14-12 14s-12-6-12-14c0-10 6-22 12-22z"
            fill="#BEF264"
          />
          <circle cx="32" cy="38" r="8" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          <circle cx="29.5" cy="35.5" r="2" fill="#B45309" />
        </svg>
      );

    case "watermelon":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M10 24c4 18 16 26 22 26s18-8 22-26H10z" fill="#16A34A" stroke="#14532D" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M14 24c3 14 12 21 18 21s15-7 18-21H14z" fill="#EF4444" />
          <circle cx="25" cy="31" r="1.8" fill="#1E293B" />
          <circle cx="32" cy="36" r="1.8" fill="#1E293B" />
          <circle cx="39" cy="31" r="1.8" fill="#1E293B" />
        </svg>
      );

    case "cupcake":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <polygon points="18,34 46,34 42,52 22,52" fill="#F43F5E" stroke="#881337" strokeWidth="2.4" strokeLinejoin="round" />
          <line x1="26" y1="34" x2="27" y2="52" stroke="#FDA4AF" strokeWidth="2" />
          <line x1="38" y1="34" x2="37" y2="52" stroke="#FDA4AF" strokeWidth="2" />
          <path
            d="M15 34c0-7 6-11 11-11 1-6 6-10 11-9 5 1 7 5 7 9 4 1 6 5 5 11H15z"
            fill="#C084FC"
            stroke="#581C87"
            strokeWidth="2.3"
          />
          <circle cx="32" cy="12" r="4" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1.8" />
        </svg>
      );

    case "pie":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="33" r="21" fill="#D97706" stroke="#78350F" strokeWidth="2.4" />
          <circle cx="32" cy="33" r="16" fill="#E11D48" />
          <path d="M19 27h26M19 39h26M26 20v26M38 20v26" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "pretzel":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path
            d="M22 44c-8 0-12-6-10-14 2-8 10-13 20-13s18 5 20 13c2 8-2 14-10 14-6 0-10-6-10-12 0 6-4 12-10 12z"
            fill="none"
            stroke="#B45309"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 44c-8 0-12-6-10-14 2-8 10-13 20-13s18 5 20 13c2 8-2 14-10 14-6 0-10-6-10-12 0 6-4 12-10 12z"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="24" r="1.6" fill="#FFF" />
          <circle cx="42" cy="25" r="1.6" fill="#FFF" />
          <circle cx="32" cy="34" r="1.6" fill="#FFF" />
        </svg>
      );

    case "hotdog":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <g transform="rotate(-24 32 32)">
            <rect x="10" y="21" width="44" height="22" rx="11" fill="#FBBF24" stroke="#92400E" strokeWidth="2.4" />
            <rect x="6" y="26" width="52" height="12" rx="6" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2.2" />
            <path d="M12 32c3-3 6 3 9 0s6 3 9 0 6 3 9 0 6 3 10 0" stroke="#FDE047" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      );
  }
}
