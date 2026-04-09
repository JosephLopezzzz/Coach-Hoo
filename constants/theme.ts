// ─── Coach Hoo Design System ──────────────────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg:           '#0A0E1A',  // deep dark navy
  bgCard:       '#111827',  // card surface
  bgElevated:   '#1A2235',  // elevated elements
  bgInput:      '#1E2D45',  // input fields

  // Primary brand
  primary:      '#00C47C',  // vibrant green
  primaryDim:   '#008F59',
  primaryGlow:  'rgba(0, 196, 124, 0.15)',

  // Accent
  accent:       '#6C63FF',  // purple
  accentDim:    '#4D47CC',

  // Macro colors (consistent across app)
  calories:     '#FF6B9D',  // pink-red
  protein:      '#FF8C42',  // orange
  carbs:        '#FFD93D',  // yellow
  fat:          '#6BCAE2',  // sky blue

  // Text
  textPrimary:  '#F0F4FF',
  textSecondary:'#8B9EC7',
  textMuted:    '#4A5A7A',
  textInverse:  '#0A0E1A',

  // Borders
  border:       '#1E2D45',
  borderLight:  '#2A3A5A',

  // Status
  success:      '#00C47C',
  warning:      '#FFB800',
  error:        '#FF4D6D',
  info:         '#4DA6FF',

  // Meal type colors
  breakfast:    '#FF9A3C',
  lunch:        '#00C47C',
  dinner:       '#6C63FF',
  snack:        '#FF6B9D',
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
