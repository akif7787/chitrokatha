import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { uploadAdMedia, updateAdCampaign } from '../../../services/adService';
import { AdminAdvertisement, AdStatus } from '../../types/adminTypes';
import { Save, Upload, CheckCircle2, AlertCircle, FileText, Film, Image as ImageIcon } from 'lucide-react';

interface EditAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdminAdvertisement | null;
}

export const EditAdModal: React.FC<EditAdModalProps> = ({ isOpen, onClose, ad }) => {
  const { refreshAds, currentAdmin } = useAdmin();

  const [title, setTitle] = useState('');
  const [placement, setPlacement] = useState('homepage');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<AdStatus>('active');

  // Media file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string>('');
  const [existingMediaType, setExistingMediaType] = useState<'image' | 'video' | 'pdf'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Sync state when ad changes
  useEffect(() => {
    if (ad) {
      setTitle(ad.title || '');
      setPlacement(ad.placement || 'homepage');
      setTargetUrl(ad.targetUrl && ad.targetUrl !== '#' ? ad.targetUrl : '');
      setStartDate(ad.startDate || '');
      setEndDate(ad.endDate || '');
      setStatus(ad.status || 'active');
      setExistingMediaUrl(ad.previewUrl || '');
      setExistingMediaType(ad.mediaType || 'image');
      setSelectedFile(null);
      setFilePreview(null);
      setStatusMessage(null);
    }
  }, [ad]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'File size must be 50MB or less.' });
      return;
    }

    setSelectedFile(file);
    setStatusMessage(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;

    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Campaign title is required.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      let finalMediaUrl = existingMediaUrl;
      let finalMediaType = existingMediaType;
      let finalStoragePath = ad.storagePath;

      // 1. If a new media file is chosen, upload it first
      if (selectedFile) {
        const uploadRes = await uploadAdMedia(selectedFile);
        if (!uploadRes.success || !uploadRes.publicUrl) {
          setStatusMessage({ type: 'error', text: uploadRes.error || 'Failed to upload new media file.' });
          setIsUploading(false);
          return;
        }
        finalMediaUrl = uploadRes.publicUrl;
        finalMediaType = uploadRes.mediaType || 'image';
        finalStoragePath = uploadRes.storagePath;
      }

      // 2. Update campaign in database
      const updateRes = await updateAdCampaign({
        campaignId: ad.id,
        campaignName: title.trim(),
        mediaType: finalMediaType,
        mediaUrl: finalMediaUrl,
        storagePath: finalStoragePath,
        oldStoragePath: selectedFile ? ad.storagePath : undefined,
        targetUrl: targetUrl.trim() || undefined,
        startDate,
        endDate,
        placement,
        status,
        adminUserId: currentAdmin.id,
      });

      if (!updateRes.success) {
        setStatusMessage({ type: 'error', text: updateRes.error || 'Failed to update campaign.' });
        setIsUploading(false);
        return;
      }

      await refreshAds();
      onClose();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update campaign.' });
    } finally {
      setIsUploading(false);
    }
  };

  if (!ad) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Advertisement Campaign"
      subtitle={`Update details for "${ad.title}"`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Campaign Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grameenphone 5G Mega Festival"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Placement / Slot</label>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            >
              <option value="homepage">Homepage Banner / Feed</option>
              <option value="movie_page">Movie Section Banner</option>
              <option value="drama_page">Natok / Drama Section</option>
              <option value="webseries_page">Web Series Section</option>
              <option value="video_player">In-stream Video Player</option>
              <option value="mobile">Mobile Devices</option>
              <option value="desktop">Desktop Displays</option>
              <option value="all">Global / All Pages</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdStatus)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            >
              <option value="active">Active (সক্রিয়)</option>
              <option value="paused">Paused / Inactive (স্থগিত)</option>
              <option value="expired">Expired (মেয়াদোত্তীর্ণ)</option>
            </select>
          </div>
        </div>

        {/* Media File Upload or Existing Media */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Campaign Creative / Media (Leave empty to keep existing media)
          </label>
          <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 text-center bg-black/30 transition-colors">
            <input
              type="file"
              id="edit-ad-media-input"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="edit-ad-media-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              {selectedFile ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>New file: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-zinc-300 font-medium">Click to replace media file</div>
                  <div className="text-[10px] text-zinc-500">Supports JPG, PNG, PDF, MP4 (up to 50MB)</div>
                </>
              )}
            </label>
          </div>

          {/* Visual Preview */}
          {filePreview ? (
            <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 max-h-36 bg-black flex items-center justify-center">
              <img src={filePreview} alt="New Creative Preview" className="max-h-36 object-contain" />
            </div>
          ) : existingMediaUrl ? (
            <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 max-h-36 bg-black flex items-center justify-center relative">
              {existingMediaType === 'video' ? (
                <video src={existingMediaUrl} className="max-h-36 object-contain" muted autoPlay loop />
              ) : (
                <img src={existingMediaUrl} alt="Current Creative" className="max-h-36 object-contain" />
              )}
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur rounded text-[10px] text-zinc-300 font-mono">
                Current Media
              </span>
            </div>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Target Click URL</label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://brand.com/campaign"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            <Save className="w-4 h-4" />
            <span>{isUploading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
