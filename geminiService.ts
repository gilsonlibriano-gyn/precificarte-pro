
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI SDK with the API key from environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Gets pricing advice based on recipe details using complex reasoning.
 */
export async function getPricingAdvice(cost: number, category: string, ingredients: string[]) {
  try {
    // Using gemini-3-pro-preview for complex reasoning tasks like financial consultancy
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Como consultor de confeitaria, analise uma receita de ${category} com custo de produção de R$ ${cost.toFixed(2)}. 
      Ingredientes: ${ingredients.join(', ')}. 
      Sugira 3 faixas de preço de venda (Econômica, Gourmet e Premium) com justificativas baseadas no mercado brasileiro atual. 
      Retorne em formato amigável Markdown.`,
    });
    // Access the .text property directly to retrieve the generated string
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível obter conselhos de precificação no momento.";
  }
}

/**
 * Suggests recipes based on available stock using creative generation.
 */
export async function getRecipeSuggestions(availableIngredients: string[]) {
  try {
    // Using gemini-3-pro-preview for advanced reasoning and creative culinary tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Tenho estes ingredientes em estoque: ${availableIngredients.join(', ')}. 
      Sugira 3 receitas lucrativas de confeitaria que eu possa fazer com eles. 
      Foque em baixo desperdício e alta margem.`,
    });
    // Use the .text property to access the response content
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível obter sugestões de receitas no momento.";
  }
}
