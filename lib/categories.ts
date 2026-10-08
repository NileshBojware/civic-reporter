export interface CivicCategory {
  id: string
  value: string
  label: string
  icon: string
  subcategories: string[]
  colorClasses: string
  badgeClasses: string
  dotColor: string
  description?: string
}

export const CIVIC_CATEGORIES: CivicCategory[] = [
  {
    id: 'roads_transport',
    value: 'roads_transport',
    label: 'Roads & Transport',
    icon: '',
    subcategories: [
      'Potholes',
      'Damaged Road',
      'Road Damage',
      'Traffic Sign Issue'
    ],
    colorClasses: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    badgeClasses: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    dotColor: 'bg-amber-500',
    description: 'Potholes, damaged asphalt, traffic signboards, and roadway safety hazards'
  },
  {
    id: 'water_supply',
    value: 'water_supply',
    label: 'Water Supply',
    icon: '',
    subcategories: [
      'Water Leakage',
      'Water Shortage',
      'Pipeline Damage',
      'Water Quality'
    ],
    colorClasses: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
    badgeClasses: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
    dotColor: 'bg-sky-500',
    description: 'Pipeline leaks, drinking water shortages, contamination, or water supply disruption'
  },
  {
    id: 'drainage_sewerage',
    value: 'drainage_sewerage',
    label: 'Drainage & Sewerage',
    icon: '',
    subcategories: [
      'Blocked Drain',
      'Drain Overflow',
      'Sewage Leakage',
      'Open Manhole'
    ],
    colorClasses: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
    badgeClasses: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
    dotColor: 'bg-indigo-500',
    description: 'Blocked stormwater drains, sewage overflow, waterlogging, or missing manhole covers'
  },
  {
    id: 'waste_management',
    value: 'waste_management',
    label: 'Waste Management',
    icon: '',
    subcategories: [
      'Garbage Overflow',
      'Garbage Not Collected',
      'Illegal Dumping',
      'Damaged Dustbin'
    ],
    colorClasses: 'text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/25',
    badgeClasses: 'text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/25',
    dotColor: 'bg-orange-500',
    description: 'Overflowing public bins, uncollected residential waste, and illegal trash dumping'
  },
  {
    id: 'street_lighting',
    value: 'street_lighting',
    label: 'Street Lighting',
    icon: '',
    subcategories: [
      'Streetlight Not Working',
      'Damaged Streetlight',
      'Broken Pole',
      'Electrical Wire Issue'
    ],
    colorClasses: 'text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 border-yellow-500/25',
    badgeClasses: 'text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 border-yellow-500/25',
    dotColor: 'bg-yellow-500',
    description: 'Non-functional streetlights, damaged light poles, dark alleys, and loose wires'
  },
  {
    id: 'sanitation_health',
    value: 'sanitation_health',
    label: 'Sanitation & Public Health',
    icon: '',
    subcategories: [
      'Unclean Area',
      'Public Toilet Issue',
      'Unsanitary Conditions',
      'Open Defecation'
    ],
    colorClasses: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    badgeClasses: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    dotColor: 'bg-emerald-500',
    description: 'Unsanitary public spaces, broken public restrooms, and hygiene health hazards'
  },
  {
    id: 'parks_spaces',
    value: 'parks_spaces',
    label: 'Parks & Public Spaces',
    icon: '',
    subcategories: [
      'Park Maintenance',
      'Damaged Equipment',
      'Tree/Vegetation Issue',
      'Public Space Damage'
    ],
    colorClasses: 'text-green-700 dark:text-green-300 bg-green-500/10 border-green-500/25',
    badgeClasses: 'text-green-700 dark:text-green-300 bg-green-500/10 border-green-500/25',
    dotColor: 'bg-green-500',
    description: 'Public garden upkeep, broken playground swings, fallen branches, and lawn maintenance'
  },
  {
    id: 'traffic_parking',
    value: 'traffic_parking',
    label: 'Traffic & Parking',
    icon: '',
    subcategories: [
      'Illegal Parking',
      'Traffic Signal Issue',
      'Road Obstruction',
      'Parking Issue'
    ],
    colorClasses: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
    badgeClasses: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
    dotColor: 'bg-rose-500',
    description: 'Faulty traffic signals, unauthorized vehicle parking, and roadway bottlenecks'
  },
  {
    id: 'electricity_utilities',
    value: 'electricity_utilities',
    label: 'Electricity & Utilities',
    icon: '',
    subcategories: [
      'Power Supply Issue',
      'Exposed Wires',
      'Damaged Utility Pole',
      'Electrical Hazard'
    ],
    colorClasses: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/25',
    badgeClasses: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/25',
    dotColor: 'bg-purple-500',
    description: 'Power disruptions, exposed high-voltage cables, and leaning transformer poles'
  },
  {
    id: 'encroachment_construction',
    value: 'encroachment_construction',
    label: 'Encroachment & Construction',
    icon: '',
    subcategories: [
      'Illegal Encroachment',
      'Unauthorized Construction',
      'Footpath Encroachment',
      'Public Land Occupation'
    ],
    colorClasses: 'text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/25',
    badgeClasses: 'text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/25',
    dotColor: 'bg-red-500',
    description: 'Footpath hawker blockage, illegal construction, and unauthorized occupation of public land'
  },
  {
    id: 'public_infrastructure',
    value: 'public_infrastructure',
    label: 'Public Infrastructure',
    icon: '',
    subcategories: [
      'Damaged Footpath',
      'Damaged Bus Stop',
      'Broken Signboard',
      'Damaged Public Property'
    ],
    colorClasses: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/25',
    badgeClasses: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/25',
    dotColor: 'bg-teal-500',
    description: 'Broken sidewalks, vandalized bus shelters, damaged municipal railings, and public assets'
  },
  {
    id: 'other_civic',
    value: 'other_civic',
    label: 'Other Civic Issues',
    icon: '',
    subcategories: [
      'Stray Animals',
      'Noise Complaint',
      'Public Nuisance',
      'Other Issue'
    ],
    colorClasses: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25',
    badgeClasses: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25',
    dotColor: 'bg-slate-500',
    description: 'Stray animals, excessive neighborhood noise, public nuisance, or miscellaneous civic matters'
  }
]

// Legacy category key mapping to retain backward compatibility with old database records
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  road_damage: 'roads_transport',
  water_leakage: 'water_supply',
  drainage: 'drainage_sewerage',
  garbage: 'waste_management',
  streetlight: 'street_lighting',
  other: 'other_civic',
}

// Mapping new categories to old legacy constraints if database has not been migrated yet
export const NEW_TO_LEGACY_MAP: Record<string, string> = {
  roads_transport: 'road_damage',
  public_infrastructure: 'road_damage',
  road_damage: 'road_damage',
  water_supply: 'water_leakage',
  water_leakage: 'water_leakage',
  drainage_sewerage: 'drainage',
  drainage: 'drainage',
  waste_management: 'garbage',
  garbage: 'garbage',
  street_lighting: 'streetlight',
  streetlight: 'streetlight',
  electricity_utilities: 'streetlight',
  sanitation_health: 'garbage',
  parks_spaces: 'other',
  encroachment_construction: 'other',
  traffic_parking: 'other',
  other_civic: 'other',
  other: 'other',
}

// Quick lookup dictionary
export const CATEGORY_MAP: Record<string, CivicCategory> = CIVIC_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat
  return acc
}, {} as Record<string, CivicCategory>)

/**
 * Converts a new category key to legacy category key
 */
export function toLegacyCategoryKey(key: string): string {
  if (!key) return 'road_damage'
  return NEW_TO_LEGACY_MAP[key] || 'other'
}

/**
 * Normalizes a category key (converting legacy keys to new ones if applicable)
 */
export function normalizeCategoryKey(key: string): string {
  if (!key) return 'roads_transport'
  if (CATEGORY_MAP[key]) return key
  if (LEGACY_CATEGORY_MAP[key]) return LEGACY_CATEGORY_MAP[key]
  return key
}

/**
 * Retrieve metadata for a category key
 */
export function getCategoryMeta(key: string): CivicCategory {
  const normalizedKey = normalizeCategoryKey(key)
  if (CATEGORY_MAP[normalizedKey]) {
    return CATEGORY_MAP[normalizedKey]
  }
  // Fallback for unknown / custom category
  return {
    id: key,
    value: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: '',
    subcategories: ['Other Issue'],
    colorClasses: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25',
    badgeClasses: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25',
    dotColor: 'bg-slate-500',
    description: 'Civic issue report'
  }
}

/**
 * Get styling badge classes for a category
 */
export function getCategoryStyles(key: string): string {
  return getCategoryMeta(key).badgeClasses
}

/**
 * Get formatted label for a category (clean text, no emojis)
 */
export function getCategoryFormattedLabel(key: string): string {
  const meta = getCategoryMeta(key)
  return meta.label
}
