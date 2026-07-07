import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, Send, Loader2, Bot, User, Activity, ShieldAlert, Package, BedDouble, Users } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const QUICK_QUESTIONS = [
  { icon: ShieldAlert, text: 'Which facilities need intervention?', color: 'text-red-400' },
  { icon: Package, text: 'Which medicines are critically low?', color: 'text-orange-400' },
  { icon: BedDouble, text: 'What is the current bed availability?', color: 'text-primary-400' },
  { icon: Users, text: 'How many doctors are present today?', color: 'text-blue-400' },
];

export default function GlobalAIAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🏥 Nexa Care AI Assistant here!\n\nI can help you with:\n• Current stock & medicine levels\n• Bed availability across wards\n• Doctor attendance status\n• Flagged/underperforming facilities\n• AI demand forecasts\n\nWhat would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { hospitalId, getDoctors, getInventory, getAdminDashboard, getPHCDashboard, user } = useSmartHealth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, loading]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let contextData = '';

      if (user?.role === 'District_Admin') {
        try {
          const adminData = await getAdminDashboard();
          const hospitals = adminData?.hospitals || [];
          const flagged = hospitals.filter(h =>
            (h.recent_attendance_rate ?? 100) < 50 ||
            h.low_stock_count > 3 ||
            (h.occupancy_rate ?? 0) > 90 ||
            h.alert_count > 2
          );

          contextData = `DISTRICT OVERVIEW:
Total Hospitals: ${adminData?.overview?.total_hospitals}
Total Beds: ${adminData?.overview?.total_beds} (${adminData?.overview?.Occupied || 0} occupied)
Active Patients: ${adminData?.overview?.total_patients}
Active Alerts: ${adminData?.overview?.active_alerts}
Critical Stock Items: ${adminData?.overview?.critical_stock_items}

HOSPITALS STATUS:
${hospitals.map(h => `- ${h.name} (${h.type}): ${h.available_beds} beds free, ${h.low_stock_count} low stock, occupancy ${h.occupancy_rate}%, alerts: ${h.alert_count}`).join('\n')}

FLAGGED FACILITIES (Need Intervention):
${flagged.length === 0
  ? 'None — all facilities performing well.'
  : flagged.map(h => `⚠️ ${h.name}: ${[
      (h.recent_attendance_rate ?? 100) < 50 ? `Low attendance (${h.recent_attendance_rate}%)` : '',
      h.low_stock_count > 3 ? `${h.low_stock_count} low stock items` : '',
      (h.occupancy_rate ?? 0) > 90 ? `Overcrowded (${h.occupancy_rate}%)` : '',
      h.alert_count > 2 ? `${h.alert_count} unresolved alerts` : '',
    ].filter(Boolean).join(', ')}`).join('\n')}

REDISTRIBUTION RECOMMENDATIONS:
${(adminData?.redistribution || []).slice(0, 3).map(r => `- Transfer ${r.quantity} ${r.item_name} from ${r.from_hospital} to ${r.to_hospital}`).join('\n') || 'None currently.'}`;
        } catch (e) {
          contextData = 'District data currently unavailable.';
        }
      } else if (hospitalId) {
        try {
          const [doctors, dashData] = await Promise.all([
            getDoctors(hospitalId),
            getPHCDashboard ? getPHCDashboard(hospitalId) : Promise.resolve(null),
          ]);
          const presentDoctors = doctors.filter(d => d.today_status === 'Present');
          const inventory = dashData?.inventory || await getInventory(hospitalId) || [];
          const critical = inventory.filter(i => (i.current_stock || 0) <= (i.minimum_threshold || 0));
          const low = inventory.filter(i =>
            (i.current_stock || 0) <= (i.minimum_threshold || 0) * 1.5 &&
            (i.current_stock || 0) > (i.minimum_threshold || 0)
          );

          contextData = `HOSPITAL: ${dashData?.hospital?.name || 'Current Hospital'}
Type: ${dashData?.hospital?.type || user?.hospital_type || 'PHC/CHC'}

BEDS: ${dashData?.bed_summary?.available ?? '?'} available / ${dashData?.bed_summary?.total ?? '?'} total
PATIENTS: ${dashData?.patients?.length ?? '?'} currently admitted

DOCTORS TODAY (${presentDoctors.length}/${doctors.length} present):
${presentDoctors.map(d => `✅ ${d.name} (${d.specialization})`).join('\n') || 'None currently marked present'}

CRITICAL STOCK (urgent restock needed):
${critical.map(i => `❌ ${i.item_name || i.medicine_name}: ${i.current_stock} units (min: ${i.minimum_threshold})`).join('\n') || 'None'}

LOW STOCK:
${low.map(i => `⚠️ ${i.item_name || i.medicine_name}: ${i.current_stock} units`).join('\n') || 'None'}

ACTIVE ALERTS: ${(dashData?.alerts || []).filter(a => !a.is_resolved).length || 0}`;
        } catch (e) {
          contextData = 'Hospital data currently unavailable.';
        }
      } else {
        contextData = 'No hospital context. User may not be logged in.';
      }

      const systemPrompt = `You are Nexa Care AI — an intelligent assistant for a rural healthcare management platform in Maharashtra, India.
You help PHC/CHC staff and district administrators monitor real-time health facility data.

CURRENT REAL-TIME DATA:
${contextData}

User Role: ${user?.role || 'Staff'}

Instructions:
- Answer concisely and clearly based ONLY on the data provided above
- If asked about flagged or underperforming facilities, use the flagged list
- If asked about stock, refer to critical/low stock sections
- Suggest actionable next steps when relevant
- Do NOT use markdown code blocks
- Keep responses under 200 words`;

      const chatHistory = messages.slice(-4).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const fullPrompt = `${systemPrompt}\n\nRecent Chat:\n${chatHistory}\n\nUser: ${userMessage}\nAssistant:`;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text.trim() }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Connection error. Please check the backend server is running and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => { e.preventDefault(); sendMessage(input); };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? 50 : 0, scale: isOpen ? 0.8 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-800/90 backdrop-blur-md border border-primary-500/40 text-white px-4 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-shadow ${isOpen ? 'pointer-events-none' : ''}`}
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-primary-400"
          />
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-emerald-500 flex items-center justify-center relative z-10">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Global AI Agent</span>
          <span className="text-[10px] text-slate-300 tracking-wider uppercase">Click to Chat</span>
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 z-[60] w-[420px] max-w-[calc(100vw-3rem)] h-[580px] max-h-[calc(100vh-6rem)] glass-card border-primary-500/30 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.15)] bg-[#040d21]/95"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 p-[2px]">
                  <div className="w-full h-full bg-[#040d21] rounded-full flex items-center justify-center relative overflow-hidden">
                    <motion.div
                      animate={{ y: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/20 to-transparent"
                    />
                    <BrainCircuit className="w-5 h-5 text-primary-400 relative z-10" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Nexa AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Online & Monitoring
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-1 border ${
                    msg.role === 'user'
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                      : 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'glass-card-sm border-white/10 text-white/90 rounded-tl-sm'
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-[85%] self-start">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mt-1 text-primary-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="glass-card-sm border-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0.15 }} className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions (show only on first open) */}
            {messages.length <= 1 && !loading && (
              <div className="px-3 pb-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 pl-1">Quick Questions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                    >
                      <q.icon className={`w-3.5 h-3.5 flex-shrink-0 ${q.color}`} />
                      <span className="text-[11px] text-white/70 group-hover:text-white transition-colors leading-tight">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white/5 border-t border-white/10">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about stock, beds, doctors..."
                  className="w-full bg-black/40 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-white/30 flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3" /> Powered by Gemini AI • Real-time data
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
