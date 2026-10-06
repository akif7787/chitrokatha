import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { uploadAdMedia, createAdCampaign } from '../../../services/adService';
import { Megaphone, Plus, Upload, CheckCircle2, AlertCircle, FileText, Film, Image as ImageIcon } from 'lucide-react';

interface AddAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAdModal: React.FC<AddAdModalProps> = ({ isOpen, onClose }) => {
  const { refreshAds, currentAdmin } = useAdmin();

  const [title, setTitle] = useState('');
  const [placement, setPlacement] = useState('homepage_hero');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  // Media file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

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
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Campaign title is required.' });
      return;
    }
    if (!selectedFile) {
      setStatusMessage({ type: 'error', text: 'Please select an image, PDF or video file.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      // 1. Upload to Supabase Storage bucket 'advertisements'
      const uploadRes = await uploadAdMedia(selectedFile);
      if (!uploadRes.success || !uploadRes.publicUrl) {
        setStatusMessage({ type: 'error', text: uploadRes.error || 'Failed to upload media file.' });
        setIsUploading(false);
        return;
      }

      // 2. Create campaign in database
      const createRes = await createAdCampaign({
        campaignName: title.trim(),
        mediaType: uploadRes.mediaType || 'image',
        mediaUrl: uploadRes.publicUrl,
        storagePath: uploadRes.storagePath,
        targetUrl: targetUrl.trim() || undefined,
        startDate,
        endDate,
        placement,
        adminUserId: currentAdmin.id,
      });

      if (!createRes.success) {
        setStatusMessage({ type: 'error', text: createRes.error || 'Failed to save campaign.' });
        setIsUploading(false);
        return;
      }

      await refreshAds();
      onClose();
      // Reset form
      setTitle('');
      setSelectedFile(null);
      setFilePreview(null);
      setTargetUrl('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to create campaign.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Advertisement Campaign"
      subtitle="Upload media to Supabase Storage and activate sponsor campaign"
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
            placeholder="e.g. Grameenphone 5G Streaming Partnership"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Placement / Slot</label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          >
            <option value="homepage_hero">Homepage Hero Banner</option>
            <option value="video_preroll">In-stream Pre-roll Video</option>
            <option value="video_midroll">In-stream Mid-roll Video</option>
            <option value="modal_popup">Interactive Modal Popup</option>
            <option value="sidebar_banner">Sidebar / Feed Banner</option>
          </select>
        </div>

        {/* Media File Upload */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Campaign Creative / Media * (JPG, PNG, PDF, MP4 — Max 50MB)
          </label>
          <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 text-center bg-black/30 transition-colors">
            <input
              type="file"
              id="ad-media-input"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="ad-media-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              {selectedFile ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-zinc-300 font-medium">Click to select media file</div>
                  <div className="text-[10px] text-zinc-500">Supports JPG, PNG, PDF, MP4 (up to 50MB)</div>
                </>
              )}
            </label>
          </div>

          {/* Visual Preview */}
          {filePreview && (
            <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 max-h-36 bg-black flex items-center justify-center">
              <img src={filePreview} alt="Creative Preview" className="max-h-36 object-contain" />
            </div>
          )}
          {selectedFile && selectedFile.type.startsWith('video/') && (
            <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2 text-xs text-zinc-300">
              <Film className="w-4 h-4 text-rose-400" />
              <span>Video creative selected: {selectedFile.name}</span>
            </div>
          )}
          {selectedFile && selectedFile.type.includes('pdf') && (
            <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2 text-xs text-zinc-300">
              <FileText className="w-4 h-4 text-rose-400" />
              <span>PDF document creative selected: {selectedFile.name}</span>
            </div>
          )}
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
            <Plus className="w-4 h-4" />
            <span>{isUploading ? 'Uploading & Creating...' : 'Launch Campaign'}</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
