// Following javascript_openai blueprint for AI moderation
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function moderateImage(base64Image: string): Promise<{ safe: boolean; categories: any }> {
  try {
    // Clean up base64 string - remove any whitespace, newlines, or data URL prefix if present
    let cleanBase64 = base64Image.trim();
    
    // If it already has a data URL prefix, extract just the base64 part
    if (cleanBase64.includes('data:image')) {
      cleanBase64 = cleanBase64.split(',')[1] || cleanBase64;
    }
    
    // Remove any whitespace characters
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${cleanBase64}`
          }
        }
      ],
    });

    const result = response.results[0];
    return {
      safe: !result.flagged,
      categories: result.categories,
    };
  } catch (error: any) {
    console.error("Image moderation error:", error);
    console.error("Error details:", error.message, error.response?.data);
    throw new Error(`Failed to moderate image: ${error.message || 'Unknown error'}`);
  }
}

export async function moderateText(text: string): Promise<{ safe: boolean; categories: any }> {
  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.results[0];
    return {
      safe: !result.flagged,
      categories: result.categories,
    };
  } catch (error) {
    console.error("Text moderation error:", error);
    throw new Error("Failed to moderate text");
  }
}

export async function analyzeProfileBio(bio: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a professional profile consultant. Analyze the bio and provide brief, actionable suggestions to improve it for a luxury lifestyle companion platform. Keep it professional and respectful. Max 2-3 sentences."
        },
        {
          role: "user",
          content: bio
        }
      ],
      max_completion_tokens: 200,
    });

    return response.choices[0].message.content || "Your bio looks good!";
  } catch (error) {
    console.error("Bio analysis error:", error);
    return "Unable to analyze bio at this time.";
  }
}
