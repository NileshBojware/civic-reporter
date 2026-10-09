import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { CIVIC_CATEGORIES, getCategoryMeta, normalizeCategoryKey } from '@/lib/categories'
import { getDepartmentByCategory } from '@/lib/departments'

// List of allowed category IDs for validation
const VALID_CATEGORY_IDS = new Set(CIVIC_CATEGORIES.map((c) => c.id))

const SYSTEM_PROMPT = `You are an advanced AI vision classifier for a municipal civic issues reporting system.
Your job is to analyze the VISUAL CONTENT of the uploaded image carefully to identify municipal civic issues.

CRITICAL INSTRUCTION:
- Base your analysis ENTIRELY on the visual pixels and evidence in the image.
- DO NOT rely on or assume any filename. Filenames are completely excluded.
- Identify the primary municipal/civic hazard, damage, or issue present.

You must select exactly ONE of the following 12 predefined civic categories:
1. "roads_transport" - Potholes, Damaged Road, Road Damage, Traffic Sign Issue, asphalt fractures, roadway hazards.
2. "water_supply" - Water Leakage, Water Shortage, Pipeline Damage, Water Quality, burst pipes, water contamination.
3. "drainage_sewerage" - Blocked Drain, Drain Overflow, Sewage Leakage, Open Manhole, flooded gutters.
4. "waste_management" - Garbage Overflow, Garbage Not Collected, Illegal Dumping, Damaged Dustbin, trash piles.
5. "street_lighting" - Streetlight Not Working, Damaged Streetlight, Broken Pole, Electrical Wire Issue, dark lamp fixtures.
6. "sanitation_health" - Unclean Area, Public Toilet Issue, Unsanitary Conditions, Open Defecation, foul public spaces.
7. "parks_spaces" - Park Maintenance, Damaged Equipment, Tree/Vegetation Issue, Public Space Damage, fallen branches, broken park benches.
8. "traffic_parking" - Illegal Parking, Traffic Signal Issue, Road Obstruction, Parking Issue, faulty traffic lights.
9. "electricity_utilities" - Power Supply Issue, Exposed Wires, Damaged Utility Pole, Electrical Hazard, transformer sparks, hanging live wires.
10. "encroachment_construction" - Illegal Encroachment, Unauthorized Construction, Footpath Encroachment, Public Land Occupation, building violations.
11. "public_infrastructure" - Damaged Footpath, Damaged Bus Stop, Broken Signboard, Damaged Public Property, municipal property destruction.
12. "other_civic" - Stray Animals, Noise Complaint, Public Nuisance, Other Issue, or any miscellaneous civic grievance.

Generate:
1. title: A concise, professional, informative title for the civic issue (e.g. "Severe Pothole on Road Surface", "Overflowing Commercial Garbage Dumpster", "Broken Streetlight Fixture", "Burst Water Supply Pipe").
2. description: A clear 1-3 sentence summary detailing what is visibly damaged, location context visible in the photo, and why it requires municipal attention.
3. category: Exactly one of the 12 category IDs above.
4. subcategory: The closest matching subcategory string for the selected category.
5. confidence: A number between 0.50 and 0.99 reflecting visual certainty.
6. explanation: A brief 1-2 sentence description explaining the visual evidence detected in the image.

Output ONLY valid JSON adhering strictly to this schema:
{
  "title": "string",
  "description": "string",
  "category": "roads_transport" | "water_supply" | "drainage_sewerage" | "waste_management" | "street_lighting" | "sanitation_health" | "parks_spaces" | "traffic_parking" | "electricity_utilities" | "encroachment_construction" | "public_infrastructure" | "other_civic",
  "subcategory": "string",
  "confidence": number,
  "explanation": "string"
}`

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function cleanAndParseJson(text: string): any {
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }
  return JSON.parse(cleaned.trim())
}

export async function POST(request: NextRequest) {
  try {
    let mimeType = 'image/jpeg'
    let base64Data = ''
    let clientApiKey = request.headers.get('x-gemini-api-key') || ''

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      base64Data = body.imageBase64 || ''
      mimeType = body.mimeType || 'image/jpeg'
      if (body.apiKey && !clientApiKey) {
        clientApiKey = body.apiKey
      }

      // Strip data URL prefix if present (e.g. data:image/jpeg;base64,...)
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',')
        const headerMatch = parts[0].match(/:(.*?);/)
        if (headerMatch && headerMatch[1]) {
          mimeType = headerMatch[1]
        }
        base64Data = parts[1]
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('image') as File | null
      const formKey = formData.get('apiKey') as string | null
      if (formKey && !clientApiKey) {
        clientApiKey = formKey
      }

      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
      }

      mimeType = file.type || 'image/jpeg'
      const arrayBuffer = await file.arrayBuffer()
      base64Data = Buffer.from(arrayBuffer).toString('base64')
    } else {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' },
        { status: 400 }
      )
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'Image data is empty' }, { status: 400 })
    }

    const apiKey =
      clientApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''

    // If Gemini API Key is missing, respond indicating AI is unavailable so manual selection is used
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          missingApiKey: true,
          error: 'SheherAI Vision is not configured. Please add GEMINI_API_KEY to your environment variables or provide a key.',
          manualRequired: true,
        },
        { status: 200 }
      )
    }

    // Call Gemini API with vision content
    const genAI = new GoogleGenerativeAI(apiKey.trim())
    // Active fast models in order of benchmark latency and reliability
    const modelNames = [
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
    ]
    let parsedResult: any = null
    let lastError: any = null

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        })

        const result = await model.generateContent([
          SYSTEM_PROMPT,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ])

        const responseText = result.response.text()
        parsedResult = cleanAndParseJson(responseText)
        if (parsedResult) break
      } catch (err: any) {
        lastError = err
        // Try next model if model not found or transient error
      }
    }

    if (!parsedResult) {
      console.error('Gemini Vision classification failed:', lastError)
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: lastError?.message || 'Gemini image analysis failed. Please select a category manually.',
          manualRequired: true,
        },
        { status: 200 }
      )
    }

    // Validate and normalize category
    let category = parsedResult.category?.toLowerCase()?.trim() || 'other_civic'
    if (!VALID_CATEGORY_IDS.has(category)) {
      category = normalizeCategoryKey(category)
      if (!VALID_CATEGORY_IDS.has(category)) {
        category = 'other_civic'
      }
    }

    const categoryMeta = getCategoryMeta(category)
    const department = getDepartmentByCategory(category)

    // Validate subcategory
    let subcategory = parsedResult.subcategory || categoryMeta.subcategories[0] || 'Other Issue'
    if (!categoryMeta.subcategories.includes(subcategory)) {
      const foundSub = categoryMeta.subcategories.find((s) =>
        s.toLowerCase().includes(subcategory.toLowerCase()) || subcategory.toLowerCase().includes(s.toLowerCase())
      )
      subcategory = foundSub || categoryMeta.subcategories[0] || 'Other Issue'
    }

    const responsePayload = {
      success: true,
      available: true,
      issueName: parsedResult.title || categoryMeta.label,
      title: parsedResult.title || categoryMeta.label,
      description: parsedResult.description || `Observed civic issue related to ${categoryMeta.label}.`,
      category: category,
      categoryLabel: categoryMeta.label,
      subcategory: subcategory,
      departmentId: department.id,
      departmentName: department.name,
      departmentShortName: department.shortName,
      confidence: typeof parsedResult.confidence === 'number' ? Math.min(Math.max(parsedResult.confidence, 0.5), 0.99) : 0.95,
      explanation: parsedResult.explanation || `Visual analysis identified features corresponding to ${categoryMeta.label}.`,
      method: 'gemini_vision' as const,
    }

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    console.error('Image analysis server error:', error)
    return NextResponse.json(
      {
        success: false,
        available: false,
        error: error.message || 'Internal server error during image analysis',
        manualRequired: true,
      },
      { status: 200 }
    )
  }
}
