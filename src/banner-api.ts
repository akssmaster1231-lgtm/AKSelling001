import { supabase, isSupabaseConfigured } from '@/supabase-client';
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
  // First check local master banners
  const local = getLocalBanners();
  if (local.length > 0) {
    const active = local.filter(b => b.active !== false);
    if (active.length > 0) {
      return active.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
  }

  // Next try Supabase ONLY if legitimately configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          title: row.title as string,
          subtitle: row.subtitle as string,
          cta: row.cta as string,
          image: row.image as string,
          gradient: (row.gradient as string) || 'from-blue-600 to-indigo-800',
        }));
      }
    } catch {
      // ignore
    }
  }

  return defaultBanners;
}

export async function fetchAllMasterBanners(): Promise<MasterBanner[]> {
  const local = getLocalBanners();
  if (local.length > 0) {
    return local.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((row: Record<string, unknown>, idx: number) => ({
          id: (row.id as string) || `b_${idx}`,
          title: (row.title as string) || '',
          subtitle: (row.subtitle as string) || '',
          cta: (row.cta as string) || 'Shop Now',
          image: (row.image as string) || '',
          gradient: (row.gradient as string) || 'from-blue-600 to-indigo-800',
          active: row.active !== false,
          display_order: Number(row.display_order) || idx + 1,
        }));
      }
    } catch {
      // ignore
    }
  }

  // Fallback to default mapped with active true
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

  if (isSupabaseConfigured) {
    try {
      await supabase.from('banners').insert({
        id: newBanner.id,
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        cta: newBanner.cta,
        image: newBanner.image,
        gradient: newBanner.gradient,
        display_order: newBanner.display_order,
        active: newBanner.active,
      });
    } catch {
      // ignore
    }
  }

  return { banner: newBanner, error: null };
}

export async function updateMasterBanner(id: string, updates: Partial<MasterBanner>): Promise<{ error: string | null }> {
  const current = await fetchAllMasterBanners();
  const updated = current.map(b => (b.id === id ? { ...b, ...updates } : b));
  saveLocalMasterBanners(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('banners').update(updates).eq('id', id);
    } catch {
      // ignore
    }
  }

  return { error: null };
}

export async function deleteMasterBanner(id: string): Promise<{ error: string | null }> {
  const current = await fetchAllMasterBanners();
  const updated = current.filter(b => b.id !== id);
  saveLocalMasterBanners(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('banners').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  return { error: null };
}

export async function trackProductView(productId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('product_views').insert({ product_id: productId });
    } catch {
      // ignore
    }
  }
}

// Aliases for backwards compatibility
export const fetchAllBanners = fetchAllMasterBanners;
export const addBanner = addMasterBanner;
export const updateBanner = updateMasterBanner;
export const deleteBanner = deleteMasterBanner;



