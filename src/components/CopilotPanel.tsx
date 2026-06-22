'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, AlertCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { ChatMessage, RegionData, UserPersona } from '../types';

interface CopilotPanelProps {
  activeRegion: RegionData;
  persona: UserPersona;
}

export default function CopilotPanel({ activeRegion, persona }: CopilotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am **PulseCopilot**, Singapore's Decision Intelligence Assistant. I am grounded in real-time air quality indicators, traffic sensors, weather reports, and citizen complaints. 

How can I help you analyze trends or allocate resources today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Suggested questions based on persona and region
  const getSuggestions = () => {
    const rName = activeRegion.name.split(' ')[0];
    if (persona === 'admin') {
      return [
        `Assess emergency resources for ${rName}`,
        `What alerts are active in Singapore right now?`,
        `Summarize today's executive recommendations`
      ];
    } else if (persona === 'ngo') {
      return [
        `Which communities in ${rName} are vulnerable to heat?`,
        `Draft an air quality health report for ${rName}`,
        `Analyze citizen complaint sentiment`
      ];
    } else {
      return [
        `Is the air quality safe in ${rName} today?`,
        `What are the traffic conditions in Central Area?`,
        `Explain how risk scores are calculated`
      ];
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          regionId: activeRegion.id,
          persona: persona
        })
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        explainability: data.explainability
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      // Auto expand explainability for the latest response
      if (data.explainability) {
        setExpandedMessageId(assistantMsg.id);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an issue processing that query. Please make sure your network is connected and your Gemini API key is configured.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 flex flex-col h-[550px] transition-colors">
      
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            PulseCopilot AI
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grounding Active</span>
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Query Singapore's live data in natural language.</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-4 mb-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Bot Avatar */}
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed border transition-colors ${
                msg.role === 'user'
                  ? 'bg-zinc-900 border-zinc-800 text-white dark:bg-zinc-900 dark:border-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 dark:bg-[#121217]/50 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-250'
              }`}>
                {/* Basic Markdown rendering */}
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
                  {msg.content.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="font-bold text-sm text-zinc-950 dark:text-white mt-3 first:mt-0">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('* ') || line.startsWith('- ')) {
                      return <li key={idx} className="list-disc ml-4 text-xs">{line.substring(2)}</li>;
                    }
                    // Handle bold markdown
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={idx} className="text-xs">
                        {parts.map((part, pIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-semibold text-zinc-900 dark:text-white">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
                <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 text-right font-mono">
                  {msg.timestamp}
                </div>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}

            </div>

            {/* Explainability Accordion */}
            {msg.role === 'assistant' && msg.explainability && (
              <div className="ml-11 max-w-[85%] bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-lg p-2.5">
                <button
                  onClick={() => setExpandedMessageId(expandedMessageId === msg.id ? null : msg.id)}
                  className="flex items-center justify-between w-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 font-mono tracking-wider"
                >
                  <span className="flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-purple-400" />
                    EXPLAINABLE AI ENGINE LOGS
                  </span>
                  {expandedMessageId === msg.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {expandedMessageId === msg.id && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-900 flex flex-col gap-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-900/60 px-2 py-1 rounded">
                      <span>Reasoning Confidence:</span>
                      <span className="font-bold text-emerald-400">{(msg.explainability.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 block mb-0.5">INPUTS UTILIZED:</span>
                      <div className="flex flex-wrap gap-1">
                        {msg.explainability.inputsUsed.map((inp, idx) => (
                          <span key={idx} className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[9px] border border-zinc-200 dark:border-zinc-800">{inp}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 block mb-0.5">REASONING CHAIN:</span>
                      <ol className="list-decimal list-inside space-y-0.5 text-[9px]">
                        {msg.explainability.reasoningSteps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-900/40 p-2 rounded border border-zinc-200 dark:border-zinc-900 text-[9px]">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">GROUNDING DATA:</span> {msg.explainability.evidence}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center flex-shrink-0 animate-spin">
              <Loader className="h-4 w-4" />
            </div>
            <div className="bg-zinc-50 border border-zinc-200 dark:bg-[#121217]/50 dark:border-zinc-800/80 rounded-xl px-4 py-2 text-xs font-mono text-zinc-500">
              PulseCopilot is reasoning over retrieved Singapore context...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (Pills) */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {getSuggestions().map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              className="text-[9px] sm:text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border border-blue-100 dark:border-blue-900/20 px-2.5 py-1.5 rounded-full transition-colors truncate max-w-[90vw]"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask PulseCopilot about Singapore AQI, heat indices, transit delay or summaries..."
          className="flex-grow bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
}
