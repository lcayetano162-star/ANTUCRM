import { runScheduledChecks } from './automationEngine';

const INTERVAL_MS = 30 * 60 * 1000; // Run every 30 minutes

let intervalId: NodeJS.Timeout | null = null;
let running = false;

async function runChecks() {
  if (running) return;
  running = true;
  const start = Date.now();
  try {
    const result = await runScheduledChecks();
    const elapsed = Date.now() - start;
    if (result.fired > 0) {
      console.log(`[AutomationWorker] Checks completados en ${elapsed}ms. Disparadas: ${result.fired} acciones.`);
    }
  } catch (err: any) {
    console.error('[AutomationWorker] Error en ciclo:', err.message);
  } finally {
    running = false;
  }
}

export const automationWorker = {
  start() {
    if (intervalId) return;
    console.log('[AutomationWorker] Iniciado (intervalo: 30 min)');
    // Run immediately on startup (after 10s delay to let DB settle)
    setTimeout(() => runChecks(), 10000);
    intervalId = setInterval(runChecks, INTERVAL_MS);
  },

  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log('[AutomationWorker] Detenido.');
    }
  },

  runNow() {
    return runChecks();
  }
};
