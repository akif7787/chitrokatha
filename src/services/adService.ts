import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AdminAdvertisement, AdStatus, AdType } from '../admin/types/adminTypes';

export interface AdCampaignRecord {
  id: string;
  campaign_name: string;
  media_type: 'image' | 'video' | 'pdf';
  media_url: string;
  storage_path?: string;
  target_url?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'paused' | 'expired';
  placement: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const LOCAL_ADS_KEY = 'chitrokatha_ad_campaigns_v1';

export function getLocalAdCampaigns(): AdminAdvertisement[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAdCampaigns(ads: AdminAdvertisement[]): void {
  try {
    localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(ads));
  } catch {}
}

/**
 * Upload advertisement media to Supabase Storage bucket `advertisements`
 */
export async function uploadAdMedia(file: File): Promise<{
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  mediaType?: 'image' | 'video' | 'pdf';
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    // Local fallback: create object URL
    const objectUrl = URL.createObjectURL(file);
    let type: 'image' | 'video' | 'pdf' = 'image';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('video')) type = 'video';
    return { success: true, publicUrl: objectUrl, mediaType: type };
  }

  // Validate file types: JPG, PNG, WEBP, PDF, MP4, WEBM
  const mime = file.type.toLowerCase();
  let mediaType: 'image' | 'video' | 'pdf' = 'image';

  if (mime === 'application/pdf') {
    mediaType = 'pdf';
  } else if (mime.startsWith('video/')) {
    if (!['video/mp4', 'video/webm'].includes(mime)) {
      return { success: false, error: 'Only MP4 and WebM videos are supported.' };
    }
    mediaType = 'video';
  } else if (mime.startsWith('image/')) {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime)) {
      return { success: false, error: 'Only JPG, PNG, and WebP images are supported.' };
    }
    mediaType = 'image';
  } else {
    return { success: false, error: 'Unsupported file format. Please upload JPG, PNG, PDF, or MP4.' };
  }

  // Validate file size: 50MB max
  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds maximum limit of 50MB.' };
  }

  try {
    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `campaigns/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('advertisements')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('advertisements')
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      storagePath: filePath,
      mediaType,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Media upload failed' };
  }
}

/**
 * Fetch all advertisement campaigns for Admin View
 */
export async function fetchAdminAdCampaigns(): Promise<AdminAdvertisement[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.campaign_name,
          type: d.media_type as AdType,
          previewUrl: d.media_url,
          targetUrl: d.target_url || '#',
          startDate: d.start_date,
          endDate: d.end_date,
          status: d.status as AdStatus,
          impressions: 0,
          clicks: 0,
          mediaType: d.media_type,
          storagePath: d.storage_path,
          placement: d.placement,
          createdAt: d.created_at,
        }));
      }
    } catch (err: any) {
      console.warn('[AdService] Error fetching campaigns:', err?.message);
    }
  }

  return getLocalAdCampaigns();
}

/**
 * Create a new advertisement campaign
 */
export async function createAdCampaign(params: {
  campaignName: string;
  mediaType: 'image' | 'video' | 'pdf';
  mediaUrl: string;
  storagePath?: string;
  targetUrl?: string;
  startDate: string;
  endDate: string;
  placement: string;
  adminUserId?: string;
}): Promise<{ success: boolean; data?: AdminAdvertisement; error?: string }> {
  const newAd: AdminAdvertisement = {
    id: `ad_${Date.now()}`,
    title: params.campaignName.trim(),
    type: params.mediaType as AdType,
    previewUrl: params.mediaUrl,
    targetUrl: params.targetUrl || '#',
    startDate: params.startDate,
    endDate: params.endDate,
    status: 'active',
    impressions: 0,
    clicks: 0,
    mediaType: params.mediaType,
    storagePath: params.storagePath,
    placement: params.placement,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('advertisement_campaigns') as any)
        .insert({
          campaign_name: params.campaignName.trim(),
          media_type: params.mediaType,
          media_url: params.mediaUrl,
          storage_path: params.storagePath || null,
          target_url: params.targetUrl || null,
          start_date: params.startDate,
          end_date: params.endDate,
          status: 'active',
          placement: params.placement,
          created_by: params.adminUserId || null,
        })
        .select()
        .single();

      if (!error && data) {
        newAd.id = data.id;

        // Log audit
        if (params.adminUserId) {
          try {
            const { error: logErr } = await (supabase.from('admin_activity_logs') as any).insert({
              admin_user_id: params.adminUserId,
              action: 'create_ad_campaign',
              entity_type: 'ad_campaign',
              entity_id: data.id,
              metadata: { name: params.campaignName, placement: params.placement },
            });
            if (logErr) {
              console.warn('[AdService] Activity log notice:', logErr.message);
            }
          } catch (lErr: any) {
            console.warn('[AdService] Activity log notice:', lErr?.message);
          }
        }
      } else if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.warn('[AdService] DB Insert notice:', err?.message);
    }
  }

  const localList = getLocalAdCampaigns();
  saveLocalAdCampaigns([newAd, ...localList]);
  return { success: true, data: newAd };
}

/**
 * Update an existing advertisement campaign
 */
export async function updateAdCampaign(params: {
  campaignId: string;
  campaignName: string;
  mediaType: 'image' | 'video' | 'pdf';
  mediaUrl: string;
  storagePath?: string;
  targetUrl?: string;
  startDate: string;
  endDate: string;
  placement: string;
  status: AdStatus;
  adminUserId?: string;
  oldStoragePath?: string;
}): Promise<{ success: boolean; data?: AdminAdvertisement; error?: string }> {
  const updatedAd: AdminAdvertisement = {
    id: params.campaignId,
    title: params.campaignName.trim(),
    type: params.mediaType as AdType,
    previewUrl: params.mediaUrl,
    targetUrl: params.targetUrl || '#',
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
    impressions: 0,
    clicks: 0,
    mediaType: params.mediaType,
    storagePath: params.storagePath,
    placement: params.placement,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('advertisement_campaigns') as any)
        .update({
          campaign_name: params.campaignName.trim(),
          media_type: params.mediaType,
          media_url: params.mediaUrl,
          storage_path: params.storagePath || null,
          target_url: params.targetUrl || null,
          start_date: params.startDate,
          end_date: params.endDate,
          status: params.status,
          placement: params.placement,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.campaignId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        updatedAd.id = data.id;
        updatedAd.createdAt = data.created_at;
      }

      // Cleanup old media file if a new file was uploaded and old file path changed
      if (params.oldStoragePath && params.storagePath && params.oldStoragePath !== params.storagePath) {
        supabase.storage.from('advertisements').remove([params.oldStoragePath]).catch(() => {});
      }

      // Audit log
      if (params.adminUserId) {
        try {
          const { error: logErr } = await (supabase.from('admin_activity_logs') as any).insert({
            admin_user_id: params.adminUserId,
            action: 'update_ad_campaign',
            entity_type: 'ad_campaign',
            entity_id: params.campaignId,
            metadata: { name: params.campaignName, placement: params.placement, status: params.status },
          });
          if (logErr) {
            console.warn('[AdService] Activity log notice:', logErr.message);
          }
        } catch (lErr: any) {
          console.warn('[AdService] Activity log notice:', lErr?.message);
        }
      }
    } catch (err: any) {
      console.warn('[AdService] DB Update notice:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  const localList = getLocalAdCampaigns();
  const updatedList = localList.map((a) => (a.id === params.campaignId ? updatedAd : a));
  saveLocalAdCampaigns(updatedList);
  return { success: true, data: updatedAd };
}

/**
 * Toggle or update campaign status (active <-> paused)
 */
export async function toggleAdCampaignStatus(
  campaignId: string,
  currentStatus: AdStatus,
  adminUserId?: string
): Promise<{ success: boolean; nextStatus?: AdStatus; error?: string }> {
  const nextStatus: AdStatus = currentStatus === 'active' ? 'paused' : 'active';

  if (isSupabaseConfigured()) {
    try {
      const { error } = await (supabase.from('advertisement_campaigns') as any)
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (adminUserId) {
        try {
          const { error: logErr } = await (supabase.from('admin_activity_logs') as any).insert({
            admin_user_id: adminUserId,
            action: 'toggle_ad_status',
            entity_type: 'ad_campaign',
            entity_id: campaignId,
            metadata: { newStatus: nextStatus },
          });
          if (logErr) {
            console.warn('[AdService] Activity log notice:', logErr.message);
          }
        } catch (lErr: any) {
          console.warn('[AdService] Activity log notice:', lErr?.message);
        }
      }
    } catch (err: any) {
      console.warn('[AdService] Status toggle notice:', err?.message);
    }
  }

  const localList = getLocalAdCampaigns();
  const updated = localList.map((ad) => (ad.id === campaignId ? { ...ad, status: nextStatus } : ad));
  saveLocalAdCampaigns(updated);

  return { success: true, nextStatus };
}

/**
 * Delete an advertisement campaign
 */
export async function deleteAdCampaign(
  campaignId: string,
  storagePath?: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      // 1. Delete DB record
      const { error } = await supabase
        .from('advertisement_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      // 2. Delete storage file if path present
      if (storagePath) {
        await supabase.storage.from('advertisements').remove([storagePath]).catch(() => {});
      }

      if (adminUserId) {
        try {
          const { error: logErr } = await (supabase.from('admin_activity_logs') as any).insert({
            admin_user_id: adminUserId,
            action: 'delete_ad_campaign',
            entity_type: 'ad_campaign',
            entity_id: campaignId,
          });
          if (logErr) {
            console.warn('[AdService] Activity log notice:', logErr.message);
          }
        } catch (lErr: any) {
          console.warn('[AdService] Activity log notice:', lErr?.message);
        }
      }
    } catch (err: any) {
      console.warn('[AdService] Delete notice:', err?.message);
    }
  }

  const localList = getLocalAdCampaigns();
  saveLocalAdCampaigns(localList.filter((a) => a.id !== campaignId));
  return { success: true };
}

/**
 * Check whether a campaign placement matches the requested public placement and device viewport.
 */
export function isPlacementMatch(campaignPlacement: string | undefined, requestedPlacement?: string): boolean {
  if (!campaignPlacement || campaignPlacement === 'all') return true;

  // Device targeting rules
  if (typeof window !== 'undefined') {
    const isMobileViewport = window.innerWidth < 768;
    if (campaignPlacement === 'mobile') return isMobileViewport;
    if (campaignPlacement === 'desktop') return !isMobileViewport;
  }

  if (!requestedPlacement || requestedPlacement === 'all') return true;

  // Normalized matching with common aliases
  const normalize = (p: string) => {
    if (p === 'homepage_hero' || p === 'homepage_banner') return 'homepage';
    if (p === 'movies' || p === 'movie') return 'movie_page';
    if (p === 'drama' || p === 'natok') return 'drama_page';
    if (p === 'series' || p === 'webseries') return 'webseries_page';
    return p;
  };

  const normCampaign = normalize(campaignPlacement);
  const normRequested = normalize(requestedPlacement);

  return normCampaign === normRequested;
}

/**
 * Fetch active advertisement campaigns for public website consumption
 * Strictly enforces:
 * - status === 'active'
 * - start_date <= today
 * - end_date >= today
 */
export async function fetchActiveAdCampaigns(placement?: string): Promise<AdminAdvertisement[]> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (isSupabaseConfigured()) {
    try {
      const query = supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', todayStr)
        .gte('end_date', todayStr)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        let list = data.map((d: any) => ({
          id: d.id,
          title: d.campaign_name,
          type: d.media_type as AdType,
          previewUrl: d.media_url,
          targetUrl: d.target_url || '#',
          startDate: d.start_date,
          endDate: d.end_date,
          status: d.status as AdStatus,
          impressions: 0,
          clicks: 0,
          mediaType: d.media_type,
          storagePath: d.storage_path,
          placement: d.placement,
          createdAt: d.created_at,
        }));

        if (placement && placement !== 'all') {
          list = list.filter((a) => isPlacementMatch(a.placement, placement));
        }
        return list;
      }
    } catch (err: any) {
      console.warn('[AdService] Active campaign fetch notice:', err?.message);
    }
  }

  // Fallback to local storage with same strict date and status filters
  const local = getLocalAdCampaigns();
  return local.filter((a) => {
    const isActive = a.status === 'active';
    const isStarted = !a.startDate || a.startDate <= todayStr;
    const isNotExpired = !a.endDate || a.endDate >= todayStr;
    const matchesPlacement = !placement || placement === 'all' || isPlacementMatch(a.placement, placement);
    return isActive && isStarted && isNotExpired && matchesPlacement;
  });
}
