import React, { useState } from 'react';
import { Settings, Shield, CreditCard, Mail, Bell, Palette, Save, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'payment' | 'email' | 'security' | 'notifications'>('general');
  const [isSaved, setIsSaved] = useState(false);

  // Mock Form States
  const [siteName, setSiteName] = useState('ChitroKatha - বাংলা ও বিশ্ব সিনেমা');
  const [siteDescription, setSiteDescription] = useState('Bilingual Bangla & English movie streaming and cinema discovery platform.');
  const [supportEmail, setSupportEmail] = useState('support@chitrokatha.com');
  const [bkashMerchant, setBkashMerchant] = useState('017XXXXXXXX');
  const [nagadMerchant, setNagadMerchant] = useState('018XXXXXXXX');
  const [primaryColor, setPrimaryColor] = useState('#e11d48');
  const [accentColor, setAccentColor] = useState('#f59e0b');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Platform Settings & Configurations
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Global controls for brand appearance, manual payment numbers, and security policies.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully (Local Mock)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
        {[
          { id: 'general', label: 'General', icon: <Settings className="w-3.5 h-3.5" /> },
          { id: 'branding', label: 'Branding', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'payment', label: 'Payment Numbers', icon: <CreditCard className="w-3.5 h-3.5" /> },
          { id: 'email', label: 'Email Gateway', icon: <Mail className="w-3.5 h-3.5" /> },
          { id: 'security', label: 'Security & Access', icon: <Shield className="w-3.5 h-3.5" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="w-3.5 h-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab.id
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-6 backdrop-blur-md max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Tagline & Meta Description
                </label>
                <textarea
                  rows={3}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Primary Accent (Pink/Red)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Secondary Accent (Gold/Amber)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                ChitroKatha uses a dark cinematic theme with tailored Tailwind tokens.
              </p>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  bKash Merchant / Personal Wallet Number
                </label>
                <input
                  type="text"
                  value={bkashMerchant}
                  onChange={(e) => setBkashMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nagad Merchant / Personal Wallet Number
                </label>
                <input
                  type="text"
                  value={nagadMerchant}
                  onChange={(e) => setNagadMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                Note: In Phase 1, payment details and numbers are presented in the subscriber modal as mock instructions. Real automated payment gateways will be integrated in Phase 2.
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  SMTP Host (Placeholder)
                </label>
                <input
                  type="text"
                  defaultValue="smtp.mailgun.org"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Sender From Address
                </label>
                <input
                  type="email"
                  defaultValue="noreply@chitrokatha.com"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Require 2FA for Admin Team</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Enforces authenticator app code on login
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-rose-600 bg-black/40 border-white/20"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Concurrent Device Restrictions</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Limit simultaneous VIP streaming sessions based on plan limits
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-rose-600 bg-black/40 border-white/20"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Email on New Pending Payment</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Alert finance team when subscriber submits TrxID
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-rose-600 bg-black/40 border-white/20"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
