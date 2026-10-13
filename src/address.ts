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
 *
 * The shapes handled here come from the real values on the לידים and לקוחות
 * boards (Oct 2026): "קומת קרקע", bare "קרקע", ordinal floors ("קומה שלישית"),
 * "מספר 6" as the house number, letter suffixes with a space ("84 ד", "6 ב'"),
 * "32א/6", a trailing "(דירת גן)", "|" as a separator, and the typos
 * "רחב"/"רחובמ"/"דדירה".
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
const NOT_A_CITY = /(?:בניין|בנין|מגדל|קומ[הת]|קרקע|דירה|דיר['׳]|כניסה|שכונ[הת]|פינת|מול|ליד|מיקוד|פנטהאוז|מרתף)/

/** Israeli city names run to three words at most (תל אביב יפו). */
const MAX_CITY_WORDS = 3

/** "קומה שלישית" — spelled-out floors, as people type them */
const ORDINAL_FLOORS =
  'ראשונה|שנייה|שניה|שלישית|רביעית|חמישית|שישית|שביעית|שמינית|תשיעית|עשירית|עליונה|אחרונה'

/** A single Hebrew letter used as a value ("קומה ב", "כניסה א'") — never the start of a longer word. */
const SINGLE_LETTER = "[א-ת]['׳]?(?![א-ת])"

const clean = (v: string) => v.replace(/[\s,;]+/g, ' ').trim()

/** Same city spelled slightly differently ("פתח תקוה" / "פתח תקווה") still compares equal. */
const cityKey = (v: string) => clean(v).replace(/['"׳״\-]/g, '').replace(/וו/g, 'ו').replace(/יי/g, 'י').replace(/\s+/g, '')

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
    // "(דירת גן)", "(הקומה הכי גבוהה - פנטהאוז)" — remarks, never address parts
    .replace(/\([^)]*\)?/g, ' ')
    // "16 א | קומת קרקע" — a pipe is a segment boundary like a comma
    .replace(/\|/g, ', ')
    // typos and abbreviations of רחוב
    .replace(/(^|[\s,])(?:רחב|רחובמ|רח['׳])(?=\s)/g, '$1רחוב')

  const postal = extract(rest, /מיקוד\s*:?\s*(\d{5,7})/)
  rest = postal.rest
  // "מספר 6" / "מס' 6" names the house number explicitly, even when the street itself is numbered ("רחוב 6002 מספר 3")
  const explicitNumber = extract(rest, /(?:מספר|מס['׳])\s*:?\s*(\d+[א-ת]?)/)
  rest = explicitNumber.rest
  const floor = extract(
    rest,
    new RegExp(`קומ[הת]\\s*:?\\s*(קרקע|${ORDINAL_FLOORS}|-?\\d+|${SINGLE_LETTER})`),
  )
  rest = floor.rest
  // a bare "קרקע" between commas or words is the ground floor too ("נקש 8 , קרקע, דירה 1")
  const bareGround = floor.value ? { value: '', rest } : extract(rest, /(?:^|[\s,])(קרקע)(?=$|[\s,.;])/)
  rest = bareGround.rest
  const apartment = extract(rest, new RegExp(`(?:ד?דירה|דירת|דיר['׳])\\s*:?\\s*(\\d+[א-ת]?|${SINGLE_LETTER})`))
  rest = apartment.rest
  const entrance = extract(rest, new RegExp(`כניסה\\s*:?\\s*(\\d+|${SINGLE_LETTER})`))
  rest = entrance.rest
  // PO boxes are noise for a delivery address form
  rest = rest.replace(/ת["׳']?\.?ד\.?\s*:?\s*\d*/g, ' ')
  // a stray full stop at the end of a token ("דירה 65.") is punctuation, not data
  rest = rest.replace(/\.(?=\s|$)/g, ' ')

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

  // the street lives in the first segment that carries a house number;
  // "12ב", "84 ד", "6 ב'" and "32א/6" are all one house number
  const numberPattern = new RegExp(
    `(?:^|\\s)(\\d+[א-ת]?(?:\\s${SINGLE_LETTER})?(?:\\s*\\/\\s*(?:\\d+[א-ת]?|[א-ת]))?)(?=\\s|$)`,
  )
  const streetIndex = explicitNumber.value ? -1 : segments.findIndex((s) => numberPattern.test(s))

  if (explicitNumber.value) {
    houseNumber = explicitNumber.value
    street = segments[0] ?? ''
    if (segments.length > 1) cityFromSegment = segments[segments.length - 1]
  } else if (streetIndex === -1) {
    // no house number anywhere — everything is street text, city stays unknown
    street = segments.join(' ')
  } else {
    const segment = segments[streetIndex]
    const m = segment.match(numberPattern)!
    const at = m.index ?? 0
    street = clean(segment.slice(0, at))
    const number = m[1].replace(/[\s'׳]+/g, '')
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
  // a segment after the street is a strong signal; a bare tail is a weaker one
  const candidate = cityFromSegment || tail
  if (!resolvedCity) {
    if (isCityLike(candidate)) {
      resolvedCity = candidate
    } else {
      // anything we are not sure about stays in the street line, never in ישוב
      if (candidate) street = clean(`${street} ${candidate}`)
      ambiguous = true
    }
  } else {
    // the structured city wins; the free text may still repeat it ("ויתקין 17 חולון",
    // "חיפה רחוב דרך אריק שרון 13") — drop the repeat, keep anything else that is
    // clearly not a city ("שכונה 12", "בניין 6") on the street line
    const key = cityKey(city)
    if (candidate && cityKey(candidate) !== key && !isCityLike(candidate)) street = clean(`${street} ${candidate}`)
    const words = street.split(' ')
    for (let n = Math.min(MAX_CITY_WORDS, words.length - 1); n >= 1; n--) {
      if (cityKey(words.slice(0, n).join(' ')) === key) {
        street = words.slice(n).join(' ')
        break
      }
    }
  }

  return {
    street,
    houseNumber,
    floor: floor.value || bareGround.value,
    apartment: apartment.value || apartmentFromSlash,
    entrance: entrance.value,
    city: resolvedCity,
    postalCode: postal.value,
    cityAmbiguous: ambiguous,
  }
}
