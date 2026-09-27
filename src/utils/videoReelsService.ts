import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '@/firebase';
import { FASHION_REELS, type VideoReelItem } from '@/components/video-shopping/reelsData';

export type { VideoReelItem };

const REELS_STORAGE_KEY = 'akselling_video_reels_cache';

export function getCachedVideoReels(): VideoReelItem[] {
  try {
    const raw = localStorage.getItem(REELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeWithDefaults(parsed);
      }
    }
  } catch {
    // fallback
  }
  return FASHION_REELS;
}

export function setCachedVideoReels(reels: VideoReelItem[]): void {
  try {
    localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(reels));
  } catch {
    // ignore
  }
}

function mergeWithDefaults(fetched: VideoReelItem[]): VideoReelItem[] {
  const customMap = new Map<string, VideoReelItem>();
  // 1. Add custom/admin uploaded reels first so they appear at the top
  fetched.forEach((r) => {
    if (r && r.id) customMap.set(r.id, r);
  });
  // 2. Add defaults if not overridden
  FASHION_REELS.forEach((def) => {
    if (!customMap.has(def.id)) {
      customMap.set(def.id, def);
    }
  });
  return Array.from(customMap.values());
}

/**
 * Real-time listener for video reels from Firebase Firestore & backend server
 */
export function subscribeVideoReels(callback: (reels: VideoReelItem[]) => void): () => void {
  // Emit cached or default reels immediately for 0ms initial load
  const initial = getCachedVideoReels();
  callback(initial);

  // Fetch from server /api/reels as fallback/complement
  fetch('/api/reels')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.reels) && data.reels.length > 0) {
        const merged = mergeWithDefaults(data.reels);
        setCachedVideoReels(merged);
        callback(merged);
      }
    })
    .catch(() => {});

  // Listen to Firestore 'video_reels' collection
  try {
    const reelsRef = collection(db, 'video_reels');
    const q = query(reelsRef);
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: VideoReelItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              productId: data.productId || '',
              videoUrl: data.videoUrl || '',
              posterUrl: data.posterUrl || '',
              creatorName: data.creatorName || 'AKSelling Official',
              creatorAvatar: data.creatorAvatar || '',
              caption: data.caption || '',
              songTitle: data.songTitle || 'Original Audio • AKSelling (Sound Active)',
              likesCount: Number(data.likesCount) || 120,
              commentsCount: Number(data.commentsCount) || 12,
              sharesCount: Number(data.sharesCount) || 35,
              tag: data.tag || 'Fashion',
              audioEnabled: data.audioEnabled !== false,
              product: data.product || undefined,
            });
          });
          const merged = mergeWithDefaults(list);
          setCachedVideoReels(merged);
          callback(merged);
        }
      },
      (err) => {
        console.warn('Firestore video_reels listener fallback:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to video_reels:', err);
    return () => {};
  }
}

/**
 * Save new or updated Video Reel to Firestore and Server
 */
export async function saveVideoReelToFirestore(reel: VideoReelItem): Promise<void> {
  const reelId = reel.id || `reel_${Date.now()}`;
  const payload: VideoReelItem = {
    ...reel,
    id: reelId,
    audioEnabled: reel.audioEnabled !== false,
    likesCount: reel.likesCount || 0,
    commentsCount: reel.commentsCount || 0,
    sharesCount: reel.sharesCount || 0,
  };

  // 1. Update local cache
  const current = getCachedVideoReels();
  const next = [payload, ...current.filter((r) => r.id !== reelId)];
  setCachedVideoReels(next);

  // 2. Persist to server backend API
  try {
    await fetch('/api/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Server video reel write notice:', err);
  }

  // 3. Persist to Firebase Firestore
  try {
    const docRef = doc(db, 'video_reels', reelId);
    const cleaned = sanitizeForFirestore(payload);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    console.warn('Firestore video_reels write notice:', err);
  }
}

/**
 * Delete a Video Reel from Firestore and Server
 */
export async function deleteVideoReelFromFirestore(reelId: string): Promise<void> {
  if (!reelId) return;

  // 1. Update local cache
  const current = getCachedVideoReels();
  const next = current.filter((r) => r.id !== reelId);
  setCachedVideoReels(next);

  // 2. Delete from server
  try {
    await fetch(`/api/reels/${reelId}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  // 3. Delete from Firestore
  try {
    await deleteDoc(doc(db, 'video_reels', reelId));
  } catch (err) {
    console.warn('Firestore video_reels delete notice:', err);
  }
}
