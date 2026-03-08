// ============================================
// OPENAI SERVICE - Análisis de emails con IA
// ============================================

import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeEmailContent(subject: string, body: string) {
    try {
      const prompt = `Analiza el siguiente email de un cliente y extrae información relevante para un CRM de ventas:

ASUNTO: ${subject}
CONTENIDO: ${body.substring(0, 3000)}

Proporciona un análisis en formato JSON con la siguiente estructura:
{
  "summary": "Resumen breve del email (máx 2 oraciones)",
  "sentiment": {
    "label": "positive|negative|neutral",
    "score": 0-1
  },
  "intent": "question|complaint|request|information|purchase_intent|other",
  "priorityScore": 1-100 (basado en urgencia),
  "actionItems": ["lista de acciones sugeridas"],
  "entities": {
    "products": ["productos mencionados"],
    "amounts": ["montos detectados"],
    "dates": ["fechas importantes"],
    "people": ["personas mencionadas"]
  },
  "detectedOpportunity": true|false,
  "detectedValue": "valor estimado si es oportunidad"
}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en análisis de comunicaciones comerciales. Extraes insights accionables de emails.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);

    } catch (error) {
      console.error('OpenAI analysis error:', error);
      // Fallback básico
      return {
        summary: body.substring(0, 200) + '...',
        sentiment: { label: 'neutral', score: 0.5 },
        intent: 'other',
        priorityScore: 50,
        actionItems: [],
        entities: { products: [], amounts: [], dates: [], people: [] },
        detectedOpportunity: false
      };
    }
  }

  async generateReplySuggestion(subject: string, body: string, context: string) {
    try {
      const prompt = `Genera una respuesta profesional al siguiente email:

CONTEXTO DEL CLIENTE:
${context}

EMAIL RECIBIDO:
Asunto: ${subject}
${body.substring(0, 2000)}

Genera una respuesta profesional, concisa y personalizada. La respuesta debe:
1. Ser cordial y profesional
2. Responder a todas las preguntas
3. Incluir un call-to-action claro
4. Mantener un tono de ventas consultivo`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en ventas B2B. Generas respuestas efectivas a emails de clientes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('Generate reply error:', error);
      return null;
    }
  }

  async transcribeAudio(audioBase64: string, language = 'es') {
    try {
      // Nota: Para Whisper necesitas enviar el archivo, no base64
      // Esta es una implementación placeholder
      const response = await this.client.audio.transcriptions.create({
        file: await this.base64ToFile(audioBase64, 'audio.webm'),
        model: 'whisper-1',
        language
      });

      return response.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async extractBusinessCardData(imageBase64: string) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrae la información de esta tarjeta de presentación y devuélvela en formato JSON con: name, company, jobTitle, email, phone, mobile, website, address'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      return content ? JSON.parse(content) : null;

    } catch (error) {
      console.error('OCR error:', error);
      throw error;
    }
  }

  private async base64ToFile(base64: string, filename: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }
}

export default OpenAIService;
