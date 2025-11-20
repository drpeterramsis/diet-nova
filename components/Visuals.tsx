
import React from 'react';

// --- 1. Macro Donut Chart ---
interface MacroDonutProps {
  cho: number;
  pro: number;
  fat: number;
  totalKcal: number;
}

export const MacroDonut: React.FC<MacroDonutProps> = ({ cho, pro, fat, totalKcal }) => {
  // Convert grams to percentages of total calories for the chart slices
  // CHO = 4kcal/g, PRO = 4kcal/g, FAT = 9kcal/g
  const choKcal = cho * 4;
  const proKcal = pro * 4;
  const fatKcal = fat * 9;
  const totalCalc = choKcal + proKcal + fatKcal || 1;

  const choDeg = (choKcal / totalCalc) * 360;
  const proDeg = (proKcal / totalCalc) * 360;
  const fatDeg = (fatKcal / totalCalc) * 360;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div 
        className="w-40 h-40 rounded-full relative"
        style={{
          background: `conic-gradient(
            #3b82f6 0deg ${choDeg}deg, 
            #ef4444 ${choDeg}deg ${choDeg + proDeg}deg, 
            #eab308 ${choDeg + proDeg}deg 360deg
          )`
        }}
      >
        {/* Inner White Circle for Donut Effect */}
        <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
           <span className="text-xs text-gray-500">Total</span>
           <span className="text-2xl font-bold text-[var(--color-heading)]">{totalKcal.toFixed(0)}</span>
           <span className="text-xs text-gray-400">Kcal</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs font-medium">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>CHO</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>PRO</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>FAT</span>
        </div>
      </div>
    </div>
  );
};

// --- 2. Progress Bar ---
interface ProgressBarProps {
  current: number;
  target: number;
  label: string;
  unit?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, target, label, unit = '', color = 'bg-[var(--color-primary)]' }) => {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOver = target > 0 && current > target;
  const barColor = isOver ? 'bg-red-500' : color;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-600">{label}</span>
        <span className={`${isOver ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
          {current.toFixed(0)} / {target.toFixed(0)} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-500 ease-out`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

// --- 3. BMI Gauge ---
interface BmiGaugeProps {
  value: number;
}

export const BmiGauge: React.FC<BmiGaugeProps> = ({ value }) => {
  // Map BMI 15-40 to 0-180 degrees
  const min = 15;
  const max = 40;
  const clamped = Math.min(Math.max(value, min), max);
  const percentage = (clamped - min) / (max - min);
  const rotation = percentage * 180; 

  return (
    <div className="relative w-48 h-24 overflow-hidden mx-auto mt-4">
      <div className="w-48 h-48 rounded-full border-[1rem] border-gray-200 absolute top-0 left-0 box-border"
           style={{
             background: `conic-gradient(from 180deg, 
               #3b82f6 0deg 25deg,  
               #22c55e 25deg 72deg, 
               #eab308 72deg 108deg, 
               #ef4444 108deg 180deg, 
               transparent 180deg)`
           }}
      ></div>
      {/* Mask to make it a gauge ring */}
      <div className="w-32 h-32 bg-white rounded-full absolute top-8 left-8 z-10"></div>
      
      {/* Needle */}
      <div 
        className="absolute bottom-0 left-1/2 w-1 h-24 bg-gray-800 origin-bottom z-20 transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
      ></div>
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 z-30"></div>
    </div>
  );
};

// --- 4. Comparison Bar Chart ---
interface ComparisonProps {
  actual: number;
  ideal: number;
  labelActual: string;
  labelIdeal: string;
}

export const WeightComparison: React.FC<ComparisonProps> = ({ actual, ideal, labelActual, labelIdeal }) => {
  const max = Math.max(actual, ideal) * 1.1; // 10% buffer
  
  return (
    <div className="flex items-end justify-center gap-8 h-32 pt-4">
      <div className="flex flex-col items-center gap-2 w-16 group">
        <span className="text-xs font-bold text-gray-500">{actual}kg</span>
        <div 
           className="w-full bg-gray-400 rounded-t-md transition-all duration-500 group-hover:bg-gray-500"
           style={{ height: `${(actual / max) * 100}%` }}
        ></div>
        <span className="text-[10px] text-center text-gray-400 leading-tight">{labelActual}</span>
      </div>
      
      <div className="flex flex-col items-center gap-2 w-16 group">
        <span className="text-xs font-bold text-[var(--color-primary)]">{ideal}kg</span>
        <div 
           className="w-full bg-[var(--color-primary)] rounded-t-md transition-all duration-500 group-hover:bg-[var(--color-primary-dark)]"
           style={{ height: `${(ideal / max) * 100}%` }}
        ></div>
        <span className="text-[10px] text-center text-[var(--color-primary-dark)] leading-tight">{labelIdeal}</span>
      </div>
    </div>
  );
};
