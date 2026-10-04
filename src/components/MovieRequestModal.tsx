import React, { useState } from 'react';
import { X, Film, CheckCircle2, Clock, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { MovieRequest } from '../types/user';

export const MovieRequestModal: React.FC = () => {
  const { isRequestModalOpen, setIsRequestModalOpen, submitMovieRequest, movieRequests, user, openLoginModal } = useAuth();
  const { language } = useLanguage();
  const { notifyRequestUpdate } = useNotifications();

  const [movieTitle, setMovieTitle] = useState('');
  const [category, setCategory] = useState<MovieRequest['category']>('cinema');
  const [releaseYear, setReleaseYear] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isRequestModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;

    submitMovieRequest(movieTitle, category, releaseYear, note);
    notifyRequestUpdate(movieTitle, 'reviewed');
    
    // Simulate approval notification after 12 seconds
    const titleRequested = movieTitle;
    setTimeout(() => {
      notifyRequestUpdate(titleRequested, 'uploaded', 'movie-toofan-2024');
    }, 12000);

    setMovieTitle('');
    setReleaseYear('');
    setNote('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsRequestModalOpen(false)} />

      <div className="relative z-10 w-full max-w-lg bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-800 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-cinzel">
                {language === 'bn' ? 'মুভি ও নাটক রিকোয়েস্ট' : 'Request Movie or Natok'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'আপনার পছন্দের চলচ্চিত্র ওয়েবসাইটে না পেলে অ্যাডমিনকে রিকোয়েস্ট দিন'
                  : 'Cannot find your title? Submit a request to admin'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRequestModalOpen(false)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {submitted && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>আপনার রিকোয়েস্ট অ্যাডমিনের কাছে জমা হয়েছে! খুব শীঘ্রই এটি যুক্ত করা হবে।</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              সিনেমা বা নাটকের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              placeholder="যেমন: মনপুরা / বড় ছেলে / ইন্টারস্টেলার"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">বিভাগ (Category)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MovieRequest['category'])}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="cinema">বাংলা সিনেমা</option>
                <option value="natok">বাংলা নাটক</option>
                <option value="series">ওয়েব সিরিজ</option>
                <option value="hollywood">হলিউড / বিশ্ব সিনেমা</option>
                <option value="other">অন্যান্য</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">মুক্তির সাল (অপশনাল)</label>
              <input
                type="text"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="যেমন: ২০২৪"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">বিশেষ কোনো নোট বা অভিনেতার নাম</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="পরিচালক বা মূল অভিনয়শিল্পী সম্পর্কে তথ্য..."
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 active:scale-98 flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>রিকোয়েস্ট সাবমিট করুন</span>
          </button>
        </form>

        {/* Previous Requests List */}
        {movieRequests.length > 0 && (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">
              সম্প্রতি জমা দেওয়া রিকোয়েস্টসমূহ ({movieRequests.length}):
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {movieRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{req.movieTitle}</p>
                    <span className="text-[10px] text-slate-400">
                      {req.category === 'natok' ? 'নাটক' : req.category === 'series' ? 'সিরিজ' : 'সিনেমা'} · {new Date(req.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>যাচাইকরণাধীন</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
