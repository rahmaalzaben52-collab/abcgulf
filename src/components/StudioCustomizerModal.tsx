import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  Download,
  Cloud,
  Check,
  Image as ImageIcon,
  Box,
  Globe,
} from 'lucide-react';
import {
  DEFAULT_LOGO_URL,
  type CompanyProfile,
  type LicenseRecord,
  parseSiteConfig,
  serializeSiteConfig,
} from '../utils/siteStore';
import type { Language } from '../utils/i18n';

interface StudioCustomizerModalProps {
  open: boolean;
  isAdmin: boolean;
  lang: Language;
  profile: CompanyProfile;
  licenses: LicenseRecord[];
  onClose: () => void;
  onSaveProfile: (updated: CompanyProfile) => void | Promise<void>;
  onImportConfig: (profile: CompanyProfile, licenses: LicenseRecord[]) => void | Promise<void>;
  onUpload3DFile: (file: File) => void;
}

export const StudioCustomizerModal: React.FC<StudioCustomizerModalProps> = ({
  open,
  isAdmin,
  lang,
  profile,
  licenses,
  onClose,
  onSaveProfile,
  onImportConfig,
  onUpload3DFile,
}) => {
  const [draft, setDraft] = useState<CompanyProfile>(profile);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setFeedback(null);
    }
  }, [open, profile]);

  if (!open || !isAdmin) return null;

  const isEn = lang === 'en';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 350 * 1024) {
      setFeedback(
        isEn
          ? 'Logo file exceeds 350 KB. Please choose a smaller PNG or SVG.'
          : 'حجم ملف الشعار يتجاوز 350 كيلوبايت، يرجى اختيار ملف PNG أو SVG أصغر.',
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({ ...prev, logoDataUrl: reader.result as string }));
        setFeedback(
          isEn
            ? 'Logo uploaded — click Save Changes to apply.'
            : 'تم تحميل الشعار بنجاح — اضغط حفظ التغييرات لتطبيقه على الموقع.',
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload3DFile(file);
    setDraft((prev) => ({ ...prev, customModelName: file.name }));
    setFeedback(
      isEn ? `Loaded 3D model: ${file.name}` : `تم تحميل مجسم 3D: ${file.name}`,
    );
  };

  const handleExportJson = () => {
    const json = serializeSiteConfig(draft, licenses);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abc-gulf-site-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setFeedback(
      isEn
        ? 'Exported site configuration and licenses (abc-gulf-site-config.json).'
        : 'تم تصدير ملف إعدادات الموقع والتراخيص (abc-gulf-site-config.json).',
    );
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const parsed = parseSiteConfig(String(reader.result || ''));
      if (!parsed) {
        setFeedback(isEn ? 'Invalid JSON configuration file.' : 'صيغة الملف غير صالحة للاستيراد.');
        return;
      }
      setDraft(parsed.profile);
      setSaving(true);
      try {
        await onImportConfig(parsed.profile, parsed.licenses);
        setFeedback(
          isEn
            ? 'Configuration and licenses imported and synced.'
            : 'تم استيراد الإعدادات والتراخيص ومزامنتها بنجاح.',
        );
      } finally {
        setSaving(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile(draft);
      setFeedback(
        isEn
          ? 'All settings saved and synced for all visitors.'
          : 'تم حفظ كافة البيانات والإعدادات ونشرها لجميع الزوار.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-white/12 bg-[#13151D] p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 id="customizer-title" className="text-xl font-bold text-[#F8F9FA]">
              {isEn
                ? 'Brand Customization, 3D File & Cloudflare Deployment'
                : 'تخصيص الهوية والملفات والنشر على Cloudflare'}
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {isEn
                ? 'Upload your company logo or 3D (.GLB) hero asset and update contact links anytime.'
                : 'ارفع شعار الشركة أو ملف العرض ثلاثي الأبعاد (.GLB) وحدّث روابط التواصل في أي وقت.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'إغلاق لوحة التخصيص'}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/8 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Logo & 3D File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#0D0E13] p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F6DDA7] mb-2">
                <ImageIcon className="w-4 h-4" />
                <span>{isEn ? 'Company Logo' : 'شعار الشركة (Logo)'}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-3">
                {isEn
                  ? 'Upload a transparent PNG or SVG logo for the header and footer.'
                  : 'ارفع ملف الشعار بصيغة PNG أو SVG ليظهر في رأس الصفحة والتذييل.'}
              </p>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg bg-[#DFAF5A] text-[#0B0C10] px-3 py-2 text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Upload Logo' : 'رفع الشعار'}</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {draft.logoDataUrl && draft.logoDataUrl !== DEFAULT_LOGO_URL && (
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, logoDataUrl: DEFAULT_LOGO_URL }))}
                    className="text-xs text-[#DFAF5A] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Restore Default' : 'استعادة الشعار الافتراضي'}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D0E13] p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F6DDA7] mb-2">
                <Box className="w-4 h-4" />
                <span>{isEn ? 'Hero 3D Model (.GLB/.GLTF)' : 'ملف الصفحة الأولى ثلاثي الأبعاد (3D)'}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-3">
                {isEn
                  ? 'Upload your custom .GLB or .GLTF model to preview it live in the 3D hero stage.'
                  : 'ارفع مجسمك الخاص بصيغة .GLB أو .GLTF لعرضه مباشرة في الواجهة الأولى.'}
              </p>
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#DFAF5A]/40 bg-[#DFAF5A]/15 text-[#F6DDA7] px-3 py-2 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {draft.customModelName
                    ? `${isEn ? 'Replace' : 'تبديل'} (${draft.customModelName})`
                    : isEn
                      ? 'Upload GLB / GLTF'
                      : 'رفع ملف GLB / GLTF'}
                </span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleModelUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Contact & Gmail Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#F8F9FA] border-b border-white/8 pb-2">
              {isEn ? 'Contact, Email & Office Location' : 'بيانات التواصل والموقع والجيميل'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-phone" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'Phone Number' : 'رقم الهاتف'}
                </label>
                <input
                  id="cfg-phone"
                  type="text"
                  dir="ltr"
                  value={draft.contact.phone}
                  onChange={(e) =>
                    setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-email" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'Email / Gmail' : 'البريد الإلكتروني / Gmail'}
                </label>
                <input
                  id="cfg-email"
                  type="email"
                  dir="ltr"
                  value={draft.contact.email}
                  onChange={(e) =>
                    setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-location" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'Office Location' : 'الموقع (العنوان)'}
                </label>
                <input
                  id="cfg-location"
                  type="text"
                  dir="ltr"
                  value={isEn ? draft.contact.locationEn : draft.contact.locationAr}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contact: {
                        ...draft.contact,
                        locationAr: e.target.value,
                        locationEn: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-maps" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'Google Maps URL' : 'رابط خرائط جوجل (Google Maps)'}
                </label>
                <input
                  id="cfg-maps"
                  type="url"
                  dir="ltr"
                  value={draft.contact.mapsUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, contact: { ...draft.contact, mapsUrl: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* YouTube & Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#F8F9FA] border-b border-white/8 pb-2">
              {isEn ? 'YouTube & Social Media Links' : 'قناة اليوتيوب وحسابات التواصل الاجتماعي'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-yt" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'YouTube Channel URL' : 'رابط قناة اليوتيوب (YouTube)'}
                </label>
                <input
                  id="cfg-yt"
                  type="url"
                  dir="ltr"
                  value={draft.socials.youtube}
                  onChange={(e) =>
                    setDraft({ ...draft, socials: { ...draft.socials, youtube: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-ig" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'Instagram URL' : 'رابط إنستغرام (Instagram)'}
                </label>
                <input
                  id="cfg-ig"
                  type="url"
                  dir="ltr"
                  value={draft.socials.instagram}
                  onChange={(e) =>
                    setDraft({ ...draft, socials: { ...draft.socials, instagram: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-li" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'LinkedIn URL' : 'رابط لينكدإن (LinkedIn)'}
                </label>
                <input
                  id="cfg-li"
                  type="url"
                  dir="ltr"
                  value={draft.socials.linkedin}
                  onChange={(e) =>
                    setDraft({ ...draft, socials: { ...draft.socials, linkedin: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cfg-fb" className="block text-xs text-[#A9AFBE] mb-1">
                  {isEn ? 'Facebook URL' : 'رابط فيسبوك (Facebook)'}
                </label>
                <input
                  id="cfg-fb"
                  type="url"
                  dir="ltr"
                  value={draft.socials.facebook}
                  onChange={(e) =>
                    setDraft({ ...draft, socials: { ...draft.socials, facebook: e.target.value } })
                  }
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3 py-2 text-sm font-code text-white text-left focus:border-[#DFAF5A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cloudflare Pages Deployment & Backup */}
          <div className="rounded-xl border border-white/10 bg-[#0D0E13] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F8F9FA]">
              <Cloud className="w-4 h-4 text-[#DFAF5A]" />
              <span>
                {isEn ? 'Cloudflare Pages Deployment Ready' : 'جاهزية النشر على Cloudflare Pages'}
              </span>
            </div>
            <p className="text-xs text-[#A9AFBE] leading-relaxed">
              {isEn ? 'Build command:' : 'المشروع مهيأ بالكامل للبناء السريع عبر أمر'}{' '}
              <code className="font-code text-[#F6DDA7] bg-white/6 px-1.5 py-0.5 rounded">
                npm run build
              </code>{' '}
              {isEn ? 'with output directory' : 'ومجلد الإخراج'}{' '}
              <code className="font-code text-[#F6DDA7] bg-white/6 px-1.5 py-0.5 rounded">
                dist
              </code>{' '}
              {isEn ? 'and SPA routing' : 'مع ملف توجيه'}{' '}
              <code className="font-code text-[#F6DDA7] bg-white/6 px-1.5 py-0.5 rounded">
                _redirects
              </code>
              .
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/14 px-3 py-1.5 text-xs font-medium text-[#E5E7EB] hover:bg-white/6 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#DFAF5A]" />
                <span>{isEn ? 'Export Site Config (JSON)' : 'تصدير إعدادات الموقع (JSON)'}</span>
              </button>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/14 px-3 py-1.5 text-xs font-medium text-[#E5E7EB] hover:bg-white/6 cursor-pointer">
                <Globe className="w-3.5 h-3.5 text-[#DFAF5A]" />
                <span>{isEn ? 'Import Site Config' : 'استيراد ملف إعدادات'}</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/12 px-4 py-2 text-sm text-[#D1D5DB] hover:bg-white/6 cursor-pointer"
            >
              {isEn ? 'Close' : 'إغلاق'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] disabled:opacity-60 text-[#0B0C10] px-5 py-2 text-sm font-bold cursor-pointer"
            >
              {saving
                ? isEn
                  ? 'Saving...'
                  : 'جاري الحفظ...'
                : isEn
                  ? 'Save Changes'
                  : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
