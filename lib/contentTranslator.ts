import { Language } from './translations'

export interface DepartmentInfo {
  id?: string
  name: string
  shortName?: string
}

// ── Department Names Translations ──────────────────────────────────────────
export const DEPARTMENT_TRANSLATIONS: Record<string, Record<Language, { name: string; shortName: string }>> = {
  pwd: {
    en: { name: 'Public Works / Engineering', shortName: 'PWD' },
    hi: { name: 'लोक निर्माण / इंजीनियरिंग विभाग', shortName: 'पीडब्ल्यूडी' },
    mr: { name: 'सार्वजनिक बांधकाम / अभियांत्रिकी विभाग', shortName: 'पीडब्ल्यूडी' },
    bn: { name: 'গণপূর্ত / ইঞ্জিনিয়ারিং বিভাগ', shortName: 'পিডব্লিউডি' },
    te: { name: 'ప్రజా పనుల / ఇంజనీరింగ్ విభాగం', shortName: 'పీడబ్ల్యూడీ' },
    ta: { name: 'பொதுப்பணி / பொறியியல் துறை', shortName: 'பொதுப்பணி' },
    gu: { name: 'જાહેર બાંધકામ / એન્જિનિયરિંગ વિભાગ', shortName: 'પીડબ્લ્યુડી' },
    ur: { name: 'محکمہ تعمیرات عامہ / انجینئرنگ', shortName: 'پی ڈبلیو ڈی' }
  },
  electrical: {
    en: { name: 'Electrical Department', shortName: 'Electrical' },
    hi: { name: 'विद्युत विभाग', shortName: 'विद्युत' },
    mr: { name: 'विद्युत विभाग', shortName: 'विद्युत' },
    bn: { name: 'বিদ্যুৎ বিভাগ', shortName: 'বিদ্যুৎ' },
    te: { name: 'విద్యుత్ శాఖ', shortName: 'విద్యుత్' },
    ta: { name: 'மின்சாரத் துறை', shortName: 'மின்சாரம்' },
    gu: { name: 'વીજળી વિભાગ', shortName: 'વીજળી' },
    ur: { name: 'محکمہ برقیات', shortName: 'برقیات' }
  },
  health: {
    en: { name: 'Public Health Department', shortName: 'Health' },
    hi: { name: 'जन स्वास्थ्य विभाग', shortName: 'स्वास्थ्य' },
    mr: { name: 'सार्वजनिक आरोग्य विभाग', shortName: 'आरोग्य' },
    bn: { name: 'জনস্বাস্থ্য বিভাগ', shortName: 'স্বাস্থ্য' },
    te: { name: 'ప్రజా ఆరోగ్య శాఖ', shortName: 'ఆరోగ్యం' },
    ta: { name: 'பொது சுகாதாரத் துறை', shortName: 'சுகாதாரம்' },
    gu: { name: 'જાહેર આરોગ્ય વિભાગ', shortName: 'આરોગ્ય' },
    ur: { name: 'محکمہ صحت عامہ', shortName: 'صحت' }
  },
  water: {
    en: { name: 'Water Supply Department', shortName: 'Water Supply' },
    hi: { name: 'जल आपूर्ति विभाग', shortName: 'जल आपूर्ति' },
    mr: { name: 'पाणी पुरवठा विभाग', shortName: 'पाणी पुरवठा' },
    bn: { name: 'পানি সরবরাহ বিভাগ', shortName: 'পানি' },
    te: { name: 'నీటి సరఫరా శాఖ', shortName: 'నీటి సరఫరా' },
    ta: { name: 'குடிநீர் வழங்கல் துறை', shortName: 'குடிநீர்' },
    gu: { name: 'પાણી પુરવઠા વિભાગ', shortName: 'પાણી પુરવઠો' },
    ur: { name: 'محکمہ فراہمی آب', shortName: 'پانی' }
  },
  sewerage: {
    en: { name: 'Sewerage & Drainage Department', shortName: 'Drainage & Sewerage' },
    hi: { name: 'सीवरेज और जल निकासी विभाग', shortName: 'जल निकासी' },
    mr: { name: 'सांडपाणी व ड्रेनेज विभाग', shortName: 'ड्रेनेज' },
    bn: { name: 'নিকাশী ও ড্রেনেজ বিভাগ', shortName: 'ড্রেনেজ' },
    te: { name: 'మురుగునీటి & డ్రైనేజీ శాఖ', shortName: 'డ్రైనేజీ' },
    ta: { name: 'கழிவுநீர் வடிகால் துறை', shortName: 'வடிகால்' },
    gu: { name: 'ગટર અને ડ્રેનેજ વિભાગ', shortName: 'ડ્રેનેજ' },
    ur: { name: 'محکمہ سیوریج و نکاسی آب', shortName: 'سیوریج' }
  },
  solidwaste: {
    en: { name: 'Solid Waste Management Department', shortName: 'Solid Waste' },
    hi: { name: 'ठोस अपशिष्ट प्रबंधन विभाग', shortName: 'कचरा प्रबंधन' },
    mr: { name: 'घनकचरा व्यवस्थापन विभाग', shortName: 'घनकचरा' },
    bn: { name: 'কঠিন বর্জ্য ব্যবস্থাপনা বিভাগ', shortName: 'বর্জ্য' },
    te: { name: 'ఘన వ్యర్థాల నిర్వహణ శాఖ', shortName: 'వ్యర్థాలు' },
    ta: { name: 'திடக்கழிவு மேலாண்மைத் துறை', shortName: 'திடக்கழிவு' },
    gu: { name: 'ઘન કચરા વ્યવસ્થાપન વિભાગ', shortName: 'ઘન કચરો' },
    ur: { name: 'محکمہ سالڈ ویسٹ مینجمنٹ', shortName: 'سالڈ ویسٹ' }
  },
  gardens: {
    en: { name: 'Garden & Parks Department', shortName: 'Parks & Gardens' },
    hi: { name: 'उद्यान एवं पार्क विभाग', shortName: 'उद्यान' },
    mr: { name: 'उद्यान व पार्क विभाग', shortName: 'उद्यान' },
    bn: { name: 'বাগান ও পার্ক বিভাগ', shortName: 'বাগান' },
    te: { name: 'తోటలు & పార్కుల శాఖ', shortName: 'పార్కులు' },
    ta: { name: 'தோட்டம் மற்றும் பூங்காக்கள் துறை', shortName: 'பூங்கா' },
    gu: { name: 'બગીચા અને ઉદ્યાન વિભાગ', shortName: 'બગીચા' },
    ur: { name: 'محکمہ باغات و پارکس', shortName: 'باغات' }
  },
  townplanning: {
    en: { name: 'Town Planning / Encroachment', shortName: 'Town Planning' },
    hi: { name: 'नगर नियोजन / अतिक्रमण नियंत्रण', shortName: 'नगर नियोजन' },
    mr: { name: 'नगररचना / अतिक्रमण विभाग', shortName: 'नगररचना' },
    bn: { name: 'নগর পরিকল্পনা / জবরদখল উচ্ছেদ', shortName: 'পরিকল্পনা' },
    te: { name: 'పట్టణ ప్రణాళిక / ఆక్రమణల తొలగింపు', shortName: 'టౌన్ ప్లానింగ్' },
    ta: { name: 'நகரமைப்பு / ஆக்கிரமிப்பு அகற்றம்', shortName: 'நகரமைப்பு' },
    gu: { name: 'ટાઉન પ્લાનિંગ / દબાણ નિયંત્રણ', shortName: 'ટાઉન પ્લાનિંગ' },
    ur: { name: 'ٹاؤن پلاننگ / انسداد تجاوزات', shortName: 'ٹاؤن پلاننگ' }
  },
  traffic: {
    en: { name: 'Traffic Department', shortName: 'Traffic' },
    hi: { name: 'यातायात विभाग', shortName: 'ट्रैफिक' },
    mr: { name: 'वाहतूक विभाग', shortName: 'वाहतूक' },
    bn: { name: 'ট্রাফিক বিভাগ', shortName: 'ট্রাফিক' },
    te: { name: 'ట్రాఫిక్ విభాగం', shortName: 'ట్రాఫిక్' },
    ta: { name: 'போக்குவரத்துத் துறை', shortName: 'போக்குவரத்து' },
    gu: { name: 'ટ્રાફિક વિભાગ', shortName: 'ટ્રાફિક' },
    ur: { name: 'محکمہ ٹریفک', shortName: 'ٹریفک' }
  },
  grievance: {
    en: { name: 'General Administration / Grievance Cell', shortName: 'General Admin' },
    hi: { name: 'सामान्य प्रशासन / शिकायत प्रकोष्ठ', shortName: 'सामान्य प्रशासन' },
    mr: { name: 'सामान्य प्रशासन / तक्रार निवारण कक्ष', shortName: 'तक्रार निवारण' },
    bn: { name: 'সাধারণ প্রশাসন / অভিযোগ সেল', shortName: 'অভিযোগ সেল' },
    te: { name: 'సాధారణ పరిపాలన / ఫిర్యాదుల విభాగం', shortName: 'పరిపాలన' },
    ta: { name: 'பொது நிர்வாகம் / குறைதீர்க்கும் பிரிவு', shortName: 'நிர்வாகம்' },
    gu: { name: 'સામાન્ય વહીવટ / ફરિયાદ નિવારણ સેલ', shortName: 'સામાન્ય વહીવટ' },
    ur: { name: 'عام انتظامیہ / شکایت سیل', shortName: 'شکایت سیل' }
  }
}

// ── Subcategories Translations ─────────────────────────────────────────────
export const SUBCATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'Potholes': {
    en: 'Potholes',
    hi: 'सड़क पर गड्ढे',
    mr: 'रस्त्यावरील खड्डे',
    bn: 'রাস্তার গর্ত',
    te: 'రోడ్డు గుంతలు',
    ta: 'சாலைக் குழிகள்',
    gu: 'રસ્તા પર ખાડા',
    ur: 'سڑک پر گڑھے'
  },
  'Damaged Road': {
    en: 'Damaged Road',
    hi: 'टूटी हुई सड़क',
    mr: 'खराब रस्ता',
    bn: 'ক্ষতিগ্রস্ত রাস্তা',
    te: 'దెబ్బతిన్న రోడ్డు',
    ta: 'சேதமடைந்த சாலை',
    gu: 'તૂટેલો રસ્તો',
    ur: 'خراب سڑک'
  },
  'Road Damage': {
    en: 'Road Damage',
    hi: 'सड़क क्षति',
    mr: 'रस्त्याचे नुकसान',
    bn: 'রাস্তার ক্ষতি',
    te: 'రోడ్డు నష్టం',
    ta: 'சாலை சேதம்',
    gu: 'રસ્તાને નુકસાન',
    ur: 'سڑک کا نقصان'
  },
  'Traffic Sign Issue': {
    en: 'Traffic Sign Issue',
    hi: 'यातायात संकेत समस्या',
    mr: 'वाहतूक चिन्ह समस्या',
    bn: 'ট্রাফিক চিহ্ন সমস্যা',
    te: 'ట్రాఫిక్ సైన్ సమస్య',
    ta: 'போக்குவரத்து பலகை பிரச்சினை',
    gu: 'ટ્રાફિક સાઇન સમસ્યા',
    ur: 'ٹریفک سائن کا مسئلہ'
  },
  'Water Leakage': {
    en: 'Water Leakage',
    hi: 'पानी का रिसाव',
    mr: 'पाणी गळती',
    bn: 'পানি ফুটো',
    te: 'నీటి లీకేజ్',
    ta: 'குடிநீர் கசிவு',
    gu: 'પાણી લિકેજ',
    ur: 'پانی کا رساؤ'
  },
  'Water Shortage': {
    en: 'Water Shortage',
    hi: 'पानी की किल्लत',
    mr: 'पाण्याची टंचाई',
    bn: 'পানির সংকট',
    te: 'నీటి కొరత',
    ta: 'குடிநீர் தட்டுப்பாடு',
    gu: 'પાણીની અછત',
    ur: 'پانی کی قلت'
  },
  'Pipeline Damage': {
    en: 'Pipeline Damage',
    hi: 'पाइपलाइन क्षति',
    mr: 'पाईपलाईन फुटणे',
    bn: 'পাইপলাইন ক্ষতি',
    te: 'పైప్‌లైన్ డ్యామేజ్',
    ta: 'குழாய் சேதம்',
    gu: 'પાઈપલાઈન ક્ષતિગ્રસ્ત',
    ur: 'پائپ لائن کا نقصان'
  },
  'Water Quality': {
    en: 'Water Quality',
    hi: 'पानी की गुणवत्ता',
    mr: 'पाण्याची गुणवत्ता समस्या',
    bn: 'পানির মান সমস্যা',
    te: 'నీటి నాణ్యత సమస్య',
    ta: 'நீர் தரம் குறைபாடு',
    gu: 'પાણીની ગુણવત્તા સમસ્યા',
    ur: 'پانی کا معیار'
  },
  'Blocked Drain': {
    en: 'Blocked Drain',
    hi: 'बंद नाली',
    mr: 'तुंबलेले गटार',
    bn: 'বন্ধ ড্রেন',
    te: 'జామ్ అయిన డ్రైనేజ్',
    ta: 'அடைபட்ட சாக்கடை',
    gu: 'બ્લોક થયેલી ગટર',
    ur: 'بند نالی'
  },
  'Drain Overflow': {
    en: 'Drain Overflow',
    hi: 'नाली ओवरफ्लो',
    mr: 'गटाराचे पाणी वाहणे',
    bn: 'ড্রেন উপচে পড়া',
    te: 'డ్రైనేజీ పొంగిపొర్లుట',
    ta: 'கழிவுநீர் நிரம்பி வழிதல்',
    gu: 'ગટર ઉભરાવી',
    ur: 'نالی کا اوور فلو'
  },
  'Sewage Leakage': {
    en: 'Sewage Leakage',
    hi: 'सीवेज रिसाव',
    mr: 'सांडपाणी गळती',
    bn: 'পয়ঃনিষ্কাশন ফুটো',
    te: 'సీవరేజ్ లీకేజ్',
    ta: 'சாக்கடை நீர் கசிவு',
    gu: 'ગટરનું પાણી લિકેજ',
    ur: 'سیوریج کا رساؤ'
  },
  'Open Manhole': {
    en: 'Open Manhole',
    hi: 'खुला मैनहोल',
    mr: 'उघडे मॅनहोल',
    bn: 'খোলা ম্যানহোল',
    te: 'తెరిచి ఉన్న మ్యాన్‌హోల్',
    ta: 'திறந்திருக்கும் பாதாள சாக்கடை',
    gu: 'ખુલ્લું મેનહોલ',
    ur: 'کھلا مین ہول'
  },
  'Garbage Overflow': {
    en: 'Garbage Overflow',
    hi: 'कचरे का ढेर',
    mr: 'कचऱ्याचे ढीग',
    bn: 'আবর্জনার স্তূপ',
    te: 'చెత్త కుప్పలు',
    ta: 'குப்பைக் குவியல்',
    gu: 'કચરાના ઢગલા',
    ur: 'کچرے کے ڈھیر'
  },
  'Garbage Not Collected': {
    en: 'Garbage Not Collected',
    hi: 'कचरा नहीं उठाया गया',
    mr: 'कचरा उचलला नाही',
    bn: 'আবর্জনা সংগ্রহ করা হয়নি',
    te: 'చెత్త తరలించలేదు',
    ta: 'குப்பை அள்ளப்படவில்லை',
    gu: 'કચરો ઉપાડ્યો નથી',
    ur: 'کچرا نہیں اٹھایا گیا'
  },
  'Illegal Dumping': {
    en: 'Illegal Dumping',
    hi: 'अवैध कचरा डंपिंग',
    mr: 'बेकायदेशीर कचरा टाकणे',
    bn: 'অবৈধ বর্জ্য ফেলা',
    te: 'అక్రమంగా చెత్త వేయుట',
    ta: 'சட்டவிரோத குப்பை கொட்டுதல்',
    gu: 'ગેરકાયદે કચરો ફેંકવો',
    ur: 'غیر قانونی کوڑا پھینکنا'
  },
  'Damaged Dustbin': {
    en: 'Damaged Dustbin',
    hi: 'टूटा कूड़ेदान',
    mr: 'तुटलेली कचराकुंडी',
    bn: 'ভাঙা ডাস্টবিন',
    te: 'పాడైన డస్ట్‌బిన్',
    ta: 'உடைந்த குப்பைத்தொட்டி',
    gu: 'તૂટેલી કચરાપેટી',
    ur: 'ٹوٹا ہوا ڈسٹ بن'
  },
  'Streetlight Not Working': {
    en: 'Streetlight Not Working',
    hi: 'स्ट्रीटलाइट बंद है',
    mr: 'पथदिवा बंद आहे',
    bn: 'পথবাতি জ্বলছে না',
    te: 'స్ట్రీట్‌లైట్ వెలగడం లేదు',
    ta: 'தெருவிளக்கு எரியவில்லை',
    gu: 'સ્ટ્રીટલાઈટ બંધ છે',
    ur: 'اسٹریٹ لائٹ بند ہے'
  },
  'Damaged Streetlight': {
    en: 'Damaged Streetlight',
    hi: 'क्षतिग्रस्त स्ट्रीटलाइट',
    mr: 'खराब झालेला पथदिवा',
    bn: 'ভাঙা পথবাতি',
    te: 'దెబ్బతిన్న వీధి దీపం',
    ta: 'சேதமடைந்த தெருவிளக்கு',
    gu: 'તૂટેલી સ્ટ્રીટલાઈટ',
    ur: 'خراب اسٹریٹ لائٹ'
  },
  'Broken Pole': {
    en: 'Broken Pole',
    hi: 'टूटा बिजली का खंभा',
    mr: 'तुटलेला विजेचा खांब',
    bn: 'ভাঙা খুঁটি',
    te: 'విరిగిన స్తంభం',
    ta: 'உடைந்த மின் கம்பம்',
    gu: 'તૂટેલો થાંભલો',
    ur: 'ٹوٹا ہوا کھمبا'
  },
  'Electrical Wire Issue': {
    en: 'Electrical Wire Issue',
    hi: 'बिजली के तार की समस्या',
    mr: 'विद्युत तारांची समस्या',
    bn: 'বৈদ্যুতিক তারের সমস্যা',
    te: 'విద్యుత్ తీగల సమస్య',
    ta: 'மின் கம்பி கோளாறு',
    gu: 'વીજળીના તારની સમસ્યા',
    ur: 'بجلی کے تار کا مسئلہ'
  },
  'Power Supply Issue': {
    en: 'Power Supply Issue',
    hi: 'बिजली आपूर्ति समस्या',
    mr: 'वीज पुरवठा खंडित',
    bn: 'বিদ্যুৎ সরবরাহ সমস্যা',
    te: 'విద్యుత్ సరఫరా సమస్య',
    ta: 'மின் விநியோகக் குறைபாடு',
    gu: 'વીજ પુરવઠો ખોરવાયો',
    ur: 'بجلی کی بندش'
  },
  'Exposed Wires': {
    en: 'Exposed Wires',
    hi: 'खुले बिजली के तार',
    mr: 'उघड्या धोकादायक तारा',
    bn: 'খোলা তার',
    te: 'బయటకు వచ్చిన తీగలు',
    ta: 'ஆபத்தான திறந்த மின் கம்பிகள்',
    gu: 'ખુલ્લા લટકતા તાર',
    ur: 'کھلے ہوئے ننگے تار'
  },
  'Damaged Utility Pole': {
    en: 'Damaged Utility Pole',
    hi: 'झुका/क्षतिग्रस्त खंभा',
    mr: 'धोकादायक वाकलेला खांब',
    bn: 'ক্ষতিগ্রস্ত খুঁটি',
    te: 'వంగిన స్తంభం',
    ta: 'சேதமடைந்த கம்பம்',
    gu: 'ક્ષતિગ્રસ્ત થાંભલો',
    ur: 'خراب پول'
  },
  'Electrical Hazard': {
    en: 'Electrical Hazard',
    hi: 'बिजली का गंभीर खतरा',
    mr: 'विद्युत धोका',
    bn: 'বিদ্যুৎ ঝুঁকি',
    te: 'విద్యుత్ ప్రమాదం',
    ta: 'மின் விபத்து அபாயம்',
    gu: 'વીજ કરંટનો ભય',
    ur: 'بجلی کا خطرہ'
  },
  'Unclean Area': {
    en: 'Unclean Area',
    hi: 'गंदगी और अस्वच्छता',
    mr: 'अस्वच्छ परिसर',
    bn: 'নোংরা এলাকা',
    te: 'పరిశుభ్రత లేని ప్రాంతం',
    ta: 'சுகாதாரமற்ற பகுதி',
    gu: 'ગંદકીવાળો વિસ્તાર',
    ur: 'گندا علاقہ'
  },
  'Public Toilet Issue': {
    en: 'Public Toilet Issue',
    hi: 'सार्वजनिक शौचालय समस्या',
    mr: 'सार्वजनिक शौचालय समस्या',
    bn: 'পাবলিক টয়লেট সমস্যা',
    te: 'పబ్లిక్ టాయిలెట్ సమస్య',
    ta: 'பொதுக் கழிப்பறை குறைபாடு',
    gu: 'જાહેર શૌચાલય સમસ્યા',
    ur: 'عوامی بیت الخلاء کا مسئلہ'
  },
  'Unsanitary Conditions': {
    en: 'Unsanitary Conditions',
    hi: 'अस्वच्छ परिस्थितियां',
    mr: 'अस्वच्छ स्थिती',
    bn: 'অস্বাস্থ্যকর পরিবেশ',
    te: 'అపరిశుభ్రమైన పరిస్థితులు',
    ta: 'சுகாதாரமற்ற சூழல்',
    gu: 'અસ્વચ્છ સ્થિતિ',
    ur: 'غیر صحت بخش حالات'
  },
  'Open Defecation': {
    en: 'Open Defecation',
    hi: 'खुले में शौच',
    mr: 'उघड्यावर शौच',
    bn: 'উন্মুক্ত স্থানে মলত্যাগ',
    te: 'బహిరంగ మలవిసర్జన',
    ta: 'திறந்தவெளி மலம் கழித்தல்',
    gu: 'ખુલ્લામાં શૌચ',
    ur: 'کھلے میں رفع حاجت'
  },
  'Park Maintenance': {
    en: 'Park Maintenance',
    hi: 'पार्क रखरखाव',
    mr: 'पार्क देखभाल',
    bn: 'পার্ক রক্ষণাবেক্ষণ',
    te: 'పార్క్ నిర్వహణ',
    ta: 'பூங்கா பராமரிப்பு',
    gu: 'બગીચાની જાળવણી',
    ur: 'پارک کی دیکھ بھال'
  },
  'Damaged Equipment': {
    en: 'Damaged Equipment',
    hi: 'टूटे झूले व उपकरण',
    mr: 'तुटलेली खेळणी व उपकरणे',
    bn: 'ক্ষতিগ্রস্ত সরঞ্জাম',
    te: 'పాడైన ఆట వస్తువులు',
    ta: 'சேதமடைந்த விளையாட்டு உபகரணங்கள்',
    gu: 'તૂટેલા સાધનો',
    ur: 'ٹوٹے ہوئے آلات'
  },
  'Tree/Vegetation Issue': {
    en: 'Tree/Vegetation Issue',
    hi: 'पेड़ / शाखा समस्या',
    mr: 'झाडे / फांद्या समस्या',
    bn: 'গাছপালার সমস্যা',
    te: 'చెట్లు / కొమ్మల సమస్య',
    ta: 'மரம் / செடிகள் பிரச்சினை',
    gu: 'ઝાડવાની સમસ્યા',
    ur: 'درخت یا جھاڑیوں کا مسئلہ'
  },
  'Public Space Damage': {
    en: 'Public Space Damage',
    hi: 'सार्वजनिक संपत्ति क्षति',
    mr: 'सार्वजनिक मालमत्तेचे नुकसान',
    bn: 'পাবলিক স্পেস ক্ষতি',
    te: 'పబ్లిక్ స్పేస్ నష్టం',
    ta: 'பொது சொத்து சேதம்',
    gu: 'જાહેર સંપત્તિને નુકસાન',
    ur: 'عوامی جگہ کا نقصان'
  },
  'Illegal Parking': {
    en: 'Illegal Parking',
    hi: 'अवैध पार्किंग',
    mr: 'अनधिकृत पार्किंग',
    bn: 'অবৈধ পার্কিং',
    te: 'అక్రమ పార్కింగ్',
    ta: 'சட்டவிரோத வாகன நிறுத்தம்',
    gu: 'ગેરકાયદે પાર્કિંગ',
    ur: 'غیر قانونی پارکنگ'
  },
  'Traffic Signal Issue': {
    en: 'Traffic Signal Issue',
    hi: 'ट्रैफिक सिग्नल बंद',
    mr: 'वाहतूक सिग्नल बिघाड',
    bn: 'ট্রাফিক সিগন্যাল সমস্যা',
    te: 'ట్రాఫిక్ సిగ్నల్ సమస్య',
    ta: 'போக்குவரத்து சிக்னல் கோளாறு',
    gu: 'ટ્રાફિક સિગ્નલ ખરાબ',
    ur: 'ٹریفک سگنل کا مسئلہ'
  },
  'Road Obstruction': {
    en: 'Road Obstruction',
    hi: 'सड़क पर रुकावट',
    mr: 'रस्त्यावरील अडथळा',
    bn: 'রাস্তায় বাধা',
    te: 'రోడ్డు అడ్డంకి',
    ta: 'சாலை அடைப்பு',
    gu: 'રસ્તા પર અવરોધ',
    ur: 'سڑک پر رکاوٹ'
  },
  'Parking Issue': {
    en: 'Parking Issue',
    hi: 'पार्किंग समस्या',
    mr: 'पार्किंग समस्या',
    bn: 'পার্কিং সমস্যা',
    te: 'పార్కింగ్ సమస్య',
    ta: 'வாகன நிறுத்துமிடம் சிக்கல்',
    gu: 'પાર્કિંગ સમસ્યા',
    ur: 'پارکنگ کا مسئلہ'
  },
  'Illegal Encroachment': {
    en: 'Illegal Encroachment',
    hi: 'अवैध अतिक्रमण',
    mr: 'बेकायदेशीर अतिक्रमण',
    bn: 'অবৈধ দখল',
    te: 'అక్రమ ఆక్రమణ',
    ta: 'சட்டவிரோத ஆக்கிரமிப்பு',
    gu: 'ગેરકાયદે દબાણ',
    ur: 'ناجائز تجاوزات'
  },
  'Unauthorized Construction': {
    en: 'Unauthorized Construction',
    hi: 'अवैध निर्माण',
    mr: 'अनधिकृत बांधकाम',
    bn: 'অননুমোদিত নির্মাণ',
    te: 'అనధికారిక నిర్మాణం',
    ta: 'அனுமதியற்ற கட்டுமானம்',
    gu: 'ગેરકાયદે બાંધકામ',
    ur: 'غیر قانونی تعمیر'
  },
  'Footpath Encroachment': {
    en: 'Footpath Encroachment',
    hi: 'फुटपाथ पर कब्जा',
    mr: 'पदपथावरील अतिक्रमण',
    bn: 'ফুটপাত দখল',
    te: 'ఫుట్‌పాత్ ఆక్రమణ',
    ta: 'நடைபாதை ஆக்கிரமிப்பு',
    gu: 'ફૂટપાથ પર દબાણ',
    ur: 'فٹ پاتھ پر تجاوزات'
  },
  'Public Land Occupation': {
    en: 'Public Land Occupation',
    hi: 'सरकारी जमीन पर कब्जा',
    mr: 'सार्वजनिक जमिनीवर कब्जा',
    bn: 'সরকারি জমি দখল',
    te: 'ప్రభుత్వ భూమి ఆక్రమణ',
    ta: 'அரசு நில ஆக்கிரமிப்பு',
    gu: 'સરકારી જમીન પર કબજો',
    ur: 'سرکاری زمین پر قبضہ'
  },
  'Damaged Footpath': {
    en: 'Damaged Footpath',
    hi: 'टूटा हुआ फुटपाथ',
    mr: 'तुटलेला पदपथ',
    bn: 'ভাঙা ফুটপাত',
    te: 'పాడైన ఫుట్‌పాత్',
    ta: 'உடைந்த நடைபாதை',
    gu: 'તૂટેલો ફૂટપાથ',
    ur: 'ٹوٹا ہوا فٹ پاتھ'
  },
  'Damaged Bus Stop': {
    en: 'Damaged Bus Stop',
    hi: 'टूटा बस स्टॉप / शेल्टर',
    mr: 'तुटलेला बस थांबा',
    bn: 'ক্ষতিগ্রস্ত বাস স্টপ',
    te: 'పాడైన బస్ స్టాప్',
    ta: 'சேதமடைந்த பேருந்து நிறுத்தம்',
    gu: 'તૂટેલું બસ સ્ટેન્ડ',
    ur: 'خراب بس اسٹاپ'
  },
  'Broken Signboard': {
    en: 'Broken Signboard',
    hi: 'टूटा दिशा बोर्ड / साइनबोर्ड',
    mr: 'तुटलेला दिशादर्शक फलक',
    bn: 'ভাঙা সাইনবোর্ড',
    te: 'విరిగిన సైన్‌బోర్డు',
    ta: 'உடைந்த அறிவிப்பு பலகை',
    gu: 'તૂટેલું સાઈનબોર્ડ',
    ur: 'ٹوٹا ہوا سائن بورڈ'
  },
  'Damaged Public Property': {
    en: 'Damaged Public Property',
    hi: 'सार्वजनिक संपत्ति को नुकसान',
    mr: 'सार्वजनिक मालमत्तेचे नुकसान',
    bn: 'পাবলিক প্রপার্টি ক্ষতি',
    te: 'ప్రజా ఆస్తి నష్టం',
    ta: 'பொது சொத்து சேதம்',
    gu: 'જાહેર મિલકતને નુકસાન',
    ur: 'عوامی املاک کا نقصان'
  },
  'Stray Animals': {
    en: 'Stray Animals',
    hi: 'आवारा पशु समस्या',
    mr: 'भटक्या जनावरांची समस्या',
    bn: 'বেওয়ারিশ প্রাণী',
    te: 'వీధి జంతువులు',
    ta: 'தெரு விலங்குகள் தொல்லை',
    gu: 'રખડતા ઢોરની સમસ્યા',
    ur: 'آوارہ جانور'
  },
  'Noise Complaint': {
    en: 'Noise Complaint',
    hi: 'अत्यधिक शोर की शिकायत',
    mr: 'मोठ्या आवाजाची तक्रार',
    bn: 'শব্দ দূষণ অভিযোগ',
    te: 'శబ్ద కాలుష్యం ఫిర్యాదు',
    ta: 'இரைச்சல் புகார்',
    gu: 'અવાજ પ્રદૂષણ ફરિયાદ',
    ur: 'شور کی شکایت'
  },
  'Public Nuisance': {
    en: 'Public Nuisance',
    hi: 'सार्वजनिक उपद्रव',
    mr: 'सार्वजनिक उपद्रव',
    bn: 'পাবলিক উপদ্রব',
    te: 'ప్రజా ఇబ్బందులు',
    ta: 'பொது மக்களுக்கு இடையூறு',
    gu: 'જાહેર ઉપદ્રવ',
    ur: 'عوامی پریشانی'
  },
  'Other Issue': {
    en: 'Other Issue',
    hi: 'अन्य नागरिक समस्या',
    mr: 'इतर नागरी समस्या',
    bn: 'অন্যান্য সমস্যা',
    te: 'ఇతర సమస్యలు',
    ta: 'பிற புகார்கள்',
    gu: 'અન્ય સમસ્યા',
    ur: 'دیگر مسئلہ'
  }
}

// ── Known Seed Reports Translations ─────────────────────────────────────────
export const SEED_REPORTS_TRANSLATIONS: Record<string, Record<Language, { title: string; address: string; description: string }>> = {
  'report-1': {
    en: {
      title: 'Deep pothole near crossroads',
      address: 'Kranti Chowk, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'A deep pothole has opened up right in the middle of the main junction, dangerous for two-wheelers.'
    },
    hi: {
      title: 'चौराहे के पास गहरा गड्ढा',
      address: 'क्रांति चौक, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'मुख्य चौराहे के ठीक बीच में एक गहरा गड्ढा हो गया है, जो दोपहिया वाहनों के लिए बेहद खतरनाक है।'
    },
    mr: {
      title: 'चौकाजवळ रस्त्यावर मोठा खड्डा',
      address: 'क्रांती चौक, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'मुख्य चौकात मध्यभागी मोठा खड्डा पडला असून दुचाकीस्वारांसाठी अपघाताचा गंभीर धोका निर्माण झाला आहे.'
    },
    bn: {
      title: 'মোড়ের কাছে গভীর গর্ত',
      address: 'ক্রান্তি চক, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'প্রধান মোড়ের ঠিক মাঝখানে একটি গভীর গর্ত তৈরি হয়েছে, যা দুই চাকার যানের জন্য অত্যন্ত বিপজ্জনক।'
    },
    te: {
      title: 'కూడలి వద్ద పెద్ద గుంత',
      address: 'క్రాంతి చౌక్, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'ప్రధాన కూడలి మధ్యలో పెద్ద గుంత ఏర్పడింది, ద్విచక్ర వాహనదారులకు ప్రమాదకరంగా మారింది.'
    },
    ta: {
      title: 'சந்திப்பில் ஆழமான சாலைக் குழி',
      address: 'கிராந்தி சௌக், சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'முக்கிய சந்திப்பின் நடுவில் ஒரு பெரிய குழி விழுந்துள்ளது, இருசக்கர வாகனங்களுக்கு ஆபத்தானது.'
    },
    gu: {
      title: 'ચાર રસ્તા પાસે ઊંડો ખાડો',
      address: 'ક્રાંતિ ચોક, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'મુખ્ય જંક્શનની બરાબર વચ્ચે એક ઊંડો ખાડો પડી ગયો છે, જે દ્વિચક્રી વાહનો માટે જોખમી છે.'
    },
    ur: {
      title: 'چوراہے کے قریب گہرا گڑھا',
      address: 'کرانتی چوک، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'مرکزی چوراہے کے عین درمیان میں ایک گہرا گڑھا بن گیا ہے جو دو پہیہ گاڑیوں کے لیے خطرناک ہے۔'
    }
  },
  'report-2': {
    en: {
      title: 'Broken streetlight causing dark alley',
      address: 'Jalna Road, CIDCO, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'The streetlight near the park entrance has been flickering and is now completely dead.'
    },
    hi: {
      title: 'स्ट्रीटलाइट बंद होने से अंधेरी गली',
      address: 'जालना रोड, सिडको, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'पार्क के प्रवेश द्वार के पास की स्ट्रीटलाइट खराब है और अब पूरी तरह बंद है जिससे रात में अंधेरा रहता है।'
    },
    mr: {
      title: 'बंद पथदिवा व अंधारी गल्ली',
      address: 'जालना रोड, सिडको, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'उद्यानाच्या प्रवेशद्वाराजवळील पथदिवा अनेक दिवसांपासून बंद असून परिसरात अंधार पसरला आहे.'
    },
    bn: {
      title: 'ভাঙা পথবাতি অন্ধকার গলি তৈরি করছে',
      address: 'জালনা রোড, সিডকো, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'পার্কের প্রবেশপথের কাছে পথবাতিটি নষ্ট হয়ে গেছে এবং বর্তমানে সম্পূর্ণ বন্ধ।'
    },
    te: {
      title: 'వీధి దీపం వెలగక చీకటిగా మారిన సందు',
      address: 'జాల్నా రోడ్, సిడ్కో, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'పార్కు ప్రవేశ ద్వారం వద్ద వీధి దీపం పనిచేయక పూర్తిగా చీకటిగా మారింది.'
    },
    ta: {
      title: 'தெருவிளக்கு எரியாததால் இருண்ட சந்து',
      address: 'ஜால்னா ரோடு, சிட்கோ, சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'பூங்கா நுழைவாயில் அருகேயுள்ள தெருவிளக்கு பழுதடைந்து முற்றிலும் அணைந்துவிட்டது.'
    },
    gu: {
      title: 'બંધ સ્ટ્રીટલાઈટના કારણે અંધારી ગલી',
      address: 'જાલના રોડ, સિડકો, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'પાર્કના પ્રવેશદ્વાર પાસેની સ્ટ્રીટલાઈટ બંધ છે જેથી રાત્રે ખૂબ અંધારું રહે છે.'
    },
    ur: {
      title: 'اسٹریٹ لائٹ بند ہونے سے تاریک گلی',
      address: 'جالنہ روڈ، سڈکو، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'پارک کے داخلی راستے کے قریب اسٹریٹ لائٹ خراب ہے اور اب مکمل طور پر بند ہے۔'
    }
  },
  'report-3': {
    en: {
      title: 'Water leaking from main line',
      address: 'Station Road, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'Clean drinking water is bursting out of the pipe under the pavement.'
    },
    hi: {
      title: 'मुख्य पाइपलाइन से पानी का रिसाव',
      address: 'स्टेशन रोड, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'फुटपाथ के नीचे पाइप से पीने का साफ पानी तेजी से बह रहा है और बर्बाद हो रहा है।'
    },
    mr: {
      title: 'मुख्य पाईपलाईनमधून पाण्याची गळती',
      address: 'स्टेशन रोड, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'पदपथाखालील मुख्य जलवाहिनी फुटल्याने पिण्याच्या पाण्याचा प्रचंड अपव्यय होत आहे.'
    },
    bn: {
      title: 'মূল পাইপলাইন থেকে পানি ফুটো',
      address: 'স্টেশন রোড, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'ফুটপাথের নিচে পাইপ থেকে পরিষ্কার পানীয় জল বেরিয়ে নষ্ট হচ্ছে।'
    },
    te: {
      title: 'ప్రధాన పైపు నుండి నీటి లీకేజ్',
      address: 'స్టేషన్ రోడ్, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'ఫుట్‌పాత్ కింద పైపు పగిలి మంచినీరు వృథాగా ప్రవహిస్తోంది.'
    },
    ta: {
      title: 'முக்கிய குழாயிலிருந்து குடிநீர் கசிவு',
      address: 'ஸ்டேஷன் ரோடு, சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'நடைபாதைக்கு அடியில் உள்ள குடிநீர் குழாய் உடைந்து நல்ல தண்ணீர் வீணாகிறது.'
    },
    gu: {
      title: 'મુખ્ય લાઈનમાંથી પાણીની ગળતર',
      address: 'સ્ટેશન રોડ, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'ફૂટપાથ નીચેની પાઈપલાઈન તૂટી જતાં પીવાનું ચોખ્ખું પાણી વેડફાઈ રહ્યું છે.'
    },
    ur: {
      title: 'مین پائپ لائن سے پانی کا رساؤ',
      address: 'اسٹیشن روڈ، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'فٹ پاتھ کے نیچے پائپ سے پینے کا صاف پانی نکل کر ضائع ہو رہا ہے۔'
    }
  },
  'report-4': {
    en: {
      title: 'Overflowing public garbage bin',
      address: 'Shahganj Market Road, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'Garbage has accumulated over the past week and spilled onto the road, attracting stray animals.'
    },
    hi: {
      title: 'सार्वजनिक कूड़ेदान से कचरा ओवरफ्लो',
      address: 'शाहगंज मार्केट रोड, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'पिछले एक सप्ताह से कचरा जमा हो गया है और सड़क पर फैल रहा है, जिससे दुर्गंध और आवारा पशु बढ़ रहे हैं।'
    },
    mr: {
      title: 'सार्वजनिक कचराकुंडी तुडुंब भरून वाहत आहे',
      address: 'शहागंज मार्केट रोड, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'आठवडाभरापासून कचरा न उचलल्याने रस्त्यावर कचऱ्याचे साम्राज्य पसरले आहे आणि दुर्गंधी येत आहे.'
    },
    bn: {
      title: 'উপচে পড়া পাবলিক ডাস্টবিন',
      address: 'শাহগঞ্জ মার্কেট রোড, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'গত এক সপ্তাহ ধরে আবর্জনা জমে রাস্তায় ছড়িয়ে পড়েছে এবং তীব্র দুর্গন্ধ ছড়াচ্ছে।'
    },
    te: {
      title: 'చెత్తకుండీ పొంగిపొర్లడం',
      address: 'షాహగంజ్ మార్కెట్ రోడ్, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'వారం రోజులుగా చెత్త తరలించకపోవడంతో రోడ్డుపైకి చేరి తీవ్ర దుర్గంధం వస్తోంది.'
    },
    ta: {
      title: 'நிரம்பி வழியும் பொதுக் குப்பைத் தொட்டி',
      address: 'ஷாகஞ்ச் மார்க்கெட் ரோடு, சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'கடந்த ஒரு வாரமாக குப்பை அள்ளப்படாததால் சாலையில் சிதறி துர்நாற்றம் வீசுகிறது.'
    },
    gu: {
      title: 'જાહેર કચરાપેટીમાંથી કચરો ઉભરાયો',
      address: 'શાહગંજ માર્કેટ રોડ, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'છેલ્લા એક અઠવાડિયાથી કચરો જમા થવાથી રસ્તા પર ફેલાઈ રહ્યો છે અને દુર્ગંધ આવી રહી છે.'
    },
    ur: {
      title: 'کوڑے دان سے کوڑا باہر پھیل رہا ہے',
      address: 'شاہ گنج مارکیٹ روڈ، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'گزشتہ ایک ہفتے سے کچرا جمع ہے اور سڑک پر پھیل رہا ہے جس سے بدبو پھیل رہی ہے۔'
    }
  },
  'report-5': {
    en: {
      title: 'Blocked storm drain causing road flooding',
      address: 'Shahnoorwadi Main Road, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'Heavy silt and plastic waste is completely blocking the rainwater drain near the residential junction.'
    },
    hi: {
      title: 'जल निकासी नाली बंद होने से सड़क पर जलभराव',
      address: 'शाहनूरवाड़ी मुख्य मार्ग, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'कचरे और गाद के कारण बरसाती नाली पूरी तरह बंद हो गई है, जिससे बारिश का पानी सड़क पर भर रहा है।'
    },
    mr: {
      title: 'पावसाळी गटार तुंबल्याने रस्त्यावर पाणी साचले',
      address: 'शाहनूरवाडी मुख्य रस्ता, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'कचरा आणि माती साचल्याने पावसाळी ड्रेनेज बंद झाले असून रस्त्यावर तळे साचले आहे.'
    },
    bn: {
      title: 'নর্দমা বন্ধ হয়ে রাস্তায় জলাবদ্ধতা',
      address: 'শাহনুরওয়াদি মেইন রোড, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'আবর্জনা ও পলি জমে বৃষ্টির ড্রেন বন্ধ হয়ে গেছে এবং রাস্তায় পানি জমেছে।'
    },
    te: {
      title: 'డ్రైనేజీ పూడికతో రోడ్డుపై నీరు నిలవడం',
      address: 'షానూర్వాడి మెయిన్ రోడ్, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'చెత్తాచెదారం వల్ల వర్షపు నీటి కాలువ మూసుకుపోయి రోడ్డుపై నీరు నిలిచిపోయింది.'
    },
    ta: {
      title: 'வடிகால் அடைப்பால் சாலையில் மழைநீர் தேக்கம்',
      address: 'ஷானூர்வாடி மெயின் ரோடு, சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'மழைநீர் வடிகால் அடைபட்டு சாலையில் தண்ணீர் தேங்கி நிற்கிறது.'
    },
    gu: {
      title: 'ગટર ભરાઈ જવાથી રસ્તા પર પાણી ભરાયું',
      address: 'શાહન્નૂરવાડી મુખ્ય રોડ, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'કચરો ભરાઈ જવાથી વરસાદી પાણીનો નિકાલ થતો નથી અને રસ્તો જળબંબાકાર છે.'
    },
    ur: {
      title: 'نالی بند ہونے سے سڑک پر پانی جمع',
      address: 'شاہ نور واڑی مین روڈ، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'بارش کی نالی کچرے کی وجہ سے مکمل بند ہے جس سے سڑک پر پانی جمع ہو رہا ہے۔'
    }
  },
  'report-6': {
    en: {
      title: 'Traffic signal malfunctioning at busy junction',
      address: 'Baba Petrol Pump Chowk, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'The green signal is not lighting up, leading to severe confusion and vehicle gridlock during rush hour.'
    },
    hi: {
      title: 'व्यस्त चौराहे पर ट्रैफिक सिग्नल खराब',
      address: 'बाबा पेट्रोल पंप चौक, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'ग्रीन सिग्नल नहीं जल रहा है, जिससे पीक आवर्स के दौरान भारी भ्रम और ट्रैफिक जाम हो रहा है।'
    },
    mr: {
      title: 'गर्दीच्या चौकातील वाहतूक सिग्नल बिघाड',
      address: 'बाबा पेट्रोल पंप चौक, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'हिरवा दिवा लागत नसल्यामुळे गर्दीच्या वेळेत वाहतूक कोंडी आणि वाहनांची गोंधळाची स्थिती निर्माण झाली आहे.'
    },
    bn: {
      title: 'ব্যস্ত মোড়ে ট্রাফিক সিগন্যাল বিকল',
      address: 'বাবা পেট্রোল পাম্প চক, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'সবুজ বাতি জ্বলছে না, যার ফলে ব্যস্ত সময়ে তীব্র যানজট তৈরি হচ্ছে।'
    },
    te: {
      title: 'రద్దీ కూడలి వద్ద ట్రాఫిక్ సిగ్నల్ పనిచేయడం లేదు',
      address: 'బాబా పెట్రోల్ పంప్ చౌక్, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'గ్రీన్ సిగ్నల్ వెలగడం లేదు, పీక్ అవర్స్‌లో తీవ్రమైన ట్రాఫిక్ జామ్ అవుతోంది.'
    },
    ta: {
      title: 'போக்குவரத்து சிக்னல் கோளாறு',
      address: 'பாபா பெட்ரோல் பங்க் சௌக், சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'பச்சை விளக்கு எரியாததால் பீக் ஹவர்ஸில் கடும் போக்குவரத்து நெரிசல் ஏற்படுகிறது.'
    },
    gu: {
      title: 'વ્યસ્ત ચાર રસ્તા પર ટ્રાફિક સિગ્નલ ખરાબ',
      address: 'બાબા પેટ્રોલ પંપ ચોક, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'લીલી બત્તી થતી નથી જેથી વાહનોનો ભારે ટ્રાફિક જામ થઈ રહ્યો છે.'
    },
    ur: {
      title: 'ٹریفک سگنل خراب ہونے سے شدید رش',
      address: 'بابا پیٹرول پمپ چوک، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'گرین سگنل نہیں جل رہا جس کی وجہ سے ٹریفک جام ہو رہا ہے۔'
    }
  },
  'report-7': {
    en: {
      title: 'Large fallen tree branch obstructing park trail',
      address: 'Siddharth Garden & Zoo, Chhatrapati Sambhaji Nagar, Maharashtra',
      description: 'Recent winds broke a heavy bough that now blocks the primary jogging and walking track.'
    },
    hi: {
      title: 'पार्क के रास्ते पर भारी पेड़ की डाल गिरी',
      address: 'सिद्धार्थ गार्डन एवं चिड़ियाघर, छत्रपति संभाजी नगर, महाराष्ट्र',
      description: 'तेज हवा से पेड़ की भारी डाल टूटकर जॉगिंग ट्रैक पर गिर गई है जिससे रास्ता बंद हो गया है।'
    },
    mr: {
      title: 'उद्यानातील धावण्याच्या मार्गावर मोठी फांदी पडली',
      address: 'सिद्धार्थ उद्यान व प्राणीसंग्रहालय, छत्रपती संभाजीनगर, महाराष्ट्र',
      description: 'वाऱ्यामुळे झाडाची मोठी फांदी तुटून जॉगिंग ट्रॅकवर पडल्याने मार्ग अडवला गेला आहे.'
    },
    bn: {
      title: 'পার্কের রাস্তায় গাছের ডাল ভেঙে পড়েছে',
      address: 'সিদ্ধার্থ গার্ডেন ও চিড়িয়াখানা, ছত্রপতী সম্ভাজিনগর, মহারাষ্ট্র',
      description: 'ঝড়ে গাছের একটি ভারী ডাল ভেঙে হাঁটার প্রধান পথ বন্ধ করে দিয়েছে।'
    },
    te: {
      title: 'పార్కులో పెద్ద చెట్టు కొమ్మ విరిగిపడింది',
      address: 'సిద్ధార్థ్ గార్డెన్ & జూ, ఛత్రపతి శంభాజీనగర్, మహారాష్ట్ర',
      description: 'ఈదురు గాలులకు పెద్ద కొమ్మ విరిగి వాకింగ్ ట్రాక్‌పై పడింది.'
    },
    ta: {
      title: 'பூங்காவில் உடைந்த மரக்கிளை வழியை மறித்துள்ளது',
      address: 'சித்தார்த் கார்டன் & உயிரியல் பூங்கா, சத்ரபதி சம்பாஜிநகர், மகாராஷ்டிரா',
      description: 'பெரிய மரக்கிளை முறிந்து நடைபாதையை மறித்துள்ளது.'
    },
    gu: {
      title: 'બગીચાના રસ્તા પર ઝાડની ડાળી પડી',
      address: 'સિદ્ધાર્થ ગાર્ડન અને પ્રાણી સંગ્રહાલય, છત્રપતિ સંભાજીનગર, મહારાષ્ટ્ર',
      description: 'મોટી ડાળી તૂટીને જોગિંગ ટ્રેક પર પડી હોવાથી રસ્તો બ્લોક થઈ ગયો છે.'
    },
    ur: {
      title: 'پارک کے راستے پر درخت کی بھاری شاخ گر گئی',
      address: 'سدھارتھ گارڈن و چڑیا گھر، چھترپتی سمبھاجی نگر، مہاراشٹر',
      description: 'ہوا کی وجہ سے درخت کی شاخ ٹوٹ کر جاگنگ ٹریک پر گر گئی ہے۔'
    }
  }
}

// ── Common Address Terms Dictionary ─────────────────────────────────────────
const LOCATION_REPLACEMENTS: Record<string, Record<Language, string>> = {
  'Chhatrapati Sambhaji Nagar': {
    en: 'Chhatrapati Sambhaji Nagar',
    hi: 'छत्रपति संभाजी नगर',
    mr: 'छत्रपती संभाजीनगर',
    bn: 'ছত্রপতী সম্ভাজিনগর',
    te: 'ఛత్రపతి శంభాజీనగర్',
    ta: 'சத்ரபதி சம்பாஜிநகர்',
    gu: 'છત્રપતિ સંભાજીનગર',
    ur: 'چھترپتی سمبھاجی نگر'
  },
  'Aurangabad': {
    en: 'Aurangabad',
    hi: 'औरंगाबाद',
    mr: 'औरंगाबाद',
    bn: 'ঔরঙ্গাবাদ',
    te: 'ఔరంగాబాద్',
    ta: 'அவுரங்காபாத்',
    gu: 'ઔરંગાબાદ',
    ur: 'اورنگ آباد'
  },
  'Maharashtra': {
    en: 'Maharashtra',
    hi: 'महाराष्ट्र',
    mr: 'महाराष्ट्र',
    bn: 'মহারাষ্ট্র',
    te: 'మహారాష్ట్ర',
    ta: 'மகாராஷ்டிரா',
    gu: 'મહારાષ્ટ્ર',
    ur: 'مہاراشٹر'
  },
  'Kranti Chowk': {
    en: 'Kranti Chowk',
    hi: 'क्रांति चौक',
    mr: 'क्रांती चौक',
    bn: 'ক্রান্তি চক',
    te: 'క్రాంతి చౌక్',
    ta: 'கிராந்தி சௌக்',
    gu: 'ક્રાંતિ ચોક',
    ur: 'کرانتی چوک'
  },
  'Jalna Road': {
    en: 'Jalna Road',
    hi: 'जालना रोड',
    mr: 'जालना रस्ता',
    bn: 'জালনা রোড',
    te: 'జాల్నా రోడ్',
    ta: 'ஜால்னா சாலை',
    gu: 'જાલના રોડ',
    ur: 'جالنہ روڈ'
  },
  'Station Road': {
    en: 'Station Road',
    hi: 'स्टेशन रोड',
    mr: 'स्टेशन रस्ता',
    bn: 'স্টেশন রোড',
    te: 'స్టేషన్ రోడ్',
    ta: 'ஸ்டேஷன் சாலை',
    gu: 'સ્ટેશન રોડ',
    ur: 'اسٹیشن روڈ'
  },
  'Shahganj Market Road': {
    en: 'Shahganj Market Road',
    hi: 'शाहगंज मार्केट रोड',
    mr: 'शहागंज मार्केट रस्ता',
    bn: 'শাহগঞ্জ মার্কেট রোড',
    te: 'షాహగంజ్ మార్కెట్ రోడ్',
    ta: 'ஷாகஞ்ச் மார்க்கெட் சாலை',
    gu: 'શાહગંજ માર્કેટ રોડ',
    ur: 'شاہ گنج مارکیٹ روڈ'
  },
  'Shahnoorwadi Main Road': {
    en: 'Shahnoorwadi Main Road',
    hi: 'शाहनूरवाड़ी मुख्य मार्ग',
    mr: 'शाहनूरवाडी मुख्य रस्ता',
    bn: 'শাহনুরওয়াদি মেইন রোড',
    te: 'షానూర్వాడి మెయిన్ రోడ్',
    ta: 'ஷானூர்வாடி பிரதான சாலை',
    gu: 'શાહન્નૂરવાડી મુખ્ય રોડ',
    ur: 'شاہ نور واڑی مین روڈ'
  },
  'Baba Petrol Pump Chowk': {
    en: 'Baba Petrol Pump Chowk',
    hi: 'बाबा पेट्रोल पंप चौक',
    mr: 'बाबा पेट्रोल पंप चौक',
    bn: 'বাবা পেট্রোল পাম্প চক',
    te: 'బాబా పెట్రోల్ పంప్ చౌక్',
    ta: 'பாபா பெட்ரோல் பங்க் சௌக்',
    gu: 'બાબા પેટ્રોલ પંપ ચોક',
    ur: 'بابا پیٹرول پمپ چوک'
  },
  'CIDCO': {
    en: 'CIDCO',
    hi: 'सिडको',
    mr: 'सिडको',
    bn: 'সিডকো',
    te: 'సిడ్కో',
    ta: 'சிட்கோ',
    gu: 'સિડકો',
    ur: 'سڈکو'
  },
  'Road': {
    en: 'Road',
    hi: 'रोड',
    mr: 'रस्ता',
    bn: 'রোড',
    te: 'రోడ్డు',
    ta: 'சாலை',
    gu: 'રોડ',
    ur: 'روڈ'
  },
  'Street': {
    en: 'Street',
    hi: 'गली / मार्ग',
    mr: 'गल्ली / रस्ता',
    bn: 'রাস্তা',
    te: 'వీధి',
    ta: 'தெரு',
    gu: 'શેરી',
    ur: 'گلی'
  },
  'Near': {
    en: 'Near',
    hi: 'के पास',
    mr: 'जवळ',
    bn: 'নিকটে',
    te: 'సమీపంలో',
    ta: 'அருகில்',
    gu: 'પાસે',
    ur: 'کے قریب'
  }
}

// ── Status Text Translations for Notifications ──────────────────────────────
export const STATUS_LABELS: Record<string, Record<Language, string>> = {
  pending: {
    en: 'Pending',
    hi: 'समीक्षाधीन (लंबित)',
    mr: 'प्रलंबित',
    bn: 'অপেক্ষারত',
    te: 'పరిశీలనలో ఉంది',
    ta: 'நிலுவையில் உள்ளது',
    gu: 'બાકી',
    ur: 'زیر التواء'
  },
  verified: {
    en: 'Verified',
    hi: 'सत्यापित',
    mr: 'पडताळणी झाली',
    bn: 'যাচাইকৃত',
    te: 'ధృవీకరించబడింది',
    ta: 'சரிபார்க்கப்பட்டது',
    gu: 'ચકાસાયેલ',
    ur: 'تصدیق شدہ'
  },
  in_progress: {
    en: 'In Progress',
    hi: 'कार्य प्रगति पर है',
    mr: 'काम प्रगतीपथावर आहे',
    bn: 'কাজ চলছে',
    te: 'పని జరుగుతోంది',
    ta: 'பணி நடப்பில் உள்ளது',
    gu: 'કામ ચાલુ છે',
    ur: 'کام جاری ہے'
  },
  resolved: {
    en: 'Resolved',
    hi: 'समाधान हो गया (हल)',
    mr: 'सोडवले गेले',
    bn: 'সমাধান হয়েছে',
    te: 'పరిష్కరించబడింది',
    ta: 'தீர்க்கப்பட்டது',
    gu: 'ઉકેલાઈ ગયું',
    ur: 'حل ہو گیا'
  },
  rejected: {
    en: 'Rejected',
    hi: 'अस्वीकृत',
    mr: 'नाकारले',
    bn: 'প্রত্যাখ্যাত',
    te: 'తిరస్కరించబడింది',
    ta: 'நிராகரிக்கப்பட்டது',
    gu: 'નકારાયેલ',
    ur: 'مسترد'
  }
}

// ── Helper: Localize Subcategory ───────────────────────────────────────────
export function getLocalizedSubcategory(sub: string, lang: Language): string {
  if (!sub || lang === 'en') return sub
  const trimmed = sub.trim()
  if (SUBCATEGORY_TRANSLATIONS[trimmed]?.[lang]) {
    return SUBCATEGORY_TRANSLATIONS[trimmed][lang]
  }
  // Try case-insensitive matching
  const key = Object.keys(SUBCATEGORY_TRANSLATIONS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  )
  if (key && SUBCATEGORY_TRANSLATIONS[key]?.[lang]) {
    return SUBCATEGORY_TRANSLATIONS[key][lang]
  }
  return sub
}

// ── Helper: Localize Department ────────────────────────────────────────────
export function getLocalizedDepartment(
  dept: DepartmentInfo | null | undefined,
  lang: Language
): { name: string; shortName: string } {
  if (!dept) {
    return { name: 'Municipality', shortName: 'Gov' }
  }
  if (lang === 'en') {
    return { name: dept.name, shortName: dept.shortName || 'Dept' }
  }
  const id = dept.id?.toLowerCase()
  if (id && DEPARTMENT_TRANSLATIONS[id]?.[lang]) {
    return DEPARTMENT_TRANSLATIONS[id][lang]
  }
  // Try finding by name matching
  const matched = Object.values(DEPARTMENT_TRANSLATIONS).find(
    (d) => d.en.name.toLowerCase() === dept.name?.toLowerCase() ||
           d.en.shortName.toLowerCase() === dept.shortName?.toLowerCase()
  )
  if (matched?.[lang]) {
    return matched[lang]
  }
  return { name: dept.name, shortName: dept.shortName || 'Dept' }
}

// ── Helper: Localize Location / Address ─────────────────────────────────────
export function getLocalizedLocation(address: string, lang: Language): string {
  if (!address || lang === 'en') return address
  let result = address
  for (const [englishTerm, langMap] of Object.entries(LOCATION_REPLACEMENTS)) {
    if (langMap[lang] && result.includes(englishTerm)) {
      result = result.replace(new RegExp(englishTerm, 'g'), langMap[lang])
    }
  }
  return result
}

// ── Helper: Localize Report ─────────────────────────────────────────────────
export function getLocalizedReport<T extends { id?: string; title?: string; address?: string; description?: string }>(
  report: T,
  lang: Language
): T {
  if (!report || lang === 'en') return report

  // 1. Direct seed report match
  if (report.id && SEED_REPORTS_TRANSLATIONS[report.id]?.[lang]) {
    const seed = SEED_REPORTS_TRANSLATIONS[report.id][lang]
    return {
      ...report,
      title: seed.title || report.title,
      address: seed.address || report.address,
      description: seed.description || report.description,
    }
  }

  // 2. Generic translation for user-submitted reports
  let translatedTitle = report.title || ''
  let translatedDesc = report.description || ''
  let translatedAddress = getLocalizedLocation(report.address || '', lang)

  // Check if title matches any subcategory
  for (const [subKey, translations] of Object.entries(SUBCATEGORY_TRANSLATIONS)) {
    if (translatedTitle.toLowerCase().includes(subKey.toLowerCase()) && translations[lang]) {
      translatedTitle = translatedTitle.replace(new RegExp(subKey, 'gi'), translations[lang])
    }
  }

  // Match common problem keywords in title / description
  const COMMON_TITLE_PATTERNS: Record<string, Record<Language, string>> = {
    'Severe Potholes and Road': {
      en: 'Severe Potholes and Road Damage',
      hi: 'गंभीर गड्ढे और सड़क क्षति',
      mr: 'रस्त्यावरील गंभीर खड्डे व नुकसान',
      bn: 'রাস্তার মারাত্মক গর্ত ও ক্ষতি',
      te: 'తీవ్రమైన రోడ్డు గుంతలు మరియు నష్టం',
      ta: 'கடுமையான சாலைக் குழிகள் மற்றும் சேதம்',
      gu: 'ગંભીર ખાડા અને રસ્તાને નુકસાન',
      ur: 'سڑک پر شدید گڑھے اور نقصان'
    },
    'Illegal Dumping and': {
      en: 'Illegal Garbage Dumping',
      hi: 'अवैध कचरा डंपिंग',
      mr: 'बेकायदेशीर कचरा टाकणे',
      bn: 'অবৈধ বর্জ্য ফেলা',
      te: 'అక్రమంగా చెత్త వేయుట',
      ta: 'சட்டவிரோத குப்பை கொட்டுதல்',
      gu: 'ગેરકાયદે કચરો ફેંકવો',
      ur: 'غیر قانونی کوڑا پھینکنا'
    }
  }

  for (const [pattern, map] of Object.entries(COMMON_TITLE_PATTERNS)) {
    if (translatedTitle.toLowerCase().includes(pattern.toLowerCase()) && map[lang]) {
      translatedTitle = map[lang]
    }
  }

  return {
    ...report,
    title: translatedTitle,
    address: translatedAddress,
    description: translatedDesc,
  }
}

// ── Helper: Localize Notification Message ────────────────────────────────────
export function getLocalizedNotification(
  notif: { title?: string; message?: string; type?: string; report_id?: string },
  lang: Language
): { title: string; message: string } {
  if (!notif) return { title: '', message: '' }
  if (lang === 'en') {
    return {
      title: notif.title || 'Notification',
      message: notif.message || '',
    }
  }

  const msg = notif.message || ''

  // 1. Status change pattern:
  // "Your reported issue "X" status has been changed to Y."
  // OR 'The "X" status has been changed to Y.'
  const statusMatch = msg.match(/(?:Your reported issue|The|Issue)\s+"([^"]+)"(?:\s+status)?\s+has been changed to\s+([a-zA-Z_]+)/i)
  if (statusMatch) {
    const rawIssueTitle = statusMatch[1]
    const rawStatus = statusMatch[2].toLowerCase().replace(/\.$/, '')

    const localizedStatus = STATUS_LABELS[rawStatus]?.[lang] || rawStatus
    const localizedTitle = getLocalizedReport({ id: notif.report_id, title: rawIssueTitle }, lang).title

    const TEMPLATES: Record<Language, string> = {
      en: `Your reported issue "${localizedTitle}" status has been changed to ${localizedStatus}.`,
      hi: `आपकी रिपोर्ट की गई समस्या "${localizedTitle}" की स्थिति बदलकर ${localizedStatus} कर दी गई है।`,
      mr: `तुमच्या नोंदवलेल्या समस्येची "${localizedTitle}" स्थिती बदलून ${localizedStatus} करण्यात आली आहे.`,
      bn: `আপনার রিপোর্ট করা সমস্যা "${localizedTitle}"-এর স্থিতি পরিবর্তন করে ${localizedStatus} করা হয়েছে।`,
      te: `మీరు నివేదించిన సమస్య "${localizedTitle}" స్థితి ${localizedStatus} గా మార్చబడింది.`,
      ta: `நீங்கள் புகாரளித்த "${localizedTitle}" பிரச்சனையின் நிலை ${localizedStatus} என மாற்றப்பட்டுள்ளது.`,
      gu: `તમારી નોંધાયેલ સમસ્યા "${localizedTitle}" ની સ્થિતિ બદલીને ${localizedStatus} કરવામાં આવી છે.`,
      ur: `آپ کے رپورٹ کردہ مسئلے "${localizedTitle}" کی حیثیت بدل کر ${localizedStatus} کر دی گئی ہے۔`
    }

    return {
      title: lang === 'hi' ? 'समस्या की स्थिति अपडेट' : lang === 'mr' ? 'समस्येची स्थिती अद्यतन' : 'Status Update',
      message: TEMPLATES[lang] || msg,
    }
  }

  // 2. Department routing notification:
  // "A new X issue has been routed to your department: "Y" at Z"
  const routeMatch = msg.match(/A new\s+(.*?)\s+issue has been routed to your department:\s+"([^"]+)"(?:\s+at\s+(.+))?/i)
  if (routeMatch) {
    const categoryName = routeMatch[1]
    const issueTitle = routeMatch[2]
    const address = routeMatch[3] || ''

    const localizedCat = getLocalizedSubcategory(categoryName, lang)
    const localizedTitle = getLocalizedReport({ id: notif.report_id, title: issueTitle }, lang).title
    const localizedAddress = getLocalizedLocation(address, lang)

    const ROUTE_TEMPLATES: Record<Language, string> = {
      en: `A new ${localizedCat} issue has been routed to your department: "${localizedTitle}" at ${localizedAddress}`,
      hi: `आपके विभाग को एक नई ${localizedCat} समस्या भेजी गई है: "${localizedTitle}" (${localizedAddress})`,
      mr: `तुमच्या विभागाकडे नवीन ${localizedCat} समस्या पाठवली गेली आहे: "${localizedTitle}" (${localizedAddress})`,
      bn: `আপনার বিভাগে একটি নতুন ${localizedCat} সমস্যা পাঠানো হয়েছে: "${localizedTitle}" (${localizedAddress})`,
      te: `మీ విభాగానికి కొత్త ${localizedCat} సమస్య పంపబడింది: "${localizedTitle}" (${localizedAddress})`,
      ta: `உங்கள் துறைக்கு புதிய ${localizedCat} பிரச்சனை ஒதுக்கப்பட்டுள்ளது: "${localizedTitle}" (${localizedAddress})`,
      gu: `તમારા વિભાગને નવી ${localizedCat} સમસ્યા સોંપવામાં આવી છે: "${localizedTitle}" (${localizedAddress})`,
      ur: `آپ کے شعبے کو نیا ${localizedCat} مسئلہ ارسال کیا گیا ہے: "${localizedTitle}" (${localizedAddress})`
    }

    return {
      title: lang === 'hi' ? 'नई समस्या रिपोर्ट' : lang === 'mr' ? 'नवीन तक्रार नोंद' : 'New Report',
      message: ROUTE_TEMPLATES[lang] || msg,
    }
  }

  // 3. General location and term localization in message
  const localizedMsg = getLocalizedLocation(msg, lang)
  return {
    title: notif.title || 'Notification',
    message: localizedMsg,
  }
}
