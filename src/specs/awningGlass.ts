import type { SpecField } from './fields'
import { checkbox, heading, num, price, sel, sw, txt } from './fields'
import {
  ACCESSORIES_COLORS,
  ANCHORING_SEEGLASS_PRO,
  DRIVE_SIDES,
  GLASS_TYPES_SUNROOM,
  GLASS_TYPES_TEMPERED,
  GUILLOTINE_OPEN_DIRECTIONS,
  LOCK_TYPES_DEFAULT,
  LOCK_TYPES_RUN2_LIKE,
  LOCK_TYPES_RUN3,
  ROLLER_FABRIC_COLORS,
  ROLLER_FABRIC_TYPES,
  ROLLER_OPERATIONS,
  STOCK_ALUMINUM_FINISHES,
  TRACK_TYPES_DEFAULT,
  TRACK_TYPES_RUN2_LIKE,
  TRACK_TYPES_RUN3,
  WING_FIXATION,
} from './catalogs'
import {
  FIXED_GLASS_ROOF,
  GLASS_DOOR,
  GUILLOTINE,
  MONOBLOC,
  OPENING_GLASS_ROOF,
  PLEATED_BLIND,
  ROLLER_BLIND,
  ROOF_ZIP,
  SEEGLASS_RUN2,
  SEEGLASS_RUN3,
  SEEGLASS_SUB,
  WINDOW_AWNING,
  WINDOW_AWNING_CASSETTE,
  isBoraLike,
  isFoldingGlass,
  isRailing,
  isRun2Like,
  isSunroom,
  isZipLike,
  usesStockFinishes,
} from './classify'

/** Which opening control the openings builder shows for a folding-glass product. */
export type OpeningControl = 'select' | 'centerToggle' | 'none'

export const hasOpenings = (p: string): boolean =>
  isFoldingGlass(p) && !isSunroom(p) && p !== GLASS_DOOR

export function openingControlFor(p: string): OpeningControl {
  if (isRailing(p)) return 'none'
  if (isBoraLike(p) || p === SEEGLASS_RUN3 || isRun2Like(p)) return 'centerToggle'
  return 'select'
}

/** מפרט סוכך / מערכת זכוכית / חדר שמש — docx renderAwningSpec */
export function awningGlassSpec(p: string): SpecField[] {
  const fields: SpecField[] = []
  const boraLike = isBoraLike(p)
  const folding = isFoldingGlass(p)
  const sunroom = isSunroom(p)
  const run2Like = isRun2Like(p)
  const stock = usesStockFinishes(p)
  const zipLike = isZipLike(p)
  const railing = isRailing(p)
  const roller = p === ROLLER_BLIND
  const pleated = p === PLEATED_BLIND

  if (roller) {
    fields.push({ kind: 'buttons', id: 'operation', label: 'אופן הפעלה', options: ROLLER_OPERATIONS })
    fields.push({
      kind: 'select',
      id: 'driveSide',
      label: 'צד ההפעלה',
      options: DRIVE_SIDES,
      visibleWhen: { id: 'operation', equals: 'ידני' },
    })
  }

  fields.push(heading('מידות משוערות'))
  if (sunroom) {
    fields.push(
      num('widthMm', 'רוחב (מ״מ)'),
      num('projectionMm', 'יציאה (מ״מ)'),
      sw(
        'additionalColumns',
        'עמודים נוספים',
        num('additionalColumnsCount', 'מספר העמודים'),
        price('additionalColumnsPrice'),
      ),
    )
  } else if (folding && p !== GLASS_DOOR) {
    fields.push({ kind: 'openings' })
  } else {
    fields.push(num('widthMm', pleated ? 'רוחב (מ״מ) – 1200 max' : 'רוחב (מ״מ)'))
    fields.push(
      zipLike || pleated || p === SEEGLASS_SUB
        ? num('heightMm', 'גובה (מ״מ)')
        : num('projectionMm', 'יציאה (מ״מ)'),
    )
  }

  // guide §5.2 — opening direction for guillotines (folding glass captures it per opening)
  if (p === GUILLOTINE) {
    fields.push(sel('openingDirection', 'כיוון פתיחה', GUILLOTINE_OPEN_DIRECTIONS))
  }

  fields.push(heading('צבעים'))
  if (stock && !boraLike) {
    fields.push(
      sel('aluminumColor', 'צבע אלומיניום', STOCK_ALUMINUM_FINISHES, 'לבן', {
        trigger: 'אחר',
        id: 'aluminumColorCustom',
        label: 'צבע אלומיניום מיוחד',
      }),
    )
    // the guillotine addon list already carries a priced 'צבע לאזור סביבה ימית'
    if (p !== GUILLOTINE) fields.push(checkbox('marineColor', 'צבע לאזור בסביבה ימית'))
  } else {
    // free-text aluminum color; the guide defaults every system to white
    fields.push(txt('aluminumColor', 'צבע אלומיניום', 'לבן'))
  }

  if (roller) {
    fields.push(sel('rollerFabricType', 'סוג הבד', ROLLER_FABRIC_TYPES))
    fields.push({
      kind: 'select',
      id: 'rollerFabricColor',
      label: 'צבע הבד',
      options: (values) => ROLLER_FABRIC_COLORS[values.rollerFabricType ?? ''] ?? [],
      visibleWhen: { id: 'rollerFabricType', notEmpty: true },
    })
  } else if (pleated) {
    fields.push({ kind: 'pleatedFabric' })
    fields.push(checkbox('manualPole', 'מוט הפעלה ידני'))
  } else if (p !== GUILLOTINE && p !== SEEGLASS_SUB && !boraLike && !folding) {
    fields.push(txt('fabric', zipLike || p === ROOF_ZIP ? 'סוג הבד' : 'צבע בד'))
  }

  // the docx's rich special-color branch is unreachable; only the window awnings
  // reach the classic switch (see plan decision 2)
  if (p === WINDOW_AWNING || p === WINDOW_AWNING_CASSETTE) {
    fields.push(
      sw(
        'specialColor',
        'צבע אלומיניום מיוחד',
        txt('specialColorText', 'צבע אחר'),
        price('specialColorPrice'),
      ),
    )
  }

  if (folding && !boraLike) {
    if (!railing) {
      if (p === OPENING_GLASS_ROOF) {
        fields.push(txt('glassType', 'סוג זכוכית'))
      } else if (p === FIXED_GLASS_ROOF) {
        fields.push(
          sel('glassType', 'סוג זכוכית', GLASS_TYPES_SUNROOM, 'טריפלקס', {
            trigger: 'אחר',
            id: 'otherGlassType',
            label: 'סוג זכוכית אחר',
          }),
        )
      } else {
        fields.push(sel('glassType', 'סוג זכוכית', GLASS_TYPES_TEMPERED, 'זכוכית מחוסמת שקופה'))
        // guide §5.4.ב — insulated glass, relevant for the RUN systems (exact names:
        // isRun2Like also matches the sunrooms, whose glass list already offers it)
        if (p === SEEGLASS_RUN3 || p === SEEGLASS_RUN2) {
          fields.push(checkbox('insulatedGlass', 'זכוכית בידודית'))
        }
      }
    }

    if (!railing && !sunroom) {
      fields.push(
        sel(
          'lockType',
          'סוג נעילה',
          run2Like ? LOCK_TYPES_RUN2_LIKE : p === SEEGLASS_RUN3 ? LOCK_TYPES_RUN3 : LOCK_TYPES_DEFAULT,
        ),
      )
    }

    if (p === SEEGLASS_RUN3) {
      fields.push(sel('accessoriesColor', 'צבע אקססוריז', ACCESSORIES_COLORS, 'אוטומטי'))
    }

    if (p !== SEEGLASS_RUN3 && !railing && !run2Like) {
      fields.push(sel('wingFixation', 'קיבוע כנפי הזכוכית', WING_FIXATION))
    }

    if (!sunroom) {
      const pro = railing
      fields.push(heading(pro ? 'סוג העיגון' : 'מסילה תחתונה'))
      fields.push(
        sel(
          'lowerTrack',
          pro ? 'סוג העיגון' : 'סוג המסילה התחתונה',
          pro
            ? ANCHORING_SEEGLASS_PRO
            : run2Like
              ? TRACK_TYPES_RUN2_LIKE
              : p === SEEGLASS_RUN3
                ? TRACK_TYPES_RUN3
                : TRACK_TYPES_DEFAULT,
          pro ? 'עיגון רצפתי סטנדרטי' : undefined,
        ),
      )
    }
  }

  // guide §5.4–5.5 — glass + lock for the systems outside the folding branch
  if (p === GUILLOTINE || p === SEEGLASS_SUB) {
    fields.push(sel('glassType', 'סוג זכוכית', GLASS_TYPES_TEMPERED, 'זכוכית מחוסמת שקופה'))
    if (p === GUILLOTINE) fields.push(checkbox('insulatedGlass', 'זכוכית בידודית'))
    fields.push(sel('lockType', 'סוג נעילה', LOCK_TYPES_DEFAULT))
  }

  if (p === MONOBLOC || p === WINDOW_AWNING) {
    fields.push(sw('aluminumHood', 'גגון אלומיניום', price('aluminumHoodPrice')))
  }

  return fields
}
