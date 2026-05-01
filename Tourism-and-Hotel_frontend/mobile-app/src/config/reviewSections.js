export const reviewSections = [
  {
    label: 'Hotels',
    value: 'Hotels',
  },
  {
    label: 'Rooms',
    value: 'Rooms',
  },
  {
    label: 'Packages',
    value: 'Packages',
  },
  {
    label: 'Safari Vehicles',
    value: 'Safari Vehicles',
  },
  {
    label: 'Restaurants',
    value: 'Restaurants',
  },
  {
    label: 'Gear Rental / Storage',
    value: 'Gear Rental / Storage',
  },
];

export function getReviewSectionLabel(value) {
  return reviewSections.find((item) => item.value === value)?.label || '';
}
