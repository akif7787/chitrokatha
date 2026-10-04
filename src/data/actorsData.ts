export interface Actor {
  id: string;
  nameBn: string;
  nameEn: string;
  photo: string;
  roleBn: string;
  roleEn: string;
  bioBn: string;
  bioEn: string;
  popularFor: string;
}

export const popularActors: Actor[] = [
  {
    id: 'shakib-khan',
    nameBn: 'শাকিব খান',
    nameEn: 'Shakib Khan',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
    roleBn: 'মেগাস্টার · ঢালিউড কিং',
    roleEn: 'Megastar · Dhallywood King',
    bioBn: 'বাংলা চলচ্চিত্রের শীর্ষ সুপারস্টার। চারবারের জাতীয় চলচ্চিত্র পুরস্কার বিজয়ী অভিনেতা।',
    bioEn: 'The undisputed megastar of Bengali cinema and four-time National Film Award winner.',
    popularFor: 'তুফান, প্রিয়তমা, শিকারী, নবাব',
  },
  {
    id: 'chanchal-chowdhury',
    nameBn: 'চঞ্চল চৌধুরী',
    nameEn: 'Chanchal Chowdhury',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    roleBn: 'বহুমাত্রিক জাতীয় পুরস্কারপ্রাপ্ত অভিনেতা',
    roleEn: 'Multi-award winning acclaimed actor',
    bioBn: 'মনপুরা, আয়নাবাজি ও হাওয়া চলচ্চিত্রের কিংবদন্তি অভিনেতা। ওটিটি সিরিজের অন্যতম পথিকৃৎ।',
    bioEn: 'Legendary actor known for Monpura, Aynabaji, Hawa, Karagar, and Taqdeer.',
    popularFor: 'হাওয়া, আয়নাবাজি, মনপুরা, কারাগার',
  },
  {
    id: 'mosharraf-karim',
    nameBn: 'মোশাররফ করিম',
    nameEn: 'Mosharraf Karim',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    roleBn: 'অভিনয় জাদুকর · কাল্ট লিজেন্ড',
    roleEn: 'Acting powerhouse & Comedy icon',
    bioBn: 'কমেডি ও সিরিয়াস অভিনয়ে বাংলাদেশের সবচেয়ে জনপ্রিয় ও বহুমুখী অভিনেতাদের একজন।',
    bioEn: 'One of the most versatile and celebrated actors in Bengali television and films.',
    popularFor: 'মহানগর, জমজ, সিকান্দার বক্স',
  },
  {
    id: 'apurba',
    nameBn: 'জিয়াউল ফারুক অপূর্ব',
    nameEn: 'Ziaul Faruq Apurba',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80',
    roleBn: 'রোমান্টিক কিং · টিভি সুপারস্টার',
    roleEn: 'King of Romance & Television',
    bioBn: 'বাংলা নাটকের ইতিহাসে সবচেয়ে বেশি ভিউ পাওয়া কালজয়ী রোমান্টিক অভিনেতা।',
    bioEn: 'Renowned for emotional depth and historic records in Bengali romantic telefilms.',
    popularFor: 'বড় ছেলে, বিনি সুতোর টান, বুকের খাঁচা',
  },
  {
    id: 'mehazabien',
    nameBn: 'মেহজাবীন চৌধুরী',
    nameEn: 'Mehazabien Chowdhury',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    roleBn: 'নাটক সম্রাজ্ঞী · ওটিটি কুইন',
    roleEn: 'Queen of Bengali Drama & OTT',
    bioBn: 'অনবদ্য অভিনয় শৈলী ও আবেগপূর্ণ চরিত্রে বাংলা নাটকের সর্বাধিক জনপ্রিয় অভিনেত্রী।',
    bioEn: 'Leading actress celebrated for versatile storytelling and record-breaking dramas.',
    popularFor: 'বড় ছেলে, আলো, সাবরিনা, কাজলের দিনরাত্রি',
  },
  {
    id: 'towsif',
    nameBn: 'তৌসিফ মাহবুব',
    nameEn: 'Towsif Mahbub',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    roleBn: 'তরুণদের প্রিয় অভিনেতা',
    roleEn: 'Youth Icon & Drama Actor',
    bioBn: 'হালের তরুণ প্রজন্মের কাছে তুমুল জনপ্রিয় রোমান্টিক ও ফ্যামিলি ড্রামা অভিনেতা।',
    bioEn: 'Widely popular romantic and family drama actor of the modern generation.',
    popularFor: 'বুকের খাঁচা, হানিমুন, ব্যাচেলর ট্রিপ',
  },
  {
    id: 'cillian-murphy',
    nameBn: 'কিলিয়ান মার্ফি',
    nameEn: 'Cillian Murphy',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&q=80',
    roleBn: 'অস্কারজয়ী হলিউড অভিনেতা',
    roleEn: 'Academy Award Winning Actor',
    bioBn: 'ওপেনহাইমার চলচ্চিত্রের জন্য সেরা অভিনেতার অস্কার বিজয়ী কিংবদন্তি।',
    bioEn: 'Oscar-winning Irish actor celebrated for Oppenheimer and Peaky Blinders.',
    popularFor: 'ওপেনহাইমার, ইনসেপশন, দ্য ডার্ক নাইট',
  },
  {
    id: 'leonardo-dicaprio',
    nameBn: 'লিওনার্দো ডিক্যাপ্রিও',
    nameEn: 'Leonardo DiCaprio',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
    roleBn: 'গ্লোবাল আইকন · অস্কারজয়ী',
    roleEn: 'Global Icon & Oscar Winner',
    bioBn: 'টাইটানিক, ইনসেপশন এবং দ্য রেভেন্যান্ট খ্যাত হলিউডের অন্যতম শ্রেষ্ঠ অভিনেতা।',
    bioEn: 'Celebrated global icon and one of cinema’s most respected actors.',
    popularFor: 'ইনসেপশন, টাইটানিক, দ্য রেভেন্যান্ট',
  },
];
