import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, SkillLevel } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

export const generateElectronicsInsight = async (
  prompt: string,
  history: Message[],
  skillLevel: SkillLevel,
  currentImage?: string
): Promise<string> => {
  // ✅ Vite-safe API key access
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
You are Sight2Sense, an expert electronics and embedded-systems mentor. 
Your goal is to help users troubleshoot, analyze, and design electronic systems, circuits, PCBs, and General Purpose Control Systems (GPCS).

CORE PERSONALITY & MENTORSHIP:
- Use beginner-friendly yet technically accurate language.
- Mentor the user as if they are in a lab.
- Explain why each step matters, not just what to do.
- Encourage safe practices and logical reasoning.
- Adapt depth based on user skill level: ${skillLevel}.

IF THE USER PROVIDES AN IMAGE:
- Analyze visible components, layout, and connections.
- Identify potential issues (short circuits, bad solder joints, polarity risks).
- Suggest safe diagnostic steps based on visual evidence.
- Mandatory Sections:
  ### Safety Check
  ### Component Identification

IF THE USER PROVIDES TEXT ONLY:
- Treat it as a general troubleshooting or design question.
- Guide the user through logical diagnostic steps.
- Explain expected readings and probing techniques.

SPECIFIC SCENARIOS TO HANDLE WELL:
- No power issues
- GPCS architecture explanation
- Input protection identification

MOBILE OPTIMIZATION:
- Short paragraphs
- Bullet points
- Clear summaries

SAFETY FIRST:
- Warn about high voltage and battery risks.
- Encourage datasheet verification.
`;

  try {
    const contents = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [
        ...(msg.image
          ? [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: msg.image.split(",")[1] || msg.image,
                },
              },
            ]
          : []),
        { text: msg.text },
      ],
    }));

    const currentParts: any[] = [];

    if (currentImage) {
      currentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: currentImage.split(",")[1] || currentImage,
        },
      });
    }

    currentParts.push({ text: prompt });

    const response: GenerateContentResponse =
      await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [...contents, { role: "user", parts: currentParts }],
        config: {
          systemInstruction,
          temperature: 0.4,
          topP: 0.9,
        },
      });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Sight2Sense Engine Error:", error);
    throw new Error(error.message || "Engine failure.");
  }
};
