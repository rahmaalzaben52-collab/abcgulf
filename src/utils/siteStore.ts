import type { Language } from './i18n';

export type LicenseStatus = 'active' | 'pending' | 'expired';

export type LicenseRegion = 'saudi' | 'oman' | 'kuwait' | 'uae' | 'erbil';

export interface LicenseRegionMeta {
  id: LicenseRegion;
  code: string;
  labelAr: string;
  labelEn: string;
  subtitleAr: string;
  subtitleEn: string;
}

export const LICENSE_REGIONS: LicenseRegionMeta[] = [
  {
    id: 'erbil',
    code: 'EBL',
    labelAr: 'أربيل',
    labelEn: 'Erbil',
    subtitleAr: 'التراخيص الرسمية والسجلات المعتمدة في المقر الرئيسي بأربيل',
    subtitleEn: 'Official corporate & studio licenses at our Erbil headquarters',
  },
  {
    id: 'oman',
    code: 'OMN',
    labelAr: 'سلطنة عُمان',
    labelEn: 'Oman',
    subtitleAr: 'تراخيص التصوير والإنتاج الفني في سلطنة عُمان',
    subtitleEn: 'Filming & audiovisual production licenses in Oman',
  },
  {
    id: 'kuwait',
    code: 'KWT',
    labelAr: 'دولة الكويت',
    labelEn: 'Kuwait',
    subtitleAr: 'التصاريح الإعلامية والسينمائية المعتمدة في الكويت',
    subtitleEn: 'Approved broadcast & film production permits in Kuwait',
  },
  {
    id: 'saudi',
    code: 'KSA',
    labelAr: 'المملكة العربية السعودية',
    labelEn: 'Saudi Arabia',
    subtitleAr: 'اعتمادات وتصاريح الإنتاج الإعلامي داخل المملكة',
    subtitleEn: 'Media production permits & regulatory approvals in Saudi Arabia',
  },
  {
    id: 'uae',
    code: 'UAE',
    labelAr: 'الإمارات العربية المتحدة',
    labelEn: 'United Arab Emirates',
    subtitleAr: 'تراخيص الإنتاج التجاري والسينمائي في الإمارات',
    subtitleEn: 'Commercial & cinema production accreditations in the UAE',
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
  mapsUrl: string;
}

export interface CompanyProfile {
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  aboutSummary: string;
  teamSummary: string;
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
  nameAr: 'شركة الخليج للإنتاج الفني',
  nameEn: 'Abc gulf productions',
  taglineAr: 'نحوّل الأفكار إلى تجارب بصرية ملهمة',
  taglineEn: 'Media. Creativity. Impact.',
  aboutSummary:
    'شركة الخليج للإنتاج الفني هي شركة رائدة في مجال الإعلام والإنتاج المرئي والسمعي، متخصصة في تقديم حلول مبتكرة وشاملة في صناعة المحتوى الإعلامي حيث تسعى الشركة إلى تحويل الأفكار إلى تجارب بصرية جذابة تترك أثراً دائماً لدى الجمهور.',
  teamSummary:
    'يتألف الفريق من مجموعة من محترفي الإخراج والتصوير والتحرير والكتابة الإبداعية، يعملون بتكامل تام لضمان أعلى معايير الجودة السينمائية والسمعية في كل مشروع.',
  logoDataUrl: DEFAULT_LOGO_URL,
  customModelName: null,
  contact: {
    phone: '+964 751 524 1452',
    email: 'Abc.productions2030@gmail.com',
    locationAr: 'Erbil - Boulevard - B2-12-253',
    locationEn: 'Erbil - Boulevard - B2-12-253',
    mapsUrl: 'https://maps.google.com/?q=Erbil+Boulevard',
  },
  socials: {
    youtube: 'https://youtube.com/@gulf0productions?si=_3G6i9O9mBo8zEbU',
    instagram: 'https://www.instagram.com/abcgulfproductions',
    linkedin: 'https://www.linkedin.com/company/abcgulfproductions',
    facebook: 'https://www.facebook.com/abcgulfproductions',
  },
};

export const DEFAULT_LICENSES: LicenseRecord[] = [
  {
    id: 'lic-saudi-01',
    region: 'saudi',
    title: 'ترخيص الإنتاج المرئي والمسموع — السعودية',
    authority: 'الهيئة العامة لتنظيم الإعلام',
    licenseNumber: 'KSA-GAMR-2026-304',
    issueDate: '2025-02-10',
    expiryDate: '2027-02-09',
    status: 'active',
    category: 'إنتاج تلفزيوني وإعلاني',
    notes: 'تصريح معتمد لتنفيذ الأعمال التلفزيونية والإعلانات التجارية داخل المملكة العربية السعودية.',
  },
  {
    id: 'lic-oman-01',
    region: 'oman',
    title: 'تصريح التصوير والإنتاج الفني — عُمان',
    authority: 'وزارة الإعلام العُمانية',
    licenseNumber: 'OMN-MOI-2026-182',
    issueDate: '2025-03-01',
    expiryDate: '2027-02-28',
    status: 'active',
    category: 'إنتاج وثائقي وسينمائي',
    notes: 'اعتماد رسمي لتصوير الأفلام الوثائقية والحملات التجارية في سلطنة عُمان.',
  },
  {
    id: 'lic-kuwait-01',
    region: 'kuwait',
    title: 'رخصة الإنتاج الإعلامي والبرامج — الكويت',
    authority: 'وزارة الإعلام الكويتية',
    licenseNumber: 'KWT-MOI-2025-719',
    issueDate: '2025-01-20',
    expiryDate: '2027-01-19',
    status: 'active',
    category: 'برامج تلفزيونية وإعلانات',
    notes: 'تصريح إنتاج وتغطية الفعاليات والمشاريع المرئية والسمعية داخل دولة الكويت.',
  },
  {
    id: 'lic-uae-01',
    region: 'uae',
    title: 'رخصة الإنتاج السينمائي والتجاري — الإمارات',
    authority: 'مجلس الإمارات للإعلام',
    licenseNumber: 'UAE-EMC-2026-552',
    issueDate: '2025-04-05',
    expiryDate: '2027-04-04',
    status: 'active',
    category: 'إنتاج سينمائي ورقمي',
    notes: 'ترخيص متكامل لتصوير الحملات الإعلانية والأفلام القصيرة في دولة الإمارات.',
  },
  {
    id: 'lic-erbil-01',
    region: 'erbil',
    title: 'رخصة الإنتاج الإعلامي والمرئي — أربيل',
    authority: 'هيئة الإعلام المرئي والمسموع',
    licenseNumber: 'IQ-EBL-2026-4810',
    issueDate: '2025-01-15',
    expiryDate: '2027-01-14',
    status: 'active',
    category: 'إنتاج تلفزيوني وإعلاني',
    notes: 'ترخيص رسمي لإنتاج الفيديوهات الدعائية والبرامج التلفزيونية والأفلام القصيرة.',
  },
  {
    id: 'lic-erbil-02',
    region: 'erbil',
    title: 'السجل التجاري المعتمد — أربيل',
    authority: 'وزارة التجارة والصناعة',
    licenseNumber: 'CR-EBL-90412',
    issueDate: '2023-06-01',
    expiryDate: '2028-05-31',
    status: 'active',
    category: 'كيان تجاري مسجل',
    notes: 'شركة مسجلة في أربيل لمزاولة أنشطة الإنتاج الفني والسمعي والبصري.',
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
  const title = draft.title.trim();
  const authority = draft.authority.trim();
  const licenseNumber = draft.licenseNumber.trim();
  const category = draft.category.trim();

  if (title.length < 3) {
    errors.title =
      lang === 'en'
        ? 'Please enter a license title (at least 3 characters).'
        : 'يرجى إدخال اسم الترخيص (3 أحرف على الأقل).';
  }
  if (authority.length < 3) {
    errors.authority =
      lang === 'en' ? 'Please enter the issuing authority.' : 'يرجى إدخال الجهة المانحة للترخيص.';
  }
  if (licenseNumber.length < 3) {
    errors.licenseNumber =
      lang === 'en' ? 'Please enter the official license number.' : 'يرجى إدخال رقم الترخيص الرسمي.';
  }
  if (!draft.issueDate) {
    errors.issueDate =
      lang === 'en' ? 'Please select an issue date.' : 'يرجى تحديد تاريخ الإصدار.';
  }
  if (!draft.expiryDate) {
    errors.expiryDate =
      lang === 'en' ? 'Please select an expiry date.' : 'يرجى تحديد تاريخ الانتهاء.';
  } else if (draft.issueDate && draft.expiryDate < draft.issueDate) {
    errors.expiryDate =
      lang === 'en'
        ? 'Expiry date must be after issue date.'
        : 'تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار.';
  }
  if (category.length < 2) {
    errors.category =
      lang === 'en' ? 'Please enter a license category.' : 'يرجى تحديد مجال أو فئة الترخيص.';
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

export function loadStoredConfig(): { profile: CompanyProfile; licenses: LicenseRecord[] } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { profile: DEFAULT_PROFILE, licenses: DEFAULT_LICENSES };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { profile: DEFAULT_PROFILE, licenses: DEFAULT_LICENSES };
    }
    const parsed = parseSiteConfig(raw);
    if (!parsed) {
      return { profile: DEFAULT_PROFILE, licenses: DEFAULT_LICENSES };
    }
    return { profile: parsed.profile, licenses: parsed.licenses };
  } catch {
    return { profile: DEFAULT_PROFILE, licenses: DEFAULT_LICENSES };
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
    return 'ar';
  }
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
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
