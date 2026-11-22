import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  DEFAULT_LOGO_URL,
  DEFAULT_PROFILE,
  normalizeLicenseRegion,
  type CompanyProfile,
  type LicenseRecord,
} from './utils/siteStore';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'rakannabale100@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function signInAdminWithGoogle(): Promise<User> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Sign in anonymously so Firestore writes are authenticated.
 * Called right after the admin successfully enters the PIN code.
 */
export async function signInAdminAnonymously(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export async function verifyUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    // Expected permission-denied for non-admin users who are not bootstrapped
    if (error instanceof Error && /permission/i.test(error.message)) {
      return false;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function profileToFirestorePayload(profile: CompanyProfile, uid: string) {
  return {
    nameAr: profile.nameAr,
    nameEn: profile.nameEn,
    taglineAr: profile.taglineAr,
    taglineEn: profile.taglineEn,
    aboutSummary: profile.aboutSummary,
    teamSummary: profile.teamSummary,
    logoDataUrl: profile.logoDataUrl ?? DEFAULT_LOGO_URL,
    customModelName: profile.customModelName ?? '',
    phone: profile.contact.phone,
    email: profile.contact.email,
    locationAr: profile.contact.locationAr,
    locationEn: profile.contact.locationEn,
    mapsUrl: profile.contact.mapsUrl,
    youtube: profile.socials.youtube,
    instagram: profile.socials.instagram,
    linkedin: profile.socials.linkedin,
    facebook: profile.socials.facebook,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

export function firestoreDocToProfile(data: Record<string, unknown>): CompanyProfile {
  const str = (key: string, fallback: string) =>
    typeof data[key] === 'string' && (data[key] as string).length > 0
      ? (data[key] as string)
      : fallback;

  return {
    nameAr: str('nameAr', DEFAULT_PROFILE.nameAr),
    nameEn: str('nameEn', DEFAULT_PROFILE.nameEn),
    taglineAr: str('taglineAr', DEFAULT_PROFILE.taglineAr),
    taglineEn: str('taglineEn', DEFAULT_PROFILE.taglineEn),
    aboutSummary: str('aboutSummary', DEFAULT_PROFILE.aboutSummary),
    teamSummary: str('teamSummary', DEFAULT_PROFILE.teamSummary),
    logoDataUrl: str('logoDataUrl', DEFAULT_LOGO_URL),
    customModelName:
      typeof data.customModelName === 'string' && data.customModelName.length > 0
        ? data.customModelName
        : null,
    contact: {
      phone: str('phone', DEFAULT_PROFILE.contact.phone),
      email: str('email', DEFAULT_PROFILE.contact.email),
      locationAr: str('locationAr', DEFAULT_PROFILE.contact.locationAr),
      locationEn: str('locationEn', DEFAULT_PROFILE.contact.locationEn),
      mapsUrl: str('mapsUrl', DEFAULT_PROFILE.contact.mapsUrl),
    },
    socials: {
      youtube: str('youtube', DEFAULT_PROFILE.socials.youtube),
      instagram: str('instagram', DEFAULT_PROFILE.socials.instagram),
      linkedin: str('linkedin', DEFAULT_PROFILE.socials.linkedin),
      facebook: str('facebook', DEFAULT_PROFILE.socials.facebook),
    },
  };
}

export async function saveSiteConfigToFirestore(profile: CompanyProfile): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const path = 'siteConfig/public';
  try {
    await setDoc(doc(db, 'siteConfig', 'public'), profileToFirestorePayload(profile, user.uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createLicenseInFirestore(record: LicenseRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const path = `licenses/${record.id}`;
  try {
    await setDoc(doc(db, 'licenses', record.id), {
      region: normalizeLicenseRegion(record.region),
      title: record.title,
      authority: record.authority,
      licenseNumber: record.licenseNumber,
      issueDate: record.issueDate,
      expiryDate: record.expiryDate,
      status: record.status,
      category: record.category,
      notes: record.notes ?? '',
      attachmentName: record.attachmentName ?? '',
      attachmentDataUrl: record.attachmentDataUrl ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLicenseInFirestore(record: LicenseRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const path = `licenses/${record.id}`;
  try {
    await updateDoc(doc(db, 'licenses', record.id), {
      region: normalizeLicenseRegion(record.region),
      title: record.title,
      authority: record.authority,
      licenseNumber: record.licenseNumber,
      issueDate: record.issueDate,
      expiryDate: record.expiryDate,
      status: record.status,
      category: record.category,
      notes: record.notes ?? '',
      attachmentName: record.attachmentName ?? '',
      attachmentDataUrl: record.attachmentDataUrl ?? '',
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLicenseFromFirestore(id: string): Promise<void> {
  const path = `licenses/${id}`;
  try {
    await deleteDoc(doc(db, 'licenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublicSiteData(callbacks: {
  onConfig: (profile: CompanyProfile, existsInDb: boolean) => void;
  onLicenses: (licenses: LicenseRecord[], isEmptyInDb: boolean) => void;
}): Unsubscribe {
  const configPath = 'siteConfig/public';
  const unsubConfig = onSnapshot(
    doc(db, 'siteConfig', 'public'),
    (snap) => {
      if (snap.exists()) {
        callbacks.onConfig(
          firestoreDocToProfile(snap.data() as Record<string, unknown>),
          true,
        );
      } else {
        callbacks.onConfig(DEFAULT_PROFILE, false);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, configPath);
    },
  );

  const licensesPath = 'licenses';
  const licensesQuery = query(
    collection(db, 'licenses'),
    where('status', 'in', ['active', 'pending', 'expired']),
  );
  const unsubLicenses = onSnapshot(
    licensesQuery,
    (snap) => {
      const items: LicenseRecord[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          region: normalizeLicenseRegion(data.region),
          title: String(data.title ?? ''),
          authority: String(data.authority ?? ''),
          licenseNumber: String(data.licenseNumber ?? ''),
          issueDate: String(data.issueDate ?? ''),
          expiryDate: String(data.expiryDate ?? ''),
          status:
            data.status === 'pending' || data.status === 'expired'
              ? data.status
              : 'active',
          category: String(data.category ?? ''),
          notes: typeof data.notes === 'string' ? data.notes : '',
          attachmentName:
            typeof data.attachmentName === 'string' ? data.attachmentName : '',
          attachmentDataUrl:
            typeof data.attachmentDataUrl === 'string' ? data.attachmentDataUrl : '',
        };
      });
      callbacks.onLicenses(items, snap.empty);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, licensesPath);
    },
  );

  return () => {
    unsubConfig();
    unsubLicenses();
  };
}
