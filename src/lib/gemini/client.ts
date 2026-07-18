import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID || 'project-4b7325a8-de64-499e-94f',
  location: process.env.GCP_LOCATION || 'us-central1',
  googleAuthOptions: (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY)
    ? {
        credentials: {
          client_email: process.env.GCP_CLIENT_EMAIL,
          private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
      }
    : undefined,
});

export const geminiFlash = {
  generateContent: async (params: any) => {
    return ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: params.contents,
      config: params.generationConfig,
    });
  }
};

export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 1200,
    },
  });

  const text = result.text;
  if (!text) {
    throw new Error('Gemini/Vertex AI returned an empty response');
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
}
