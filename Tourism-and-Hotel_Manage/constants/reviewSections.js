export const ALLOWED_REVIEW_SECTIONS = [
  "Hotels",
  "Rooms",
  "Packages",
  "Safari Vehicles",
  "Restaurants",
  "Gear Rental / Storage",
];

export function normalizeReviewSection(section) {
  if (typeof section !== "string") {
    return "";
  }

  return section.trim();
}

export function isAllowedReviewSection(section) {
  return ALLOWED_REVIEW_SECTIONS.includes(normalizeReviewSection(section));
}
