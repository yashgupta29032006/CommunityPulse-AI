import React, { useState } from 'react';
import { FileText, Download, Check, HelpCircle, X, Sparkles } from 'lucide-react';
import { RegionData, Alert, Recommendation } from '../types';

interface ReportGeneratorProps {
  regions: RegionData[];
  alerts: Alert[];
  recommendations: Recommendation[];
}

export default function ReportGenerator({ regions, alerts, recommendations }: ReportGeneratorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [reportTitle, setReportTitle] = useState('Singapore Daily Situation Executive Brief');
  const [sections, setSections] = useState({
    summary: true,
    regionalData: true,
    alerts: true,
    decisions: true
  });

  const handlePrint = () => {
    // Hide dashboard elements momentarily and trigger print window
    window.print();
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 transition-colors mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-255 dark:border-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 h-fit">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              Automated Report Compiler
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/30">PDF Export</span>
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Compile situation briefs, forecast metrics, and recommended actions.</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowPreview(true)}
          className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-[#000000] font-extrabold rounded-lg px-4 py-2 text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
        >
          <Download className="h-4 w-4" />
          Compile &amp; Download PDF
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col justify-between overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Document Compiler &amp; Print Preview</span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selection Options & Settings */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/50 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Document Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Sections to Include</label>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={sections.summary} 
                      onChange={(e) => setSections({...sections, summary: e.target.checked})} 
                      className="rounded accent-blue-500"
                    />
                    Summary
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={sections.regionalData} 
                      onChange={(e) => setSections({...sections, regionalData: e.target.checked})}
                      className="rounded accent-blue-500"
                    />
                    Metrics Grid
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={sections.alerts} 
                      onChange={(e) => setSections({...sections, alerts: e.target.checked})}
                      className="rounded accent-blue-500"
                    />
                    Active Alerts
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={sections.decisions} 
                      onChange={(e) => setSections({...sections, decisions: e.target.checked})}
                      className="rounded accent-blue-500"
                    />
                    AI Recommendations
                  </label>
                </div>
              </div>
            </div>

            {/* Document Body (Printable Area) */}
            <div id="printable-report" className="flex-grow overflow-y-auto p-8 bg-white text-zinc-950 font-sans print:p-0 print:overflow-visible">
              <div className="max-w-[750px] mx-auto flex flex-col gap-6">
                
                {/* Printable Header */}
                <div className="border-b-4 border-zinc-900 pb-5 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">{reportTitle}</h1>
                    <p className="text-xs text-zinc-500 mt-1 font-mono uppercase">CONFIDENTIAL // Singapore Operations Management</p>
                  </div>
                  <div className="text-right text-xs text-zinc-500 font-mono">
                    <div>Date: {new Date().toLocaleDateString('en-SG', { dateStyle: 'medium' })}</div>
                    <div>Time: {new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>

                {/* Section 1: Executive Summary */}
                {sections.summary && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">I. Executive Situation Summary</h2>
                    <p className="text-xs text-zinc-650 leading-relaxed">
                      This operational brief compiles real-time sensing data across Singapore. Active hotspots include elevated particulate matter concentrations in the Western Industrial sector (Jurong) and high thermal indicators combined with aging demographics in the Northern residential sector (Woodlands). Eastern and Central sectors display stable baseline scores. Corrective action is ongoing.
                    </p>
                  </div>
                )}

                {/* Section 2: Regional Metrics Summary */}
                {sections.regionalData && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">II. Regional Telemetry</h2>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-zinc-800 bg-zinc-50">
                          <th className="py-2 px-1">Region</th>
                          <th className="py-2 px-1 text-center">AQI</th>
                          <th className="py-2 px-1 text-center">Temp (°C)</th>
                          <th className="py-2 px-1 text-center">Traffic (%)</th>
                          <th className="py-2 px-1 text-center">Health (%)</th>
                          <th className="py-2 px-1 text-center">Complaints</th>
                          <th className="py-2 px-1 text-right">Risk Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regions.map((r) => (
                          <tr key={r.id} className="border-b border-zinc-200">
                            <td className="py-2 px-1 font-semibold">{r.name}</td>
                            <td className="py-2 px-1 text-center font-mono">{r.aqi}</td>
                            <td className="py-2 px-1 text-center font-mono">{r.temperature.toFixed(1)}</td>
                            <td className="py-2 px-1 text-center font-mono">{r.trafficCongestion}%</td>
                            <td className="py-2 px-1 text-center font-mono">{r.healthcareDemand}%</td>
                            <td className="py-2 px-1 text-center font-mono">{r.complaintsCount}</td>
                            <td className="py-2 px-1 text-right font-mono font-bold capitalize">{r.riskLevel} ({r.riskScore})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section 3: Active Alerts */}
                {sections.alerts && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">III. Active Anomalies</h2>
                    <div className="flex flex-col gap-2">
                      {alerts.length > 0 ? (
                        alerts.map((a) => (
                          <div key={a.id} className="border border-zinc-300 rounded p-2.5 text-xs bg-zinc-50/50">
                            <div className="flex justify-between font-bold text-zinc-800">
                              <span>{a.regionName} - {a.type.toUpperCase()}</span>
                              <span className="uppercase text-[9px] px-1 bg-zinc-200 rounded">{a.severity}</span>
                            </div>
                            <p className="text-zinc-600 mt-1 text-[11px]">{a.message}</p>
                            <p className="text-[10px] text-zinc-500 italic mt-1">Recommended Response: {a.suggestedAction}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No critical anomalies logged in this reporting cycle.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 4: AI Decision Recommendations */}
                {sections.decisions && (
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-2">IV. AI Grounded Action Protocols</h2>
                    <div className="flex flex-col gap-3">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border border-zinc-200 rounded p-2.5 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{rec.title}</span>
                            <span className="font-mono text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded">Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-zinc-650 mt-1 text-[11px]">{rec.description}</p>
                          <div className="mt-2 text-[10px] text-zinc-500">
                            <span className="font-bold">Rationale:</span> {rec.reasoning.join(' ')}
                          </div>
                          <div className="mt-1 text-[10px] text-zinc-500">
                            <span className="font-bold">Proposed Tasks:</span> {rec.actions.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer notes */}
                <div className="border-t border-zinc-400 mt-8 pt-4 text-center text-[10px] text-zinc-500 font-mono">
                  Report generated automatically by CommunityPulse Decision Intelligence Engine.
                  <br />
                  NEA Sensors and LTA Transit Data grounded.
                </div>

              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-950/20">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold"
              >
                Close Preview
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold shadow-sm flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                Print / Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS to handle printing of the printable area only */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

    </div>
  );
}
