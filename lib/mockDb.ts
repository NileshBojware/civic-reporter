import fs from 'fs'
import path from 'path'

// Save in the parent folder or workspace root to avoid rebuild cycles if next watches changes
const MOCK_DB_PATH = path.join(process.cwd(), 'mock_db.json')

export interface Profile {
  id: string
  full_name: string
  role: 'citizen' | 'admin'
  created_at: string
}

export interface Report {
  id: string
  user_id: string | null
  title: string
  description: string
  category: 'road_damage' | 'garbage' | 'water_leakage' | 'drainage' | 'streetlight' | 'other'
  latitude: number
  longitude: number
  address: string
  image_url: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
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

interface MockData {
  profiles: Profile[]
  reports: Report[]
  report_votes: ReportVote[]
}

const defaultData: MockData = {
  profiles: [
    {
      id: 'admin-id-123',
      full_name: 'Municipal Admin',
      role: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: 'citizen-id-123',
      full_name: 'John Citizen',
      role: 'citizen',
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
      latitude: 12.9715987,
      longitude: 77.5945627,
      address: 'Cubbon Park Road, Bangalore',
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
      latitude: 12.9729,
      longitude: 77.5937,
      address: 'Lavelle Road, Bangalore',
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
      latitude: 12.9701,
      longitude: 77.5952,
      address: 'Kasturba Road, Bangalore',
      image_url: 'https://images.unsplash.com/photo-1542013936693-8848e574047e?auto=format&fit=crop&w=800&q=80',
      status: 'resolved',
      resolved_image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      resolved_note: 'Main valve replaced, leakage plugged.',
      upvote_count: 3,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  report_votes: [
    { report_id: 'report-2', user_id: 'citizen-id-123' }
  ]
}

export function readMockDb(): MockData {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
  try {
    const fileContent = fs.readFileSync(MOCK_DB_PATH, 'utf-8')
    return JSON.parse(fileContent)
  } catch (e) {
    return defaultData
  }
}

export function writeMockDb(data: MockData) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2))
}
