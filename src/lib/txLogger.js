/**
 * Simple transaction logger for dev: stores transactions in localStorage under 'tx_log'
 * Each tx: { id, service, permitId, action, actor, comment, timestamp }
 */
export function logTx({ service, permitId, action, actor = 'admin', comment = '' }) {
  try {
    const key = 'tx_log';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const tx = { id: `${service}-${Date.now()}`, service, permitId, action, actor, comment, timestamp: new Date().toISOString() };
    existing.unshift(tx);
    localStorage.setItem(key, JSON.stringify(existing));
    return tx;
  } catch (e) {
    console.error('txLogger error', e);
    return null;
  }
}

export function getTxs() {
  try {
    return JSON.parse(localStorage.getItem('tx_log') || '[]');
  } catch (e) { return []; }
}

export function getAggregates() {
  const txs = getTxs();
  const agg = { building: 0, barangay: 0, franchise: 0, business: 0 };
  for (const t of txs) {
    if (agg[t.service] !== undefined) agg[t.service] += 1;
  }
  return agg;
}
