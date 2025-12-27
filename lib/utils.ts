import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Get the site URL for redirects and email links
 * Uses NEXT_PUBLIC_SITE_URL if set, otherwise falls back to window.location.origin (client) or localhost (server)
 */
export function getSiteUrl(): string {
  // Client-side: use NEXT_PUBLIC_SITE_URL or window.location.origin
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    return window.location.origin;
  }
  
  // Server-side: use NEXT_PUBLIC_SITE_URL, VERCEL_URL, or localhost
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
