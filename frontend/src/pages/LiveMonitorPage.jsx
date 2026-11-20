import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Radio,
  Info
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../services/api';

const MACHINES_CONFIG = [
  { id: 'M-01', name: 'CNC Milling Center Alpha', type: 'M', cell: 'Cell 1' },
  { id: 'M-02', name: 'High-Precision Lathe Bravo', type: 'L', cell: 'Cell 1' },
  { id: 'M-03', name: 'Heavy Boring Rig Charlie', type: 'H', cell: 'Cell 2' },
  { id: 'M-04', name: 'Automatic Surface Grinder Delta', type: 'L', cell: 'Cell 2' },
  { id: 'M-05', name: 'Vertical Machining Center Echo', type: 'M', cell: 'Cell 3' },
  { id: 'M-06', name: 'Hydro-Pneumatic Press Foxtrot', type: 'L', cell: 'Cell 3' }
];

export default function LiveMonitorPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [readingsPool, setReadingsPool] = useState([]);
  const [machines, setMachines] = useState(() =>
    MACHINES_CONFIG.map((m) => ({
      ...m,
      air_temp_K: 298.5,
      process_temp_K: 308.7,
      speed_rpm: 1450,
      torque_Nm: 42.0,
      tool_wear_min: 45,
      probability: 0.005,
      status: 'HEALTHY',
      history: [0.005, 0.004, 0.006, 0.005]
    }))
  );
  const [alerts, setAlerts] = useState([]);
  const [threshold, setThreshold] = useState(0.4259);
  const intervalRef = useRef(null);

  // Fetch sample test readings pool on mount
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const meta = await api.getMeta();
        if (meta?.thresholds?.RandomForest) {
          setThreshold(meta.thresholds.RandomForest);
        }
        const data = await api.getSampleReadings(300);
        if (data.readings && data.readings.length > 0) {
          setReadingsPool(data.readings);
        }
      } catch (err) {
        console.warn('Failed to load sample readings pool:', err);
      }
    };
    fetchSamples();
  }, []);

  // Live simulation tick every 3 seconds
  useEffect(() => {
    if (!isRunning || readingsPool.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tickSimulation();
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, readingsPool, threshold]);

  const tickSimulation = () => {
    setMachines((prevMachines) => {
      return prevMachines.map((m) => {
        // Pick random reading from test pool
        const randRow = readingsPool[Math.floor(Math.random() * readingsPool.length)];
        const prob = randRow.prob !== undefined ? randRow.prob : (randRow.true === 1 ? 0.88 : 0.02);

        let status = 'HEALTHY';
        if (prob >= threshold) {
          status = 'HIGH RISK';
        } else if (prob >= threshold * 0.6) {
          status = 'WATCH';
        }

        const newHistory = [...m.history.slice(-8), prob];

        // Trigger alert if elevated
        if (status === 'HIGH RISK' || status === 'WATCH') {
          setAlerts((prev) => [
            {
              id: Date.now() + Math.random(),
              machineId: m.id,
              machineName: m.name,
              status,
              prob: prob,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              toolWear: Math.round(randRow.Tool_wear || 150),
              torque: (randRow.Torque || 50).toFixed(1)
            },
            ...prev.slice(0, 25)
          ]);
        }

        return {
          ...m,
          air_temp_K: randRow.Air_temperature || 298.5,
          process_temp_K: randRow.Process_temperature || 308.7,
          speed_rpm: Math.round(randRow.Rotational_speed || 1450),
          torque_Nm: parseFloat((randRow.Torque || 40.0).toFixed(1)),
          tool_wear_min: Math.round(randRow.Tool_wear || 60),
          probability: prob,
          status,
          history: newHistory
        };
      });
    });
  };

  return (
    <div className="space-y-6 text-coffee-deep">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-coffee-dark tracking-tight">
              Factory Floor Live Monitor
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cream text-coffee border border-tan shadow-soft">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-coffee animate-ping' : 'bg-coffee-muted'}`} />
              {isRunning ? 'STREAMING' : 'PAUSED'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-coffee-muted mt-1">
            Simulated replay of AI4I 2020 test rows, not live machine data.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-soft ${
              isRunning
                ? 'bg-cream hover:bg-beige text-coffee border border-tan'
                : 'bg-coffee hover:bg-coffee-dark text-cream'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 text-amber" />
                <span>Pause Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Machine Cards + Alerts Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 6 Machine Grid (8 cols on XL) */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {machines.map((machine) => {
            let statusBadge = 'bg-sage-bg text-sage-text border-sage-border';
            let cardBorder = 'border-tan';
            if (machine.status === 'HIGH RISK') {
              statusBadge = 'bg-terracotta-bg text-terracotta-text border-terracotta-border';
              cardBorder = 'border-2 border-terracotta-border';
            } else if (machine.status === 'WATCH') {
              statusBadge = 'bg-amber-bg text-amber-text border-amber-border';
              cardBorder = 'border-2 border-amber-border';
            }

            const sparkData = machine.history.map((val, idx) => ({ idx, val }));

            return (
              <div
                key={machine.id}
                className={`p-5 rounded-2xl bg-cream border ${cardBorder} shadow-soft transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-[10px] font-mono text-coffee font-bold uppercase">
                        {machine.id} &bull; Type {machine.type} &bull; {machine.cell}
                      </div>
                      <h3 className="text-sm font-bold text-coffee-dark leading-snug">
                        {machine.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${statusBadge}`}>
                      {machine.status}
                    </span>
                  </div>

                  {/* Sensor Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-beige border border-tan mb-3 text-center">
                    <div>
                      <div className="text-[9px] uppercase font-mono text-coffee-muted">Speed</div>
                      <div className="text-xs font-mono font-bold text-coffee-dark mt-0.5">
                        {machine.speed_rpm} <span className="text-[10px] text-coffee-muted">rpm</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-mono text-coffee-muted">Torque</div>
                      <div className="text-xs font-mono font-bold text-coffee-dark mt-0.5">
                        {machine.torque_Nm} <span className="text-[10px] text-coffee-muted">Nm</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-mono text-coffee-muted">Wear</div>
                      <div className="text-xs font-mono font-bold text-coffee-dark mt-0.5">
                        {machine.tool_wear_min} <span className="text-[10px] text-coffee-muted">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Probability & Sparkline */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-coffee-muted text-[11px]">Failure Probability</span>
                    <span className="font-mono font-bold text-coffee-dark text-sm">
                      {(machine.probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div className="h-9 w-full bg-beige rounded-lg p-1 border border-tan">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line
                          type="monotone"
                          dataKey="val"
                          stroke={machine.status === 'HIGH RISK' ? '#A33A36' : machine.status === 'WATCH' ? '#8A6100' : '#6F4E37'}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Incident Alarms Feed (4 cols on XL) */}
        <div className="xl:col-span-4 bg-cream border border-tan rounded-2xl p-5 shadow-soft flex flex-col h-[580px]">
          <div className="flex items-center justify-between border-b border-tan pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-terracotta animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-coffee-dark">
                Live Incident Alarms Feed
              </h3>
            </div>
            <span className="text-[10px] font-mono text-coffee-muted">
              {alerts.length} events logged
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-coffee-muted">
                <CheckCircle className="w-8 h-8 text-sage mb-2 opacity-60" />
                <div className="text-xs font-medium text-coffee-dark">All Systems Nominal</div>
                <div className="text-[11px] text-coffee-muted mt-0.5">
                  Live telemetry stream active. Any WATCH or HIGH RISK incidents will appear here automatically.
                </div>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all shadow-soft ${
                    alert.status === 'HIGH RISK'
                      ? 'bg-terracotta-bg border-terracotta-border text-terracotta-text'
                      : 'bg-amber-bg border-amber-border text-amber-text'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold flex items-center gap-1">
                      {alert.status === 'HIGH RISK' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-terracotta-text" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-amber-text" />
                      )}
                      {alert.machineId} &bull; {alert.status}
                    </span>
                    <span className="text-[10px] text-coffee-muted">{alert.time}</span>
                  </div>
                  <div className="text-[11px] font-sans font-medium text-coffee-deep truncate">
                    {alert.machineName}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-coffee-deep pt-1 border-t border-tan/60 mt-0.5">
                    <span>Wear: {alert.toolWear} min</span>
                    <span>Torque: {alert.torque} Nm</span>
                    <span className="font-bold text-coffee-dark">Risk: {(alert.prob * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-tan text-[11px] text-coffee-muted text-center font-mono">
            Simulation rate: 1 test frame every 3.0s
          </div>
        </div>
      </div>
    </div>
  );
}
