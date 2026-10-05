import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Crown,
  Calendar,
  Edit2,
  Check,
  Clock,
  ShieldCheck,
  Film,
  MessageSquare,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Link as LinkIcon,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface PresetAvatar {
  id: string;
  nameBn: string;
  nameEn: string;
  url: string;
  badge?: string;
}

const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'film-director',
    nameBn: 'চলচ্চিত্র নির্মাতা',
    nameEn: 'Film Director',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=FilmDirector&backgroundColor=b6e3f4',
    badge: 'DIRECTOR',
  },
  {
    id: 'cinephile-buff',
    nameBn: 'সিনেমাপ্রেমী',
    nameEn: 'Movie Buff',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MovieBuff&backgroundColor=ffd5dc',
    badge: 'BUFF',
  },
  {
    id: 'vip-gold',
    nameBn: 'ভিআইপি গোল্ড মেম্বার',
    nameEn: 'VIP Cinephile',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=VIPGold&backgroundColor=ffdfbf',
    badge: 'VIP',
  },
  {
    id: 'dhallywood-star',
    nameBn: 'ঢালিউড হিরো',
    nameEn: 'Cinema Hero',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=ShakibHero&backgroundColor=c0aede',
    badge: 'HERO',
  },
  {
    id: 'natok-artist',
    nameBn: 'নাট্যশিল্পী',
    nameEn: 'Natok Artist',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=NatokThespian&backgroundColor=d1d4f9',
    badge: 'DRAMA',
  },
  {
    id: 'mystery-detective',
    nameBn: 'থ্রিলার গোয়েন্দা',
    nameEn: 'Mystery Detective',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DetectiveByomkesh&backgroundColor=b6e3f4',
    badge: 'THRILLER',
  },
  {
    id: 'cyber-streamer',
    nameBn: 'সাই-ফাই রোবট',
    nameEn: 'Sci-Fi Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberStreamer&backgroundColor=c0aede',
    badge: 'SCI-FI',
  },
  {
    id: 'bengal-tiger',
    nameBn: 'রয়্যাল বেঙ্গল',
    nameEn: 'Bengal Tiger',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoyalTiger&backgroundColor=ffdfbf',
    badge: 'ROYAL',
  },
  {
    id: 'retro-classic',
    nameBn: 'রেট্রো ভিন্টেজ',
    nameEn: 'Retro Classic',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=RetroClassic&backgroundColor=ffd5dc',
    badge: 'RETRO',
  },
  {
    id: 'cinematographer',
    nameBn: 'ক্যামেরাম্যান',
    nameEn: 'Cameraman',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CameraCrew&backgroundColor=b6e3f4',
    badge: 'CAMERA',
  },
  {
    id: 'action-crusader',
    nameBn: 'অ্যাকশন ক্রুসেডার',
    nameEn: 'Action Star',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=ActionStarToofan&backgroundColor=d1d4f9',
    badge: 'ACTION',
  },
  {
    id: 'popcorn-lover',
    nameBn: 'পপকর্ন লাভার',
    nameEn: 'Popcorn Lover',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PopcornSnack&backgroundColor=ffdfbf',
    badge: 'POPCORN',
  },
];

interface CancellationReasonOption {
  id: string;
  labelBn: string;
  labelEn: string;
  isTemporary?: boolean;
}

const CANCELLATION_REASONS: CancellationReasonOption[] = [
  {
    id: 'price_too_high',
    labelBn: 'সাবস্ক্রিপশন ফি তুলনামূলক বেশি মনে হচ্ছে',
    labelEn: 'Subscription price is too high',
  },
  {
    id: 'missing_content',
    labelBn: 'আমার পছন্দের সিনেমা, নাটক বা সিরিজ খুঁজে পাচ্ছি না',
    labelEn: 'Cannot find my favorite movies or series',
  },
  {
    id: 'buffering_issues',
    labelBn: 'ভিডিও প্লেব্যাক বা বাফারিং সমস্যা হচ্ছে',
    labelEn: 'Experiencing video buffering or playback issues',
  },
  {
    id: 'busy_temporary',
    labelBn: 'কয়েকদিনের জন্য ব্যস্ত থাকব, দেখার সময় পাচ্ছি না',
    labelEn: 'Too busy to watch right now, need a short break',
    isTemporary: true,
  },
  {
    id: 'using_other_ott',
    labelBn: 'অন্যান্য ওটিটি প্ল্যাটফর্মে বেশি সময় কাটাচ্ছি',
    labelEn: 'Spending more time on other streaming apps',
  },
  {
    id: 'other',
    labelBn: 'অন্যান্য কারণ (বিস্তারিত লিখুন)',
    labelEn: 'Other reason (please describe)',
  },
];

export const UserProfileModal: React.FC = () => {
  const {
    user,
    isProfileModalOpen,
    setIsProfileModalOpen,
    updateUserProfile,
    cancelPendingSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    openSubscriptionModal,
    openSubscriptionStatusModal,
    openRequestModal,
    openSupportModal,
  } = useAuth();
  const { language } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [customUrl, setCustomUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Subscription Pause state (maximum 7 days)
  const [isPauseDrawerOpen, setIsPauseDrawerOpen] = useState(false);
  const [selectedPauseDays, setSelectedPauseDays] = useState<number>(7);
  const [pauseSuccessMsg, setPauseSuccessMsg] = useState<string | null>(null);

  // Subscription Cancel & Multi-Choice Exit Survey state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('busy_temporary');
  const [otherFeedback, setOtherFeedback] = useState<string>('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isProfileModalOpen || !user) return null;

  const isSubscribed = user.tier === 'vip' || user.tier === 'standard';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name, email, phone);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Select a preset avatar
  const handleSelectPreset = (url: string) => {
    updateUserProfile(name || user.name, email || user.email, phone || user.phone, url);
    setAvatarSuccess(true);
    setTimeout(() => setAvatarSuccess(false), 2200);
  };

  // Upload local picture from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setUploadError(
        language === 'bn'
          ? 'ছবির সাইজ ৩ মেগাবাইটের কম হতে হবে।'
          : 'Image size must be less than 3MB.'
      );
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateUserProfile(name || user.name, email || user.email, phone || user.phone, result);
        setAvatarSuccess(true);
        setIsAvatarPickerOpen(false);
        setTimeout(() => setAvatarSuccess(false), 2500);
      }
    };
    reader.onerror = () => {
      setUploadError(
        language === 'bn'
          ? 'ছবি লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to read image file. Please try again.'
      );
    };
    reader.readAsDataURL(file);
  };

  // Apply custom URL
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    updateUserProfile(name || user.name, email || user.email, phone || user.phone, customUrl.trim());
    setCustomUrl('');
    setAvatarSuccess(true);
    setIsAvatarPickerOpen(false);
    setTimeout(() => setAvatarSuccess(false), 2200);
  };

  // Generate random avatar with DiceBear
  const handleGenerateRandom = () => {
    const randomSeed = 'User_' + Math.random().toString(36).substring(2, 8);
    const generatedUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    updateUserProfile(name || user.name, email || user.email, phone || user.phone, generatedUrl);
    setAvatarSuccess(true);
    setTimeout(() => setAvatarSuccess(false), 2000);
  };

  // Confirm Pause Action (1 to 7 days)
  const handleConfirmPause = () => {
    pauseSubscription(selectedPauseDays);
    setIsPauseDrawerOpen(false);
    setPauseSuccessMsg(
      language === 'bn'
        ? `আপনার সাবস্ক্রিপশন আগামী ${selectedPauseDays} দিনের জন্য সফলভাবে পজ রাখা হয়েছে!`
        : `Your subscription has been paused for ${selectedPauseDays} days!`
    );
    setTimeout(() => setPauseSuccessMsg(null), 3500);
  };

  // Confirm Immediate Cancellation Action
  const handleConfirmCancellation = () => {
    const chosenOption = CANCELLATION_REASONS.find((r) => r.id === selectedReasonId);
    const fullReason =
      (chosenOption?.labelBn || selectedReasonId) +
      (otherFeedback.trim() ? ` (মন্তব্য: ${otherFeedback.trim()})` : '');

    cancelSubscription(fullReason);
    setIsCancelModalOpen(false);
    setCancelSuccessMsg(
      language === 'bn'
        ? 'আপনার সাবস্ক্রিপশন সাথে সাথে বাতিল ও মুছে ফেলা হয়েছে।'
        : 'Your subscription has been cancelled and removed immediately.'
    );
    setTimeout(() => setCancelSuccessMsg(null), 4000);
  };

  // Calculate remaining days for paused status
  const getRemainingPauseDays = () => {
    if (!user.pausedUntil) return 0;
    const diffMs = new Date(user.pausedUntil).getTime() - Date.now();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsProfileModalOpen(false)} />

      <div className="relative z-10 w-full max-w-xl bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-700 to-amber-500 flex items-center justify-center text-white font-cinzel font-bold text-base shadow-lg shadow-rose-950/40">
              চ
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-cinzel">
                {language === 'bn' ? 'আমার প্রোফাইল ও ইউজার তথ্য' : 'User Details & Profile'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'bn' ? 'আপনার ব্যক্তিগত তথ্য ও মেম্বারশিপ স্ট্যাটাস' : 'Manage your profile and subscription'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alerts */}
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{language === 'bn' ? 'তথ্য সফলভাবে আপডেট ও সেভ হয়েছে!' : 'Profile details updated successfully!'}</span>
          </div>
        )}

        {avatarSuccess && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{language === 'bn' ? 'প্রোফাইল অ্যাভাটার সফলভাবে আপডেট হয়েছে!' : 'Profile avatar updated successfully!'}</span>
          </div>
        )}

        {pauseSuccessMsg && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Pause className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{pauseSuccessMsg}</span>
          </div>
        )}

        {cancelSuccessMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Avatar & User ID Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="relative group shrink-0">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/15 group-hover:border-rose-500/70 shadow-xl transition-all duration-300">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-lg shadow-rose-950/80 ring-2 ring-[#0c0e16] transition-transform active:scale-90 cursor-pointer"
              title={language === 'bn' ? 'অ্যাভাটার পরিবর্তন করুন' : 'Change Avatar'}
              aria-label="Change Avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">{user.name}</h3>
              {user.isPaused ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                  <Pause className="w-3 h-3 text-amber-400" />
                  PAUSED
                </span>
              ) : user.tier === 'vip' ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  VIP MEMBER
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  FREE TIER
                </span>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {isAvatarPickerOpen
                    ? language === 'bn'
                      ? 'অ্যাভাটার বন্ধ করুন'
                      : 'Close Avatar Picker'
                    : language === 'bn'
                    ? 'অ্যাভাটার পরিবর্তন / ছবি আপলোড'
                    : 'Personalize Avatar'}
                </span>
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono">User ID: #{user.id.slice(-6)}</p>
            <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-3 h-3" />
              <span>যোগদান: {new Date(user.joinedAt).toLocaleDateString('bn-BD')}</span>
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? (language === 'bn' ? 'বাতিল' : 'Cancel') : (language === 'bn' ? 'এডিট করুন' : 'Edit Profile')}</span>
          </button>
        </div>

        {/* Interactive Avatar Customization Panel / Drawer */}
        {isAvatarPickerOpen && (
          <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-rose-500/30 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white font-cinzel">
                  {language === 'bn' ? 'অ্যাভাটার নির্বাচন বা ছবি আপলোড' : 'Choose Avatar or Upload Photo'}
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono flex items-center gap-1 border border-white/5 cursor-pointer"
                  title="Generate Random Avatar"
                >
                  <RefreshCw className="w-3 h-3 text-rose-400" />
                  <span>{language === 'bn' ? 'র‍্যান্ডম' : 'Random'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Local File Upload Box */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 rounded-xl border border-dashed border-rose-500/50 hover:border-rose-400 bg-rose-950/20 hover:bg-rose-950/30 flex items-center justify-center gap-2 text-rose-300 text-xs font-bold transition-all cursor-pointer group"
              >
                <Upload className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>
                  {language === 'bn'
                    ? 'ডিভাইস থেকে নিজের ছবি আপলোড করুন (Upload Image)'
                    : 'Upload photo from your device'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">(Max 3MB)</span>
              </button>
            </div>

            {/* Cinema & Culture Presets Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-cinzel">
                {language === 'bn' ? 'সিনেমা ক্যারেক্টার ও আইকন' : 'Cinema & Thespian Icons'}
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isCurrent = user.avatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`group relative p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-600/30 border-2 border-rose-500 shadow-lg shadow-rose-950/50 scale-105'
                          : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                        <img
                          src={preset.url}
                          alt={preset.nameBn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-rose-600/40 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] font-medium text-white truncate max-w-full font-cinzel">
                        {language === 'bn' ? preset.nameBn : preset.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Web Image URL Form */}
            <form onSubmit={handleApplyCustomUrl} className="pt-2 border-t border-white/10">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'bn' ? 'অথবা যেকোনো ইমেজ লিংক পেস্ট করুন:' : 'Or paste a direct image URL:'}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View / Edit Mode Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              {language === 'bn' ? 'তথ্য পরিবর্তন করুন' : 'Edit Profile Information'}
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'bn' ? 'আপনার নাম' : 'Your Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১XXXXXXXXX"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
            >
              {language === 'bn' ? 'সংরক্ষণ করুন (Save Changes)' : 'Save Profile Changes'}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-rose-400" />
                <span>{language === 'bn' ? 'পুরো নাম' : 'Full Name'}</span>
              </span>
              <p className="font-semibold text-white">{user.name}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-rose-400" />
                <span>{language === 'bn' ? 'ইমেইল' : 'Email'}</span>
              </span>
              <p className="font-semibold text-white font-mono truncate">{user.email}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-rose-400" />
                <span>{language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}</span>
              </span>
              <p className="font-semibold text-white font-mono">
                {user.phone || (language === 'bn' ? 'যুক্ত করা হয়নি' : 'Not added')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Crown className="w-3 h-3 text-rose-400" />
                <span>{language === 'bn' ? 'বর্তমান প্ল্যান' : 'Current Plan'}</span>
              </span>
              <p className="font-semibold text-amber-300">
                {user.tier === 'vip'
                  ? language === 'bn'
                    ? 'ভিআইপি মেম্বারশিপ'
                    : 'VIP Membership'
                  : user.tier === 'standard'
                  ? 'স্ট্যান্ডার্ড'
                  : language === 'bn'
                  ? 'ফ্রি সংস্করণ'
                  : 'Free Tier'}
              </p>
            </div>
          </div>
        )}

        {/* Subscription Status & Management Section */}
        <div className="p-4 rounded-2xl bg-[#10131d] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>{language === 'bn' ? 'সাবস্ক্রিপশন ও পেমেন্ট স্ট্যাটাস' : 'Subscription & Status'}</span>
            </h4>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  openSubscriptionStatusModal();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
              >
                {language === 'bn' ? 'স্ট্যাটাস ও হিস্ট্রি দেখুন' : 'View Status & History'}
              </button>

              {user.tier === 'free' && !user.pendingSubscription && (
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    openSubscriptionModal();
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                >
                  {language === 'bn' ? 'আপগ্রেড' : 'Upgrade'}
                </button>
              )}
            </div>
          </div>

          {/* If there is a PENDING Send Money payment request */}
          {user.pendingSubscription ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs font-bold text-amber-300">
                    {language === 'bn' ? 'পেমেন্ট যাচাইকরণাধীন' : 'Payment Verification Pending'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {user.pendingSubscription.method.toUpperCase()}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <p>
                  প্ল্যান: <strong className="text-white">{user.pendingSubscription.plan.toUpperCase()} (৳{user.pendingSubscription.amount})</strong>
                </p>
                <p>TrxID: <strong className="text-amber-300">{user.pendingSubscription.trxId}</strong></p>
                <p>প্রেরক নম্বর: {user.pendingSubscription.senderPhone}</p>
                <p className="text-[10px] text-slate-400 pt-1">
                  * অ্যাডমিন ০১৬৪৩৪৪২৫১৮ নম্বরে ট্রানজেকশন মিলিয়ে গ্রহণ করলেই আপনার ভিআইপি স্ট্যাটাস সাথে সাথে চালু হবে।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-medium">
                  স্ট্যাটাস: অ্যাডমিন অনুমোদনের অপেক্ষায় (Pending)
                </span>
                <button
                  type="button"
                  onClick={cancelPendingSubscription}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 text-[10px] transition-all cursor-pointer"
                >
                  আবেদন বাতিল
                </button>
              </div>
            </div>
          ) : user.isPaused ? (
            /* Subscribed, but CURRENTLY PAUSED */
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-black border border-amber-500/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pause className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-amber-300">
                    {language === 'bn' ? 'সাবস্ক্রিপশন সাময়িক পজ (Push) রয়েছে' : 'Subscription is Currently Paused'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {getRemainingPauseDays()} {language === 'bn' ? 'দিন বাকি' : 'days left'}
                </span>
              </div>

              <p className="text-[11px] text-slate-300">
                {language === 'bn'
                  ? `আপনার সাবস্ক্রিপশন ${
                      user.pausedUntil
                        ? new Date(user.pausedUntil).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''
                    } পর্যন্ত পজ থাকবে। পজ চলাকালীন আপনার মেম্বারশিপের দিন নষ্ট হবে না।`
                  : `Your subscription is paused until ${
                      user.pausedUntil ? new Date(user.pausedUntil).toLocaleDateString() : ''
                    }. No days are lost while paused.`}
              </p>

              <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={resumeSubscription}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{language === 'bn' ? 'এখনই পুনরায় চালু করুন (Resume)' : 'Resume Subscription Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'স্থায়ী বাতিল' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          ) : isSubscribed ? (
            /* Subscribed and ACTIVE */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-black border border-amber-500/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>{language === 'bn' ? 'আপনার ভিআইপি মেম্বারশিপ সক্রিয় রয়েছে!' : 'Your VIP Membership is active!'}</span>
                  </p>
                  {user.subscriptionEndDate && (
                    <span className="text-[10px] font-mono text-slate-400">
                      মেয়াদ: {new Date(user.subscriptionEndDate).toLocaleDateString('bn-BD')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  {language === 'bn'
                    ? 'আপনি ১০০% বিজ্ঞাপনমুক্ত, ৪কে আল্ট্রা এইচডি কোয়ালিটি এবং ডলবি সারাউন্ড সাউন্ড উপভোগ করছেন।'
                    : 'You have full ad-free access in 4K UHD with Dolby sound.'}
                </p>
              </div>

              {/* Pause & Cancel Management Controls */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                {/* Pause Button */}
                <button
                  type="button"
                  onClick={() => setIsPauseDrawerOpen(true)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-amber-950/30 border border-white/10 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-amber-400">
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'bn' ? 'পজ করে রাখুন' : 'Pause Subscription'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'bn' ? 'সর্বোচ্চ ৭ দিন পজ রাখুন' : 'Pause for up to 7 days'}
                  </p>
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{language === 'bn' ? 'সাবস্ক্রিপশন বাতিল' : 'Cancel Subscription'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'bn' ? 'সাথে সাথে বন্ধ করুন' : 'Instant cancellation'}
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 text-xs text-slate-400 space-y-1">
              <p>
                {language === 'bn'
                  ? 'আপনি বর্তমানে ফ্রি ভার্সন ব্যবহার করছেন (বিজ্ঞাপন সহ)।'
                  : 'You are currently using the Free tier (with ads).'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'bn'
                  ? 'বিজ্ঞাপনমুক্ত দেখতে বিকাশ, নগদ, রকেটে সেন্ড মানি করে ভিআইপি সক্রিয় করুন।'
                  : 'Upgrade to VIP for ad-free streaming in 4K UHD.'}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              openRequestModal();
            }}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left space-y-1 transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-rose-400">
              <Film className="w-4 h-4 text-rose-500" />
              <span>{language === 'bn' ? 'মুভি রিকোয়েস্ট করুন' : 'Request Movie'}</span>
            </span>
            <p className="text-[10px] text-slate-400">
              {language === 'bn' ? 'পছন্দের সিনেমা না পেলে রিকোয়েস্ট দিন' : 'Cannot find a title? Submit a request'}
            </p>
          </button>

          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              openSupportModal();
            }}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left space-y-1 transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-rose-400">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{language === 'bn' ? 'অ্যাডমিনকে মেসেজ দিন' : 'Admin Support'}</span>
            </span>
            <p className="text-[10px] text-slate-400">
              {language === 'bn' ? 'যেকোনো সমস্যায় তাৎক্ষণিক সাহায্য নিন' : 'Instant help for any platform issue'}
            </p>
          </button>
        </div>
      </div>

      {/* PAUSE SUBSCRIPTION DRAWER / MODAL (Max 7 Days) */}
      {isPauseDrawerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsPauseDrawerOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#0e111a] border border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <Pause className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-cinzel">
                    {language === 'bn' ? 'সাবস্ক্রিপশন সাময়িক পজ রাখুন' : 'Pause Subscription'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {language === 'bn' ? 'সর্বোচ্চ ৭ দিন পর্যন্ত পজ (Push) রাখা যাবে' : 'Pause for up to 7 days maximum'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPauseDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
              {language === 'bn'
                ? 'ব্যস্ত সময় পার করছেন? সাবস্ক্রিপশন পুরোপুরি বাতিল না করে সাময়িক পজ রাখতে পারেন। পজ চলাকালীন কোনো দিন নষ্ট হবে না এবং আপনার বর্তমান মেয়াদের সাথে দিনগুলো যোগ হবে।'
                : 'Taking a short break? Pause your subscription instead of cancelling. No days will be lost and remaining days will resume automatically.'}
            </div>

            {/* Days Selector (1 to 7 days) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                {language === 'bn' ? 'কতদিনের জন্য পজ রাখতে চান?' : 'Select pause duration (Max 7 days):'}
              </label>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 5, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSelectedPauseDays(days)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedPauseDays === days
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-950/60 scale-105'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {days} {language === 'bn' ? 'দিন' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsPauseDrawerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPause}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-950/50 cursor-pointer active:scale-95"
              >
                {selectedPauseDays} {language === 'bn' ? 'দিনের জন্য পজ করুন' : 'Days Pause Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL SUBSCRIPTION EXIT SURVEY MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsCancelModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#0e111a] border border-rose-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center border border-rose-500/40">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-cinzel">
                    {language === 'bn' ? 'কেন সাবস্ক্রিপশন বাতিল করছেন?' : 'Why are you cancelling?'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'bn' ? 'বাতিল করলে আপনার সাবস্ক্রিপশন সাথে সাথে ডিলিট হয়ে যাবে' : 'Subscription will be deleted immediately'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Multiple Choice Survey Questions */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-300">
                {language === 'bn'
                  ? 'দয়া করে আপনার কারণটি বেছে নিন (Multiple Choice):'
                  : 'Please select a reason below:'}
              </p>

              <div className="space-y-2">
                {CANCELLATION_REASONS.map((reason) => {
                  const isSelected = selectedReasonId === reason.id;
                  return (
                    <label
                      key={reason.id}
                      onClick={() => setSelectedReasonId(reason.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={isSelected}
                        onChange={() => setSelectedReasonId(reason.id)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="flex-1 text-xs">
                        <p className={`font-semibold ${isSelected ? 'text-rose-200' : 'text-slate-300'}`}>
                          {language === 'bn' ? reason.labelBn : reason.labelEn}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Other feedback box */}
              {selectedReasonId === 'other' && (
                <div className="pt-2 animate-in fade-in">
                  <textarea
                    rows={2}
                    value={otherFeedback}
                    onChange={(e) => setOtherFeedback(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'আপনার মতামত সংক্ষেপে লিখুন...'
                        : 'Please briefly describe your reason...'
                    }
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                  />
                </div>
              )}
            </div>

            {/* Retention Offer if reason is temporary busy */}
            {selectedReasonId === 'busy_temporary' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-amber-900/30 to-black border border-amber-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'bn' ? 'স্মার্ট সমাধান: বাতিল না করে পজ রাখুন!' : 'Alternative: Pause instead!'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === 'bn'
                    ? 'সাবস্ক্রিপশন পুরোপুরি মুছে না ফেলে সর্বোচ্চ ৭ দিনের জন্য পজ করে রাখতে পারেন। আপনার দিন নষ্ট হবে না!'
                    : 'Instead of deleting your subscription, you can pause it for up to 7 days with zero loss.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    setIsPauseDrawerOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Pause className="w-3 h-3 fill-black" />
                  <span>{language === 'bn' ? '৭ দিনের জন্য পজ করুন' : 'Pause for 7 Days Instead'}</span>
                </button>
              </div>
            )}

            {/* Warning Callout */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-rose-300 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'সতর্কবার্তা:' : 'Warning:'}</span>
              </p>
              <p>
                {language === 'bn'
                  ? 'বাতিল নিশ্চিত করলে আপনার সাবস্ক্রিপশন সাথে সাথে স্থায়ীভাবে মুছে যাবে এবং আপনার অ্যাকাউন্ট ফ্রি ভার্সনে চলে যাবে।'
                  : 'Confirming cancellation will immediately delete your subscription and return your account to Free tier.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer text-center"
              >
                {language === 'bn' ? 'না, সাবস্ক্রিপশন রাখব (Keep Subscription)' : 'Keep My Subscription'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-950/60 cursor-pointer text-center active:scale-95"
              >
                {language === 'bn' ? 'হ্যাঁ, সাথে সাথে বাতিল করুন' : 'Confirm & Delete Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
