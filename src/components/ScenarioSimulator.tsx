'use client';

import React, { useState } from 'react';
import { Brain, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle, Info, Sparkles } from 'lucide-react';
import { RegionData, UserLocation } from '../types';

interface ScenarioSimulatorProps {
  currentLocation: UserLocation;
  currentRegion: RegionData;
}

interface SimulationResult {
  simulatedRiskScore: number;
  impactAnalysis: string;
  mitigationActions: string[];
  assumptions: string[];
  dataSources: string[];
  confidenceScore: number;
}

export default function ScenarioSimulator({ currentLocation, currentRegion }: ScenarioSimulatorProps) {
  const [parameter, setParameter] = useState<'aqi' | 'temperature' | 'traffic' | 'resources'>('aqi');
  const [simValue, setSimValue] = useState<number>(180);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Set default values when switching parameter
  const handleParameterChange = (param: 'aqi' | 'temperature' | 'traffic' | 'resources') => {
    setParameter(param);
    if (param === 'aqi') setSimValue(180);
    else if (param === 'temperature') setSimValue(42);
    else if (param === 'traffic') setSimValue(85);
    else setSimValue(1);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameter,
          value: simValue,
          currentLocation,
          currentMetrics: [currentRegion]
        })
      });

      if (!response.ok) throw new Error('Simulation failed');
      const data = await response.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSliderMinMax = () => {
    switch (parameter) {
      case 'aqi': return { min: 0, max: 300, step: 5, unit: 'AQI' };
      case 'temperature': return { min: 15, max: 55, step: 0.5, unit: '°C' };
      case 'traffic': return { min: 0, max: 100, step: 5, unit: '%' };
      case 'resources': return { min: 0, max: 10, step: 1, unit: 'units' };
    }
  };

  const getParameterLabel = () => {
    switch (parameter) {
      case 'aqi': return 'Air Quality Index';
      case 'temperature': return 'Sensed Temperature';
      case 'traffic': return 'Traffic Congestion';
      case 'resources': return 'Emergency Resources Deployed';
    }
  };

  const sliderProps = getSliderMinMax();

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 transition-colors mb-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
          <Brain className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            AI What-If Simulation Laboratory
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 px-1 py-0.5 rounded border border-purple-200 dark:border-purple-800/30">Predictive Engine</span>
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Model hypothetical environmental anomalies in {currentRegion.name} to simulate downstream municipal stress.</p>
        </div>
      </div>

      {/* Simulator Inputs & Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Settings panel */}
        <div className="md:col-span-1 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Simulate Parameter</label>
            <select
              value={parameter}
              onChange={(e) => handleParameterChange(e.target.value as any)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none min-h-[38px]"
            >
              <option value="aqi">Air Quality Index (AQI)</option>
              <option value="temperature">Extreme Temperature</option>
              <option value="traffic">Traffic Congestion (%)</option>
              <option value="resources">Asset Resource Cutbacks</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Hypothetical Value</label>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">{simValue} {sliderProps.unit}</span>
            </div>
            <input
              type="range"
              min={sliderProps.min}
              max={sliderProps.max}
              step={sliderProps.step}
              value={simValue}
              onChange={(e) => setSimValue(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-1">
              <span>{sliderProps.min} {sliderProps.unit}</span>
              <span>{sliderProps.max} {sliderProps.unit}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="flex-grow px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm min-h-[40px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Running AI Models...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Run AI Simulation
                </>
              )}
            </button>
            {result && (
              <button
                onClick={() => setResult(null)}
                className="px-3 py-2.5 border border-zinc-250 dark:border-zinc-800 text-zinc-500 rounded-lg text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 min-h-[40px]"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results panel */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {!result ? (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center text-xs text-zinc-500 font-mono gap-2.5 min-h-[220px]">
              <Info className="h-8 w-8 text-zinc-400" />
              <div>
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Simulator Idle</p>
                <p className="text-[10px] text-zinc-450 mt-1 max-w-sm leading-relaxed">Select an environmental parameter, drag the slider to input a hypothetical value, and trigger the predictive models to view projected impacts.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Scenario Warning Disclaimer Banner */}
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold block uppercase tracking-wider text-[10px]">Scenario Simulation — Not Current Reality</span>
                  <p className="text-[11px] opacity-90 mt-0.5">This represents a hypothetical AI projection based on speculative inputs and is meant for mitigation preparedness audits, not current operational conditions.</p>
                </div>
              </div>

              {/* Simulation comparative dials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Score comparison card */}
                <div className="border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl flex items-center justify-between bg-zinc-50/20 dark:bg-zinc-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Overall Risk Score</span>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-zinc-400 dark:text-zinc-500 line-through text-lg font-bold font-mono">{currentRegion.riskScore}</span>
                      <span className="text-2xl font-extrabold text-purple-500 font-mono">→ {result.simulatedRiskScore}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">Calculated under hypothetical {getParameterLabel()} of {simValue}</span>
                  </div>
                  <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center text-xs font-mono font-bold ${
                    result.simulatedRiskScore > 70 
                      ? 'border-rose-500/20 text-rose-500' 
                      : result.simulatedRiskScore > 40 
                      ? 'border-amber-500/20 text-amber-500' 
                      : 'border-emerald-500/20 text-emerald-500'
                  }`}>
                    {result.simulatedRiskScore}
                  </div>
                </div>

                {/* Score meta information */}
                <div className="border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl flex flex-col justify-between bg-zinc-50/20 dark:bg-zinc-900/10 text-xs text-zinc-500 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Sim Confidence:</span>
                    <span className="font-bold text-emerald-400">{(result.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span>Inputs Integrated:</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Live Feeds + Sim</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span>Source Scope:</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[130px]" title={result.dataSources?.join(', ')}>{result.dataSources?.[0] || 'Open-Meteo API'}</span>
                  </div>
                </div>

              </div>

              {/* Simulation AI Impact Narrative */}
              <div className="border border-zinc-200 dark:border-zinc-850 p-4.5 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/5">
                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 text-xs">
                  {result.impactAnalysis.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="font-bold text-sm text-zinc-950 dark:text-white mt-4 first:mt-0 mb-2">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('* ') || line.startsWith('- ')) {
                      return <li key={idx} className="list-disc ml-4 text-xs mt-1">{line.substring(2)}</li>;
                    }
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={idx} className="mt-1.5 first:mt-0 leading-relaxed text-xs">
                        {parts.map((part, pIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-semibold text-zinc-950 dark:text-white">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Mitigation Protocols */}
              {result.mitigationActions && result.mitigationActions.length > 0 && (
                <div className="border border-zinc-200 dark:border-zinc-850 p-4.5 rounded-xl bg-zinc-50/10 dark:bg-[#121217]/20 flex flex-col gap-2">
                  <span className="font-bold text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Recommended AI Mitigation Protocols</span>
                  {result.mitigationActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                      <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Assumptions */}
              {result.assumptions && result.assumptions.length > 0 && (
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900/30 rounded-lg border border-zinc-200 dark:border-zinc-850 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  <span className="font-bold block mb-1">PROJECTIONS ASSUMPTIONS:</span>
                  <ul className="list-decimal list-inside space-y-0.5">
                    {result.assumptions.map((assump, idx) => (
                      <li key={idx}>{assump}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
