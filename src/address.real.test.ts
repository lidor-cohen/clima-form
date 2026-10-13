import { describe, expect, it } from 'vitest'
import { parseAddress } from './address'

/**
 * Shapes taken from the live לידים (5099980319) and לקוחות (5099980327) boards,
 * October 2026. Street names are kept, people are not.
 */
describe('parseAddress on real board values', () => {
  describe('floors', () => {
    it('reads קומת קרקע', () => {
      expect(parseAddress('רחוב אריק איינשטיין 30 קומת קרקע דירה 202')).toMatchObject({
        street: 'רחוב אריק איינשטיין',
        houseNumber: '30',
        floor: 'קרקע',
        apartment: '202',
        city: '',
      })
    })

    it('reads a bare קרקע between commas and never promotes it to a city', () => {
      expect(parseAddress('נקש 8 , קרקע, דירה 1')).toMatchObject({
        street: 'נקש',
        houseNumber: '8',
        floor: 'קרקע',
        apartment: '1',
        city: '',
        cityAmbiguous: true,
      })
      expect(parseAddress('רחוב דבורה הנביאה 36 קרקע דירה 4')).toMatchObject({
        houseNumber: '36',
        floor: 'קרקע',
        apartment: '4',
        city: '',
      })
    })

    it('reads spelled-out floors instead of taking their first letter', () => {
      expect(parseAddress('דרך הים 157, קומה שלישית')).toMatchObject({ street: 'דרך הים', houseNumber: '157', floor: 'שלישית', city: '' })
      expect(parseAddress('רחוב יפה רום 33 קומה ראשונה דירה 33')).toMatchObject({ floor: 'ראשונה', apartment: '33', city: '' })
    })

    it('still reads a single-letter floor when it stands alone', () => {
      expect(parseAddress('הרצל 5 קומה ב דירה 3, חדרה')).toMatchObject({ floor: 'ב', apartment: '3', city: 'חדרה' })
    })
  })

  describe('house numbers', () => {
    it('joins a letter suffix written after a space', () => {
      expect(parseAddress('רחוב מעפילי אגוז 84 ד קומה 4 דירה 31')).toMatchObject({ street: 'רחוב מעפילי אגוז', houseNumber: '84ד', floor: '4', apartment: '31', city: '' })
      expect(parseAddress("עגור 6 ב'")).toMatchObject({ street: 'עגור', houseNumber: '6ב', city: '' })
      expect(parseAddress('רחוב וינגייט 38 א')).toMatchObject({ houseNumber: '38א', city: '' })
    })

    it('splits 32א/6 and 18/3 into house and apartment', () => {
      expect(parseAddress('רחוב החיטה 32א/6 קומת קרקע')).toMatchObject({ houseNumber: '32א', apartment: '6', floor: 'קרקע' })
      expect(parseAddress('רחוב תכלת 18/3')).toMatchObject({ street: 'רחוב תכלת', houseNumber: '18', apartment: '3' })
    })

    it('takes "מספר N" as the house number even on a numbered street', () => {
      expect(parseAddress('רחוב 6002 מספר 3')).toMatchObject({ street: 'רחוב 6002', houseNumber: '3', city: '' })
      expect(parseAddress("רחוב ע' הלל מספר 6")).toMatchObject({ street: "רחוב ע' הלל", houseNumber: '6' })
      expect(parseAddress('רחוב ש שלום מספר 1 קומה 2 דירה 3')).toMatchObject({ street: 'רחוב ש שלום', houseNumber: '1', floor: '2', apartment: '3' })
    })
  })

  describe('noise', () => {
    it('drops remarks in parentheses', () => {
      expect(parseAddress('רחוב בורוכוב 50 קומת קרקע דירה 2(דירת גן)')).toMatchObject({ street: 'רחוב בורוכוב', houseNumber: '50', floor: 'קרקע', apartment: '2', city: '' })
      expect(parseAddress('רחוב השומר 66  (הקומה הכי גבוהה - פנטהאוז)')).toMatchObject({ street: 'רחוב השומר', houseNumber: '66', city: '' })
    })

    it('treats a pipe as a separator', () => {
      expect(parseAddress('ליונל ווטסון 16 א | קומת קרקע')).toMatchObject({ street: 'ליונל ווטסון', houseNumber: '16א', floor: 'קרקע', city: '' })
    })

    it('ignores a trailing full stop', () => {
      const parsed = parseAddress('רחוב חיל התותחנים 7 קומה 17 דירה 65.')
      expect(parsed).toMatchObject({ houseNumber: '7', floor: '17', apartment: '65', city: '' })
    })

    it('fixes the common typos', () => {
      expect(parseAddress('רחב אמירם מידן 7')).toMatchObject({ street: 'רחוב אמירם מידן', houseNumber: '7' })
      expect(parseAddress('רחובמ גרשון אבנר 3 קומה 5')).toMatchObject({ street: 'רחוב גרשון אבנר', houseNumber: '3', floor: '5' })
      expect(parseAddress('רחוב משעול פלג 7 קומה 3 דדירה 11')).toMatchObject({ floor: '3', apartment: '11', city: '' })
    })
  })

  describe('with the structured city column (the leads board)', () => {
    it('drops the city when the text repeats it at the end', () => {
      expect(parseAddress('ויתקין 17 חולון', 'חולון')).toMatchObject({ street: 'ויתקין', houseNumber: '17', city: 'חולון' })
    })

    it('drops the city when the text starts with it', () => {
      expect(parseAddress('חיפה רחוב דרך אריק שרון 13', 'חיפה')).toMatchObject({ street: 'רחוב דרך אריק שרון', houseNumber: '13', city: 'חיפה' })
    })

    it('matches the city across spelling variants', () => {
      expect(parseAddress('רחוב אורי צבי גרינברג 5 פתח תקוה', 'פתח תקווה').street).toBe('רחוב אורי צבי גרינברג')
    })

    it('keeps a neighbourhood or building on the street line instead of dropping it', () => {
      expect(parseAddress('רחוב גל 20 שכונה 12', 'קיסריה')).toMatchObject({ street: 'רחוב גל שכונה 12', houseNumber: '20', city: 'קיסריה' })
      expect(parseAddress('רחוב אריק איינשטיין 10 בניין 6 קומה 23 דירה 111', 'קרית ביאליק')).toMatchObject({ street: 'רחוב אריק איינשטיין בניין 6', floor: '23', apartment: '111', city: 'קרית ביאליק' })
    })

    it('never lets the text override the structured city', () => {
      expect(parseAddress('רחוב בר אילן 5, חיפה קומה 2 דירה 3', 'קריית שמואל(קריות)')).toMatchObject({ street: 'רחוב בר אילן', city: 'קריית שמואל(קריות)', floor: '2', apartment: '3' })
    })
  })

  describe('without a city column (the customers board)', () => {
    it('reads a city written after the number', () => {
      expect(parseAddress('המסגר 3 נתניה')).toMatchObject({ city: 'נתניה', cityAmbiguous: false })
    })

    it('flags everything else for manual entry instead of guessing', () => {
      for (const raw of ['רחוב אשכנזי 23 קומה 10 דירה 39', 'רחוב שוהם 27 דירה 9', 'יגאל אלון 17', 'שכונת ארנונה', ', רמות מנשה']) {
        const parsed = parseAddress(raw)
        expect(parsed.city, raw).toBe('')
        expect(parsed.cityAmbiguous, raw).toBe(true)
      }
    })
  })

  it('never produces a city containing a digit or a floor/apartment/ground word', () => {
    const samples = [
      'רחוב כיכר יהלום 26 קומה 2 דירה 14',
      'שחם 42 קומה 14 דירה 52',
      'רחוב המעלה 31 דירה 12 קומה 3',
      'אהבת אדם 72 קומה 7',
      'רחוב יוסף מילוא 2 א',
      'החרוב 301',
      'רחוב שדרות הבחושי 145 קומה 7',
      'רחוב יעקב דורי 6 דירה 74 קומה 19',
      'רחוב הכרכום 14 ב',
      'רחוב הזית 9ב',
      'רחוב 127',
      'מספר 17',
      'רחוב גיטרה וכינור',
      'תחנת דלק נווה אילן בוויז',
    ]
    for (const raw of samples) {
      const { city } = parseAddress(raw)
      expect(city, raw).not.toMatch(/\d|קומ|דירה|קרקע|כניסה|בניין/)
    }
  })
})
