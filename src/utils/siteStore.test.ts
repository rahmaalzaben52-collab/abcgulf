import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_SERVICES,
  DEFAULT_LICENSES,
  DEFAULT_LOGO_URL,
  DEFAULT_PROFILE,
  LICENSE_REGIONS,
  groupLicensesByRegion,
  normalizeLicenseRegion,
  parseSiteConfig,
  sanitizeExternalUrl,
  serializeSiteConfig,
  validateContactDraft,
  validateLicenseDraft,
} from './siteStore';
import { getDirection } from './i18n';

test('DEFAULT_PROFILE carries updated Erbil location, phone, Gmail, YouTube, and transparent logo', () => {
  assert.equal(DEFAULT_PROFILE.logoDataUrl, DEFAULT_LOGO_URL);
  assert.equal(DEFAULT_PROFILE.contact.phone, '+964 751 524 1452');
  assert.equal(DEFAULT_PROFILE.contact.email, 'Abc.productions2030@gmail.com');
  assert.equal(DEFAULT_PROFILE.contact.locationEn, 'Erbil - Boulevard - B2-12-253');
  assert.equal(
    DEFAULT_PROFILE.socials.youtube,
    'https://youtube.com/@gulf0productions?si=_3G6i9O9mBo8zEbU',
  );
});

test('getDirection maps language codes to RTL/LTR', () => {
  assert.equal(getDirection('ar'), 'rtl');
  assert.equal(getDirection('en'), 'ltr');
});

test('validateLicenseDraft rejects empty fields and invalid date ranges in both AR and EN', () => {
  const invalidEmpty = validateLicenseDraft(
    {
      region: 'saudi',
      title: '',
      authority: '',
      licenseNumber: '',
      issueDate: '',
      expiryDate: '',
      status: 'active',
      category: '',
    },
    'en',
  );
  assert.equal(invalidEmpty.ok, false);
  assert.match(invalidEmpty.errors.title, /Please enter/);

  const invalidDates = validateLicenseDraft({
    region: 'erbil',
    title: 'رخصة بث تجريبية',
    authority: 'هيئة الإعلام',
    licenseNumber: 'LIC-991',
    issueDate: '2026-10-01',
    expiryDate: '2025-01-01',
    status: 'active',
    category: 'بث مرئي',
  });
  assert.equal(invalidDates.ok, false);
  assert.ok(invalidDates.errors.expiryDate);
});

test('validateLicenseDraft accepts valid license records and trims whitespace', () => {
  const valid = validateLicenseDraft({
    region: 'uae',
    title: '  رخصة تصوير سينمائي  ',
    authority: '  هيئة الأفلام  ',
    licenseNumber: ' FILM-2026-01 ',
    issueDate: '2026-01-01',
    expiryDate: '2028-01-01',
    status: 'active',
    category: 'إنتاج سينمائي',
    notes: '  تصريح سنوي  ',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data?.region, 'uae');
  assert.equal(valid.data?.title, 'رخصة تصوير سينمائي');
  assert.equal(valid.data?.licenseNumber, 'FILM-2026-01');
  assert.equal(valid.data?.notes, 'تصريح سنوي');
});

test('LICENSE_REGIONS and groupLicensesByRegion group Saudi, Oman, Kuwait, UAE, and Erbil together cleanly', () => {
  assert.deepEqual(
    LICENSE_REGIONS.map((r) => r.id),
    ['saudi', 'oman', 'kuwait', 'uae', 'erbil'],
  );
  assert.equal(normalizeLicenseRegion('unknown-country'), 'erbil');

  const grouped = groupLicensesByRegion(DEFAULT_LICENSES);
  assert.equal(grouped.length, 5);
  for (const group of grouped) {
    assert.ok(group.items.length >= 1, `Expected default license in region ${group.region.id}`);
    assert.ok(group.items.every((item) => item.region === group.region.id));
  }
});

test('validateContactDraft validates email format and minimum message length in both languages', () => {
  const bad = validateContactDraft(
    {
      name: 'A',
      email: 'invalid-email',
      subject: '',
      message: 'Hi',
    },
    'en',
  );
  assert.equal(bad.ok, false);
  assert.match(bad.errors.name, /full name/i);
  assert.match(bad.errors.email, /valid email/i);
  assert.match(bad.errors.message, /10 characters/i);

  const good = validateContactDraft({
    name: 'راكان نبيل',
    email: 'rakan@gmail.com',
    subject: '',
    message: 'نرغب في إنتاج فيديو إعلاني متكامل لشركتنا خلال الشهر القادم.',
  });
  assert.equal(good.ok, true);
  assert.equal(good.data?.subject, 'استفسار إنتاجي');
});

test('serializeSiteConfig and parseSiteConfig roundtrip cleanly', () => {
  const json = serializeSiteConfig(DEFAULT_PROFILE, DEFAULT_LICENSES);
  const parsed = parseSiteConfig(json);
  assert.ok(parsed);
  assert.equal(parsed?.profile.contact.phone, DEFAULT_PROFILE.contact.phone);
  assert.equal(parsed?.licenses.length, DEFAULT_LICENSES.length);
  assert.equal(parseSiteConfig('not-json'), null);
});

test('sanitizeExternalUrl normalizes missing scheme', () => {
  assert.equal(sanitizeExternalUrl('youtube.com/@abcgulf'), 'https://youtube.com/@abcgulf');
  assert.equal(sanitizeExternalUrl('https://instagram.com/abc'), 'https://instagram.com/abc');
  assert.equal(sanitizeExternalUrl('   '), '#');
});

test('isAdminRouteTriggered detects #admin and ?admin=1 securely', async () => {
  const { isAdminRouteTriggered } = await import('./siteStore');
  assert.equal(isAdminRouteTriggered('#admin', ''), true);
  assert.equal(isAdminRouteTriggered('#/admin', ''), true);
  assert.equal(isAdminRouteTriggered('', '?admin=1'), true);
  assert.equal(isAdminRouteTriggered('', '?mode=admin'), true);
  assert.equal(isAdminRouteTriggered('#services', ''), false);
  assert.equal(isAdminRouteTriggered('', ''), false);
});

test('CORE_SERVICES includes exactly the 5 requested expertise items without srv-aerial', () => {
  assert.equal(CORE_SERVICES.length, 5);
  assert.equal(
    CORE_SERVICES.some((s) => s.id === 'srv-aerial'),
    false,
  );
});
