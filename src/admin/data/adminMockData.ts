import {
  AdminAccount,
  AdminKpi,
  AdminPayment,
  AdminCustomerUser,
  AdminSubscriptionPlan,
  AdminAdvertisement,
  AdminNotificationItem,
  AdminCoupon,
  AdminContentItem,
  AdminActor,
  AdminGenre,
  AdminRevenueDataPoint
} from '../types/adminTypes';

export const currentAdminAccount: AdminAccount = {
  id: 'adm-001',
  name: 'Administrator',
  email: 'admin@chitrokatha.com',
  role: 'super_admin',
  roleTitle: 'Super Admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  status: 'active',
  lastLogin: 'Today, 10:45 AM',
  permissions: ['all_access', 'manage_content', 'manage_users', 'manage_finance', 'manage_system']
};

export const adminKpis: AdminKpi[] = [
  {
    id: 'users',
    title: 'Total Users',
    value: '12,480',
    change: '+12.5%',
    isPositive: true,
    timeframe: 'vs last month',
    accent: 'blue'
  },
  {
    id: 'vip',
    title: 'Active VIP Users',
    value: '1,240',
    change: '+8.2%',
    isPositive: true,
    timeframe: 'vs last month',
    accent: 'amber'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '৳84,500',
    change: '+18.4%',
    isPositive: true,
    timeframe: 'vs last month',
    accent: 'rose'
  },
  {
    id: 'content',
    title: 'Total Content',
    value: '428',
    change: '+14 added',
    isPositive: true,
    timeframe: 'this week',
    accent: 'purple'
  }
];

export const revenueTimeframes: Record<'today' | '7days' | '30days' | '12months', AdminRevenueDataPoint[]> = {
  today: [
    { date: '02:00', revenue: 1200, users: 18, transactions: 14 },
    { date: '06:00', revenue: 3400, users: 42, transactions: 36 },
    { date: '10:00', revenue: 8900, users: 110, transactions: 92 },
    { date: '14:00', revenue: 14500, users: 180, transactions: 155 },
    { date: '18:00', revenue: 21300, users: 260, transactions: 220 },
    { date: '22:00', revenue: 28400, users: 340, transactions: 295 }
  ],
  '7days': [
    { date: 'Mon', revenue: 9800, users: 120, transactions: 95 },
    { date: 'Tue', revenue: 11200, users: 140, transactions: 115 },
    { date: 'Wed', revenue: 10400, users: 135, transactions: 108 },
    { date: 'Thu', revenue: 13800, users: 165, transactions: 142 },
    { date: 'Fri', revenue: 19500, users: 240, transactions: 205 },
    { date: 'Sat', revenue: 24300, users: 310, transactions: 260 },
    { date: 'Sun', revenue: 22100, users: 280, transactions: 235 }
  ],
  '30days': [
    { date: 'Week 1', revenue: 64000, users: 780, transactions: 670 },
    { date: 'Week 2', revenue: 78500, users: 920, transactions: 810 },
    { date: 'Week 3', revenue: 89200, users: 1050, transactions: 940 },
    { date: 'Week 4', revenue: 95400, users: 1140, transactions: 1020 }
  ],
  '12months': [
    { date: 'Jan', revenue: 320000, users: 3800, transactions: 3400 },
    { date: 'Feb', revenue: 345000, users: 4100, transactions: 3650 },
    { date: 'Mar', revenue: 390000, users: 4700, transactions: 4120 },
    { date: 'Apr', revenue: 420000, users: 5100, transactions: 4450 },
    { date: 'May', revenue: 460000, users: 5600, transactions: 4900 },
    { date: 'Jun', revenue: 510000, users: 6200, transactions: 5400 },
    { date: 'Jul', revenue: 550000, users: 6800, transactions: 5850 },
    { date: 'Aug', revenue: 610000, users: 7500, transactions: 6500 },
    { date: 'Sep', revenue: 670000, users: 8300, transactions: 7150 },
    { date: 'Oct', revenue: 730000, users: 9100, transactions: 7800 },
    { date: 'Nov', revenue: 790000, users: 10200, transactions: 8500 },
    { date: 'Dec', revenue: 884000, users: 12480, transactions: 9600 }
  ]
};

export const initialPayments: AdminPayment[] = [
  {
    id: 'pay-101',
    trxId: 'TRX98721654',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir@gmail.com',
    userPhone: '01711223344',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    planName: '30 Days VIP',
    amount: 99,
    method: 'bkash',
    senderPhone: '01711223344',
    date: '10 Mins Ago',
    status: 'pending',
    notes: 'Sender confirmed via SMS code 4492'
  },
  {
    id: 'pay-102',
    trxId: 'NAG78239012',
    userName: 'Farhana Yasmin',
    userEmail: 'farhana.y@yahoo.com',
    userPhone: '01822334455',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    planName: '365 Days Annual VIP',
    amount: 799,
    method: 'nagad',
    senderPhone: '01822334455',
    date: '25 Mins Ago',
    status: 'pending',
    notes: 'Direct personal Nagad transfer'
  },
  {
    id: 'pay-103',
    trxId: 'RCK66491028',
    userName: 'Mahmudul Hasan',
    userEmail: 'm.hasan@outlook.com',
    userPhone: '01933445566',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    planName: '90 Days VIP',
    amount: 249,
    method: 'rocket',
    senderPhone: '01933445566',
    date: '1 Hour Ago',
    status: 'approved',
    notes: 'Auto-verified with merchant portal'
  },
  {
    id: 'pay-104',
    trxId: 'TRX44189023',
    userName: 'Sadia Rahman',
    userEmail: 'sadia.r@gmail.com',
    userPhone: '01644556677',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
    planName: '30 Days VIP',
    amount: 99,
    method: 'bkash',
    senderPhone: '01644556677',
    date: '2 Hours Ago',
    status: 'approved'
  },
  {
    id: 'pay-105',
    trxId: 'TRX00192834',
    userName: 'Shafiqul Islam',
    userEmail: 'shafiqul@gmail.com',
    userPhone: '01555667788',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    planName: '7 Days VIP Pass',
    amount: 49,
    method: 'upay',
    senderPhone: '01555667788',
    date: '4 Hours Ago',
    status: 'rejected',
    notes: 'TrxID mismatched with telecom records'
  },
  {
    id: 'pay-106',
    trxId: 'TRX55891230',
    userName: 'Kazi Naimur',
    userEmail: 'naimur@kazi.com',
    userPhone: '01799887766',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    planName: '365 Days Annual VIP',
    amount: 799,
    method: 'bkash',
    senderPhone: '01799887766',
    date: 'Yesterday, 8:30 PM',
    status: 'approved'
  }
];

export const initialUsers: AdminCustomerUser[] = [
  {
    id: 'usr-101',
    name: 'Rahim Ahmed',
    email: 'rahim@example.com',
    phone: '01710001122',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    joinedDate: 'Oct 02, 2026',
    subscription: 'Monthly VIP',
    tier: 'vip',
    status: 'active',
    lastLogin: '10 Mins Ago',
    watchHistoryCount: 48
  },
  {
    id: 'usr-102',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@gmail.com',
    phone: '01820002233',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    joinedDate: 'Sep 28, 2026',
    subscription: 'Annual VIP',
    tier: 'vip',
    status: 'active',
    lastLogin: 'Today, 9:15 AM',
    watchHistoryCount: 112
  },
  {
    id: 'usr-103',
    name: 'Anisur Rahman',
    email: 'anis.ctg@gmail.com',
    phone: '01930003344',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    joinedDate: 'Oct 01, 2026',
    subscription: 'Free Tier',
    tier: 'free',
    status: 'active',
    lastLogin: '1 Hour Ago',
    watchHistoryCount: 14
  },
  {
    id: 'usr-104',
    name: 'Tania Sultana',
    email: 'tania.sultana@yahoo.com',
    phone: '01640004455',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
    joinedDate: 'Aug 14, 2026',
    subscription: 'Quarterly VIP',
    tier: 'vip',
    status: 'active',
    lastLogin: 'Yesterday',
    watchHistoryCount: 89
  },
  {
    id: 'usr-105',
    name: 'Jahid Hasan',
    email: 'jahid.hasan@outlook.com',
    phone: '01550005566',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    joinedDate: 'Jul 20, 2026',
    subscription: 'Free Tier',
    tier: 'free',
    status: 'suspended',
    lastLogin: '2 Weeks Ago',
    watchHistoryCount: 3
  },
  {
    id: 'usr-106',
    name: 'Mehnaz Tabassum',
    email: 'mehnaz.tab@gmail.com',
    phone: '01780006677',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    joinedDate: 'Sep 11, 2026',
    subscription: 'Weekly Pass',
    tier: 'basic',
    status: 'active',
    lastLogin: '4 Hours Ago',
    watchHistoryCount: 26
  }
];

export const initialSubscriptionPlans: AdminSubscriptionPlan[] = [
  {
    id: 'plan-7d',
    name: '7 Days VIP Pass',
    price: 49,
    durationDays: 7,
    durationLabel: '7 Days',
    features: ['1080p Full HD', 'Watch on 1 Device', 'Limited Ads', 'Exclusive Bengali Dramas'],
    isActive: true,
    badge: 'Quick Trial',
    subscribersCount: 284,
    resolution: '1080p FHD',
    adFree: false
  },
  {
    id: 'plan-30d',
    name: '30 Days VIP Standard',
    price: 99,
    durationDays: 30,
    durationLabel: '30 Days',
    features: ['4K Ultra HD + HDR', 'Watch on 2 Devices Simultaneously', '100% Ad-Free Experience', 'Offline Download & PWA', 'Unlimited Bangla & World Cinema'],
    isActive: true,
    badge: 'Most Popular',
    subscribersCount: 612,
    resolution: '4K UHD',
    adFree: true
  },
  {
    id: 'plan-90d',
    name: '90 Days VIP Silver',
    price: 249,
    durationDays: 90,
    durationLabel: '90 Days',
    features: ['4K Ultra HD + Dolby Atmos', 'Watch on 3 Devices', 'Zero Interruptions / Ad-Free', 'Early Access to New Premieres', 'Priority 24/7 Support'],
    isActive: true,
    badge: 'Value Saver',
    subscribersCount: 218,
    resolution: '4K UHD',
    adFree: true
  },
  {
    id: 'plan-365d',
    name: '365 Days VIP Diamond',
    price: 799,
    durationDays: 365,
    durationLabel: '1 Year',
    features: ['4K Ultra HD Cinema Master', 'Watch on 4 Family Devices', 'Completely Ad-Free', 'VIP Premiere Red Carpet Access', 'Save ৳389 vs Monthly'],
    isActive: true,
    badge: 'Best Value',
    subscribersCount: 126,
    resolution: '4K UHD Master',
    adFree: true
  }
];

export const topCinematicContent: AdminContentItem[] = [
  {
    id: 'top-1',
    titleBn: 'তুফান',
    titleEn: 'Toofan',
    year: 2024,
    genre: 'Action, Crime',
    genres: ['Action', 'Crime', 'Thriller'],
    language: 'Bangla',
    rating: 8.8,
    status: 'published',
    isFeatured: true,
    isTop10: 1,
    views: '2.4M',
    viewsCount: 2400000,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    type: 'movie',
    industry: 'Dhallywood',
    runtime: '2h 25m'
  },
  {
    id: 'top-2',
    titleBn: 'হাওয়া',
    titleEn: 'Hawa',
    year: 2022,
    genre: 'Mystery, Drama',
    genres: ['Mystery', 'Drama', 'Mythology'],
    language: 'Bangla',
    rating: 8.6,
    status: 'published',
    isFeatured: true,
    isTop10: 2,
    views: '1.9M',
    viewsCount: 1900000,
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    type: 'movie',
    industry: 'Dhallywood',
    runtime: '2h 11m'
  },
  {
    id: 'top-3',
    titleBn: 'কারাগার',
    titleEn: 'Karagar (The Cell)',
    year: 2022,
    genre: 'Psychological Thriller',
    genres: ['Thriller', 'Mystery'],
    language: 'Bangla',
    rating: 8.9,
    status: 'published',
    isFeatured: true,
    isTop10: 3,
    views: '1.7M',
    viewsCount: 1700000,
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
    type: 'series',
    industry: 'Dhallywood',
    runtime: 'Season 1 & 2'
  },
  {
    id: 'top-4',
    titleBn: 'পুনর্জন্ম',
    titleEn: 'Punarjanma',
    year: 2021,
    genre: 'Suspense Drama',
    genres: ['Drama', 'Thriller'],
    language: 'Bangla',
    rating: 8.7,
    status: 'published',
    isFeatured: false,
    isTop10: 4,
    views: '1.2M',
    viewsCount: 1200000,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
    type: 'drama',
    industry: 'Natok',
    runtime: '45m Telefilm'
  }
];

export const initialMovies: AdminContentItem[] = [
  ...topCinematicContent,
  {
    id: 'mov-5',
    titleBn: 'প্রিয়তমা',
    titleEn: 'Priyotoma',
    year: 2023,
    genre: 'Romantic Drama',
    genres: ['Romance', 'Drama'],
    language: 'Bangla',
    rating: 8.4,
    status: 'published',
    isFeatured: false,
    views: '1.1M',
    viewsCount: 1100000,
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    type: 'movie',
    industry: 'Dhallywood',
    runtime: '2h 18m'
  },
  {
    id: 'mov-6',
    titleBn: 'ওপেনহাইমার',
    titleEn: 'Oppenheimer',
    year: 2023,
    genre: 'Biographical Drama',
    genres: ['Biography', 'Drama', 'History'],
    language: 'English',
    rating: 8.9,
    status: 'published',
    isFeatured: true,
    views: '3.1M',
    viewsCount: 3100000,
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80',
    type: 'movie',
    industry: 'Hollywood',
    runtime: '3h 00m'
  },
  {
    id: 'mov-7',
    titleBn: 'পথের পাঁচালী',
    titleEn: 'Pather Panchali',
    year: 1955,
    genre: 'Classic Masterpiece',
    genres: ['Classic', 'Drama'],
    language: 'Bangla',
    rating: 9.3,
    status: 'published',
    isFeatured: true,
    views: '850K',
    viewsCount: 850000,
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    type: 'movie',
    industry: 'Tollywood',
    runtime: '2h 05m'
  },
  {
    id: 'mov-8',
    titleBn: 'ইনসেপশন',
    titleEn: 'Inception',
    year: 2010,
    genre: 'Sci-Fi, Action',
    genres: ['Sci-Fi', 'Action', 'Mystery'],
    language: 'English',
    rating: 8.8,
    status: 'published',
    isFeatured: false,
    views: '2.8M',
    viewsCount: 2800000,
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    type: 'movie',
    industry: 'Hollywood',
    runtime: '2h 28m'
  }
];

export const initialDramas: AdminContentItem[] = [
  {
    id: 'drm-1',
    titleBn: 'পুনর্জন্ম',
    titleEn: 'Punarjanma',
    year: 2021,
    genre: 'Suspense Drama',
    genres: ['Drama', 'Thriller'],
    language: 'Bangla',
    rating: 8.7,
    status: 'published',
    isFeatured: true,
    views: '1.2M',
    viewsCount: 1200000,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
    type: 'drama',
    industry: 'Natok',
    runtime: '45m Telefilm'
  },
  {
    id: 'drm-2',
    titleBn: 'বড় ছেলে',
    titleEn: 'Boro Chele',
    year: 2017,
    genre: 'Family Emotion',
    genres: ['Drama', 'Family'],
    language: 'Bangla',
    rating: 9.1,
    status: 'published',
    isFeatured: true,
    views: '3.4M',
    viewsCount: 3400000,
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    type: 'drama',
    industry: 'Natok',
    runtime: '52m Telefilm'
  },
  {
    id: 'drm-3',
    titleBn: 'হৃদ মাঝারে',
    titleEn: 'Hrid Majhare',
    year: 2023,
    genre: 'Romantic Melo',
    genres: ['Romance', 'Drama'],
    language: 'Bangla',
    rating: 8.2,
    status: 'published',
    isFeatured: false,
    views: '640K',
    viewsCount: 640000,
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    type: 'drama',
    industry: 'Natok',
    runtime: '41m Telefilm'
  }
];

export const initialWebSeries: AdminContentItem[] = [
  {
    id: 'ws-1',
    titleBn: 'কারাগার',
    titleEn: 'Karagar',
    year: 2022,
    genre: 'Mystery Thriller',
    genres: ['Thriller', 'Mystery'],
    language: 'Bangla',
    rating: 8.9,
    status: 'published',
    isFeatured: true,
    views: '1.7M',
    viewsCount: 1700000,
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
    type: 'series',
    industry: 'Dhallywood',
    runtime: '2 Seasons • 14 Episodes'
  },
  {
    id: 'ws-2',
    titleBn: 'তকদীর',
    titleEn: 'Taqdeer',
    year: 2020,
    genre: 'Crime Thriller',
    genres: ['Crime', 'Thriller'],
    language: 'Bangla',
    rating: 8.8,
    status: 'published',
    isFeatured: true,
    views: '1.5M',
    viewsCount: 1500000,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    type: 'series',
    industry: 'Dhallywood',
    runtime: '1 Season • 8 Episodes'
  },
  {
    id: 'ws-3',
    titleBn: 'মাইক্যাল',
    titleEn: 'Myself Allen Swapan',
    year: 2023,
    genre: 'Dark Comedy Crime',
    genres: ['Crime', 'Comedy'],
    language: 'Bangla',
    rating: 8.5,
    status: 'published',
    isFeatured: false,
    views: '980K',
    viewsCount: 980000,
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80',
    type: 'series',
    industry: 'Dhallywood',
    runtime: '1 Season • 6 Episodes'
  }
];

export const initialActors: AdminActor[] = [
  {
    id: 'act-1',
    nameBn: 'শাকিব খান',
    nameEn: 'Shakib Khan',
    industry: 'Dhallywood',
    worksCount: 42,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    topMovie: 'তুফান (Toofan)'
  },
  {
    id: 'act-2',
    nameBn: 'চঞ্চল চৌধুরী',
    nameEn: 'Chanchal Chowdhury',
    industry: 'Dhallywood',
    worksCount: 38,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    topMovie: 'কারাগার, হাওয়া'
  },
  {
    id: 'act-3',
    nameBn: 'আফরান নিশো',
    nameEn: 'Afran Nisho',
    industry: 'Dhallywood / Natok',
    worksCount: 65,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    topMovie: 'সুড়ঙ্গ, পুনর্জন্ম'
  },
  {
    id: 'act-4',
    nameBn: 'মেহজাবীন চৌধুরী',
    nameEn: 'Mehazabien Chowdhury',
    industry: 'Dhallywood / Natok',
    worksCount: 52,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    topMovie: 'সাবা, রেডরাম'
  },
  {
    id: 'act-5',
    nameBn: 'জয়া আহসান',
    nameEn: 'Joya Ahsan',
    industry: 'Dhallywood / Tollywood',
    worksCount: 34,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    topMovie: 'দেবী, বিসর্জন'
  }
];

export const initialGenres: AdminGenre[] = [
  { id: 'gnr-1', nameBn: 'অ্যাকশন', nameEn: 'Action', slug: 'action', count: 84, featured: true },
  { id: 'gnr-2', nameBn: 'ড্রামা', nameEn: 'Drama', slug: 'drama', count: 142, featured: true },
  { id: 'gnr-3', nameBn: 'থ্রিলার', nameEn: 'Thriller', slug: 'thriller', count: 96, featured: true },
  { id: 'gnr-4', nameBn: 'রোম্যান্স', nameEn: 'Romance', slug: 'romance', count: 78, featured: true },
  { id: 'gnr-5', nameBn: 'রহস্য ও গোয়েন্দা', nameEn: 'Mystery', slug: 'mystery', count: 54, featured: false },
  { id: 'gnr-6', nameBn: 'সায়েন্স ফিকশন', nameEn: 'Sci-Fi', slug: 'sci-fi', count: 32, featured: false },
  { id: 'gnr-7', nameBn: 'কমেডি', nameEn: 'Comedy', slug: 'comedy', count: 68, featured: false },
  { id: 'gnr-8', nameBn: 'কালজয়ী ক্লাসিক', nameEn: 'Classic', slug: 'classic', count: 45, featured: true }
];

export const initialAdvertisements: AdminAdvertisement[] = [
  {
    id: 'ad-01',
    title: 'Grameenphone 5G Mega Campaign',
    type: 'video',
    previewUrl: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=400&q=80',
    targetUrl: 'https://www.grameenphone.com',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'active',
    impressions: 145000,
    clicks: 12400
  },
  {
    id: 'ad-02',
    title: 'bKash Cashback Festival Pop-up',
    type: 'popup',
    previewUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80',
    targetUrl: 'https://www.bkash.com',
    startDate: '2026-10-05',
    endDate: '2026-10-25',
    status: 'scheduled',
    impressions: 0,
    clicks: 0
  },
  {
    id: 'ad-03',
    title: 'Samsung Galaxy S26 Ultra Banner',
    type: 'banner',
    previewUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    targetUrl: 'https://www.samsung.com',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'expired',
    impressions: 320000,
    clicks: 29500
  }
];

export const initialNotifications: AdminNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'তুফান (Toofan) Now Available in 4K UHD!',
    message: 'Stream Dhallywood’s biggest blockbuster in stunning 4K audio and video exclusively on ChitroKatha VIP.',
    type: 'promotion',
    target: 'all',
    scheduledDate: '2026-10-04 18:00',
    status: 'sent',
    sentCount: 12480
  },
  {
    id: 'notif-2',
    title: 'Scheduled System Maintenance Notice',
    message: 'Streaming services will undergo brief performance enhancement tonight between 3:00 AM - 4:00 AM.',
    type: 'system',
    target: 'all',
    scheduledDate: '2026-10-06 02:00',
    status: 'scheduled',
    sentCount: 0
  },
  {
    id: 'notif-3',
    title: 'VIP Renewal Discount Offer',
    message: 'Renew your subscription with coupon VIPSPECIAL and receive 30% instant discount.',
    type: 'promotion',
    target: 'vip',
    scheduledDate: '2026-10-02 12:00',
    status: 'sent',
    sentCount: 1240
  }
];

export const initialCoupons: AdminCoupon[] = [
  {
    id: 'cpn-1',
    code: 'WELCOME50',
    discount: '50% OFF',
    discountType: 'percentage',
    discountValue: 50,
    usageLimit: 500,
    usedCount: 342,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'active'
  },
  {
    id: 'cpn-2',
    code: 'VIPSPECIAL',
    discount: '30% OFF',
    discountType: 'percentage',
    discountValue: 30,
    usageLimit: 1000,
    usedCount: 780,
    startDate: '2026-09-15',
    endDate: '2026-11-15',
    status: 'active'
  },
  {
    id: 'cpn-3',
    code: 'EID2026',
    discount: '৳100 Flat',
    discountType: 'fixed',
    discountValue: 100,
    usageLimit: 300,
    usedCount: 300,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'expired'
  }
];

export const initialAdmins: AdminAccount[] = [
  currentAdminAccount,
  {
    id: 'adm-002',
    name: 'Sabbir Ahmed',
    email: 'sabbir@chitrokatha.com',
    role: 'content_manager',
    roleTitle: 'Content Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastLogin: 'Yesterday, 4:20 PM',
    permissions: ['manage_content']
  },
  {
    id: 'adm-003',
    name: 'Rina Begum',
    email: 'rina@chitrokatha.com',
    role: 'support_manager',
    roleTitle: 'Support & Finance Manager',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastLogin: 'Today, 8:40 AM',
    permissions: ['manage_finance', 'manage_users']
  },
  {
    id: 'adm-004',
    name: 'Kamal Pasha',
    email: 'kamal@chitrokatha.com',
    role: 'admin',
    roleTitle: 'Platform Administrator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'inactive',
    lastLogin: '5 Days Ago',
    permissions: ['manage_content', 'manage_users']
  }
];

export const mockNotificationsDropdown = [
  {
    id: 'notif-drop-1',
    title: '3 New Pending Payments',
    description: 'Tanvir Hossain and 2 others submitted bKash/Nagad TrxIDs.',
    time: '5 mins ago',
    type: 'payment',
    unread: true
  },
  {
    id: 'notif-drop-2',
    title: '2 New VIP Users Registered',
    description: 'Farhana Yasmin upgraded to 365 Days Annual VIP.',
    time: '25 mins ago',
    type: 'user',
    unread: true
  },
  {
    id: 'notif-drop-3',
    title: '1 Subscription Issue Flagged',
    description: 'TrxID mismatch reported for Shafiqul Islam (Upay).',
    time: '2 hours ago',
    type: 'alert',
    unread: false
  }
];
