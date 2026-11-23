import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  LICENSE_REGIONS,
  type LicenseDraft,
  type LicenseRecord,
  type LicenseRegion,
  getLicenseRegionMeta,
  groupLicensesByRegion,
  normalizeLicenseRegion,
  validateLicenseDraft,
} from '../utils/siteStore';
import {
  dataUrlToBlob,
  generateLicensePdfBlob,
  isImageAttachment,
  isImageDataUrl,
  isPdfAttachment,
  isPdfDataUrl,
  sanitizePdfFilename,
  triggerBlobDownload,
} from '../utils/pdfCertificate';
import { uploadLicenseFile } from '../cloudflareApi';
import { UI_COPY, type Language } from '../utils/i18n';

interface LicensesSectionProps {
  licenses: LicenseRecord[];
  lang: Language;
  isAdmin: boolean;
  onAddLicense: (record: LicenseRecord) => void | Promise<void>;
  onUpdateLicense: (record: LicenseRecord) => void | Promise<void>;
  onDeleteLicense: (id: string) => void | Promise<void>;
  onOpenCustomizer: () => void;
}

function createEmptyDraft(region: LicenseRegion = 'saudi'): LicenseDraft {
  return {
    region,
    title: '',
    authority: 'الجهة الرسمية المعتمدة',
    licenseNumber: `LIC-${Date.now().toString().slice(-6)}`,
    issueDate: '2025-01-01',
    expiryDate: '2028-01-01',
    status: 'active',
    category: 'إنتاج فني وإعلامي',
    notes: '',
    attachmentName: '',
    attachmentDataUrl: '',
  };
}

const DEFAULT_LICENSE_EN: Record<
  string,
  { title: string; defaultTitleAr: string }
> = {
  'lic-oman-cr': {
    defaultTitleAr: 'شهادة السجل التجاري — سلطنة عُمان',
    title: 'Commercial Registration Certificate — Oman',
  },
  'lic-oman-economic': {
    defaultTitleAr: 'شهادة ترخيص الأنشطة الاقتصادية والإنتاج الفني',
    title: 'Economic Activities & Media Production License — Oman',
  },
  'lic-oman-permit-barka': {
    defaultTitleAr: 'رخصة الأنشطة التجارية والإنتاج الفني — بركاء',
    title: 'Commercial & Media Production Permit — Barka',
  },
  'lic-oman-tax': {
    defaultTitleAr: 'البطاقة الضريبية الرسمية — سلطنة عُمان',
    title: 'Official Tax Card — Sultanate of Oman',
  },
  'lic-oman-chamber': {
    defaultTitleAr: 'شهادة عضوية غرفة تجارة وصناعة عُمان',
    title: 'Oman Chamber of Commerce & Industry Certificate',
  },
};

export const LicensesSection: React.FC<LicensesSectionProps> = ({
  licenses,
  lang,
  isAdmin,
  onAddLicense,
  onUpdateLicense,
  onDeleteLicense,
  onOpenCustomizer,
}) => {
  const t = UI_COPY[lang].licenses;
  const companyName = UI_COPY[lang].hero.companyName;

  const [selectedRegion, setSelectedRegion] = useState<'all' | LicenseRegion>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LicenseDraft>(() => createEmptyDraft('saudi'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewLicense, setPreviewLicense] = useState<LicenseRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const regionalGroups = useMemo(() => groupLicensesByRegion(licenses), [licenses]);

  const visibleGroups = useMemo(() => {
    if (selectedRegion === 'all') {
      return isAdmin ? regionalGroups : regionalGroups.filter((group) => group.items.length > 0);
    }
    return regionalGroups.filter((group) => group.region.id === selectedRegion);
  }, [regionalGroups, selectedRegion, isAdmin]);

  const getDisplayLicense = (rawLic: LicenseRecord): LicenseRecord => {
    const normalizedRegion = normalizeLicenseRegion(rawLic.region);
    const lic = normalizedRegion === rawLic.region ? rawLic : { ...rawLic, region: normalizedRegion };
    const enMeta = DEFAULT_LICENSE_EN[lic.id];
    if (lang === 'en' && enMeta && lic.title === enMeta.defaultTitleAr) {
      return {
        ...lic,
        title: enMeta.title,
      };
    }
    return lic;
  };

  const openCreateModal = (defaultRegion?: LicenseRegion) => {
    if (!isAdmin) return;
    const region = defaultRegion ?? (selectedRegion === 'all' ? 'saudi' : selectedRegion);
    setEditingId(null);
    setDraft(createEmptyDraft(region));
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: LicenseRecord) => {
    if (!isAdmin) return;
    setEditingId(record.id);
    setDraft({
      region: normalizeLicenseRegion(record.region),
      title: record.title,
      authority: record.authority || 'Official Authority',
      licenseNumber: record.licenseNumber || 'LIC-DOC',
      issueDate: record.issueDate || '2026-01-01',
      expiryDate: record.expiryDate || '2028-01-01',
      status: 'active',
      category: record.category || 'Official License',
      notes: record.notes || '',
      attachmentName: record.attachmentName || '',
      attachmentDataUrl: record.attachmentDataUrl || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setErrors((prev) => ({
        ...prev,
        attachment:
          lang === 'en'
            ? 'Please upload a valid PDF document (or certificate image).'
            : 'يرجى اختيار ملف بصيغة PDF (أو صورة للشهادة).',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        attachment:
          lang === 'en'
            ? 'File exceeds 5 MB limit. Please choose a smaller file.'
            : lang === 'ku'
              ? 'قەبارەی فایل زیاترە لە 5 مێگابایت، تکایە فایلێکی بچووکتر هەڵبژێرە.'
              : 'حجم الملف يتجاوز 5 ميجابايت، يرجى اختيار ملف أصغر.',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, ''),
        attachmentName: file.name,
        attachmentDataUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.attachment;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = async (rawLic: LicenseRecord) => {
    const lic = getDisplayLicense(rawLic);
    setDownloadingId(lic.id);
    try {
      if (lic.attachmentDataUrl && !lic.attachmentDataUrl.startsWith('data:')) {
        try {
          const res = await fetch(lic.attachmentDataUrl);
          if (res.ok) {
            const blob = await res.blob();
            const fileBase = lic.attachmentName || `${lic.title}.pdf`;
            triggerBlobDownload(blob, sanitizePdfFilename(fileBase));
            return;
          }
        } catch (fetchErr) {
          console.warn('Direct file download fallback:', fetchErr);
        }
      }
      const regionMeta = getLicenseRegionMeta(lic.region);
      const pdfBlob = await generateLicensePdfBlob(lic, regionMeta, lang, companyName);
      const fileBase =
        lic.attachmentName || `${regionMeta.code}-${lic.licenseNumber || lic.title}`;
      triggerBlobDownload(pdfBlob, sanitizePdfFilename(fileBase));
    } finally {
      setDownloadingId((curr) => (curr === lic.id ? null : curr));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const titleToValidate = draft.title.trim() || draft.attachmentName || (lang === 'en' ? 'Official License' : 'ترخيص رسمي');
    const validatedDraft = { ...draft, title: titleToValidate };
    const result = validateLicenseDraft(validatedDraft, lang);
    if (!result.ok || !result.data) {
      setErrors(result.errors);
      return;
    }

    let finalAttachmentUrl = result.data.attachmentDataUrl;
    if (finalAttachmentUrl && finalAttachmentUrl.startsWith('data:')) {
      try {
        const cloudUrl = await uploadLicenseFile(
          result.data.attachmentName || `license-${Date.now()}.pdf`,
          finalAttachmentUrl,
        );
        if (cloudUrl) {
          finalAttachmentUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('Could not upload file to Cloudflare directly, saving dataUrl:', err);
      }
    }

    const payload: LicenseRecord = {
      id: editingId ?? `lic-${result.data.region}-${Date.now()}`,
      ...result.data,
      attachmentDataUrl: finalAttachmentUrl,
      status: 'active',
    };

    try {
      if (editingId) {
        await onUpdateLicense(payload);
      } else {
        await onAddLicense(payload);
      }
    } catch (err) {
      console.warn('Error saving license:', err);
    } finally {
      setModalOpen(false);
      setErrors({});
    }
  };

  const localizedPreview = previewLicense ? getDisplayLicense(previewLicense) : null;
  const previewRegionMeta = localizedPreview ? getLicenseRegionMeta(localizedPreview.region) : null;

  return (
    <section
      id="licenses"
      aria-labelledby="licenses-heading"
      className="py-20 sm:py-28 border-t border-[#DDA146]/20 bg-[#070605] relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 end-1/4 w-[420px] h-[420px] rounded-full bg-[#DDA146]/8 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Admin Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-px bg-[#DDA146]" aria-hidden="true" />
              <p className="text-xs font-semibold tracking-wide text-[#DDA146]">{t.kicker}</p>
            </div>
            <h2
              id="licenses-heading"
              className="text-2xl sm:text-4xl font-bold text-[#F8F9FA] leading-tight"
            >
              {t.heading}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A9AFBE] max-w-2xl leading-relaxed">
              {isAdmin ? t.subheading : t.publicSubheading}
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#DDA146] to-[#F3C067] hover:brightness-110 text-[#070605] px-4 py-2.5 text-sm font-bold transition-all shadow-[0_0_12px_rgba(221,161,70,0.3)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addBtn}</span>
              </button>
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="inline-flex items-center gap-2 rounded-lg border border-[#DDA146]/30 bg-[#120F0A] hover:border-[#DDA146] text-[#F4F5F7] px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t.manageBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Regional Country Filter Strip */}
        <div
          role="tablist"
          aria-label={t.fields.region}
          data-testid="license-region-tabs"
          className="flex flex-wrap items-center gap-2.5 pb-8 mb-10 border-b border-[#DDA146]/20"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedRegion === 'all'}
            data-testid="region-tab-all"
            onClick={() => setSelectedRegion('all')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedRegion === 'all'
                ? 'bg-[#DDA146] border-[#DDA146] text-[#070605] shadow-[0_0_10px_rgba(221,161,70,0.3)]'
                : 'bg-[#120F0A] border-[#DDA146]/25 text-[#D1D5DB] hover:border-[#DDA146]/60 hover:text-white'
            }`}
          >
            <Globe2 className="w-4 h-4 shrink-0" />
            <span>{t.allRegions}</span>
            <span
              className={`font-code text-[11px] px-1.5 py-0.5 rounded ${
                selectedRegion === 'all' ? 'bg-[#070605]/20 text-[#070605]' : 'bg-white/6 text-[#9CA3AF]'
              }`}
            >
              {licenses.length}
            </span>
          </button>

          {regionalGroups.map(({ region, items }) => {
            const active = selectedRegion === region.id;
            const label =
              lang === 'ku'
                ? region.labelKu || region.labelAr
                : lang === 'ar'
                  ? region.labelAr
                  : region.labelEn;
            return (
              <button
                key={region.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`region-tab-${region.id}`}
                onClick={() => setSelectedRegion(region.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#DDA146] border-[#DDA146] text-[#070605] shadow-[0_0_10px_rgba(221,161,70,0.3)]'
                    : 'bg-[#120F0A] border-[#DDA146]/25 text-[#D1D5DB] hover:border-[#DDA146]/60 hover:text-white'
                }`}
              >
                <span
                  className={`font-code text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    active ? 'bg-[#070605]/20 text-[#070605]' : 'bg-[#DDA146]/15 text-[#DDA146]'
                  }`}
                >
                  {region.code}
                </span>
                <span>{label}</span>
                <span className={`font-code text-[11px] ${active ? 'text-[#070605]/80' : 'text-[#8E95A5]'}`}>
                  {items.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grouped Country Sections — Facebook Story/Card Style Row Grid */}
        {visibleGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDA146]/30 bg-[#120F0A] p-12 text-center">
            <FileText className="w-10 h-10 text-[#DDA146] mx-auto mb-3" />
            <p className="text-base font-semibold text-[#F4F5F7]">{t.emptyTitle}</p>
            <p className="text-sm text-[#9CA3AF] mt-1 mb-5">{t.emptyDesc}</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#DDA146] text-[#070605] px-4 py-2 text-sm font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addFirstBtn}</span>
              </button>
            )}
          </div>
        ) : (
          <div data-testid="licenses-grouped-container" className="space-y-10">
            {visibleGroups.map(({ region, items }) => {
              const regionTitle =
                lang === 'ku'
                  ? region.labelKu || region.labelAr
                  : lang === 'ar'
                    ? region.labelAr
                    : region.labelEn;
              const countLabel =
                lang === 'ar'
                  ? items.length === 1
                    ? t.countSingle
                    : `${items.length} ${t.countPlural}`
                  : items.length === 1
                    ? t.countSingle
                    : `${items.length} ${t.countPlural}`;

              return (
                <section
                  key={region.id}
                  data-testid={`license-group-${region.id}`}
                  aria-labelledby={`group-heading-${region.id}`}
                  className="relative rounded-2xl border border-[#DDA146]/25 bg-[#0C0A07]/95 p-5 sm:p-6 overflow-hidden"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#DDA146] via-[#F3C067]/65 to-transparent z-10"
                  />

                  {/* Country Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#DDA146]/15">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-[#DDA146]/35 bg-[#DDA146]/10 flex flex-col items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-[#DDA146] mb-0.5" aria-hidden="true" />
                        <span className="font-code text-[10px] font-bold tracking-wider text-[#F3C067]">
                          {region.code}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3
                            id={`group-heading-${region.id}`}
                            className="text-lg sm:text-xl font-bold text-[#F8F9FA]"
                          >
                            {regionTitle}
                          </h3>
                          <span className="inline-flex items-center rounded-md border border-[#DDA146]/30 bg-[#DDA146]/10 px-2 py-0.5 text-[11px] font-semibold text-[#F3C067]">
                            {countLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openCreateModal(region.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DDA146]/40 bg-[#DDA146]/10 hover:bg-[#DDA146] hover:text-[#070605] text-[#F3C067] px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addToRegionBtn}</span>
                      </button>
                    )}
                  </div>

                  {/* Facebook Story-Style Horizontal Grid (Side-by-Side Cards) */}
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/12 bg-[#070605] p-8 text-center">
                      <p className="text-sm text-[#9CA3AF]">{t.emptyTitle}</p>
                    </div>
                  ) : (
                    <div
                      data-testid={`licenses-grid-${region.id}`}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                      {items.map((rawLic) => {
                        const lic = getDisplayLicense(rawLic);
                        const hasCustomPdf = isPdfAttachment(lic.attachmentDataUrl);
                        const isBusy = downloadingId === lic.id;

                        return (
                          <article
                            key={lic.id}
                            data-testid={`license-card-${lic.id}`}
                            className="group relative flex flex-col justify-between rounded-xl border border-[#DDA146]/25 bg-[#120F0A] hover:border-[#DDA146]/80 hover:shadow-[0_0_20px_rgba(221,161,70,0.2)] transition-all duration-200 overflow-hidden shadow-lg p-4"
                          >
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#DDA146] via-[#F3C067] to-transparent"
                            />

                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-[#DDA146]/12 border border-[#DDA146]/25 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-[#DDA146]" />
                                </div>
                                <span className="inline-flex items-center gap-1 rounded border border-[#DDA146]/25 bg-[#070605] px-2 py-0.5 text-[10px] font-semibold text-[#D1D5DB]">
                                  <span className="font-code text-[#DDA146] font-bold">PDF</span>
                                  <span>{hasCustomPdf ? t.pdfAttached : t.pdfReady}</span>
                                </span>
                              </div>

                              <h4
                                title={lic.title}
                                className="text-sm font-bold text-[#F8F9FA] leading-snug mb-3 line-clamp-2"
                              >
                                {lic.title}
                              </h4>
                            </div>

                            <div className="pt-3 border-t border-[#DDA146]/15 flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewLicense(rawLic)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DDA146] hover:text-[#F3C067] cursor-pointer bg-[#070605] px-2.5 py-1.5 rounded border border-[#DDA146]/25"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{t.viewDoc}</span>
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleDownloadPdf(rawLic)}
                                aria-label={`${t.downloadPdf} — ${lic.title}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#DDA146] hover:bg-[#F3C067] disabled:opacity-60 text-[#070605] px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{isBusy ? t.downloadingPdf : t.downloadPdf}</span>
                              </button>

                              {isAdmin && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(rawLic)}
                                    aria-label="Edit"
                                    className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/8 cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void onDeleteLicense(lic.id)}
                                    aria-label="Delete"
                                    className="p-1 rounded text-[#9CA3AF] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit License Modal (Admin Only) */}
      {isAdmin && modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="license-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#14161E] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
              <h3 id="license-modal-title" className="text-lg font-bold text-[#F8F9FA]">
                {editingId ? t.modalEditTitle : t.modalAddTitle}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label={t.cancel}
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/8 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <label htmlFor="lic-region" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  {t.formRegion}
                </label>
                <select
                  id="lic-region"
                  value={draft.region}
                  onChange={(e) => setDraft({ ...draft, region: e.target.value as LicenseRegion })}
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm text-white focus:border-[#DFAF5A] focus:outline-none"
                >
                  {LICENSE_REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {lang === 'ku'
                        ? region.labelKu || region.labelAr
                        : lang === 'ar'
                          ? region.labelAr
                          : region.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lic-title" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  {t.formTitle}
                </label>
                <input
                  id="lic-title"
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder={lang === 'en' ? 'e.g. Audiovisual Production Permit' : 'مثال: ترخيص الإنتاج الإعلامي'}
                  className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none"
                />
                {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lic-authority" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                    {t.formAuthority}
                  </label>
                  <input
                    id="lic-authority"
                    type="text"
                    value={draft.authority}
                    onChange={(e) => setDraft({ ...draft, authority: e.target.value })}
                    placeholder={lang === 'en' ? 'e.g. Ministry of Media' : 'مثال: وزارة الإعلام / هيئة تنظيم الإعلام'}
                    className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none"
                  />
                  {errors.authority && <p className="mt-1 text-xs text-rose-400">{errors.authority}</p>}
                </div>

                <div>
                  <label htmlFor="lic-number" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                    {t.formNumber}
                  </label>
                  <input
                    id="lic-number"
                    type="text"
                    dir="ltr"
                    value={draft.licenseNumber}
                    onChange={(e) => setDraft({ ...draft, licenseNumber: e.target.value })}
                    placeholder="e.g. LIC-2026-904"
                    className="w-full rounded-lg border border-white/12 bg-[#0D0E13] px-3.5 py-2.5 text-sm font-code text-white placeholder:text-[#6B7280] focus:border-[#DFAF5A] focus:outline-none text-left"
                  />
                  {errors.licenseNumber && <p className="mt-1 text-xs text-rose-400">{errors.licenseNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  {t.formAttachment}
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#0D0E13] px-4 py-3 text-xs text-[#C5C9D3] hover:border-[#DFAF5A]/50 cursor-pointer">
                    <Upload className="w-4 h-4 text-[#DFAF5A] shrink-0" />
                    <span className="truncate">{draft.attachmentName || t.chooseFile}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={handleAttachmentChange}
                      className="hidden"
                    />
                  </label>
                  {draft.attachmentDataUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          attachmentName: '',
                          attachmentDataUrl: '',
                        }))
                      }
                      aria-label={t.removeFile}
                      className="rounded-lg border border-white/12 px-3 py-3 text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                    >
                      {t.removeFile}
                    </button>
                  )}
                </div>
                {errors.attachment && (
                  <p className="mt-1 text-xs text-rose-400">{errors.attachment}</p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/12 px-4 py-2 text-sm text-[#D1D5DB] hover:bg-white/6 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-5 py-2 text-sm font-bold cursor-pointer"
                >
                  {editingId ? t.saveEdit : t.saveNew}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* License Preview & Full Details Modal */}
      {localizedPreview && previewRegionMeta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-license-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/12 bg-[#14161E] p-5 sm:p-7 shadow-2xl my-8 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-code text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-[#DFAF5A]/15 text-[#F6DDA7] border border-[#DFAF5A]/30">
                    {previewRegionMeta.code}
                  </span>
                  <span className="text-xs text-[#D1D5DB] font-medium">
                    {lang === 'ku'
                      ? previewRegionMeta.labelKu || previewRegionMeta.labelAr
                      : lang === 'ar'
                        ? previewRegionMeta.labelAr
                        : previewRegionMeta.labelEn}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Verified & Active'
                        : lang === 'ku'
                          ? 'پەسەندکراو و کارا'
                          : 'معتمد وسارٍ'}
                    </span>
                  </span>
                </div>
                <h3 id="preview-license-title" className="text-xl sm:text-2xl font-bold text-[#F8F9FA] leading-snug pt-0.5">
                  {localizedPreview.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLicense(null)}
                aria-label={t.closePreview}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete License Information Details Grid */}
            <div className="py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-white/8 bg-[#0D0E14]">
                  <p className="text-[11px] font-semibold text-[#8E95A5] mb-1">{t.fields.authority}</p>
                  <p className="text-sm font-bold text-[#F8F9FA]">{localizedPreview.authority || '—'}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-white/8 bg-[#0D0E14]">
                  <p className="text-[11px] font-semibold text-[#8E95A5] mb-1">{t.fields.number}</p>
                  <p dir="ltr" className="text-sm font-code font-bold text-[#F6DDA7] rtl:text-right ltr:text-left">
                    {localizedPreview.licenseNumber || '—'}
                  </p>
                </div>
              </div>

              {/* Official Attached File Card with Direct Open & Download Action */}
              {localizedPreview.attachmentDataUrl && (
                <div className="p-4 rounded-xl border border-[#DFAF5A]/30 bg-[#DFAF5A]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#DFAF5A]/15 border border-[#DFAF5A]/35 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#DFAF5A]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F8F9FA] break-all">
                        {localizedPreview.attachmentName || `${localizedPreview.title}.pdf`}
                      </p>
                      <p className="text-[11px] text-[#A9AFBE]">
                        {isPdfAttachment(localizedPreview.attachmentDataUrl)
                          ? (lang === 'en' ? 'Official PDF Certificate Document' : lang === 'ku' ? 'بەڵگەنامەی فەرمی PDF' : 'مستند وترخيص رسمي معتمد بصيغة PDF')
                          : (lang === 'en' ? 'Official Document Image' : lang === 'ku' ? 'وێنەی بەڵگەنامەی فەرمی' : 'صورة الوثيقة المعتمدة')}
                      </p>
                    </div>
                  </div>

                  <a
                    href={localizedPreview.attachmentDataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-4 py-2 text-xs font-bold transition-colors shrink-0 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Open Document'
                        : lang === 'ku'
                          ? 'کردنەوەی بەڵگەنامە'
                          : 'عرض المستند الأصلي'}
                    </span>
                  </a>
                </div>
              )}

              {/* If an image attachment, display thumbnail preview cleanly */}
              {isImageAttachment(localizedPreview.attachmentDataUrl) && localizedPreview.attachmentDataUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60 p-2 flex justify-center">
                  <img
                    src={localizedPreview.attachmentDataUrl}
                    alt={localizedPreview.title}
                    referrerPolicy="no-referrer"
                    className="max-h-72 w-auto max-w-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-white/10">
              <span className="text-xs text-[#8E95A5]">
                {previewRegionMeta.code} · {localizedPreview.licenseNumber}
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewLicense(null)}
                  className="rounded-lg border border-white/12 px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:bg-white/6 cursor-pointer transition-colors"
                >
                  {t.closePreview}
                </button>
                <button
                  type="button"
                  disabled={downloadingId === localizedPreview.id}
                  onClick={() => previewLicense && void handleDownloadPdf(previewLicense)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#DFAF5A] hover:bg-[#ECC578] text-[#0B0C10] px-4 py-2 text-xs font-bold cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingId === localizedPreview.id ? t.downloadingPdf : t.downloadDoc}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
