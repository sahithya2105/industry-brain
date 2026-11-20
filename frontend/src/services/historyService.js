const STORAGE_KEY = 'industry_brain_history';

export const historyService = {
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return [];
    }
  },

  addHistory(record) {
    try {
      const current = this.getHistory();
      const enriched = {
        id: 'pred-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        ...record
      };
      const updated = [enriched, ...current].slice(0, 500); // keep up to 500 records
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return enriched;
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      return record;
    }
  },

  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  },

  exportToCSV(records) {
    if (!records || records.length === 0) return;

    const headers = [
      'Timestamp',
      'Model',
      'Machine_Type',
      'Air_Temp_K',
      'Process_Temp_K',
      'Speed_RPM',
      'Torque_Nm',
      'Tool_Wear_Min',
      'Probability',
      'Threshold',
      'Status',
      'Message'
    ];

    const rows = records.map(r => [
      r.timestamp,
      r.model || 'RandomForest',
      r.inputs?.machine_type || 'M',
      r.inputs?.air_temp_K || '',
      r.inputs?.process_temp_K || '',
      r.inputs?.speed_rpm || '',
      r.inputs?.torque_Nm || '',
      r.inputs?.tool_wear_min || '',
      r.probability,
      r.threshold,
      r.status,
      `"${(r.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `industry_brain_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
