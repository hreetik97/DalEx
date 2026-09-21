// Liquid Glass theme — iOS 26 style: deep dark canvas, frosted translucent
// surfaces, luminous gradient light, crisp white type.

export const colors = {
  // Canvas
  bg: '#06080E',
  bgDeep: '#030509',

  // Glass surfaces (used with BlurView; these tints sit under the blur)
  glass: 'rgba(255,255,255,0.07)',
  glassStrong: 'rgba(255,255,255,0.11)',
  glassBorder: 'rgba(255,255,255,0.16)',
  glassHighlight: 'rgba(255,255,255,0.28)',

  // Type
  ink: '#FFFFFF',
  inkSoft: 'rgba(235,240,255,0.82)',
  muted: 'rgba(235,240,255,0.55)',
  faint: 'rgba(235,240,255,0.38)',

  // Accents
  primary: '#34D399', // mint
  primaryDeep: '#0C6B4E',
  blue: '#5B8CFF',
  violet: '#A78BFA',
  amber: '#FBBF24',
  rose: '#FB7185',

  // Payment badges on dark glass
  upiBg: 'rgba(52,211,153,0.16)',
  upiText: '#6EE7B7',
  cardBg: 'rgba(91,140,255,0.18)',
  cardText: '#9DB9FF',

  // Category hues (tuned for dark)
  categories: {
    Food: '#FB923C',
    Travel: '#5B8CFF',
    Bills: '#A78BFA',
    Shopping: '#FB7185',
    Other: '#94A3B8',
  },

  // Category glyphs (Ionicons names)
  categoryIcons: {
    Food: 'fast-food-outline',
    Travel: 'car-outline',
    Bills: 'receipt-outline',
    Shopping: 'bag-outline',
    Other: 'shapes-outline',
  },

  // Ambient gradient orbs
  orbMint: '#0E7C5B',
  orbIndigo: '#2B3A8F',
  orbRose: '#8F2B4A',
};

export const radius = { sm: 12, md: 18, lg: 26, xl: 32 };

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

// Soft drop shadow for floating glass
export const floatShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 24,
  elevation: 8,
};
