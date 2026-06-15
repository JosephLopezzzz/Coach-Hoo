// ─── Coach Hoo Design System ──────────────────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg:           '#FAF6EE',  // warm cozy cream/beige background
  bgCard:       '#FFFFFF',  // white card surface
  bgElevated:   '#F5EBE0',  // warm cream elevated element
  bgInput:      '#FFFFFF',  // white input fields

  // Primary brand
  primary:      '#E8A254',  // golden yellow
  primaryDim:   '#D08B3E',
  primaryGlow:  'rgba(232, 162, 84, 0.12)',

  // Accent
  accent:       '#7CB7A5',  // soft mint/teal
  accentDim:    '#62A491',

  // Macro colors (consistent across app, based on brand palette)
  calories:     '#E8A254',  // golden
  protein:      '#FFA76C',  // soft peach/orange
  carbs:        '#9BE1C8',  // mint green
  fat:          '#7CB7A5',  // soft teal

  // Text
  textPrimary:  '#2F3E46',  // dark slate text
  textSecondary:'#526E7A',  // lighter slate
  textMuted:    '#8FA4AE',  // muted slate
  textInverse:  '#FFFFFF',  // white text on colored buttons

  // Borders
  border:       '#EEDECB',  // warm border color
  borderLight:  '#F5EBE0',

  // Status
  success:      '#7CB7A5',
  warning:      '#FFA76C',
  error:        '#E05252',
  info:         '#9BE1C8',

  // Meal type colors
  breakfast:    '#E8A254',  // Golden
  lunch:        '#9BE1C8',  // Mint
  dinner:       '#7CB7A5',  // Teal
  snack:        '#FFA76C',  // Soft orange
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  hero: 42,
} as const;

export const FontWeight = {
  regular:    '400' as const,
  medium:     '500' as const,
  semibold:   '600' as const,
  bold:       '700' as const,
  extrabold:  '800' as const,
};

// Meal type metadata
export const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', color: Colors.breakfast, icon: 'sunny-outline' },
  { key: 'lunch',     label: 'Lunch',     color: Colors.lunch,     icon: 'restaurant-outline' },
  { key: 'dinner',    label: 'Dinner',    color: Colors.dinner,    icon: 'moon-outline' },
  { key: 'snack',     label: 'Snack',     color: Colors.snack,     icon: 'cafe-outline' },
] as const;

export const COOKING_METHODS = [
  { key: 'raw',       label: 'Raw' },
  { key: 'boiled',    label: 'Boiled' },
  { key: 'steamed',   label: 'Steamed' },
  { key: 'grilled',   label: 'Grilled' },
  { key: 'baked',     label: 'Baked' },
  { key: 'fried',     label: 'Fried' },
  { key: 'deep_fried',label: 'Deep Fried' },
  { key: 'sauteed',   label: 'Sautéed' },
  { key: 'stewed',    label: 'Stewed' },
  { key: 'roasted',   label: 'Roasted' },
] as const;

export const FOOD_TYPES = [
  'chicken', 'chicken breast', 'chicken thigh', 'chicken wings',
  'pork', 'pork belly', 'beef', 'ground beef',
  'fish', 'tilapia', 'bangus', 'shrimp', 'squid',
  'egg', 'tofu', 'rice',
] as const;
