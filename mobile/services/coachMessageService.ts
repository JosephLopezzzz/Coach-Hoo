export type Language = 'english' | 'filipino';

export const LANGUAGE_KEY = 'coach_hoo_language';

export function getSuggestedGoal(
  heightCm: number,
  weightKg: number,
): 'lose' | 'maintain' | 'gain' | 'build_habits' {
  const bmi = weightKg / (heightCm / 100) ** 2;
  if (bmi < 18.5) return 'gain';
  if (bmi > 25) return 'lose';
  return 'maintain';
}

function t(lang: Language, en: string, fil: string): string {
  return lang === 'filipino' ? fil : en;
}

export function getWelcomeMessage(lang: Language): string {
  return t(
    lang,
    "Hi! I'm Coach Hoo, your coach for tracking meals, calories, and healthy habits. What should I call you?",
    'Hi! Ako si Coach Hoo, ang iyong coach para sa pag-track ng pagkain, calories, at malusog na gawi. Ano ang gusto mong itawag ko sa iyo?',
  );
}

export function getAgeMessage(lang: Language, name: string): string {
  return t(
    lang,
    `Nice to meet you, ${name}! How old are you?`,
    `Ikinagagalak kitang makilala, ${name}! Ilang taon ka na?`,
  );
}

export function getHeightWeightMessage(lang: Language): string {
  return t(
    lang,
    "Let's set up your starting point. Enter your height and weight — you can choose cm or ft/in, and kg or lb.",
    'I-set up natin ang iyong panimulang datos. Ilagay ang iyong taas at timbang — pwedeng cm o ft/in, at kg o lb.',
  );
}

export function getFeedbackMessage(lang: Language, name: string): string {
  return t(
    lang,
    `Thanks, ${name}. This helps me personalize your tracking experience. We'll take this one step at a time.`,
    `Salamat, ${name}. Ito ay makakatulong sa akin na i-personalize ang iyong tracking experience. Isa-isa nating gagawin ito.`,
  );
}

export function getGoalMessage(
  lang: Language,
  suggestedGoal?: string,
): string {
  const base = t(
    lang,
    'What would you like to focus on?',
    'Ano ang gusto mong pagtuunan?',
  );
  if (suggestedGoal) {
    const suggestion = t(
      lang,
      `Based on what you shared, one option you may want to consider is ${suggestedGoal}, but you are always in control of your goal.`,
      `Batay sa iyong ibinahagi, isang opsyon na maaari mong pag-isipan ay ang ${suggestedGoal}, pero ikaw pa rin ang may kontrol sa iyong goal.`,
    );
    return `${base}\n\n${suggestion}`;
  }
  return base;
}

export function getGoalLabel(lang: Language, key: string): string {
  const labels: Record<string, [string, string]> = {
    lose: ['Lose weight', 'Magpapayat'],
    maintain: ['Maintain weight', 'Panatilihin'],
    gain: ['Gain weight', 'Dumagdag ng timbang'],
    build_habits: ['Build healthier habits', 'Bumuo ng mas malusog na gawi'],
  };
  const pair = labels[key];
  if (!pair) return key;
  return lang === 'filipino' ? pair[1] : pair[0];
}

export function getHealthConditionMessage(lang: Language): string {
  return t(
    lang,
    'Do you have any health conditions that may affect food, activity, or nutrition planning?',
    'Mayroon ka bang mga kondisyong pangkalusugan na maaaring makaapekto sa pagkain, aktibidad, o nutrisyon?',
  );
}

export function getHealthConditionNoResponse(lang: Language): string {
  return t(
    lang,
    "Thanks for letting me know. I'll keep your plan simple and focused on your goals.",
    'Salamat sa pagsagot. Pananatilihin kong simple at nakatutok ang iyong plan sa iyong mga goal.',
  );
}

export function getHealthConditionYesResponse(lang: Language): string {
  return t(
    lang,
    'Thanks for sharing. I can support general tracking, but please follow advice from your doctor or registered dietitian for condition-specific food, exercise, and calorie guidance.',
    'Salamat sa pagbabahagi. Kaya kong sumuporta sa general tracking, pero mangyaring sumunod sa payo ng iyong doktor o dietitian para sa condition-specific na gabay.',
  );
}

export function getAllergiesMessage(lang: Language): string {
  return t(
    lang,
    'Do you have any food allergies or foods you need to avoid?',
    'Mayroon ka bang mga allergy sa pagkain o pagkain na kailangan mong iwasan?',
  );
}

export function getAllergiesNoResponse(lang: Language): string {
  return t(
    lang,
    'Great! I will not filter any foods out for you.',
    'Magaling! Hindi ako mag-filter ng anumang pagkain para sa iyo.',
  );
}

export function getAllergiesSelectMessage(lang: Language): string {
  return t(
    lang,
    'Select any that apply:',
    'Piliin ang mga naaangkop:',
  );
}

export function getFinishMessage(lang: Language, name: string): string {
  return t(
    lang,
    `You're all set, ${name}! I'll be here to help you track your progress, celebrate your consistency, and take things one day at a time.`,
    `Handa ka na, ${name}! Nandito ako para tulungan kang i-track ang iyong progress, ipagdiwang ang iyong consistency, at gawin ang mga bagay isa-isa.`,
  );
}

export function getNoLabel(lang: Language): string {
  return t(lang, 'No', 'Hindi');
}
export function getYesLabel(lang: Language): string {
  return t(lang, 'Yes', 'Oo');
}
export function getSkipLabel(lang: Language): string {
  return t(lang, 'Prefer not to say', 'Mas gusto kong hindi sumagot');
}
export function getContinueLabel(lang: Language): string {
  return t(lang, 'Continue', 'Magpatuloy');
}
export function getGoToDashboardLabel(lang: Language): string {
  return t(lang, 'Go to Dashboard', 'Pumunta sa Dashboard');
}
export function getOtherAllergyLabel(lang: Language): string {
  return t(lang, 'Other (optional)', 'Iba pa (opsyonal)');
}
export function getConfirmLabel(lang: Language): string {
  return t(lang, 'Confirm', 'Kumpirmahin');
}

export interface SelectItem {
  key: string;
  label: string;
}
export interface SelectGroup {
  category: string;
  items: SelectItem[];
}

export const HEALTH_CONDITION_GROUPS: SelectGroup[] = [
  {
    category: 'Metabolic / endocrine',
    items: [
      { key: 'type1_diabetes', label: 'Type 1 diabetes' },
      { key: 'type2_diabetes', label: 'Type 2 diabetes' },
      { key: 'prediabetes', label: 'Prediabetes' },
      { key: 'pcos', label: 'PCOS' },
      { key: 'hypothyroidism', label: 'Hypothyroidism' },
      { key: 'hyperthyroidism', label: 'Hyperthyroidism' },
    ],
  },
  {
    category: 'Heart / circulation',
    items: [
      { key: 'high_blood_pressure', label: 'High blood pressure' },
      { key: 'high_cholesterol', label: 'High cholesterol' },
      { key: 'heart_disease', label: 'Heart disease' },
      { key: 'heart_failure', label: 'Heart failure' },
    ],
  },
  {
    category: 'Digestive',
    items: [
      { key: 'celiac', label: 'Celiac disease' },
      { key: 'ibs', label: 'Irritable bowel syndrome (IBS)' },
      { key: 'ibd', label: 'Inflammatory bowel disease (Crohn\'s / ulcerative colitis)' },
      { key: 'gerd', label: 'GERD / acid reflux' },
      { key: 'chronic_constipation', label: 'Chronic constipation' },
    ],
  },
  {
    category: 'Kidney / liver',
    items: [
      { key: 'ckd', label: 'Chronic kidney disease' },
      { key: 'kidney_stones', label: 'Kidney stones' },
      { key: 'fatty_liver', label: 'Fatty liver disease' },
      { key: 'liver_disease', label: 'Liver disease' },
    ],
  },
  {
    category: 'Bone / blood',
    items: [
      { key: 'iron_deficiency', label: 'Iron-deficiency anemia' },
      { key: 'osteoporosis', label: 'Osteoporosis' },
    ],
  },
  {
    category: 'Other diet-related contexts',
    items: [
      { key: 'gout', label: 'Gout / high uric acid' },
      { key: 'pregnancy', label: 'Pregnancy' },
      { key: 'breastfeeding', label: 'Breastfeeding' },
      { key: 'eating_disorder', label: 'Eating disorder or history of disordered eating' },
    ],
  },
];

export const HEALTH_META_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'other', label: 'Other / not listed' },
  { key: 'prefer_not_say', label: 'Prefer not to say' },
] as const;

export function getHealthConditionSafetyNotice(lang: Language): string {
  return t(
    lang,
    'Coach Hoo can support general tracking. For condition-specific food, calorie, medication, or activity advice, please follow guidance from your doctor or registered dietitian.',
    'Ang Coach Hoo ay maaaring sumuporta sa general tracking. Para sa kondisyon-specific na payo sa pagkain, calorie, gamot, o aktibidad, mangyaring sumunod sa gabay ng iyong doktor o rehistradong dietitian.',
  );
}
export function getHealthConditionWhichMessage(lang: Language): string {
  return t(
    lang,
    'Which condition(s) apply to you?',
    'Aling kondisyon ang naaangkop sa iyo?',
  );
}

export function getNamePlaceholder(lang: Language): string {
  return t(lang, 'Your name', 'Ang iyong pangalan');
}
export function getAgePlaceholder(lang: Language): string {
  return t(lang, 'Your age', 'Ang iyong edad');
}

export const ALLERGEN_GROUPS: SelectGroup[] = [
  {
    category: 'Common allergens',
    items: [
      { key: 'milk', label: 'Milk / dairy' },
      { key: 'egg', label: 'Egg' },
      { key: 'peanut', label: 'Peanut' },
      { key: 'tree_nuts', label: 'Tree nuts' },
      { key: 'soy', label: 'Soy' },
      { key: 'wheat', label: 'Wheat' },
      { key: 'sesame', label: 'Sesame' },
      { key: 'fish', label: 'Fish' },
    ],
  },
  {
    category: 'Shellfish & mollusks',
    items: [
      { key: 'crustacean', label: 'Crustacean shellfish (shrimp, crab, lobster)' },
      { key: 'mollusks', label: 'Mollusks (squid, oyster, mussel, clam)' },
    ],
  },
  {
    category: 'Other allergens',
    items: [
      { key: 'corn', label: 'Corn' },
      { key: 'coconut', label: 'Coconut' },
      { key: 'mustard', label: 'Mustard' },
      { key: 'celery', label: 'Celery' },
      { key: 'lupin', label: 'Lupin' },
      { key: 'sulfites', label: 'Sulfites' },
    ],
  },
  {
    category: 'Fruits',
    items: [
      { key: 'kiwi', label: 'Kiwi' },
      { key: 'banana', label: 'Banana' },
      { key: 'avocado', label: 'Avocado' },
      { key: 'strawberry', label: 'Strawberry' },
    ],
  },
];

export const ALLERGY_META_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'other', label: 'Other / not listed' },
  { key: 'prefer_not_say', label: 'Prefer not to say' },
] as const;

export function getAllergySafetyNotice(lang: Language): string {
  return t(
    lang,
    'Always check food labels and ask a healthcare professional for guidance about allergies or severe reactions.',
    'Palaging suriin ang mga food label at magtanong sa isang healthcare professional para sa gabay tungkol sa mga allergy o matinding reaksyon.',
  );
}

export const ONBOARDING_PROGRESS_KEY = 'coach_hoo_onboarding_progress';

export function convertHeight(
  value: number,
  fromUnit: 'cm' | 'in',
): number {
  if (fromUnit === 'in') return Math.round(value * 2.54);
  return value;
}

export function convertWeight(
  value: number,
  fromUnit: 'kg' | 'lbs',
): number {
  if (fromUnit === 'lbs')
    return Math.round(value * 0.453592 * 10) / 10;
  return value;
}

export function validateAge(age: number): boolean {
  return Number.isInteger(age) && age >= 10 && age <= 120;
}

export function validateHeight(height: number): boolean {
  return height > 0 && height <= 300;
}

export function validateWeight(weight: number): boolean {
  return weight > 0 && weight <= 700;
}