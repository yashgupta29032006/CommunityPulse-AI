import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, PlusCircle, HelpCircle, Activity, Play } from 'lucide-react';
import { Alert, Recommendation, UserPersona } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
  recommendations: Recommendation[];
  persona: UserPersona;
  onExecuteAction: (regionId: string, actionTitle: string) => void;
}

export default function AlertsPanel({
  alerts,
  recommendations,
  persona,
  onExecuteAction
}: AlertsPanelProps) {
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());

  const handleExecute = (recId: string, regionId: string, title: string) => {
    setExecutingId(recId);
    setTimeout(() => {
      onExecuteAction(regionId, title);
      setExecutingId(null);
      setExecutedIds(prev => {
        const next = new Set(prev);
        next.add(recId);
        return next;
      });
    }, 1200); // 1.2s delay to simulate cloud orchestration
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      
      {/* LEFT: Active Anomalies / Alerts */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors min-h-[300px]">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
            Active Anomalies &amp; Alerts
          </h3>
          
          <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`border rounded-lg p-3 flex flex-col gap-1.5 text-xs ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="capitalize">{alert.regionName} ({alert.type})</span>
                    <span className="text-[10px] opacity-75 font-mono">{alert.severity.toUpperCase()}</span>
                  </div>
                  <p className="leading-relaxed opacity-90">{alert.message}</p>
                  <div className="mt-1 text-[10px] font-semibold flex items-center gap-1 border-t border-current/10 pt-1.5">
                    <span className="uppercase opacity-75">Suggestion:</span>
                    <span className="italic">{alert.suggestedAction}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500 font-mono text-xs gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                All environmental metrics are within safe boundaries.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: AI Generated Recommendations */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors min-h-[300px]">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-3">
            <Activity className="h-4.5 w-4.5 text-emerald-500" />
            AI Decision Recommendations
          </h3>

          <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto pr-1">
            {recommendations.map((rec) => {
              const isExecuted = executedIds.has(rec.id);
              const isExecuting = executingId === rec.id;

              return (
                <div 
                  key={rec.id} 
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 bg-zinc-50 dark:bg-zinc-950/20 text-xs flex flex-col gap-2.5 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-zinc-950 dark:text-zinc-100">{rec.title}</h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">Region: {rec.regionName}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] border border-emerald-800/30 font-bold font-mono">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </span>
                      <span className={`text-[8px] font-bold uppercase font-mono mt-1 ${
                        rec.priority === 'high' ? 'text-rose-500' : rec.priority === 'medium' ? 'text-amber-500' : 'text-zinc-500'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                  </div>

                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{rec.description}</p>
                  
                  {/* Reasoning list */}
                  <div className="bg-zinc-100 dark:bg-zinc-900/40 p-2.5 rounded border border-zinc-200 dark:border-zinc-850">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block mb-1">AI Rationale:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {rec.reasoning.map((reason, idx) => (
                        <li key={idx} className="leading-snug">{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions list */}
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-0.5">Recommended Tasks:</span>
                    {rec.actions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                        <CheckCircle className="h-3.5 w-3.5 text-zinc-400/50 dark:text-zinc-800 flex-shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>

                  {/* Execute button for City Admin only */}
                  {persona === 'admin' && (
                    <button
                      onClick={() => handleExecute(rec.id, rec.regionId, rec.title)}
                      disabled={isExecuted || isExecuting}
                      className={`mt-2 py-2.5 px-4 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm min-h-[40px] w-full sm:w-auto ${
                        isExecuted 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed'
                          : isExecuting
                          ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800 cursor-wait'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-black border-emerald-400 font-extrabold active:scale-95'
                      }`}
                    >
                      {isExecuted ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Protocol Executed
                        </>
                      ) : isExecuting ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                          Orchestrating...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-black" />
                          Execute Decision Protocol
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
