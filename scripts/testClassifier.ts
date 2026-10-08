import { classifyImageByFilename } from '../lib/imageClassifier'

const testCases = [
  // Examples from prompt
  { filename: 'pothole_01.jpg', expectedIssue: 'Pothole', expectedCat: 'roads_transport', expectedDept: 'Public Works / Engineering' },
  { filename: 'streetlight_01.jpg', expectedIssue: 'Broken Streetlight', expectedCat: 'street_lighting', expectedDept: 'Electrical Department' },
  { filename: 'garbage_01.jpg', expectedIssue: 'Garbage Dump', expectedCat: 'waste_management', expectedDept: 'Solid Waste Management Department' },

  // Public Works / Engineering
  { filename: 'road_damage_photo.png', expectedIssue: 'Road Damage', expectedCat: 'roads_transport', expectedDept: 'Public Works / Engineering' },
  { filename: 'road_crack_2024.jpg', expectedIssue: 'Road Crack', expectedCat: 'roads_transport', expectedDept: 'Public Works / Engineering' },
  { filename: 'asphalt-problem.jpeg', expectedIssue: 'Damaged Asphalt Road', expectedCat: 'roads_transport', expectedDept: 'Public Works / Engineering' },
  { filename: 'footpath_broken.jpg', expectedIssue: 'Damaged Footpath', expectedCat: 'public_infrastructure', expectedDept: 'Public Works / Engineering' },
  { filename: 'bus_stop_vandalized.jpg', expectedIssue: 'Damaged Bus Stop', expectedCat: 'public_infrastructure', expectedDept: 'Public Works / Engineering' },

  // Electrical Department
  { filename: 'street_light_down.jpg', expectedIssue: 'Broken Streetlight', expectedCat: 'street_lighting', expectedDept: 'Electrical Department' },
  { filename: 'electric_pole_leaning.jpg', expectedIssue: 'Damaged Electric Pole', expectedCat: 'electricity_utilities', expectedDept: 'Electrical Department' },
  { filename: 'powerline_hazard.jpg', expectedIssue: 'Hazardous Powerline', expectedCat: 'electricity_utilities', expectedDept: 'Electrical Department' },
  { filename: 'transformer_blast.png', expectedIssue: 'Transformer Issue', expectedCat: 'electricity_utilities', expectedDept: 'Electrical Department' },

  // Public Health Department
  { filename: 'sanitation_issue_ward4.jpg', expectedIssue: 'Sanitation Issue', expectedCat: 'sanitation_health', expectedDept: 'Public Health Department' },
  { filename: 'open_defecation_spot.jpg', expectedIssue: 'Open Defecation Issue', expectedCat: 'sanitation_health', expectedDept: 'Public Health Department' },
  { filename: 'foul_smell_area.png', expectedIssue: 'Foul Smell / Odor Hazard', expectedCat: 'sanitation_health', expectedDept: 'Public Health Department' },

  // Water Supply Department
  { filename: 'water_leakage_street5.jpg', expectedIssue: 'Water Leakage', expectedCat: 'water_supply', expectedDept: 'Water Supply Department' },
  { filename: 'pipe_leak_mainroad.jpeg', expectedIssue: 'Pipeline Leak', expectedCat: 'water_supply', expectedDept: 'Water Supply Department' },
  { filename: 'contaminated_water_sample.png', expectedIssue: 'Contaminated Water', expectedCat: 'water_supply', expectedDept: 'Water Supply Department' },
  { filename: 'no_water_block_b.jpg', expectedIssue: 'No Water Supply', expectedCat: 'water_supply', expectedDept: 'Water Supply Department' },

  // Sewerage & Drainage Department
  { filename: 'blocked_drain_near_market.jpg', expectedIssue: 'Blocked Drain', expectedCat: 'drainage_sewerage', expectedDept: 'Sewerage & Drainage Department' },
  { filename: 'drain_overflow_monsoon.jpg', expectedIssue: 'Drain Overflow', expectedCat: 'drainage_sewerage', expectedDept: 'Sewerage & Drainage Department' },
  { filename: 'open_manhole_danger.png', expectedIssue: 'Open Manhole', expectedCat: 'drainage_sewerage', expectedDept: 'Sewerage & Drainage Department' },
  { filename: 'sewage_leak.jpg', expectedIssue: 'Sewage Leakage', expectedCat: 'drainage_sewerage', expectedDept: 'Sewerage & Drainage Department' },

  // Solid Waste Management Department
  { filename: 'plastic_waste_corner.jpg', expectedIssue: 'Plastic Waste Dump', expectedCat: 'waste_management', expectedDept: 'Solid Waste Management Department' },
  { filename: 'overflowing_bin_sector2.png', expectedIssue: 'Overflowing Dustbin', expectedCat: 'waste_management', expectedDept: 'Solid Waste Management Department' },
  { filename: 'dead_animal_roadside.jpg', expectedIssue: 'Dead Animal Removal', expectedCat: 'waste_management', expectedDept: 'Solid Waste Management Department' },

  // Garden & Parks Department
  { filename: 'fallen_tree_heavy_rain.jpg', expectedIssue: 'Fallen Tree / Branch', expectedCat: 'parks_spaces', expectedDept: 'Garden & Parks Department' },
  { filename: 'public_park_broken_bench.jpg', expectedIssue: 'Public Park Maintenance', expectedCat: 'parks_spaces', expectedDept: 'Garden & Parks Department' },
  { filename: 'playground_swings_broken.png', expectedIssue: 'Playground Equipment Issue', expectedCat: 'parks_spaces', expectedDept: 'Garden & Parks Department' },

  // Town Planning / Encroachment
  { filename: 'illegal_construction_site.jpg', expectedIssue: 'Illegal Construction', expectedCat: 'encroachment_construction', expectedDept: 'Town Planning / Encroachment' },
  { filename: 'footpath_encroachment_hawkers.jpg', expectedIssue: 'Footpath Encroachment', expectedCat: 'encroachment_construction', expectedDept: 'Town Planning / Encroachment' },
  { filename: 'demolition_debris.png', expectedIssue: 'Demolition Hazard', expectedCat: 'encroachment_construction', expectedDept: 'Town Planning / Encroachment' },

  // Traffic Department
  { filename: 'traffic_signal_blinking.jpg', expectedIssue: 'Traffic Signal Issue', expectedCat: 'traffic_parking', expectedDept: 'Traffic Department' },
  { filename: 'illegal_parking_lane.jpg', expectedIssue: 'Illegal Parking', expectedCat: 'traffic_parking', expectedDept: 'Traffic Department' },
  { filename: 'zebra_crossing_faded.png', expectedIssue: 'Faded Zebra Crossing', expectedCat: 'traffic_parking', expectedDept: 'Traffic Department' },
  { filename: 'traffic_jam_junction.jpg', expectedIssue: 'Traffic Congestion', expectedCat: 'traffic_parking', expectedDept: 'Traffic Department' },

  // General Administration / Grievance Cell
  { filename: 'complaint_noise_night.jpg', expectedIssue: 'Citizen Complaint', expectedCat: 'other_civic', expectedDept: 'General Administration / Grievance Cell' },
  { filename: 'public_issue_ward.jpg', expectedIssue: 'Public Civic Grievance', expectedCat: 'other_civic', expectedDept: 'General Administration / Grievance Cell' },
  { filename: 'miscellaneous_issue_doc.png', expectedIssue: 'Miscellaneous Issue', expectedCat: 'other_civic', expectedDept: 'General Administration / Grievance Cell' },

  // Fallback test
  { filename: 'random_photo_20240412.jpg', expectedIssue: 'Other Civic Issue', expectedCat: 'other_civic', expectedDept: 'General Administration / Grievance Cell' },
  { filename: 'camera_capture_1234567.jpg', expectedIssue: 'Other Civic Issue', expectedCat: 'other_civic', expectedDept: 'General Administration / Grievance Cell' },
]

console.log(`Running ${testCases.length} Image Classification Test Cases...\n`)
let passed = 0
let failed = 0

for (const tc of testCases) {
  const res = classifyImageByFilename(tc.filename)
  const ok = res.issueName === tc.expectedIssue && res.category === tc.expectedCat && res.departmentName === tc.expectedDept
  if (ok) {
    console.log(`✅ PASS: "${tc.filename}" -> [${res.issueName}] / [${res.category}] / [${res.departmentName}]`)
    passed++
  } else {
    console.error(`❌ FAIL: "${tc.filename}"`)
    console.error(`   Expected: issue="${tc.expectedIssue}", cat="${tc.expectedCat}", dept="${tc.expectedDept}"`)
    console.error(`   Got:      issue="${res.issueName}", cat="${res.category}", dept="${res.departmentName}"`)
    failed++
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`)
if (failed > 0) {
  process.exit(1)
} else {
  console.log('All test cases passed perfectly!')
}
