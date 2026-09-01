/**
 * Hebrew free-text address parser.
 *
 * monday.com stores addresses as one free-text string that mixes street, house
 * number, floor, apartment, entrance and sometimes the city
 * ("רחוב חלמיש 4 קומה 3 דירה 16"). Parsing it positionally — street, first
 * number, then "everything else is the city" — is what put "קומה 6 דירה 18"
 * into the ישוב field.
 *
 * This parser is label-driven instead: every labelled fragment is recognised and
 * *removed* first, whatever order it appears in, and only the remainder is
 * considered for street/house/city. A city is produced only when it is
 * unambiguous; otherwise the field is left empty and `cityAmbiguous` is set so
 * the UI can flag it for manual entry. A floor or apartment fragment can never
 * reach the city field, because it is gone before the city is even considered.
 */

export type ParsedAddress = {
  street: string
  houseNumber: string
  floor: string
  apartment: string
  entrance: string
  city: string
  postalCode: string
  /** the source had address text, but no city could be determined safely */
  cityAmbiguous: boolean
}

const EMPTY: ParsedAddress = {
  street: '',
  houseNumber: '',
  floor: '',
  apartment: '',
  entrance: '',
  city: '',
  postalCode: '',
  cityAmbiguous: false,
}

/** Words that rule a fragment out as a city name. Deliberately excludes בית — בית שאן / בית שמש are cities. */
const NOT_A_CITY = /(?:בניין|בנין|מגדל|קומ[הת]|דירה|דיר['׳]|כניסה|שכונ[הת]|פינת|מול|ליד|מיקוד)/

/** Israeli city names run to three words at most (תל אביב יפו). */
const MAX_CITY_WORDS = 3

const clean = (v: string) => v.replace(/[\s,;]+/g, ' ').trim()

/**
 * Pull one labelled fragment out of the string, returning the captured value and
 * the string with that fragment removed.
 */
function extract(source: string, pattern: RegExp): { value: string; rest: string } {
  const m = source.match(pattern)
  if (!m) return { value: '', rest: source }
  return { value: m[1].trim(), rest: source.replace(m[0], ' ') }
}

export function parseAddress(raw: string, structuredCity = ''): ParsedAddress {
  const trimmed = String(raw ?? '').trim()
  const city = String(structuredCity ?? '').trim()
  if (!trimmed) {
    // no address text at all — a structured city alone is still worth keeping
    return { ...EMPTY, city }
  }

  let rest = trimmed

  const postal = extract(rest, /מיקוד\s*:?\s*(\d{5,7})/)
  rest = postal.rest
  const floor = extract(rest, /קומ[הת]\s*:?\s*(קרקע|-?\d+|[א-ת]['׳]?)/)
  rest = floor.rest
  const apartment = extract(rest, /(?:דירה|דירת|דיר['׳])\s*:?\s*(\d+[א-ת]?|[א-ת]['׳]?)/)
  rest = apartment.rest
  const entrance = extract(rest, /כניסה\s*:?\s*(\d+|[א-ת]['׳]?)/)
  rest = entrance.rest
  // PO boxes are noise for a delivery address form
  rest = rest.replace(/ת["׳']?\.?ד\.?\s*:?\s*\d*/g, ' ')

  // commas are meaningful boundaries — keep them as segment markers
  const segments = rest
    .split(/[,;]/)
    .map((s) => clean(s))
    .filter(Boolean)

  let street = ''
  let houseNumber = ''
  let apartmentFromSlash = ''
  let tail = ''
  let cityFromSegment = ''

  // the street lives in the first segment that carries a house number
  const numberPattern = /(?:^|\s)(\d+[א-ת]?(?:\s*\/\s*(?:\d+[א-ת]?|[א-ת]))?)(?=\s|$)/
  const streetIndex = segments.findIndex((s) => numberPattern.test(s))

  if (streetIndex === -1) {
    // no house number anywhere — everything is street text, city stays unknown
    street = segments.join(' ')
  } else {
    const segment = segments[streetIndex]
    const m = segment.match(numberPattern)!
    const at = m.index ?? 0
    street = clean(segment.slice(0, at))
    const number = m[1].replace(/\s+/g, '')
    // "3/5" is house 3, apartment 5
    const [house, viaSlash] = number.split('/')
    houseNumber = house
    apartmentFromSlash = viaSlash ?? ''
    tail = clean(segment.slice(at + m[0].length))

    const laterSegments = segments.slice(streetIndex + 1)
    if (laterSegments.length > 0) cityFromSegment = laterSegments[laterSegments.length - 1]
  }

  const isCityLike = (candidate: string) => {
    if (!candidate) return false
    if (/\d/.test(candidate)) return false
    if (NOT_A_CITY.test(candidate)) return false
    return candidate.split(/\s+/).length <= MAX_CITY_WORDS
  }

  let resolvedCity = city
  let ambiguous = false
  if (!resolvedCity) {
    // a segment after the street is a strong signal; a bare tail is a weaker one
    const candidate = cityFromSegment || tail
    if (isCityLike(candidate)) {
      resolvedCity = candidate
    } else {
      // anything we are not sure about stays in the street line, never in ישוב
      if (candidate) street = clean(`${street} ${candidate}`)
      ambiguous = true
    }
  }

  return {
    street,
    houseNumber,
    floor: floor.value,
    apartment: apartment.value || apartmentFromSlash,
    entrance: entrance.value,
    city: resolvedCity,
    postalCode: postal.value,
    cityAmbiguous: ambiguous,
  }
}
