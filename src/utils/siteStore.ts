import type { Language } from './i18n';

export type LicenseStatus = 'active' | 'pending' | 'expired';

export type LicenseRegion = 'saudi' | 'oman' | 'kuwait' | 'uae' | 'erbil';

export interface LicenseRegionMeta {
  id: LicenseRegion;
  code: string;
  labelAr: string;
  labelEn: string;
  labelKu?: string;
  subtitleAr: string;
  subtitleEn: string;
  subtitleKu?: string;
}

export const LICENSE_REGIONS: LicenseRegionMeta[] = [
  {
    id: 'erbil',
    code: 'EBL',
    labelAr: 'أربيل',
    labelEn: 'Erbil',
    labelKu: 'هەولێر',
    subtitleAr: 'التراخيص الرسمية والسجلات المعتمدة في المقر الرئيسي بأربيل',
    subtitleEn: 'Official corporate & studio licenses at our Erbil headquarters',
    subtitleKu: 'مۆڵەتە فەرمییەکان و تۆمارە باوەڕپێکراوەکان لە بنکەی سەرەکی لە هەولێر',
  },
  {
    id: 'oman',
    code: 'OMN',
    labelAr: 'سلطنة عُمان',
    labelEn: 'Oman',
    labelKu: 'سەڵتەنەتی عومان',
    subtitleAr: 'تراخيص التصوير والإنتاج الفني في سلطنة عُمان',
    subtitleEn: 'Filming & audiovisual production licenses in Oman',
    subtitleKu: 'مۆڵەتەکانی وێنەگرتن و بەرهەمهێنانی هونەری لە عومان',
  },
  {
    id: 'kuwait',
    code: 'KWT',
    labelAr: 'دولة الكويت',
    labelEn: 'Kuwait',
    labelKu: 'کووەیت',
    subtitleAr: 'التصاريح الإعلامية والسينمائية المعتمدة في الكويت',
    subtitleEn: 'Approved broadcast & film production permits in Kuwait',
    subtitleKu: 'مۆڵەتەکانی بەرهەمهێنانی میدیایی و بەرنامەکان لە کووەیت',
  },
  {
    id: 'saudi',
    code: 'KSA',
    labelAr: 'المملكة العربية السعودية',
    labelEn: 'Saudi Arabia',
    labelKu: 'عەرەبستانی سعوودی',
    subtitleAr: 'اعتمادات وتصاريح الإنتاج الإعلامي داخل المملكة',
    subtitleEn: 'Media production permits & regulatory approvals in Saudi Arabia',
    subtitleKu: 'ڕێگەپێدان و مۆڵەتەکانی بەرهەمهێنانی میدیایی لە سعوودیە',
  },
  {
    id: 'uae',
    code: 'UAE',
    labelAr: 'الإمارات العربية المتحدة',
    labelEn: 'United Arab Emirates',
    labelKu: 'ئیمارات',
    subtitleAr: 'تراخيص الإنتاج التجاري والسينمائي في الإمارات',
    subtitleEn: 'Commercial & cinema production accreditations in the UAE',
    subtitleKu: 'مۆڵەتەکانی بەرهەمهێنانی بازرگانی و سینەمایی لە ئیمارات',
  },
];

export const VALID_LICENSE_REGIONS: ReadonlySet<LicenseRegion> = new Set<LicenseRegion>([
  'saudi',
  'oman',
  'kuwait',
  'uae',
  'erbil',
]);

export function normalizeLicenseRegion(raw: unknown): LicenseRegion {
  if (typeof raw === 'string' && VALID_LICENSE_REGIONS.has(raw as LicenseRegion)) {
    return raw as LicenseRegion;
  }
  return 'erbil';
}

export function getLicenseRegionMeta(region: LicenseRegion): LicenseRegionMeta {
  return LICENSE_REGIONS.find((r) => r.id === region) ?? LICENSE_REGIONS[LICENSE_REGIONS.length - 1];
}

export interface LicenseRecord {
  id: string;
  region: LicenseRegion;
  title: string;
  authority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  status: LicenseStatus;
  category: string;
  notes?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
}

export interface RegionalLicenseGroup {
  region: LicenseRegionMeta;
  items: LicenseRecord[];
}

export function groupLicensesByRegion(licenses: LicenseRecord[]): RegionalLicenseGroup[] {
  const buckets = new Map<LicenseRegion, LicenseRecord[]>();
  for (const meta of LICENSE_REGIONS) {
    buckets.set(meta.id, []);
  }
  for (const item of licenses) {
    const region = normalizeLicenseRegion(item.region);
    const list = buckets.get(region) ?? [];
    list.push({ ...item, region });
    buckets.set(region, list);
  }
  return LICENSE_REGIONS.map((region) => ({
    region,
    items: buckets.get(region.id) ?? [],
  }));
}

export interface SocialLinks {
  youtube: string;
  instagram: string;
  linkedin: string;
  facebook: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  locationAr: string;
  locationEn: string;
  locationKu?: string;
  mapsUrl: string;
}

export interface CompanyProfile {
  nameAr: string;
  nameEn: string;
  nameKu?: string;
  taglineAr: string;
  taglineEn: string;
  taglineKu?: string;
  aboutSummary: string;
  aboutSummaryKu?: string;
  teamSummary: string;
  teamSummaryKu?: string;
  logoDataUrl: string | null;
  customModelName: string | null;
  contact: ContactInfo;
  socials: SocialLinks;
}

export type ArtVariant =
  | 'concert'
  | 'clapper'
  | 'cinema-cam'
  | 'city-skyline'
  | 'tv-studio'
  | 'editing-suite'
  | 'drone-aerial'
  | 'podcast-mic';

export interface ServiceItem {
  id: string;
  order: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  artVariant: ArtVariant;
  deliverables: string[];
}

export interface SiteConfigPayload {
  version: number;
  updatedAt: string;
  profile: CompanyProfile;
  licenses: LicenseRecord[];
}

export const STORAGE_KEY = 'abc_gulf_studio_config_v2';
export const LANG_STORAGE_KEY = 'abc_gulf_lang_v1';
export const DEFAULT_LOGO_URL = '/assets/abc-gulf-logo.png';

export const DEFAULT_PROFILE: CompanyProfile = {
  nameAr: 'أي بي سي الخليج للإنتاج الفني',
  nameEn: 'Abc Gulf Productions',
  nameKu: 'ئەی بی سی خەلیج بۆ بەرهەمهێنانی هونەری',
  taglineAr: 'نَحْوُ الأَفْكَارِ إِلَى تَجَارِبَ بَصَرِيَّةٍ مُلْهِمَةٍ',
  taglineEn: 'Media. Creativity. Impact.',
  taglineKu: 'میدیا . داهێنان . کاریگەری',
  aboutSummary:
    'أي بي سي الخليج للإنتاج الفني هي شركة رائدة في مجال الإعلام والإنتاج المرئي والسمعي، متخصصة في تقديم حلول مبتكرة وشاملة في صناعة المحتوى الإعلامي حيث تسعى الشركة إلى تحويل الأفكار إلى تجارب بصرية جذابة تترك أثراً دائماً لدى الجمهور.',
  aboutSummaryKu:
    'کۆمپانیای ئەی بی سی خەلیج بۆ بەرهەمهێنانی هونەری کۆمپانیایەکی پێشەنگە لە بواری میدیا و بەرهەمهێنانی بینراو و بیستراو، تایبەتمەندە لە پێشکەشکردنی چارەسەری نوێ و گشتگیر لە پیشەسازی ناوەڕۆکی میدیایی کە هەوڵدەدات بیرۆکەکان بگۆڕێت بۆ ئەزموونی بینراوی سەرنجڕاکێش.',
  teamSummary:
    'يتألف الفريق من نخبة من المحترفين في الإخراج والتصوير والتحرير والمونتاج والكتابة الإبداعية، يعملون بتكامل تام لضمان أعلى معايير الجودة السينمائية والسمعية في كل مشروع.',
  teamSummaryKu:
    'تیمەکە لە کۆمەڵێک کەسایەتی پیشەگەر لە دەرهێنان، وێنەگرتن، مۆنتاژ و نووسینی داهێنەرانە پێکهاتووە، کە بە هەماهەنگی تەواو کاردەکەن بۆ دڵنیابوون لە بەرزترین ئاستی کوالیتی سینەمایی و دەنگی لە هەر پڕۆژەیەکدا.',
  logoDataUrl: DEFAULT_LOGO_URL,
  customModelName: null,
  contact: {
    phone: '+964 751 524 1452',
    email: 'Abc.productions2030@gmail.com',
    locationAr: 'أربيل - البوليفارد - B2-12-253',
    locationEn: 'Erbil - Boulevard - B2-12-253',
    locationKu: 'هەولێر - بۆلیڤارد - B2-12-253',
    mapsUrl: 'https://maps.google.com/?q=Erbil+Boulevard',
  },
  socials: {
    youtube: 'https://youtube.com/@gulf0productions?si=_3G6i9O9mBo8zEbU',
    instagram: '',
    linkedin: '',
    facebook: '',
  },
};

export const DEFAULT_LICENSES: LicenseRecord[] = [
  {
    id: 'lic-oman-cr',
    region: 'oman',
    title: 'شهادة السجل التجاري — سلطنة عُمان',
    authority: 'وزارة التجارة والصناعة وترويج الاستثمار',
    licenseNumber: '1637225',
    issueDate: '2025-12-25',
    expiryDate: '2028-12-25',
    status: 'active',
    category: 'شركة الشخص الواحد (أي بي سي الخليج للإنتاج الفني ش.ش.و)',
    notes: 'سجل تجاري رئيسي معتمد للإنتاج الفني والسينمائي والتلفزيوني برأس مال 10,000 ر.ع في محافظة مسقط.',
    attachmentName: 'سجل تجاري.pdf',
    attachmentDataUrl: '/licenses/oman/oman-commercial-registration-1637225.pdf',
  },
  {
    id: 'lic-oman-economic',
    region: 'oman',
    title: 'شهادة ترخيص الأنشطة الاقتصادية والإنتاج الفني',
    authority: 'وزارة التجارة والصناعة وترويج الاستثمار',
    licenseNumber: 'L3718766',
    issueDate: '2025-12-25',
    expiryDate: '2028-12-25',
    status: 'active',
    category: 'أنشطة الإنتاج المرئي والمسموع والسينمائي',
    notes: 'ترخيص رسمي مالي ومكاني لممارسة أنشطة الإنتاج الفني والدعائي (رمز الفرع: 46548483).',
    attachmentName: 'license_certificate(L3718766).pdf',
    attachmentDataUrl: '/licenses/oman/oman-economic-license-L3718766.pdf',
  },
  {
    id: 'lic-oman-permit-barka',
    region: 'oman',
    title: 'رخصة الأنشطة التجارية والإنتاج الفني — بركاء',
    authority: 'وزارة التجارة والصناعة وترويج الاستثمار',
    licenseNumber: 'POA-46501046',
    issueDate: '2026-01-13',
    expiryDate: '2028-12-25',
    status: 'active',
    category: 'رخصة تجارية ومكانية للإنتاج الفني',
    notes: 'ترخيص مكاني معتمد لمزاولة أعمال الإنتاج الإعلامي والفني والتجاري (سجل تجاري: 1637225).',
    attachmentName: 'رخصة تجارية .pdf',
    attachmentDataUrl: '/licenses/oman/oman-commercial-permit-barka.pdf',
  },
  {
    id: 'lic-oman-tax',
    region: 'oman',
    title: 'البطاقة الضريبية الرسمية — سلطنة عُمان',
    authority: 'جهاز الضرائب — سلطنة عُمان',
    licenseNumber: '95378383',
    issueDate: '2025-12-25',
    expiryDate: '2028-01-13',
    status: 'active',
    category: 'رقم التعريف الضريبي (TIN: 2257127)',
    notes: 'بطاقة ضريبية معتمدة من جهاز الضرائب العماني لشركة أي بي سي الخليج للإنتاج الفني.',
    attachmentName: 'شهادة الضريبة .pdf',
    attachmentDataUrl: '/licenses/oman/oman-tax-card-95378383.pdf',
  },
  {
    id: 'lic-oman-chamber',
    region: 'oman',
    title: 'شهادة عضوية غرفة تجارة وصناعة عُمان',
    authority: 'غرفة تجارة وصناعة عُمان',
    licenseNumber: 'OCCI-528270',
    issueDate: '2025-12-25',
    expiryDate: '2028-12-25',
    status: 'active',
    category: 'عضوية معتمدة — الدرجة الرابعة (محافظة مسقط)',
    notes: 'شهادة انتساب رسمية صادرة من غرفة تجارة وصناعة عُمان برقم العضوية 528270 ورقم سجل 1637225.',
    attachmentName: 'شهادة انتساب.pdf',
    attachmentDataUrl: '/licenses/oman/oman-chamber-of-commerce-528270.pdf',
  },
];

export const CORE_SERVICES: ServiceItem[] = [
  {
    id: 'srv-commercials',
    order: '01',
    title: 'إنتاج الفيديوهات الدعائية والتسويقية',
    shortDesc: 'حملات بصرية مؤثرة تبني الهوية وتعزز الحضور التجاري.',
    fullDesc:
      'تصميم وإخراج الإعلانات التجارية ومقاطع الحملات التسويقية بدءاً من كتابة السيناريو الإبداعي وصولاً إلى التصوير السينمائي والمونتاج.',
    artVariant: 'clapper',
    deliverables: ['كتابة السيناريو الإبداعي', 'تصوير 4K/6K سينمائي', 'نسخ مهيأة لمنصات التواصل'],
  },
  {
    id: 'srv-films-tv',
    order: '02',
    title: 'صناعة الأفلام القصيرة والبرامج التلفزيونية',
    shortDesc: 'سرد قصصي متكامل من الفكرة الأولى حتى البث.',
    fullDesc:
      'تنفيذ الأفلام القصيرة والوثائقية والبرامج التلفزيونية بإشراف مخرجين ومديري تصوير محترفين وفق معايير البث التلفزيوني.',
    artVariant: 'tv-studio',
    deliverables: ['إدارة الإنتاج والمواقع', 'إخراج فني متكامل', 'تجهيز استوديوهات البرامج'],
  },
  {
    id: 'srv-cinematography',
    order: '03',
    title: 'تصوير وتحرير الفيديو بجودة عالية',
    shortDesc: 'عدسات سينمائية وإضاءة احترافية وتصوير جوي.',
    fullDesc:
      'تغطية الفعاليات والمؤتمرات والتصوير الميداني والجوي باستخدام أحدث الكاميرات السينمائية ومعدات الإضاءة والثبات.',
    artVariant: 'cinema-cam',
    deliverables: ['تغطية حية متعددة الكاميرات', 'تصوير جوي بالدرون', 'تحرير سريع واحترافي'],
  },
  {
    id: 'srv-podcast',
    order: '04',
    title: 'إنتاج وتسجيل البودكاست والمقابلات',
    shortDesc: 'استوديوهات معزولة صوتياً وإخراج مرئي متعدد الزوايا.',
    fullDesc:
      'تسجيل حلقات البودكاست الصوتية والمرئية والمقابلات الحوارية بميكروفونات بث احترافية وهندسة صوتية نقية.',
    artVariant: 'podcast-mic',
    deliverables: ['هندسة ومعالجة الصوت', 'تصوير 3 زوايا للبودكاست', 'مقاطع قصيرة للنشر'],
  },
  {
    id: 'srv-post',
    order: '05',
    title: 'خدمات شاملة ما بعد الإنتاج',
    shortDesc: 'مونتاج، تلوين سينمائي، مؤثرات بصرية وهندسة صوتية.',
    fullDesc:
      'مرحلة ما بعد الإنتاج الكاملة تشمل المونتاج السردي، تصحيح وتدريج الألوان، الرسوم المتحركة والمكساج النهائي.',
    artVariant: 'editing-suite',
    deliverables: ['تصحيح وتدريج الألوان', 'تصميم المؤثرات والموشن', 'مكساج دولبي وتصدير للبث'],
  },
];

export interface LicenseDraft {
  region: LicenseRegion;
  title: string;
  authority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  status: LicenseStatus;
  category: string;
  notes?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  errors: Record<string, string>;
  data?: T;
}

export function validateLicenseDraft(
  draft: LicenseDraft,
  lang: Language = 'ar',
): ValidationResult<LicenseDraft> {
  const errors: Record<string, string> = {};
  const region = normalizeLicenseRegion(draft.region);
  const title = draft.title.trim() || draft.attachmentName || (lang === 'en' ? 'Official License' : 'ترخيص رسمي');
  const authority = draft.authority?.trim() || (lang === 'en' ? 'Competent Authority' : 'الجهة الرسمية المعتمدة');
  const licenseNumber = draft.licenseNumber?.trim() || `LIC-${Date.now().toString().slice(-6)}`;
  const category = draft.category?.trim() || (lang === 'en' ? 'Audiovisual Production' : 'إنتاج فني وإعلامي');
  const issueDate = draft.issueDate || '2025-01-01';
  const expiryDate = draft.expiryDate || '2028-01-01';

  if (title.length < 2) {
    errors.title =
      lang === 'en'
        ? 'Please enter a license title.'
        : 'يرجى إدخال اسم الترخيص.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: {},
    data: {
      ...draft,
      region,
      title,
      authority,
      licenseNumber,
      issueDate,
      expiryDate,
      status: 'active',
      category,
      notes: draft.notes?.trim() || '',
    },
  };
}

export interface ContactFormDraft {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactDraft(
  draft: ContactFormDraft,
  lang: Language = 'ar',
): ValidationResult<ContactFormDraft> {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();
  const email = draft.email.trim();
  const subject = draft.subject.trim();
  const message = draft.message.trim();

  if (name.length < 2) {
    errors.name =
      lang === 'en' ? 'Please enter your full name.' : 'يرجى إدخال الاسم الكامل.';
  }
  if (!EMAIL_PATTERN.test(email)) {
    errors.email =
      lang === 'en' ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.';
  }
  if (message.length < 10) {
    errors.message =
      lang === 'en'
        ? 'Please write your project details (at least 10 characters).'
        : 'يرجى كتابة تفاصيل المشروع أو الرسالة (10 أحرف على الأقل).';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: {},
    data: {
      name,
      email,
      subject: subject || (lang === 'en' ? 'Production Inquiry' : 'استفسار إنتاجي'),
      message,
    },
  };
}

export function sanitizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function serializeSiteConfig(
  profile: CompanyProfile,
  licenses: LicenseRecord[],
): string {
  const payload: SiteConfigPayload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    profile,
    licenses,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseSiteConfig(rawJson: string): SiteConfigPayload | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<SiteConfigPayload>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.profile || !Array.isArray(parsed.licenses)) return null;

    return {
      version: typeof parsed.version === 'number' ? parsed.version : 2,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      profile: {
        ...DEFAULT_PROFILE,
        ...parsed.profile,
        contact: {
          ...DEFAULT_PROFILE.contact,
          ...(parsed.profile.contact ?? {}),
        },
        socials: {
          ...DEFAULT_PROFILE.socials,
          ...(parsed.profile.socials ?? {}),
        },
      },
      licenses: parsed.licenses.map((item) => ({
        ...item,
        region: normalizeLicenseRegion((item as Partial<LicenseRecord>).region),
      })),
    };
  } catch {
    return null;
  }
}

export function loadStoredConfig(): { profile: CompanyProfile; licenses: LicenseRecord[] | null } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { profile: DEFAULT_PROFILE, licenses: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { profile: DEFAULT_PROFILE, licenses: null };
    }
    const parsed = parseSiteConfig(raw);
    if (!parsed) {
      return { profile: DEFAULT_PROFILE, licenses: null };
    }
    return { profile: parsed.profile, licenses: parsed.licenses };
  } catch {
    return { profile: DEFAULT_PROFILE, licenses: null };
  }
}

export function saveStoredConfig(profile: CompanyProfile, licenses: LicenseRecord[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeSiteConfig(profile, licenses));
    return true;
  } catch {
    return false;
  }
}

export function loadStoredLanguage(): Language {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'ku';
  }
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'ku' || stored === 'ar' || stored === 'en') {
      return stored as Language;
    }
    return 'ku';
  } catch {
    return 'ku';
  }
}

export function saveStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore quota errors
  }
}

export function isAdminRouteTriggered(hash: string, search: string): boolean {
  const normalizedHash = hash.trim().toLowerCase();
  if (normalizedHash === '#admin' || normalizedHash === '#/admin') {
    return true;
  }
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  return params.get('admin') === '1' || params.get('mode') === 'admin';
}

const ADMIN_PIN_KEY = 'abc_admin_pin_code';
export const DEFAULT_ADMIN_PIN = '2030';

export function getStoredAdminPin(): string {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_ADMIN_PIN;
  return window.localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
}

export function setStoredAdminPin(newPin: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(ADMIN_PIN_KEY, newPin.trim());
    return true;
  } catch {
    return false;
  }
}

export function verifyAdminPin(pin: string): boolean {
  const current = getStoredAdminPin();
  return pin.trim() === current.trim();
}

