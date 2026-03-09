// ============================================
// ANTU CRM - Gemini AI Service (PRO Strategy)
// ============================================

export interface GeminiResponse {
    text: string;
    error?: string;
}

/**
 * Genera contenido utilizando Google Gemini API
 */
export async function generateAIContent(prompt: string, systemInstruction?: string): Promise<GeminiResponse> {
    // PROXY SECURITY: Mover llamadas al backend para proteger API Keys
    const API_URL = `${import.meta.env.VITE_API_URL || '/api/v1'}/ai/generate`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Requerir auth
            },
            body: JSON.stringify({
                prompt,
                systemInstruction,
                config: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                return {
                    text: '',
                    error: 'Antü AI: Límite de cuota alcanzado. Para modo Pro ilimitado, activa la facturación en https://aistudio.google.com/app/billing'
                };
            }
            return {
                text: '',
                error: `Antü AI: ${data.error?.message || 'Error de servicio'}`
            };
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            return { text: '', error: 'Sin respuesta del cerebro de Antü.' };
        }

        return { text: aiText };
    } catch (error: any) {
        return {
            text: '',
            error: 'Error de conexión. Revisa tu internet o el CSP en index.html.'
        };
    }
}

/**
 * Helper para el Copilot del CRM
 */
export async function getCopilotResponse(message: string, context?: any) {
    const systemPrompt = `Eres Antü AI, asistente del Antü CRM. 
  Tu misión es preparar al usuario para LLAMADAS DE CIERRE. 
  Analiza al cliente: ${context?.customerName || 'General'}, busca riesgos y sugiere el siguiente paso de venta. 
  Responde de forma estratégica y en español dominicano profesional.`;

    return generateAIContent(message, systemPrompt);
}
