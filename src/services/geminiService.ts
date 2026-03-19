import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DiagnosisResult {
  status: "Healthy" | "Infected";
  diseaseName: string;
  confidence: string;
  treatmentPlan: string[];
  pesticides: {
    organic: string[];
    chemical: string[];
  };
  controlMeasures: string[];
  preventionMethods: string[];
  plantLifespan: string;
  additionalInfo: string;
}

export async function analyzeCropImage(base64Image: string, language: string = "English", retryCount = 0): Promise<DiagnosisResult> {
  // Try the preview model first, then fall back to the stable latest model if busy
  const models = ["gemini-3-flash-preview", "gemini-flash-latest"];
  const model = models[retryCount % models.length];
  
  const prompt = `
    Analyze this crop/plant image and provide a detailed diagnosis.
    Return the result strictly in JSON format with the following structure:
    {
      "status": "Healthy" | "Infected",
      "diseaseName": "Name of the disease or 'None' if healthy",
      "confidence": "Confidence level as a percentage",
      "treatmentPlan": ["step 1", "step 2", ...],
      "pesticides": {
        "organic": ["organic pesticide 1", ...],
        "chemical": ["chemical pesticide 1", ...]
      },
      "controlMeasures": ["measure 1", "measure 2", ...],
      "preventionMethods": ["prevention 1", "prevention 2", ...],
      "plantLifespan": "Specific information about how much longer the plant can live given its current infection status vs its normal lifespan",
      "additionalInfo": "Any other relevant observations"
    }
    
    CRITICAL INSTRUCTIONS:
    1. The entire response (except for the JSON keys) MUST be in ${language}.
    2. The 'treatmentPlan' must be written in very simple, easy-to-understand language that anyone (even without technical knowledge) can follow. Avoid jargon.
    3. The 'plantLifespan' must specifically address the impact of the infection. Tell the farmer how much longer the plant is likely to survive if left untreated, and how much its lifespan can be extended if the treatment plan is followed.
    4. Provide specific 'pesticides' (both organic and chemical) that are effective against the identified disease.
    5. 'controlMeasures' should describe how to manage the current outbreak.
    6. 'preventionMethods' should provide advice on how to prevent this disease in future crops.
    7. Be as accurate as possible.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }, imagePart] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("The AI was unable to generate a response for this image. It might be blurry or not contain a plant.");
    
    try {
      return JSON.parse(text) as DiagnosisResult;
    } catch (parseError) {
      console.error("JSON Parse Error:", text);
      throw new Error("The analysis result was not in the expected format. Please try again.");
    }
  } catch (error: any) {
    console.error(`Error analyzing image with ${model}:`, error);
    
    // Handle 503 Service Unavailable with automatic retry/fallback
    if ((error.message?.includes("503") || error.message?.includes("UNAVAILABLE")) && retryCount < 3) {
      // If the first model failed, try the next one in the list immediately
      // If we've tried both, start applying exponential backoff
      const delay = retryCount < 1 ? 0 : Math.pow(2, retryCount - 1) * 1000; 
      
      console.log(`Model ${model} busy. Retrying with next option in ${delay}ms... (Attempt ${retryCount + 1}/3)`);
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      
      return analyzeCropImage(base64Image, language, retryCount + 1);
    }

    // Handle specific Gemini API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Analysis limit reached. Please wait a moment before trying again.");
    }
    if (error.message?.includes("400")) {
      throw new Error("The image could not be processed. It might be too large or in an unsupported format.");
    }
    if (error.message?.includes("503") || error.message?.includes("UNAVAILABLE")) {
      throw new Error("All AI models are currently very busy. Please wait 10-20 seconds and click 'Analyze' again.");
    }
    if (error.message?.includes("500")) {
      throw new Error("The AI service is temporarily unavailable. Please try again in a few minutes.");
    }
    
    throw new Error(error.message || "Failed to analyze the image. Please ensure the photo is clear and contains a plant.");
  }
}
