/**
 * Option catalogs ported verbatim from the spec prototype embedded in example.docx
 * ("order-flow-urbanica"). Keep the Hebrew strings exactly as in the prototype —
 * downstream webhook scenarios match on them.
 */

export const LIGHTING_TINTS = ['ללא', 'צהוב', 'אור יום', 'לבן', 'RGB']
export const BIO_LIGHTING_TINTS = ['צהוב', 'אור יום', 'לבן', 'RGB']
export const FIXED_LIGHTING_TINTS = ['צהוב', 'אור יום', 'לבן']
export const FAN_TINTS = ['שחור', 'לבן', 'גוון עץ']

export const OPENING_OPTIONS = ['ימין', 'שמאל', 'ימין ושמאל', 'דלת אמצע']
export const DRIVE_SIDES = ['ימין', 'שמאל']
export const ROLLER_OPERATIONS = ['ידני', 'חשמלי']
export const MOTOR_TYPES = ['סומפי', 'סימו', 'אחר']
export const GUILLOTINE_OPEN_DIRECTIONS = ['פתיחה עליונה', 'פתיחה תחתונה']

export const STOCK_ALUMINUM_FINISHES = [
  'לבן',
  'RAL 1013',
  'RAL 1013 מאט',
  'RAL 1013 מגורען',
  'RAL 7011',
  'RAL 7016',
  'RAL 7016 מאט',
  'RAL 7016 מגורען',
  'RAL 7022 מאט',
  'RAL 7035',
  'RAL 8014',
  'RAL 8017',
  'RAL 8017 מאט',
  'RAL 8017 מגורען',
  'RAL 9005',
  'RAL 9005 מאט',
  'RAL 9005 מגורען',
  'RAL 9011 שחור מבריק',
  'RAL 9011 מאט',
  'RAL 9011 מגורען',
  'RAL 9016',
  'RAL 9016 מאט',
  'RAL 9016 מגורען',
  'C3-1108 אפקט חלודה',
  'אנודייז כסף מאט',
  'אנודייז נירוסטה מוברש/מלוטש',
  'אנודייז ברונזה מוברש/מלוטש',
  'NATURA אפור 9006',
  'עץ 703',
  'עץ 702',
  'עץ 701',
  'אחר',
]

export const FIXED_COLOR_OPTIONS = [
  'RAL 9006 – אפור בהיר',
  'RAL 9007 – אפור כהה',
  'RAL 9016 – לבן',
  'RAL 9005 – שחור',
  'RAL 1013 – קרם',
  'i40 – אפור כהה מגורען (מניפת איירון)',
  'מיוחד',
]

export const EASY_GLAZE_PANELS = [
  'שקוף – 90% העברת אור',
  'SOLAR CONTROL – 20% העברת אור',
  'SOLAR ICE – 20% העברת אור',
  'GREY – 20% העברת אור',
  'BLUISH BREEZE – 70% העברת אור',
  'COOL BH – 65% העברת אור',
  'SOLAR ICE BH – 25% העברת אור',
  'שקוף BH – 87% העברת אור',
]

export const BH_TYPES = [
  'ללא',
  'CLEAR – 87% העברת אור',
  'SOLAR ICE – 25% העברת אור',
  'SOLAR CONTROL – 20% העברת אור',
  'GREY – 60% העברת אור',
  'COOL – 65% העברת אור',
  'GOLD – 20% העברת אור',
  'SOLAR OLYMPIC – 25% העברת אור',
  'BRONZE – 33% העברת אור',
]

export const GLASS_TYPES_TEMPERED = [
  'זכוכית מחוסמת שקופה',
  'זכוכית מחוסמת מט',
  'זכוכית מחוסמת אפורה',
  'זכוכית מחוסמת ברונזה',
  'זכוכית מחוסמת אקסטרה קליר',
  'זכוכית מחוסמת סולארית בגוון כחול בהיר SunGuard 52',
  'זכוכית מחוסמת סולארית בגוון ניטרלי SunGuard 67',
  'ללא זכוכית',
]

export const GLASS_TYPES_SUNROOM = [
  'טריפלקס',
  'זכוכית בידודית',
  'זכוכית אקסטרה בידודית',
  'גג פאנל',
  'אחר',
]

export const LOCK_TYPES_RUN2_LIKE = ['נעילה תחתונה', 'נעילה תחתונה כפולה']
export const LOCK_TYPES_RUN3 = [
  'מנעול תחתון אוטומטי',
  'מנעול כפול תחתון אוטומטי',
  'מנעול שקוע',
  'ללא מנעול',
  'צילינדר CD 6 שחור מאט',
  'צילינדר CD 6 כרום מאט',
]
export const LOCK_TYPES_DEFAULT = ['נוב', 'נוב כפול', 'צילינדר מגנטי']

export const ACCESSORIES_COLORS = ['אוטומטי', 'שחור', 'לבן', 'כרום']
export const WING_FIXATION = ['קלאמפ', 'דאבל קלאמפ', 'תפס תחתון']

export const TRACK_TYPES_RUN2_LIKE = ['מסילה סטנדרטית', 'מסילה מוטמעת']
export const TRACK_TYPES_RUN3 = ['סטנדרטית', 'מסילת רמפה', 'מסילה מוטמעת', 'משולב']
export const TRACK_TYPES_DEFAULT = ['סטנדרטית', 'מסילת רמפה', 'מסילה מוטמעת']
export const ANCHORING_SEEGLASS_PRO = ['עיגון רצפתי סטנדרטי', 'עיגון חזיתי', 'מסילה מוטמעת']

export const ROLLER_FABRIC_TYPES = [
  'Fabrics Basic 240',
  'Fabrics Basic 310',
  'Fabrics Screen A10',
  'Fabrics Screen J5',
  'Fabrics Blackout',
]

export const ROLLER_FABRIC_COLORS: Record<string, string[]> = {
  'Fabrics Basic 240': ['0100 BLANCO NUCLEAR'],
  'Fabrics Basic 310': [
    '10114 GRIS PIEDRA',
    '10686 GRIS MEDIO',
    '4905 BLANCO ROTO',
    '4934 GRIS PERLA',
    '4959 BEIGE CLARO',
    '4993 GRIS OSCURO',
  ],
  'Fabrics Screen A10': [
    '001 ANTRACITA GRIS',
    '010 ANTRACITA',
    '011 ANTRACITA BRONCE',
    '202 BLANCO',
    '207 BLANCO PERLA',
    '208 BLANCO LINO',
  ],
  'Fabrics Screen J5': [
    '001 ANTRACITA GRIS',
    '010 ANTRACITA',
    '011 ANTRACITA BRONCE',
    '202 BLANCO',
    '207 BLANCO PERLA',
    '208 BLANCO LINO',
    '707 PERLA',
    '708 PERLA LINO',
    '808 LINO',
  ],
  'Fabrics Blackout': [
    '601 BLANCO',
    '602 NEGRO',
    '604 LINO',
    '606 PERLA',
    '644 BEIGE',
  ],
}

export const PLEATED_FABRIC_TYPES = ['בד סטנדרט', 'בד אטום', 'בדים מיקרו־מחוררים']

export type FabricSwatch = { name: string; color: string }

export const PLEATED_FABRICS: Record<string, FabricSwatch[]> = {
  'בד סטנדרט': [
    { name: 'TEJIDO BASIC 0100', color: '#ecece6' },
    { name: 'TEJIDO BASIC 0101', color: '#f1f1ed' },
    { name: 'TEJIDO BASIC 0104', color: '#d9b879' },
    { name: 'TEJIDO BASIC 0106', color: '#dc8c32' },
    { name: 'TEJIDO BASIC 0109', color: '#92938f' },
    { name: 'TEJIDO BASIC 0114', color: '#aaa48d' },
    { name: 'TEJIDO BASIC 0116', color: '#51453f' },
  ],
  'בד אטום': [
    { name: 'TEJIDO BLACK-OUT 0200', color: '#f1f1ed' },
    { name: 'TEJIDO BLACK-OUT 0201', color: '#e5dfb9' },
    { name: 'TEJIDO BLACK-OUT 0203', color: '#70436f' },
    { name: 'TEJIDO BLACK-OUT 0204', color: '#343b3c' },
    { name: 'TEJIDO BLACK-OUT 0205', color: '#62c8cf' },
  ],
  'בדים מיקרו־מחוררים': [
    { name: 'TEJIDO MICRO-PERFORADO 0301', color: '#f2f2ee' },
    { name: 'TEJIDO MICRO-PERFORADO 0302', color: '#c9c8c1' },
    { name: 'TEJIDO MICRO-PERFORADO 0303', color: '#e4d2a2' },
    { name: 'TEJIDO MICRO-PERFORADO 0305', color: '#292b29' },
  ],
}

export const DECOR_PROFILE_POSITIONS = [
  'אנכי בלבד – 9011 מאט',
  'אנכי בלבד – בצבע הקונסטרוקציה',
  'לצד הפנימי – 9011 מאט',
  'לצד החיצוני – 9011 מאט',
  'לצד הפנימי – בצבע הקונסטרוקציה',
  'לצד החיצוני – בצבע הקונסטרוקציה',
]

export const GLASS_DECOR_TYPES = [
  'פנימי',
  'חיצוני',
  'אנכי בלבד – 9011 מאט',
  'אנכי בלבד – צבע הקונסטרוקציה',
]
