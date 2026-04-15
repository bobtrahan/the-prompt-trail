/**
 * Telemetry — lightweight session data collector.
 * Stores arbitrary JSON-serialisable events during a run.
 * downloadJson() triggers a browser download; returns null if no data.
 */

const _events: Record<string, unknown>[] = [];

export const Telemetry = {
  record(event: Record<string, unknown>): void {
    _events.push({ ts: Date.now(), ...event });
  },

  downloadJson(): null | true {
    if (_events.length === 0) return null;
    const blob = new Blob([JSON.stringify(_events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  clear(): void {
    _events.length = 0;
  },
};

export default Telemetry;
