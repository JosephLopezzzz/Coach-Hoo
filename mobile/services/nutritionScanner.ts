const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface NutritionFacts {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size_g?: number;
}

export async function scanNutritionFacts(base64Image: string): Promise<NutritionFacts> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Missing Gemini API Key. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
You are an expert nutritionist and OCR system.
Analyze the provided image of a nutrition facts label or food packaging.
Extract the following information exactly. If multiple servings are listed, extract the macros for ONE serving.
Return ONLY a valid, raw JSON object with no markdown formatting, no backticks, and no explanation.

Required JSON structure:
{
  "food_name": "String (try to guess the food name, or 'Unknown Food' if not possible)",
  "calories": Number (total calories per serving),
  "protein": Number (protein in grams per serving),
  "carbs": Number (total carbohydrates in grams per serving),
  "fat": Number (total fat in grams per serving),
  "serving_size_g": Number (the weight of one serving in grams, if available, otherwise null)
}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Failed to scan image. Gemini returned ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('AI returned an empty response.');
    }

    // Attempt to parse JSON. Sometimes AI still wraps in markdown despite instructions.
    let cleanedJson = candidateText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.substring(7);
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
      }
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.substring(3);
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
      }
    }

    const parsed = JSON.parse(cleanedJson.trim());
    return {
      food_name: parsed.food_name || 'Scanned Food',
      calories: Number(parsed.calories) || 0,
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      fat: Number(parsed.fat) || 0,
      serving_size_g: parsed.serving_size_g ? Number(parsed.serving_size_g) : undefined,
    };

  } catch (err: any) {
    console.error('Nutrition Scan Error:', err);
    throw new Error(err.message || 'Failed to analyze nutrition facts.');
  }
}
