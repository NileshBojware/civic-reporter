export interface GPSCoordinates {
  latitude: number
  longitude: number
}

/**
 * Extracts GPS coordinates from a JPEG array buffer, parsing the APP1 EXIF segment.
 * Returns { latitude, longitude } if found, otherwise null.
 */
export function extractGPSFromJPEG(arrayBuffer: ArrayBuffer): GPSCoordinates | null {
  const view = new DataView(arrayBuffer)
  
  // Verify SOI (Start of Image) marker 0xFFD8
  if (view.byteLength < 2 || view.getUint16(0) !== 0xFFD8) {
    return null // Not a valid JPEG
  }

  let offset = 2
  const length = view.byteLength

  while (offset < length - 2) {
    const marker = view.getUint16(offset)
    if (marker === 0xFFE1) { // APP1 segment (EXIF)
      const segmentLength = view.getUint16(offset + 2)
      return parseEXIFSegment(view, offset + 4, segmentLength - 2)
    }
    // Check if it's another marker that contains length (most markers except SOI, EOI, etc.)
    if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFFD8 && marker !== 0xFFD9) {
      const segmentLength = view.getUint16(offset + 2)
      offset += 2 + segmentLength
    } else {
      offset += 1
    }
  }

  return null
}

function parseEXIFSegment(view: DataView, offset: number, length: number): GPSCoordinates | null {
  // Check Exif header "Exif\0\0"
  if (length < 6) return null
  
  const charE = view.getUint8(offset)
  const charX = view.getUint8(offset + 1)
  const charI = view.getUint8(offset + 2)
  const charF = view.getUint8(offset + 3)
  const char0_1 = view.getUint8(offset + 4)
  const char0_2 = view.getUint8(offset + 5)

  if (charE !== 0x45 || charX !== 0x78 || charI !== 0x69 || charF !== 0x66 || char0_1 !== 0x00 || char0_2 !== 0x00) {
    return null // Not valid EXIF
  }

  const tiffStart = offset + 6
  
  // Parse TIFF header
  if (tiffStart + 8 > view.byteLength) return null
  const byteOrder = view.getUint16(tiffStart)
  let littleEndian = false
  if (byteOrder === 0x4949) {
    littleEndian = true
  } else if (byteOrder === 0x4D4D) {
    littleEndian = false
  } else {
    return null // Invalid TIFF byte alignment
  }

  const signature = view.getUint16(tiffStart + 2, littleEndian)
  if (signature !== 42) {
    return null // Invalid TIFF signature
  }

  const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian)
  if (ifd0Offset + tiffStart >= view.byteLength) {
    return null
  }

  let gpsInfoOffset: number | null = null
  let currentOffset = tiffStart + ifd0Offset

  // Read IFD0 entries
  if (currentOffset + 2 > view.byteLength) return null
  const numEntries = view.getUint16(currentOffset, littleEndian)
  currentOffset += 2

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = currentOffset + i * 12
    if (entryOffset + 12 > view.byteLength) break
    const tag = view.getUint16(entryOffset, littleEndian)
    if (tag === 0x8825) { // GPSInfo tag
      gpsInfoOffset = view.getUint32(entryOffset + 8, littleEndian)
      break
    }
  }

  if (gpsInfoOffset === null) {
    return null // No GPS Info found
  }

  const gpsIfdStart = tiffStart + gpsInfoOffset
  if (gpsIfdStart + 2 > view.byteLength) return null
  const numGpsEntries = view.getUint16(gpsIfdStart, littleEndian)
  let gpsOffset = gpsIfdStart + 2

  let latRef = ''
  let latVal: number[] = []
  let lngRef = ''
  let lngVal: number[] = []

  for (let i = 0; i < numGpsEntries; i++) {
    const entryOffset = gpsOffset + i * 12
    if (entryOffset + 12 > view.byteLength) break
    
    const tag = view.getUint16(entryOffset, littleEndian)
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)
    const valueOffset = view.getUint32(entryOffset + 8, littleEndian)

    if (tag === 0x0001) { // GPSLatitudeRef
      latRef = String.fromCharCode(view.getUint8(entryOffset + 8))
    } else if (tag === 0x0002) { // GPSLatitude
      latVal = readRationals(view, tiffStart + valueOffset, count, littleEndian)
    } else if (tag === 0x0003) { // GPSLongitudeRef
      lngRef = String.fromCharCode(view.getUint8(entryOffset + 8))
    } else if (tag === 0x0004) { // GPSLongitude
      lngVal = readRationals(view, tiffStart + valueOffset, count, littleEndian)
    }
  }

  if (latVal.length === 3 && lngVal.length === 3 && latRef && lngRef) {
    const latitude = convertDMSToDD(latVal[0], latVal[1], latVal[2], latRef)
    const longitude = convertDMSToDD(lngVal[0], lngVal[1], lngVal[2], lngRef)
    return { latitude, longitude }
  }

  return null
}

function readRationals(view: DataView, offset: number, count: number, littleEndian: boolean): number[] {
  const result: number[] = []
  for (let i = 0; i < count; i++) {
    const entryOffset = offset + i * 8
    if (entryOffset + 8 > view.byteLength) break
    const num = view.getUint32(entryOffset, littleEndian)
    const den = view.getUint32(entryOffset + 4, littleEndian)
    if (den === 0) {
      result.push(0)
    } else {
      result.push(num / den)
    }
  }
  return result
}

function convertDMSToDD(degrees: number, minutes: number, seconds: number, ref: string): number {
  let dd = degrees + (minutes / 60.0) + (seconds / 3600.0)
  if (ref === 'S' || ref === 'W') {
    dd = -dd
  }
  return dd
}
