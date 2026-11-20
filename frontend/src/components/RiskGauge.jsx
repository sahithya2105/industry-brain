import React from 'react';

export default function RiskGauge({ probability = 0, threshold = 0.5, status = 'HEALTHY' }) {
  const probPercent = Math.min(100, Math.max(0, probability * 100));
  const threshPercent = Math.min(100, Math.max(0, threshold * 100));

  // Semicircle gauge calculation
  const radius = 85;
  const circumference = Math.PI * radius; // half circle perimeter
  const strokeDashoffset = circumference - (probPercent / 100) * circumference;

  let strokeColor = '#3F6B4A'; // sage green
  if (status === 'HIGH RISK') {
    strokeColor = '#A33A36'; // terracotta red
  } else if (status === 'WATCH') {
    strokeColor = '#8A6100'; // soft amber
  }

  // Calculate angle for threshold tick on semicircle
  // 0% is at angle Math.PI (left), 100% is at angle 0 (right)
  const threshAngle = Math.PI * (1 - threshPercent / 100);
  const cx = 110;
  const cy = 100;
  const tickInnerR = radius - 10;
  const tickOuterR = radius + 10;

  const tx1 = cx + tickInnerR * Math.cos(threshAngle);
  const ty1 = cy - tickInnerR * Math.sin(threshAngle);
  const tx2 = cx + tickOuterR * Math.cos(threshAngle);
  const ty2 = cy - tickOuterR * Math.sin(threshAngle);

  return (
    <div className="flex flex-col items-center justify-center relative py-2">
      <svg width="220" height="135" viewBox="0 0 220 135" className="overflow-visible">
        {/* Background Track Arc in Tan */}
        <path
          d="M 25 100 A 85 85 0 0 1 195 100"
          fill="none"
          stroke="#D9C3A5"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Active Progress Arc */}
        <path
          d="M 25 100 A 85 85 0 0 1 195 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
          }}
        />

        {/* Alert Threshold Marker Tick */}
        <line
          x1={tx1}
          y1={ty1}
          x2={tx2}
          y2={ty2}
          stroke="#4B2E1E"
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Probability Reading in Center of Arc */}
      <div className="absolute top-[52px] flex flex-col items-center text-center">
        <div className="text-3xl font-extrabold font-mono tracking-tight text-coffee-dark">
          {probPercent.toFixed(1)}%
        </div>
        <div className="text-[11px] font-semibold tracking-wider uppercase text-coffee-muted mt-0.5">
          Failure Risk
        </div>
      </div>

      {/* Axis Labels */}
      <div className="w-[200px] flex justify-between text-[11px] font-mono text-coffee-muted mt-1">
        <span>0.0</span>
        <span className="text-coffee font-semibold">Thresh: {(threshold * 100).toFixed(1)}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
