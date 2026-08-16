import React, { useEffect, useState } from 'react';
import { ImagePlus, X, Camera, Paperclip } from 'lucide-react';
import api from '../api/client';
import logo from '../assets/logo.jpeg';

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 6;
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB per photo
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB per attachment

const SubmitComplaint = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    location_address: '',
  });
  const [photos, setPhotos] = useState([]); // array of base64 strings
  const [attachments, setAttachments] = useState([]); // array of File objects for optional uploads
  const [uploadProgress, setUploadProgress] = useState(null); // percent 0-100
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) {
          setFormData((f) => ({ ...f, category_id: res.data[0].category_id }));
        }
      })
      .catch(() => setError('Could not load categories. Is the server running?'));
    // Try to get user's location once for better duplicate detection
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setCoords({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const handlePhotosSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      e.target.value = '';
      return;
    }

    files.forEach((file) => {
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" is larger than 3MB — please use a smaller photo.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setPhotos((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });

    e.target.value = ''; // allow re-selecting the same file if removed later
  };

  const handleAttachmentsSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`"${file.name}" is larger than 10MB — please use a smaller file.`);
        e.target.value = '';
        return;
      }
    }

    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (photos.length < MIN_PHOTOS) {
      setError(`Please attach at least ${MIN_PHOTOS} photos of the issue before submitting.`);
      return;
    }

    setLoading(true);
    try {
      const body = { ...formData, photos };
      if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
      }
      const res = await api.post('/complaints', body);
      setResult(res.data);
      // Upload optional attachments via the files API after complaint created
      if (attachments.length > 0 && res.data && res.data.complaint_id) {
        try {
          const form = new FormData();
          attachments.forEach((f) => form.append('files', f));
          form.append('complaint_id', res.data.complaint_id);
          setUploadProgress(0);
          await api.post('/files/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (ev) => {
              if (!ev.lengthComputable) return;
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setUploadProgress(pct);
            }
          });
          setUploadProgress(100);
        } catch (err) {
          console.error('Attachment upload failed', err);
          setError('Complaint submitted but some attachments failed to upload. You can add them later from the dashboard.');
        } finally {
          // hide progress after short delay
          setTimeout(() => setUploadProgress(null), 800);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting. Make sure your server is running!');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <img src={logo} alt="MuniReport" className="w-14 h-14 rounded-full object-cover mb-6 ring-4 ring-white shadow" />
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">✓</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Complaint Submitted</h2>
          <p className="text-slate-500 mb-6">Your report is now in the system.</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reference Number</p>
            <p className="font-mono font-black text-xl text-slate-900">{result.reference_number}</p>
          </div>
          {result.is_duplicate && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              A similar report already exists for this location — this has been flagged for review as a
              possible duplicate.
            </p>
          )}
          <button onClick={onBack} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all active:scale-95">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl flex items-center gap-3 mb-6">
        <img src={logo} alt="MuniReport" className="w-10 h-10 rounded-full object-cover" />
        <span className="font-black text-slate-800 text-lg">MuniReport</span>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-2xl">
        <button onClick={onBack} className="text-blue-600 font-bold mb-6 hover:underline">← Back to Dashboard</button>

        <h2 className="text-3xl font-black text-slate-800 mb-2 italic">Report an Issue</h2>
        <p className="text-slate-500 mb-8">Fill in the details below to notify the municipality.</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Category</label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Location Address</label>
            <input
              type="text"
              required
              value={formData.location_address}
              placeholder="e.g., 45 Jan van Riebeeck St, Sasolburg"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Description</label>
            <textarea
              required
              value={formData.description}
              placeholder="Provide as much detail as possible..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase">Photos</label>
              <span className={`text-xs font-bold ${photos.length < MIN_PHOTOS ? 'text-amber-600' : 'text-green-600'}`}>
                {photos.length} / {MIN_PHOTOS} minimum attached
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="aspect-square flex flex-col items-center justify-center gap-1 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition text-slate-400">
                  <ImagePlus size={20} />
                  <span className="text-[10px] font-bold uppercase">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosSelected} />
                </label>
              )}
            </div>

            <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
              <Camera size={13} /> Attach at least {MIN_PHOTOS} clear photos of the issue (up to {MAX_PHOTOS}, 3MB each).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase">Additional Attachments</label>
              <span className="text-xs font-bold text-slate-400">Optional — documents, videos, or extra images (10MB max each)</span>
            </div>

            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {attachments.map((f, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Paperclip size={14} />
                    <span className="text-sm max-w-xs truncate">{f.name}</span>
                    <button type="button" onClick={() => removeAttachment(i)} className="text-xs text-red-500 ml-2">Remove</button>
                  </div>
                ))}
              </div>
            </div>

              {uploadProgress !== null && (
                <div className="mt-2">
                  <div className="text-xs font-bold mb-1">Uploading attachments — {uploadProgress}%</div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${uploadProgress}%` }} className="h-2 bg-blue-600 transition-all" />
                  </div>
                </div>
              )}

            <label className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-50">
              <Paperclip size={16} />
              <span className="text-sm font-bold">Add attachments</span>
              <input type="file" multiple className="hidden" onChange={handleAttachmentsSelected} />
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95 disabled:opacity-60">
            {loading ? 'Submitting…' : 'SUBMIT COMPLAINT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
