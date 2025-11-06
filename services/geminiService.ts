
import { GoogleGenAI } from "@google/genai";

// A utility function to convert a File object to a Gemini API Part object.
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // remove the `data:...;base64,` prefix
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
        // This error is for the developer, not the user.
        console.error("API_KEY environment variable not set");
        throw new Error("API_KEY environment variable not set. Please configure it in your environment.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};


export const runGemini = async (prompt: string, image?: File): Promise<string> => {
  try {
    const aiInstance = getAi();
    const modelName = 'gemini-2.5-flash';

    const parts: any[] = [];

    if (image) {
      const imagePart = await fileToGenerativePart(image);
      parts.push(imagePart);
    }
    
    parts.push({ text: prompt });

    const response = await aiInstance.models.generateContent({
        model: modelName,
        contents: { parts: parts },
    });
    
    return response.text;

  } catch (error) {
    console.error("Error running Gemini:", error);
    if (error instanceof Error) {
        return `An error occurred while contacting the AI model: ${error.message}. Please check your API key and network connection.`;
    }
    return "An unknown error occurred while contacting the Gemini API.";
  }
};
