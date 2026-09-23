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

// In-memory cache for ultra-resilience against localStorage QuotaExceeded errors
let inMemoryBanners: MasterBanner[] | null = null;

function getLocalBanners(): MasterBanner[] {
  if (inMemoryBanners && inMemoryBanners.length > 0) {
    return inMemoryBanners;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryBanners = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalMasterBanners(bannersList: MasterBanner[]): void {
  inMemoryBanners = [...bannersList];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bannersList));
  } catch {
    // QuotaExceededError safety: prune images in localStorage if too large, but keep full data in inMemoryBanners
    try {
      const lightweight = bannersList.map(b => ({
        ...b,
        image: b.image && b.image.length > 5000 ? b.image.slice(0, 100) : b.image,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // ignore
    }
  }
  window.dispatchEvent(new Event('akselling_banners_updated'));
}

export async function fetchBanners(): Promise<Banner[]> {
  const all = await fetchAllMasterBanners();
  const active = all.filter(b => b.active !== false);
  return active.length > 0 ? active.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) : defaultBanners;
}

export async function fetchAllMasterBanners(): Promise<MasterBanner[]> {
  const local = getLocalBanners();
  const mergedMap = new Map<string, MasterBanner>();

  // 1. Preload local/memory
  local.forEach(b => {
    if (b && b.id) mergedMap.set(b.id, b);
  });

  // 2. Fetch from backend API /api/banners
  try {
    const res = await fetch('/api/banners');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.banners) && data.banners.length > 0) {
        data.banners.forEach((b: MasterBanner) => {
          if (b && b.id) mergedMap.set(b.id, { ...mergedMap.get(b.id), ...b });
        });
      }
    }
  } catch {
    // offline/silent
  }

  // 3. Attempt fetch from Firestore 'banners' collection
  try {
    const bannersCol = collection(db, 'banners');
    const snap = await getDocs(bannersCol);
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const bannerId = docSnap.id;
        mergedMap.set(bannerId, {
          id: bannerId,
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
    }
  } catch {
    // Silent fallback to avoid public user permission alerts
  }

  // 4. Default fallback if absolutely nothing exists
  if (mergedMap.size === 0) {
    defaultBanners.forEach((b, idx) => {
      mergedMap.set(b.id, {
        ...b,
        active: true,
        display_order: idx + 1,
      });
    });
  }

  const result = Array.from(mergedMap.values()).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  saveLocalMasterBanners(result);
  return result;
}

export async function addMasterBanner(banner: Omit<MasterBanner, 'id'>): Promise<{ banner: MasterBanner; error: string | null }> {
  const newBanner: MasterBanner = {
    ...banner,
    id: `banner_${Date.now()}`,
    active: banner.active ?? true,
    display_order: banner.display_order || 1,
  };

  const current = getLocalBanners();
  const updated = [newBanner, ...current.filter(b => b.id !== newBanner.id)];
  saveLocalMasterBanners(updated);

  // 1. Sync to server backend /api/banners
  try {
    await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBanner),
    });
  } catch (e) {
    console.warn('Server banner sync notice:', e);
  }

  // 2. Sync to Firebase Firestore
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
    console.warn('Firestore banner write notice (saved to server/local storage):', err);
  }

  window.dispatchEvent(new Event('akselling_banners_updated'));
  return { banner: newBanner, error: null };
}

export async function updateMasterBanner(id: string, updates: Partial<MasterBanner>): Promise<{ error: string | null }> {
  const current = getLocalBanners();
  const updated = current.map(b => (b.id === id ? { ...b, ...updates } : b));
  saveLocalMasterBanners(updated);

  // 1. Sync to server backend /api/banners/:id
  try {
    await fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (e) {
    console.warn('Server banner update notice:', e);
  }

  // 2. Sync to Firebase Firestore
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
    console.warn('Firestore update banner notice:', err);
  }

  window.dispatchEvent(new Event('akselling_banners_updated'));
  return { error: null };
}

export async function deleteMasterBanner(id: string): Promise<{ error: string | null }> {
  const current = getLocalBanners();
  const updated = current.filter(b => b.id !== id);
  saveLocalMasterBanners(updated);

  // 1. Sync to server backend
  try {
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Server banner delete notice:', e);
  }

  // 2. Sync to Firebase Firestore
  try {
    const docRef = doc(db, 'banners', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete banner notice:', err);
  }

  window.dispatchEvent(new Event('akselling_banners_updated'));
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
