// ============================================================
// Devanagari Phrase Maps — pre-approved Marathi taglines per dish category
// Used by programmatic text overlay to avoid AI-rendered Devanagari errors
// ============================================================

export type PhraseMap = Record<string, string>

// Annabrahma Chinese Corner — exact approved Marathi taglines
export const ANNABRAHMA_PHRASES: PhraseMap = {
  soup:       'गरमागरम सूप, थंडीत उष्णतेची अनुभूती!',
  noodles:    'गरमागरम नूडल्स, भन्नाट चव!',
  rice:       'सुगंधी भात, घरच्या चवीची आठवण!',
  manchurian: 'खमंग चायनीज चव, गरमागरम सर्व्ह!',
  momos:      'खुसखुशीत मोमोज, तिखट चटणीसोबत!',
  maggi:      'घरच्या आठवणींची, गरमागरम चव!',
  starter:    'तोंडाला पाणी सुटेल असा स्वाद!',
  pasta:      'एक घास आणि मन तृप्त!',
  pizza:      'चीझी पिझ्झा, एक तुकडा पुरेसा नाही!',
  burger:     'कुरकुरीत बर्गर, तोंडाला पाणी!',
  paneer:     'मसालेदार पनीर, अप्रतिम चव!',
  biryani:    'दमदार बिर्याणी, एक घास स्वर्ग!',
  combo:      'कॉम्बो ऑफर, दुप्पट आनंद!',
}

/**
 * Look up a pre-approved Marathi tagline for a given dish name.
 * Falls back to `defaultTagline` if no category matches.
 */
export function lookupTagline(
  dishName: string,
  phraseMap: PhraseMap,
  defaultTagline: string,
): string {
  const lower = dishName.toLowerCase()
  if (lower.includes('soup'))                                      return phraseMap.soup       ?? defaultTagline
  if (lower.includes('noodle') || lower.includes('hakka') || lower.includes('chow mein'))
                                                                   return phraseMap.noodles    ?? defaultTagline
  if (lower.includes('rice') || lower.includes('fried rice'))     return phraseMap.rice       ?? defaultTagline
  if (lower.includes('manchurian') || lower.includes('manchow'))  return phraseMap.manchurian ?? defaultTagline
  if (lower.includes('momo'))                                      return phraseMap.momos      ?? defaultTagline
  if (lower.includes('maggi'))                                     return phraseMap.maggi      ?? defaultTagline
  if (lower.includes('pasta'))                                     return phraseMap.pasta      ?? defaultTagline
  if (lower.includes('pizza'))                                     return phraseMap.pizza      ?? defaultTagline
  if (lower.includes('burger') || lower.includes('sandwich'))     return phraseMap.burger     ?? defaultTagline
  if (lower.includes('paneer'))                                    return phraseMap.paneer     ?? defaultTagline
  if (lower.includes('biryani') || lower.includes('dum'))         return phraseMap.biryani    ?? defaultTagline
  if (lower.includes('combo'))                                     return phraseMap.combo      ?? defaultTagline
  // Starters, spring rolls, soyabean, gobi, bhel, etc.
  return phraseMap.starter ?? defaultTagline
}
