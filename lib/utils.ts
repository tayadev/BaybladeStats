import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(ms: number): string {
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return ""
  }
}

export function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString()
  } catch {
    return ""
  }
}
