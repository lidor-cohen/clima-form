import { describe, expect, it } from 'vitest'
import { parseAddress } from './address'

describe('parseAddress', () => {
  describe('the reported bug: floor/apartment fragments in the city field', () => {
    // every one of these strings is a real value from monday board 5099980327
    const realAddresses = [
      'רחוב אביגדור המאירי 15 קומה 6 דירה 18',
      'רחוב עוזי חיטמן 10 קומה 7',
      "רחוב יורדי ים 1 בניין מרינה וילג' דירה 101",
      'רחוב בר אילן 5, חיפה קומה 2 דירה 3',
      'רחוב חלמיש 4 קומה 3 דירה 16',
      'רחוב הברושים 66 קומה 12',
    ]

    it.each(realAddresses)('never puts a floor or apartment fragment into the city: %s', (raw) => {
      const { city } = parseAddress(raw)
      expect(city).not.toMatch(/קומה|דירה|כניסה|בניין/)
      expect(city).not.toMatch(/\d/)
    })

    it('splits floor and apartment out instead of leaving them in the city', () => {
      expect(parseAddress('רחוב אביגדור המאירי 15 קומה 6 דירה 18')).toMatchObject({
        street: 'רחוב אביגדור המאירי',
        houseNumber: '15',
        floor: '6',
        apartment: '18',
        city: '',
        cityAmbiguous: true,
      })
    })

    it('keeps a comma-separated city while still stripping floor and apartment', () => {
      expect(parseAddress('רחוב בר אילן 5, חיפה קומה 2 דירה 3')).toMatchObject({
        street: 'רחוב בר אילן',
        houseNumber: '5',
        floor: '2',
        apartment: '3',
        city: 'חיפה',
        cityAmbiguous: false,
      })
    })

    it('refuses to treat a building name as a city', () => {
      const parsed = parseAddress("רחוב יורדי ים 1 בניין מרינה וילג' דירה 101")
      expect(parsed.houseNumber).toBe('1')
      expect(parsed.apartment).toBe('101')
      expect(parsed.city).toBe('')
      expect(parsed.cityAmbiguous).toBe(true)
      // the fragment is not discarded, it just goes somewhere harmless
      expect(parsed.street).toContain('בניין מרינה')
    })
  })

  describe('the structured city column wins', () => {
    it('prefers the structured city over anything in the free text', () => {
      const parsed = parseAddress('רחוב חלמיש 4 קומה 3 דירה 16', 'חיפה')
      expect(parsed).toMatchObject({
        street: 'רחוב חלמיש',
        houseNumber: '4',
        floor: '3',
        apartment: '16',
        city: 'חיפה',
        cityAmbiguous: false,
      })
    })

    it('keeps a structured city when there is no address text at all', () => {
      expect(parseAddress('', 'ראש העין')).toMatchObject({ city: 'ראש העין', street: '', cityAmbiguous: false })
    })

    it('never overrides the structured city with a free-text guess', () => {
      expect(parseAddress('המסגר 3 נתניה', 'רעננה').city).toBe('רעננה')
    })
  })

  describe('happy paths', () => {
    it('parses street, number and city', () => {
      expect(parseAddress('המסגר 3 נתניה')).toMatchObject({
        street: 'המסגר',
        houseNumber: '3',
        city: 'נתניה',
        cityAmbiguous: false,
      })
    })

    it('parses a comma before the city, which the old parser could not', () => {
      expect(parseAddress('המסגר 3, נתניה')).toMatchObject({
        street: 'המסגר',
        houseNumber: '3',
        city: 'נתניה',
      })
    })

    it('handles a multi-word street and a multi-word city', () => {
      expect(parseAddress('שדרות בן גוריון 15 רמת גן')).toMatchObject({
        street: 'שדרות בן גוריון',
        houseNumber: '15',
        city: 'רמת גן',
      })
    })

    it('accepts a three-word city', () => {
      expect(parseAddress('הרצל 8, תל אביב יפו').city).toBe('תל אביב יפו')
    })

    it('reads a house number with a letter suffix', () => {
      expect(parseAddress('הרצל 12ב חולון')).toMatchObject({ houseNumber: '12ב', city: 'חולון' })
    })
  })

  describe('tolerates missing parts and different orderings', () => {
    it('street and number only', () => {
      expect(parseAddress('רחוב רשי 14')).toMatchObject({
        street: 'רחוב רשי',
        houseNumber: '14',
        city: '',
        cityAmbiguous: true,
      })
    })

    it('no house number at all leaves the city empty rather than guessing', () => {
      const parsed = parseAddress('רחוב כספי בית אחרון')
      expect(parsed.houseNumber).toBe('')
      expect(parsed.city).toBe('')
      expect(parsed.cityAmbiguous).toBe(true)
    })

    it('an empty string produces no ambiguity warning', () => {
      expect(parseAddress('')).toMatchObject({ street: '', city: '', cityAmbiguous: false })
    })

    it('reads labelled parts regardless of the order they appear in', () => {
      const front = parseAddress('קומה 3 דירה 16 רחוב חלמיש 4')
      const back = parseAddress('רחוב חלמיש 4 דירה 16 קומה 3')
      expect(front).toMatchObject({ street: 'רחוב חלמיש', houseNumber: '4', floor: '3', apartment: '16' })
      expect(back).toMatchObject({ street: 'רחוב חלמיש', houseNumber: '4', floor: '3', apartment: '16' })
    })

    it('reads an entrance and a ground floor', () => {
      expect(parseAddress('הרצל 5 כניסה ב קומה קרקע, אשדוד')).toMatchObject({
        entrance: 'ב',
        floor: 'קרקע',
        city: 'אשדוד',
      })
    })

    it('reads a postal code only when it is labelled', () => {
      expect(parseAddress('הרצל 5, נתניה מיקוד 4250439').postalCode).toBe('4250439')
      // a bare number must not be mistaken for a postal code
      expect(parseAddress('הרצל 5 נתניה').postalCode).toBe('')
    })

    it('treats 3/5 as house 3 apartment 5', () => {
      expect(parseAddress('הרצל 3/5, נתניה')).toMatchObject({
        houseNumber: '3',
        apartment: '5',
        city: 'נתניה',
      })
    })

    it('handles a letter after the slash, as in רחוב סחלב 2/ב', () => {
      expect(parseAddress('רחוב סחלב 2/ב')).toMatchObject({
        street: 'רחוב סחלב',
        houseNumber: '2',
        apartment: 'ב',
      })
    })

    it('drops a PO box without letting it reach the city', () => {
      const parsed = parseAddress('הרצל 5 ת.ד 1234, חדרה')
      expect(parsed.city).toBe('חדרה')
      expect(parsed.houseNumber).toBe('5')
    })
  })
})
