/**
 * הערות מחיר ותנאי אחריות המוצגים בדף הסיכום מעל החתימה.
 *
 * הנוסח ניתן לעריכה בטופס עצמו: כל הזמנה מתחילה מנוסח ברירת המחדל, אפשר
 * לשנות אותו להזמנה הנוכחית, ואפשר לשמור את הנוסח החדש כברירת המחדל של המכשיר
 * (localStorage) כך שההזמנות הבאות יתחילו ממנו. "איפוס" מחזיר לנוסח המקורי כאן.
 */

export const PRICE_NOTES = [
  'המחיר אינו כולל עלויות מנוף.',
  'המחיר אינו כולל חיבור קבע לרשת החשמל.',
]

export const WARRANTY_TERMS = [
  'האחריות למערכת הינה בהתאם לתעודת האחריות של היצרן שתימסר ללקוח עם ההתקנה.',
  'האחריות אינה חלה על נזק שנגרם כתוצאה משימוש בלתי סביר, תחזוקה לקויה, כוח עליון או תיקון/שינוי שבוצע על ידי גורם שאינו מוסמך מטעם החברה.',
]

/** One line per note, so the text is easy to edit in a textarea and to split back into lines. */
export const BUILT_IN_TERMS_TEXT = [...PRICE_NOTES, ...WARRANTY_TERMS].join('\n')

const DEFAULT_KEY = 'clima-terms-default-v1'

/** The device's saved default, or the built-in text when none was saved (or storage is unavailable). */
export function defaultTermsText(): string {
  try {
    const saved = localStorage.getItem(DEFAULT_KEY)
    if (saved && saved.trim()) return saved
  } catch {
    // storage unavailable — fall back to the built-in wording
  }
  return BUILT_IN_TERMS_TEXT
}

/** Returns false when the browser refused to store it. */
export function saveDefaultTermsText(text: string): boolean {
  try {
    if (text.trim() === BUILT_IN_TERMS_TEXT.trim()) localStorage.removeItem(DEFAULT_KEY)
    else localStorage.setItem(DEFAULT_KEY, text)
    return true
  } catch {
    return false
  }
}

export function hasSavedDefaultTerms(): boolean {
  try {
    return Boolean(localStorage.getItem(DEFAULT_KEY))
  } catch {
    return false
  }
}

/** Non-empty trimmed lines — what the payload and the documents render. */
export const termsLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
