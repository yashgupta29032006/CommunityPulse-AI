import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, LogOut, Sun, Moon, Sparkles, UserCheck } from 'lucide-react';
import { UserPersona, UserLocation } from '../types';

interface DashboardHeaderProps {
  currentPersona: UserPersona;
  onChangePersona: (persona: UserPersona) => void;
  activeAlertsCount: number;
  onExit: () => void;
  location: UserLocation;
}

export default function DashboardHeader({
  currentPersona,
  onChangePersona,
  activeAlertsCount,
  onExit,
  location
}: DashboardHeaderProps) {
  const [time, setTime] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Local browser clock
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme management
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  };

  const getPersonaLabel = (p: UserPersona) => {
    const city = location?.city || 'Local';
    switch (p) {
      case 'admin': return 'City Administrator';
      case 'ngo': return 'NGO Coordinator';
      case 'citizen': return `${city} Resident`;
    }
  };

  const getPersonaColor = (p: UserPersona) => {
    switch (p) {
      case 'admin': return 'border-purple-500/30 text-purple-400 bg-purple-950/20';
      case 'ngo': return 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20';
      case 'citizen': return 'border-blue-500/30 text-blue-400 bg-blue-950/20';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-lg shadow-md flex items-center justify-center">
              <Activity className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                CommunityPulse
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/30">AI</span>
              </h1>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider">DECISION INTELLIGENCE PLATFORM</p>
            </div>
          </div>
          <button 
            onClick={onExit}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Clock & Alert status */}
        <div className="flex items-center gap-3 sm:gap-6 text-sm flex-wrap justify-center">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-widest uppercase">LOCAL {time}</span>
          </div>

          {activeAlertsCount > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 font-medium text-xs">
              <ShieldAlert className="h-4 w-4 animate-bounce" />
              <span>{activeAlertsCount} Active Incidents</span>
            </div>
          )}
        </div>

        {/* Theme, Persona select, Logout */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Persona selector pill */}
          <div className="flex items-center gap-1 sm:gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className={`px-2 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 ${getPersonaColor(currentPersona)}`}>
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{getPersonaLabel(currentPersona)}</span>
            </div>
            
            <select
              value={currentPersona}
              onChange={(e) => onChangePersona(e.target.value as UserPersona)}
              className="bg-transparent border-0 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:ring-0 focus:outline-none pr-7 py-1 cursor-pointer max-w-[120px] xs:max-w-[140px] sm:max-w-none truncate"
            >
              <option value="citizen">{location?.city || 'Local'} Resident</option>
              <option value="ngo">NGO Coordinator</option>
              <option value="admin">City Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggler */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors flex items-center justify-center min-h-[38px] min-w-[38px]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
            </button>

            {/* Back to landing */}
            <button
              onClick={onExit}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors min-h-[38px]"
            >
              <LogOut className="h-4 w-4" />
              Exit
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
