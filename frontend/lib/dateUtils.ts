/**
 * Unified Date Derivation and Formatting Utility for TatkalPro
 * Formats: "08 Nov 2026" (DD Mon YYYY)
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Parses YYYY-MM-DD or ISO string into a local Date object safely
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a Date or YYYY-MM-DD string as "08 Nov 2026"
 */
export function formatDisplayDate(dateInput: string | Date): string {
  const dateObj = typeof dateInput === "string" ? parseLocalDate(dateInput) : dateInput;
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[dateObj.getMonth()] || "Nov";
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Determines whether a train journey crosses midnight (overnight)
 */
export function isOvernightJourney(
  dayOffset: number = 0,
  departureTime?: string | null,
  arrivalTime?: string | null
): boolean {
  if (dayOffset > 0) return true;
  if (departureTime && arrivalTime) {
    const depH = parseInt(departureTime.split(":")[0], 10);
    const arrH = parseInt(arrivalTime.split(":")[0], 10);
    if (!isNaN(depH) && !isNaN(arrH) && arrH < depH) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates arrival date from departure journey date and journey parameters
 * Automatically advances by 1 or more days if overnight
 */
export function calculateArrivalDate(
  journeyDateStr: string,
  dayOffset: number = 0,
  departureTime?: string | null,
  arrivalTime?: string | null
): string {
  const dateObj = parseLocalDate(journeyDateStr);
  let effectiveOffset = dayOffset;
  if (effectiveOffset === 0 && isOvernightJourney(0, departureTime, arrivalTime)) {
    effectiveOffset = 1;
  }
  dateObj.setDate(dateObj.getDate() + effectiveOffset);
  return formatDisplayDate(dateObj);
}

