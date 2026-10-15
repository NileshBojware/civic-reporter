import fs from 'fs'
import path from 'path'

// Save in the parent folder or workspace root to avoid rebuild cycles if next watches changes
const MOCK_DB_PATH = path.join(process.cwd(), 'mock_db.json')

export interface Profile {
  id: string
  full_name: string
  role: 'citizen' | 'admin'
  department?: string
  email?: string
  created_at: string
}

export interface Report {
  id: string
  user_id: string | null
  title: string
  description: string
  category:
    | 'roads_transport'
    | 'water_supply'
    | 'drainage_sewerage'
    | 'waste_management'
    | 'street_lighting'
    | 'sanitation_health'
    | 'parks_spaces'
    | 'traffic_parking'
    | 'electricity_utilities'
    | 'encroachment_construction'
    | 'public_infrastructure'
    | 'other_civic'
    | 'road_damage'
    | 'garbage'
    | 'water_leakage'
    | 'drainage'
    | 'streetlight'
    | 'other'
    | string
  latitude: number
  longitude: number
  address: string
  image_url: string
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected'
  rejection_reason?: string | null
  resolved_image_url?: string | null
  resolved_note?: string | null
  upvote_count: number
  created_at: string
  updated_at: string
}

export interface ReportVote {
  report_id: string
  user_id: string
}

export interface Comment {
  id: string
  report_id: string
  user_id: string | null
  author_name: string
  body: string
  created_at: string
}

export interface MockNotification {
  id: string
  user_id: string
  report_id: string
  title: string
  message: string
  is_read: boolean
  type: 'status_change' | 'new_report'
  created_at: string
}

interface MockData {
  profiles: Profile[]
  reports: Report[]
  report_votes: ReportVote[]
  notifications: MockNotification[]
  comments: Comment[]
}

const defaultData: MockData = {
  profiles: [
    {
      id: 'admin-pwd',
      full_name: 'Public Works / Engineering Admin',
      role: 'admin',
      department: 'pwd',
      email: 'admin.pwd@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-electrical',
      full_name: 'Electrical Department Admin',
      role: 'admin',
      department: 'electrical',
      email: 'admin.electrical@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-health',
      full_name: 'Public Health Department Admin',
      role: 'admin',
      department: 'health',
      email: 'admin.health@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-water',
      full_name: 'Water Supply Department Admin',
      role: 'admin',
      department: 'water',
      email: 'admin.water@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-sewerage',
      full_name: 'Sewerage & Drainage Department Admin',
      role: 'admin',
      department: 'sewerage',
      email: 'admin.sewerage@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-solidwaste',
      full_name: 'Solid Waste Management Department Admin',
      role: 'admin',
      department: 'solidwaste',
      email: 'admin.solidwaste@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-gardens',
      full_name: 'Garden & Parks Department Admin',
      role: 'admin',
      department: 'gardens',
      email: 'admin.gardens@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-townplanning',
      full_name: 'Town Planning / Encroachment Admin',
      role: 'admin',
      department: 'townplanning',
      email: 'admin.townplanning@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-traffic',
      full_name: 'Traffic Department Admin',
      role: 'admin',
      department: 'traffic',
      email: 'admin.traffic@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-grievance',
      full_name: 'General Administration / Grievance Cell Admin',
      role: 'admin',
      department: 'grievance',
      email: 'admin.grievance@shehercare.in',
      created_at: new Date().toISOString()
    },
    {
      id: 'citizen-id-123',
      full_name: 'John Citizen',
      role: 'citizen',
      email: 'citizen@shehercare.in',
      created_at: new Date().toISOString()
    }
  ],
  reports: [
    {
      id: 'report-1',
      user_id: 'citizen-id-123',
      title: 'Deep pothole near crossroads',
      description: 'A deep pothole has opened up right in the middle of the main junction, dangerous for two-wheelers.',
      category: 'road_damage',
      latitude: 19.8735,
      longitude: 75.3262,
      address: 'Kranti Chowk, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
      status: 'pending',
      upvote_count: 5,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-2',
      user_id: 'citizen-id-123',
      title: 'Broken streetlight causing dark alley',
      description: 'The streetlight near the park entrance has been flickering and is now completely dead.',
      category: 'streetlight',
      latitude: 19.8821,
      longitude: 75.3582,
      address: 'Jalna Road, CIDCO, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=800&q=80',
      status: 'in_progress',
      upvote_count: 12,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-3',
      user_id: 'citizen-id-123',
      title: 'Water leaking from main line',
      description: 'Clean drinking water is bursting out of the pipe under the pavement.',
      category: 'water_leakage',
      latitude: 19.8631,
      longitude: 75.3195,
      address: 'Station Road, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1542013936693-8848e574047e?auto=format&fit=crop&w=800&q=80',
      status: 'resolved',
      resolved_image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      resolved_note: 'Main valve replaced, leakage plugged.',
      upvote_count: 3,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-4',
      user_id: 'citizen-id-123',
      title: 'Overflowing public garbage bin',
      description: 'Garbage has accumulated over the past week and spilled onto the road, attracting stray animals.',
      category: 'waste_management',
      latitude: 19.8860,
      longitude: 75.3340,
      address: 'Shahganj Market Road, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
      status: 'verified',
      upvote_count: 8,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-5',
      user_id: 'citizen-id-123',
      title: 'Blocked storm drain causing road flooding',
      description: 'Heavy silt and plastic waste is completely blocking the rainwater drain near the residential junction.',
      category: 'drainage_sewerage',
      latitude: 19.8672,
      longitude: 75.3370,
      address: 'Shahnoorwadi Main Road, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80',
      status: 'in_progress',
      upvote_count: 14,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-6',
      user_id: 'citizen-id-123',
      title: 'Traffic signal malfunctioning at busy junction',
      description: 'The green signal is not lighting up, leading to severe confusion and vehicle gridlock during rush hour.',
      category: 'traffic_parking',
      latitude: 19.8790,
      longitude: 75.3210,
      address: 'Baba Petrol Pump Chowk, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80',
      status: 'pending',
      upvote_count: 9,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-7',
      user_id: 'citizen-id-123',
      title: 'Large fallen tree branch obstructing park trail',
      description: 'Recent winds broke a heavy bough that now blocks the primary jogging and walking track.',
      category: 'parks_spaces',
      latitude: 19.8895,
      longitude: 75.3175,
      address: 'Siddharth Garden & Zoo, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
      status: 'resolved',
      resolved_note: 'Branch cleared and safely moved by garden department.',
      upvote_count: 4,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'report-8',
      user_id: 'citizen-id-123',
      title: 'Loose dangling electrical wire near bus stop',
      description: 'High tension cable has slipped from its clamp and is hanging dangerously low over pedestrians.',
      category: 'electricity_utilities',
      latitude: 19.8770,
      longitude: 75.3290,
      address: 'CBS Bus Station, Chhatrapati Sambhaji Nagar, Maharashtra',
      image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
      status: 'verified',
      upvote_count: 18,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  report_votes: [
    { report_id: 'report-2', user_id: 'citizen-id-123' }
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'citizen-id-123',
      report_id: 'report-3',
      title: 'Issue Status Updated',
      message: 'Your reported issue "Water leaking from main line" status has been changed to resolved.',
      is_read: false,
      type: 'status_change',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  comments: [
    {
      id: 'comment-1',
      report_id: 'report-1',
      user_id: 'citizen-id-123',
      author_name: 'John Citizen',
      body: 'This pothole has been here for weeks, my bike tyre burst because of it!',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'comment-2',
      report_id: 'report-1',
      user_id: null,
      author_name: 'Anonymous',
      body: 'Agreed, very dangerous especially at night. Please fix urgently.',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ]
}

export function readMockDb(): MockData {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
  try {
    const fileContent = fs.readFileSync(MOCK_DB_PATH, 'utf-8')
    const parsed = JSON.parse(fileContent)
    // Back-fill any keys added after the file was first written
    return {
      ...defaultData,
      ...parsed,
      comments: parsed.comments ?? defaultData.comments,
    }
  } catch {
    return defaultData
  }
}

export function writeMockDb(data: MockData) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2))
}
