/**
 * Gemini Vision Civic Image Classification Service
 * 
 * Analyzes visual image content using Gemini Vision to detect civic issues,
 * generate issue titles & descriptions, and categorize into one of 12 predefined
 * civic categories mapped directly to municipal departments.
 * 
 * Keyword matching and filename heuristics have been completely removed.
 */

import { CIVIC_CATEGORIES, getCategoryMeta, CivicCategory } from './categories'
import { getDepartmentByCategory, Department } from './departments'

export interface ClassificationResult {
  /** Auto-generated issue title */
  issueName: string
  /** Auto-generated detailed description */
  description?: string
  /** One of the 12 predefined civic category IDs */
  category: string
  /** Human-readable category label */
  categoryLabel: string
  /** Matched subcategory */
  subcategory?: string
  /** Department ID */
  departmentId: string
  /** Department full name */
  departmentName: string
  /** Department short code/name */
  departmentShortName: string
  /** Confidence score (0.0 to 1.0) */
  confidence: number
  /** Method identifier */
  method: 'gemini_vision'
  /** Explanation of visual features identified by Gemini */
  explanation: string
}

export interface ClassificationResponse {
  result: ClassificationResult | null
  missingApiKey?: boolean
  error?: string
}

export interface ClassificationApiResponse {
  success: boolean
  available?: boolean
  missingApiKey?: boolean
  issueName?: string
  title?: string
  description?: string
  category?: string
  categoryLabel?: string
  subcategory?: string
  departmentId?: string
  departmentName?: string
  departmentShortName?: string
  confidence?: number
  explanation?: string
  method?: 'gemini_vision'
  error?: string
  manualRequired?: boolean
}

/**
 * Convert a File or Blob to a base64 data URL string.
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read image as base64 string'))
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * Classifies an image using Gemini Vision by analyzing its actual visual content.
 * 
 * @param image File, Blob, or base64 data URL string representing the photo evidence.
 * @param customApiKey Optional Gemini API key if provided by the user in browser session.
 */
export async function classifyImageWithStatus(
  image: File | Blob | string,
  customApiKey?: string
): Promise<ClassificationResponse> {
  try {
    let base64String = ''
    let mimeType = 'image/jpeg'

    if (typeof image === 'string') {
      base64String = image
    } else if (image instanceof Blob) {
      mimeType = image.type || 'image/jpeg'
      base64String = await fileToBase64(image)
    } else {
      throw new Error('Invalid image input format. Expected File, Blob, or base64 string.')
    }

    const storedKey =
      customApiKey ||
      (typeof window !== 'undefined' ? localStorage.getItem('civic_gemini_api_key') || '' : '')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (storedKey) {
      headers['x-gemini-api-key'] = storedKey.trim()
    }

    // Call server-side Gemini Vision analysis API
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageBase64: base64String,
        mimeType: mimeType,
      }),
    })

    if (!response.ok) {
      return {
        result: null,
        error: `Server responded with status ${response.status}`,
      }
    }

    const data: ClassificationApiResponse = await response.json()

    if (data.missingApiKey) {
      return {
        result: null,
        missingApiKey: true,
        error: data.error,
      }
    }

    if (!data.success || !data.category) {
      return {
        result: null,
        error: data.error || 'SheherAI Vision could not identify civic issue.',
      }
    }

    const catMeta = getCategoryMeta(data.category)
    const dept = getDepartmentByCategory(data.category)

    const result: ClassificationResult = {
      issueName: data.issueName || data.title || catMeta.label,
      description: data.description,
      category: data.category,
      categoryLabel: catMeta.label,
      subcategory: data.subcategory || catMeta.subcategories[0],
      departmentId: dept.id,
      departmentName: dept.name,
      departmentShortName: dept.shortName,
      confidence: data.confidence || 0.95,
      method: 'gemini_vision',
      explanation: data.explanation || `Visual analysis by SheherAI identified ${catMeta.label}.`,
    }

    return {
      result,
    }
  } catch (error: any) {
    console.error('SheherAI image classification error:', error)
    return {
      result: null,
      error: error.message || 'Image classification failed',
    }
  }
}

/**
 * Backward compatible classifyImage wrapper.
 */
export async function classifyImage(
  image: File | Blob | string
): Promise<ClassificationResult | null> {
  const resp = await classifyImageWithStatus(image)
  return resp.result
}
