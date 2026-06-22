import React from 'react';
import { ShieldAlert, Bot, TrendingUp, Map, Users, HeartHandshake, Building, ArrowRight, Activity } from 'lucide-react';
import { UserPersona } from '../types';

interface LandingPageProps {
  onEnter: (persona: UserPersona) => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#fafafa] overflow-hidden flex flex-col justify-between">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-zinc-800/40 bg-zinc-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-lg shadow-lg shadow-blue-500/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-black" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              CommunityPulse
            </span>
            <span className="text-xs ml-1 font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">AI</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 font-mono">v1.0.0-APAC</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-md border border-zinc-800/50 hover:bg-zinc-900/40"
          >
            Docs
          </a>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex-grow flex flex-col justify-center gap-16">
        {/* Pitch Headline */}
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-6">
          <div className="inline-flex items-center gap-1.5 mx-auto bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-300 backdrop-blur-sm">
            <Bot className="h-3.5 w-3.5" />
            Empowering Singapore with Generative Decision Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Predictive Analytics &amp; <br />
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              AI Decision Copilot
            </span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 font-normal leading-relaxed">
            CommunityPulse AI processes real-time pollution metrics, weather fluctuations, traffic flows, healthcare demand, and citizen complaints to generate transparent, actionable decisions for communities.
          </p>
        </div>

        {/* Persona Selectors */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-center mb-2">
            Select Your Role to Enter the Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
            {/* Citizen Persona */}
            <div 
              onClick={() => onEnter('citizen')}
              className="group relative cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="h-24 w-24 text-blue-500" />
              </div>
              <div className="p-3 bg-blue-950/50 border border-blue-900/30 rounded-xl w-fit mb-5 text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-1.5">
                Citizen Portal
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Explore local environmental trends, view current health and weather advisories, query PulseCopilot in natural language, and view active alerts.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                Explore Public Insights &rarr;
              </div>
            </div>

            {/* NGO Persona */}
            <div 
              onClick={() => onEnter('ngo')}
              className="group relative cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <HeartHandshake className="h-24 w-24 text-emerald-500" />
              </div>
              <div className="p-3 bg-emerald-950/50 border border-emerald-900/30 rounded-xl w-fit mb-5 text-emerald-400 group-hover:scale-110 transition-transform">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-1.5">
                NGO / Community Organizer
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Monitor vulnerable elderly sectors, trace respiratory risks, access deep forecasting overlays, and download curated daily situation reports.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                Access Vulnerability Indexes &rarr;
              </div>
            </div>

            {/* City Admin Persona */}
            <div 
              onClick={() => onEnter('admin')}
              className="group relative cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Building className="h-24 w-24 text-purple-500" />
              </div>
              <div className="p-3 bg-purple-950/50 border border-purple-900/30 rounded-xl w-fit mb-5 text-purple-400 group-hover:scale-110 transition-transform">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-1.5">
                City Administrator
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Full dashboard control. Monitor critical environmental triggers, allocate public utility resources (cooling shelters, air scrubbers), and manage alerts.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                Command Resource Hub &rarr;
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-zinc-800/50 pt-10">
          <div className="flex gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 h-fit">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Gemini Decision Copilot</h4>
              <p className="text-xs text-zinc-400 mt-1">Multi-turn grounded conversational reasoning.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 h-fit">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Predictive Forecasting</h4>
              <p className="text-xs text-zinc-400 mt-1">7-day outlook for AQI, heat indices, and transit congestion.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 h-fit">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">GIS Geo-spatial Map</h4>
              <p className="text-xs text-zinc-400 mt-1">Real-time localized map circles showing risk hotspots.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 h-fit">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Explainable AI Alerts</h4>
              <p className="text-xs text-zinc-400 mt-1">Transparent data triggers for every recommendation.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-zinc-800/40 text-center text-xs text-zinc-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <span>© 2026 CommunityPulse AI. Google Gen AI APAC Challenge Submission.</span>
        <span className="font-mono">Adaptive Urban Sustainability Engine</span>
      </footer>
    </div>
  );
}
