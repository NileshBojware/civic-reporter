/**
 * SheherAI Vision Civic Image Classification Service
 * 
 * Analyzes visual image content using SheherAI Vision to detect civic issues,
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
  /** Explanation of visual features identified by SheherAI */
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
 * Client-side high performance canvas resizer.
 * Resizes any massive camera-clicked photo (10MB-30MB) down to an optimized
 * resolution (<1024px, ~120KB) so that uploads to serverless/Vercel functions
 * are instant, never hit 413 Payload Too Large limits, and process in 1-2s.
 */
export async function resizeImageForAI(
  fileOrBlob: File | Blob,
  maxDimension = 1024,
  quality = 0.85
): Promise<{ base64: string; blob: Blob }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const base64 = await fileToBase64(fileOrBlob)
    return { base64, blob: fileOrBlob }
  }

  // 1. First attempt: Fast native HTML5 Canvas Resizing
  try {
    const result = await new Promise<{ base64: string; blob: Blob }>((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(fileOrBlob)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        let { width, height } = img

        if (width <= 0 || height <= 0) {
          reject(new Error('Invalid image dimensions'))
          return
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'))
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const base64 = canvas.toDataURL('image/jpeg', quality)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ base64, blob })
            } else {
              reject(new Error('Canvas blob generation failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl)
        reject(err)
      }

      img.src = objectUrl
    })

    return result
  } catch (canvasErr) {
    // 2. Second attempt: browser-image-compression for EXIF orientation & HEIC conversion
    try {
      const imageCompression = (await import('browser-image-compression')).default
      const compressedBlob = await imageCompression(fileOrBlob as File, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: quality,
      })
      const base64 = await fileToBase64(compressedBlob)
      return { base64, blob: compressedBlob }
    } catch (compressionErr) {
      console.warn('Image compression fallback:', compressionErr)
      const base64 = await fileToBase64(fileOrBlob)
      return { base64, blob: fileOrBlob }
    }
  }
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
 * Classifies an image using SheherAI Vision by analyzing its actual visual content.
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
      // If it's a huge base64 string, keep it, or if it has prefix parse it
      base64String = image
    } else if (image instanceof Blob) {
      // Resize huge camera photos on client canvas
      try {
        const resized = await resizeImageForAI(image, 1024, 0.85)
        base64String = resized.base64
        mimeType = 'image/jpeg'
      } catch (resizeErr) {
        console.warn('Canvas resize fallback:', resizeErr)
        mimeType = image.type || 'image/jpeg'
        base64String = await fileToBase64(image)
      }
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

    // Call server-side SheherAI Vision analysis API
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
