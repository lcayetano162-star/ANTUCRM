/**
 * AI Analysis Integration for Interactions
 * 
 * Usa el aiService existente para analizar cada interacción
 * y guardar insights en el campo ai_insight (JSONB)
 */

import { interactionService, Interaction, AIInsight } from './interactionService';
import { callAI } from '../ai/aiService';

/**
 * Analiza una interacción con Claude y guarda los resultados
 * Llamar esto desde un worker o background job
 */
export async function analyzeInteraction(interaction: Interaction): Promise<AIInsight> {
  const prompt = buildAnalysisPrompt(interaction);
  
  try {
    const aiResponse = await callAI(
      `Eres un analista de ventas experto. Analiza esta interacción de CRM y responde ÚNICAMENTE con JSON válido.
      
      Reglas:
      1. sentiment: "positive", "negative", "neutral", o "mixed"
      2. sentiment_score: número entre 0.0 y 1.0
      3. summary: máximo 150 caracteres describiendo la esencia
      4. topics: array de 1-5 temas principales
      5. intent: intención del cliente (purchase_intent, support_request, complaint, inquiry, etc)
      6. urgency: "low", "medium", "high"
      7. keywords: palabras clave importantes (3-10)
      8. suggested_action: qué debería hacer el vendedor`,
      prompt
    );

    const insight = parseAIResponse(aiResponse);
    
    // Guardar en BD
    await interactionService.updateAIInsight(interaction.id, insight);
    
    console.log(`[AI Analysis] Interaction ${interaction.id} analyzed: ${insight.sentiment}`);
    return insight;
    
  } catch (error) {
    console.error(`[AI Analysis] Failed for interaction ${interaction.id}:`, error);
    throw error;
  }
}

/**
 * Procesa todas las interacciones pendientes de análisis
 * Útil para correr en un cron job cada 5 minutos
 */
export async function processPendingAnalysis(batchSize: number = 10): Promise<number> {
  const { pool } = await import('../../shared/config/database');
  
  const result = await pool.query(
    `SELECT * FROM interactions 
     WHERE ai_status = 'pending' 
     AND channel IN ('email', 'whatsapp')
     ORDER BY created_at DESC
     LIMIT $1`,
    [batchSize]
  );
  
  let processed = 0;
  
  for (const row of result.rows) {
    try {
      await analyzeInteraction(interactionService['mapRow'](row));
      processed++;
    } catch (error) {
      // Marcar como failed para no reintentar indefinidamente
      await pool.query(
        `UPDATE interactions SET ai_status = 'failed' WHERE id = $1`,
        [row.id]
      );
    }
  }
  
  return processed;
}

/**
 * Genera resumen de conversación completa (thread)
 * Útil para el vendedor antes de una llamada
 */
export async function summarizeThread(threadId: string): Promise<{
  summary: string;
  keyPoints: string[];
  nextActions: string[];
  sentiment: string;
}> {
  const interactions = await interactionService.getThread('any', threadId);
  
  if (interactions.length === 0) {
    throw new Error('Thread not found or empty');
  }
  
  // Construir contexto de la conversación
  const conversation = interactions.map(i => 
    `[${i.direction.toUpperCase()} ${i.channel}] ${i.content.substring(0, 500)}`
  ).join('\n\n');
  
  const prompt = `
    Resume esta conversación de CRM entre vendedor y cliente:
    
    ${conversation}
    
    Responde en JSON:
    {
      "summary": "Resumen ejecutivo de máximo 200 caracteres",
      "keyPoints": ["punto clave 1", "punto clave 2"],
      "nextActions": ["acción recomendada 1"],
      "sentiment": "sentimiento general"
    }
  `;
  
  const response = await callAI(
    'Eres un asistente de ventas. Resume la conversación para que el vendedor esté preparado.',
    prompt
  );
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse thread summary:', e);
  }
  
  return {
    summary: 'No se pudo generar resumen',
    keyPoints: [],
    nextActions: ['Revisar conversación manualmente'],
    sentiment: 'unknown'
  };
}

// ─── PRIVATE ─────────────────────────────────────────────────────────────────

function buildAnalysisPrompt(interaction: Interaction): string {
  return `
    Canal: ${interaction.channel}
    Dirección: ${interaction.direction} (${interaction.direction === 'inbound' ? 'cliente a vendedor' : 'vendedor a cliente'})
    ${interaction.subject ? `Asunto: ${interaction.subject}` : ''}
    
    Contenido:
    ${interaction.content.substring(0, 3000)}
    
    Responde exactamente así:
    {
      "sentiment": "positive",
      "sentiment_score": 0.85,
      "summary": "Cliente muestra interés en el producto premium",
      "topics": ["pricing", "features", "demo"],
      "intent": "purchase_intent",
      "urgency": "high",
      "keywords": ["comprar", "precio", "descuento"],
      "suggested_action": "Schedule demo call"
    }
  `;
}

function parseAIResponse(response: string): AIInsight {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      sentiment: parsed.sentiment || 'neutral',
      sentiment_score: parsed.sentiment_score || 0.5,
      summary: parsed.summary || 'Sin resumen',
      topics: parsed.topics || [],
      intent: parsed.intent,
      urgency: parsed.urgency || 'low',
      keywords: parsed.keywords || [],
      suggested_action: parsed.suggested_action
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return {
      sentiment: 'neutral',
      sentiment_score: 0.5,
      summary: 'Error en análisis',
      topics: [],
      urgency: 'low'
    };
  }
}
