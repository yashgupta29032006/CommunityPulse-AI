'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, HelpCircle } from 'lucide-react';
import { RegionData } from '../types';

interface AnalyticsChartsProps {
  region: RegionData;
}

export default function AnalyticsCharts({ region }: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'environmental' | 'mobility' | 'complaints'>('environmental');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[380px] bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-zinc-500">
        Loading Analytics Engine...
      </div>
    );
  }

  // Pre-process complaint categories for chart representation
  const complaintsByCategory = region.complaintsList.reduce((acc, comp) => {
    acc[comp.category] = (acc[comp.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryNames = {
    pollution: 'Pollution/Odor',
    traffic: 'Traffic Congestion',
    health: 'Health Surge',
    infrastructure: 'Public Infrastructure',
    other: 'General Utilities'
  };

  const complaintChartData = Object.keys(categoryNames).map(cat => ({
    name: categoryNames[cat as keyof typeof categoryNames],
    value: complaintsByCategory[cat] || 0,
    rawKey: cat
  })).filter(c => c.value > 0);

  // Standard Colors
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];
  const CATEGORY_COLORS: Record<string, string> = {
    pollution: '#ef4444',     // Red
    traffic: '#3b82f6',       // Blue
    health: '#f59e0b',        // Amber
    infrastructure: '#10b981', // Green
    other: '#8b5cf6'          // Purple
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 transition-colors flex flex-col justify-between h-full">
      
      {/* Chart controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-5">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-blue-500" />
            24h Historical Timeline &amp; Trends
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Historical trend charts for {region.name}.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('environmental')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'environmental'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Environment
          </button>
          <button
            onClick={() => setActiveTab('mobility')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'mobility'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Mobility &amp; Health
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'complaints'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            Public Reports
          </button>
        </div>
      </div>

      {/* Render selected chart */}
      <div className="flex-grow h-[280px] w-full">
        {activeTab === 'environmental' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={region.metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.15} />
              <XAxis dataKey="timestamp" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                labelStyle={{ fontSize: '10px', color: '#71717a' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Area name="AQI Level" type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
              <Area name="Temperature (°C)" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'mobility' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={region.metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.15} />
              <XAxis dataKey="timestamp" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                labelStyle={{ fontSize: '10px', color: '#71717a' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Area name="Transit Congestion (%)" type="monotone" dataKey="traffic" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" />
              <Area name="Healthcare Demand (%)" type="monotone" dataKey="health" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'complaints' && (
          complaintChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.15} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ fontSize: '10px', color: '#71717a' }}
                />
                <Bar dataKey="value" name="Unresolved Cases" radius={[4, 4, 0, 0]}>
                  {complaintChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.rawKey] || '#8b5cf6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-xs gap-2">
              <HelpCircle className="h-8 w-8 text-zinc-650" />
              No active citizen complaints logged for {region.name} today.
            </div>
          )
        )}
      </div>
    </div>
  );
}
