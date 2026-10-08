export interface Department {
  id: string
  name: string
  shortName: string
  code: string
  adminEmail: string
  defaultPassword: string
  adminTitle: string
  categories: string[] // subcategories handled by this department
  iconName: string
  accentColor: string
  bgLight: string
  borderLight: string
  textColor: string
  badgeColor: string
  description: string
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'pwd',
    name: 'Public Works / Engineering',
    shortName: 'PWD',
    code: 'PWD26',
    adminEmail: 'admin.pwd@shehercare.in',
    defaultPassword: 'Sheher@PWD26',
    adminTitle: 'Public Works / Engineering Admin',
    categories: ['roads_transport', 'public_infrastructure', 'road_damage'],
    iconName: 'HardHat',
    accentColor: 'amber',
    bgLight: 'bg-amber-500/10 dark:bg-amber-950/30',
    borderLight: 'border-amber-500/30 dark:border-amber-500/40',
    textColor: 'text-amber-700 dark:text-amber-300',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    description: 'Roads, bridges, asphalt repairs, sidewalks, traffic signboards, and public infrastructure assets.'
  },
  {
    id: 'electrical',
    name: 'Electrical Department',
    shortName: 'Electrical',
    code: 'ELEC26',
    adminEmail: 'admin.electrical@shehercare.in',
    defaultPassword: 'Sheher@ELEC26',
    adminTitle: 'Electrical Department Admin',
    categories: ['street_lighting', 'electricity_utilities', 'streetlight'],
    iconName: 'Zap',
    accentColor: 'yellow',
    bgLight: 'bg-yellow-500/10 dark:bg-yellow-950/30',
    borderLight: 'border-yellow-500/30 dark:border-yellow-500/40',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    description: 'Streetlight poles, dark street illumination, public power supply, transformer grids, and electrical hazards.'
  },
  {
    id: 'health',
    name: 'Public Health Department',
    shortName: 'Health',
    code: 'HEALTH26',
    adminEmail: 'admin.health@shehercare.in',
    defaultPassword: 'Sheher@HEALTH26',
    adminTitle: 'Public Health Department Admin',
    categories: ['sanitation_health'],
    iconName: 'Activity',
    accentColor: 'emerald',
    bgLight: 'bg-emerald-500/10 dark:bg-emerald-950/30',
    borderLight: 'border-emerald-500/30 dark:border-emerald-500/40',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    description: 'Sanitation inspection, public toilet facilities, hygiene maintenance, and civic health hazard management.'
  },
  {
    id: 'water',
    name: 'Water Supply Department',
    shortName: 'Water Supply',
    code: 'WATER26',
    adminEmail: 'admin.water@shehercare.in',
    defaultPassword: 'Sheher@WATER26',
    adminTitle: 'Water Supply Department Admin',
    categories: ['water_supply', 'water_leakage'],
    iconName: 'Droplets',
    accentColor: 'sky',
    bgLight: 'bg-sky-500/10 dark:bg-sky-950/30',
    borderLight: 'border-sky-500/30 dark:border-sky-500/40',
    textColor: 'text-sky-700 dark:text-sky-300',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    description: 'Potable water pipelines, distribution pressure, main supply valve leaks, and drinking water shortages.'
  },
  {
    id: 'sewerage',
    name: 'Sewerage & Drainage Department',
    shortName: 'Drainage & Sewerage',
    code: 'SEWER26',
    adminEmail: 'admin.sewerage@shehercare.in',
    defaultPassword: 'Sheher@SEWER26',
    adminTitle: 'Sewerage & Drainage Department Admin',
    categories: ['drainage_sewerage', 'drainage'],
    iconName: 'Waves',
    accentColor: 'indigo',
    bgLight: 'bg-indigo-500/10 dark:bg-indigo-950/30',
    borderLight: 'border-indigo-500/30 dark:border-indigo-500/40',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    description: 'Underground sewage networks, stormwater drainage, manhole covers, and urban waterlogging prevention.'
  },
  {
    id: 'solidwaste',
    name: 'Solid Waste Management Department',
    shortName: 'Solid Waste',
    code: 'WASTE26',
    adminEmail: 'admin.solidwaste@shehercare.in',
    defaultPassword: 'Sheher@WASTE26',
    adminTitle: 'Solid Waste Management Department Admin',
    categories: ['waste_management', 'garbage'],
    iconName: 'Trash2',
    accentColor: 'orange',
    bgLight: 'bg-orange-500/10 dark:bg-orange-950/30',
    borderLight: 'border-orange-500/30 dark:border-orange-500/40',
    textColor: 'text-orange-700 dark:text-orange-300',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    description: 'Garbage dumpsters, residential waste collection vans, illegal dumping hotspots, and compost/landfill transport.'
  },
  {
    id: 'gardens',
    name: 'Garden & Parks Department',
    shortName: 'Parks & Gardens',
    code: 'GARDEN26',
    adminEmail: 'admin.gardens@shehercare.in',
    defaultPassword: 'Sheher@GARDEN26',
    adminTitle: 'Garden & Parks Department Admin',
    categories: ['parks_spaces'],
    iconName: 'Trees',
    accentColor: 'green',
    bgLight: 'bg-green-500/10 dark:bg-green-950/30',
    borderLight: 'border-green-500/30 dark:border-green-500/40',
    textColor: 'text-green-700 dark:text-green-300',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700',
    description: 'Municipal gardens, children playgrounds, swings & equipment, tree trimming, and green space upkeep.'
  },
  {
    id: 'townplanning',
    name: 'Town Planning / Encroachment',
    shortName: 'Town Planning',
    code: 'PLAN26',
    adminEmail: 'admin.townplanning@shehercare.in',
    defaultPassword: 'Sheher@PLAN26',
    adminTitle: 'Town Planning / Encroachment Admin',
    categories: ['encroachment_construction'],
    iconName: 'Building2',
    accentColor: 'red',
    bgLight: 'bg-red-500/10 dark:bg-red-950/30',
    borderLight: 'border-red-500/30 dark:border-red-500/40',
    textColor: 'text-red-700 dark:text-red-300',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
    description: 'Footpath hawker encroachments, unauthorized commercial constructions, illegal structures, and zoning.'
  },
  {
    id: 'traffic',
    name: 'Traffic Department',
    shortName: 'Traffic',
    code: 'TRAFFIC26',
    adminEmail: 'admin.traffic@shehercare.in',
    defaultPassword: 'Sheher@TRAFFIC26',
    adminTitle: 'Traffic Department Admin',
    categories: ['traffic_parking'],
    iconName: 'Car',
    accentColor: 'rose',
    bgLight: 'bg-rose-500/10 dark:bg-rose-950/30',
    borderLight: 'border-rose-500/30 dark:border-rose-500/40',
    textColor: 'text-rose-700 dark:text-rose-300',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    description: 'Traffic signals, illegal parking bottlenecks, road lane markings, and vehicular congestion mitigation.'
  },
  {
    id: 'grievance',
    name: 'General Administration / Grievance Cell',
    shortName: 'General Admin',
    code: 'ADMIN26',
    adminEmail: 'admin.grievance@shehercare.in',
    defaultPassword: 'Sheher@ADMIN26',
    adminTitle: 'General Administration / Grievance Cell Admin',
    categories: ['other_civic', 'other'],
    iconName: 'ShieldCheck',
    accentColor: 'slate',
    bgLight: 'bg-slate-500/10 dark:bg-slate-800/40',
    borderLight: 'border-slate-500/30 dark:border-slate-700',
    textColor: 'text-slate-700 dark:text-slate-300',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    description: 'Cross-departmental grievances, stray animals, public nuisance, noise complaints, and executive oversight.'
  }
]

// Mapping dictionaries
export const DEPARTMENT_MAP: Record<string, Department> = DEPARTMENTS.reduce((acc, dept) => {
  acc[dept.id] = dept
  return acc
}, {} as Record<string, Department>)

export const DEPARTMENT_BY_EMAIL: Record<string, Department> = DEPARTMENTS.reduce((acc, dept) => {
  acc[dept.adminEmail.toLowerCase()] = dept
  return acc
}, {} as Record<string, Department>)

/**
 * Get department by ID (e.g. 'pwd', 'water')
 */
export function getDepartmentById(id?: string | null): Department | null {
  if (!id) return null
  return DEPARTMENT_MAP[id] || null
}

/**
 * Get department by admin email
 */
export function getDepartmentByEmail(email?: string | null): Department | null {
  if (!email) return null
  const normalized = email.toLowerCase().trim()
  if (DEPARTMENT_BY_EMAIL[normalized]) {
    return DEPARTMENT_BY_EMAIL[normalized]
  }
  // Try finding by prefix matching (e.g. admin.pwd -> pwd)
  const found = DEPARTMENTS.find(d => normalized.includes(d.id) || normalized === d.adminEmail.toLowerCase())
  return found || null
}

/**
 * Get department responsible for a given report category
 */
export function getDepartmentByCategory(category?: string | null): Department {
  if (!category) return DEPARTMENT_MAP['grievance']
  const cat = category.toLowerCase().trim()
  const found = DEPARTMENTS.find(d => d.categories.includes(cat))
  return found || DEPARTMENT_MAP['grievance']
}

/**
 * Resolve the department for a logged-in admin user and profile
 */
export function getAdminDepartment(user?: any, profile?: any): Department | null {
  // 1. Check explicit profile department
  if (profile?.department && DEPARTMENT_MAP[profile.department]) {
    return DEPARTMENT_MAP[profile.department]
  }

  // 2. Check user metadata
  const metaDept = user?.user_metadata?.department
  if (metaDept && DEPARTMENT_MAP[metaDept]) {
    return DEPARTMENT_MAP[metaDept]
  }

  // 3. Check by email
  const userEmail = user?.email || profile?.email
  if (userEmail) {
    const dept = getDepartmentByEmail(userEmail)
    if (dept) return dept
  }

  // 4. Check by full name
  const name = profile?.full_name || user?.user_metadata?.full_name
  if (name) {
    const found = DEPARTMENTS.find(d => name.toLowerCase().includes(d.name.toLowerCase()) || name.toLowerCase().includes(d.shortName.toLowerCase()))
    if (found) return found
  }

  // If role is admin but no department is matched, default to general administration or PWD
  if (profile?.role === 'admin' || user?.user_metadata?.role === 'admin') {
    return DEPARTMENT_MAP['pwd']
  }

  return null
}

/**
 * Checks if a category belongs to a given department
 */
export function isCategoryInDepartment(category: string, departmentId: string): boolean {
  const dept = DEPARTMENT_MAP[departmentId]
  if (!dept) return false
  return dept.categories.includes(category.toLowerCase().trim())
}
