import { db } from '@/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { banners as defaultBanners } from '@/data';
import type { Banner } from '@/types';

export interface MasterBanner extends Banner {
  active?: boolean;
  display_order?: number;
  category?: string;
}

const STORAGE_KEY = 'akselling_master_banners';

function getLocalBanners(): MasterBanner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalMasterBanners(bannersList: MasterBanner[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bannersList));
    window.dispatchEvent(new Event('akselling_banners_updated'));
  } catch {
    // ignore
  }
}

export async function fetchBanners(): Promise<Banner[]> {
  // First check local cached banners for 0ms load
  const local = getLocalBanners();
  if (local.length > 0) {
    const active = local.filter(b => b.active !== false);
    if (active.length > 0) {
      return active.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
  }

  // Next fetch from Firebase Firestore 'banners' collection
  try {
    const bannersCol = collection(db, 'banners');
    const snap = await getDocs(bannersCol);
    if (!snap.empty) {
      const items: MasterBanner[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          title: (d.title as string) || '',
          subtitle: (d.subtitle as string) || '',
          cta: (d.cta as string) || 'Shop Now',
          image: (d.image as string) || (d.imageUrl as string) || '',
          gradient: (d.gradient as string) || 'from-blue-600 to-indigo-800',
          active: d.active !== false && d.isActive !== false,
          display_order: Number(d.display_order || d.order || 1),
          category: d.category as string,
        });
      });
      saveLocalMasterBanners(items);
      const activeItems = items.filter(b => b.active !== false);
      if (activeItems.length > 0) {
        return activeItems.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      }
    }
  } catch (err) {
    console.warn('Firestore fetch banners notice:', err);
  }

  return defaultBanners;
}

export async function fetchAllMasterBanners(): Promise<MasterBanner[]> {
  const local = getLocalBanners();
  if (local.length > 0) {
    return local.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  try {
    const bannersCol = collection(db, 'banners');
    const snap = await getDocs(bannersCol);
    if (!snap.empty) {
      const items: MasterBanner[] = [];
      snap.forEach((docSnap, idx) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id || `b_${idx}`,
          title: (d.title as string) || '',
          subtitle: (d.subtitle as string) || '',
          cta: (d.cta as string) || 'Shop Now',
          image: (d.image as string) || (d.imageUrl as string) || '',
          gradient: (d.gradient as string) || 'from-blue-600 to-indigo-800',
          active: d.active !== false && d.isActive !== false,
          display_order: Number(d.display_order || d.order || idx + 1),
          category: d.category as string,
        });
      });
      saveLocalMasterBanners(items);
      return items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
  } catch (err) {
    console.warn('Firestore fetch all banners notice:', err);
  }

  const initialMaster: MasterBanner[] = defaultBanners.map((b, idx) => ({
    ...b,
    active: true,
    display_order: idx + 1,
  }));
  saveLocalMasterBanners(initialMaster);
  return initialMaster;
}

export async function addMasterBanner(banner: Omit<MasterBanner, 'id'>): Promise<{ banner: MasterBanner; error: string | null }> {
  const newBanner: MasterBanner = {
    ...banner,
    id: `banner_${Date.now()}`,
    active: banner.active ?? true,
    display_order: banner.display_order || 1,
  };

  const current = await fetchAllMasterBanners();
  const updated = [newBanner, ...current];
  saveLocalMasterBanners(updated);

  try {
    const docRef = doc(db, 'banners', newBanner.id);
    await setDoc(docRef, {
      id: newBanner.id,
      title: newBanner.title,
      subtitle: newBanner.subtitle,
      cta: newBanner.cta,
      image: newBanner.image,
      imageUrl: newBanner.image,
      gradient: newBanner.gradient,
      display_order: newBanner.display_order,
      active: newBanner.active,
      isActive: newBanner.active,
      category: newBanner.category || null,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore add banner error:', err);
  }

  return { banner: newBanner, error: null };
}

export async function updateMasterBanner(id: string, updates: Partial<MasterBanner>): Promise<{ error: string | null }> {
  const current = await fetchAllMasterBanners();
  const updated = current.map(b => (b.id === id ? { ...b, ...updates } : b));
  saveLocalMasterBanners(updated);

  try {
    const docRef = doc(db, 'banners', id);
    const firestoreUpdates: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.image) firestoreUpdates.imageUrl = updates.image;
    if (updates.active !== undefined) firestoreUpdates.isActive = updates.active;
    await updateDoc(docRef, firestoreUpdates);
  } catch (err) {
    console.warn('Firestore update banner error:', err);
  }

  return { error: null };
}

export async function deleteMasterBanner(id: string): Promise<{ error: string | null }> {
  const current = await fetchAllMasterBanners();
  const updated = current.filter(b => b.id !== id);
  saveLocalMasterBanners(updated);

  try {
    const docRef = doc(db, 'banners', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete banner error:', err);
  }

  return { error: null };
}

export async function trackProductView(productId: string): Promise<void> {
  try {
    const viewRef = doc(collection(db, 'product_views'));
    await setDoc(viewRef, {
      productId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // silent
  }
}

// Aliases for backwards compatibility
export const fetchAllBanners = fetchAllMasterBanners;
export const addBanner = addMasterBanner;
export const updateBanner = updateMasterBanner;
export const deleteBanner = deleteMasterBanner;
