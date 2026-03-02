
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Club, User, UserRoles } from '../types';

interface ClubsViewProps {
  clubs: Club[];
  user: User | null;
  onAddClub?: (club: Club) => void;
  onDeleteClub?: (id: string) => void;
}

const MAX_BASE64_BYTES = 150000; // ~150KB hard cap to fit Turso row limits

const compressImage = (base64: string, maxWidth = 800, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      ctx.drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL('image/jpeg', quality);
      // If still too big, re-compress at lower quality
      if (result.length > MAX_BASE64_BYTES) {
        result = canvas.toDataURL('image/jpeg', 0.3);
      }
      // If STILL too big, shrink further
      if (result.length > MAX_BASE64_BYTES) {
        canvas.width = Math.floor(width * 0.6);
        canvas.height = Math.floor(height * 0.6);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL('image/jpeg', 0.3);
      }
      resolve(result);
    };
    img.onerror = () => resolve(base64);
  });
};

const ClubsView: React.FC<ClubsViewProps> = ({ clubs, user, onAddClub, onDeleteClub }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [formData, setFormData] = useState<Partial<Club>>({
    name: '',
    tagline: '',
    description: '',
    logo: '',
    bannerImage: '',
    themeColor: '#800000'
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isAuthorizedAdmin = user && (user.role === UserRoles.ADMIN || user.role === UserRoles.SUPER_ADMIN);

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tagline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'bannerImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const maxWidth = field === 'logo' ? 300 : 800;
      const compressed = await compressImage(base64, maxWidth);
      if (compressed.length > 200000) {
        alert('Image is too large even after compression. Please use a smaller image (under 500KB).');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = () => {
    if (!formData.name || !formData.logo || !formData.bannerImage) {
      alert("Please ensure Name, Brand Logo, and Hero Banner are all provided.");
      return;
    }
    const newClub: Club = {
      id: 'c' + Date.now(),
      name: formData.name || '',
      tagline: formData.tagline || '',
      description: formData.description || '',
      bannerImage: formData.bannerImage || '',
      logo: formData.logo || '',
      themeColor: formData.themeColor || '#800000'
    };
    onAddClub?.(newClub);
    setShowAddModal(false);
    setFormData({ name: '', tagline: '', description: '', logo: '', bannerImage: '', themeColor: '#800000' });
  };

  const openDeleteModal = (e: React.MouseEvent, club: Club) => {
    e.stopPropagation();
    e.preventDefault();
    setClubToDelete(club);
    setDeleteConfirmation('');
  };

  const confirmDelete = () => {
    if (clubToDelete && deleteConfirmation.trim() === clubToDelete.name.trim()) {
      onDeleteClub?.(clubToDelete.id);
      setClubToDelete(null);
      setDeleteConfirmation('');
    }
  };

  const goToClub = (id: string) => {
    navigate(`/clubs/${id}`);
  };

  return (
    <div className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {isAuthorizedAdmin && (
          <div className="mb-12 bg-maroon-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-fade-in border border-white/10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">
                <i className="fa-solid fa-screwdriver-wrench"></i>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Chapter Command Center</h3>
                <p className="text-maroon-200 text-sm font-medium opacity-80">Provision and manage Titan chapters.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-maroon-900 px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-maroon-50 transition-all flex items-center gap-3 text-xs uppercase tracking-widest active:scale-95"
            >
              <i className="fa-solid fa-plus-circle text-lg"></i> Provision New Club
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 animate-slide-up">
          <div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4 leading-none">The Club Hub</h2>
            <p className="text-gray-500 text-lg font-medium max-w-xl">Central directory for all Titan chapters. Connect with specialized innovative groups.</p>
          </div>

          <div className="relative w-full md:w-96 group">
            <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-maroon-800 transition-colors"></i>
            <input
              type="text"
              placeholder="Find a club..."
              className="w-full pl-14 pr-8 py-5 bg-white rounded-2xl border-none shadow-sm focus:ring-4 focus:ring-maroon-800/10 font-bold outline-none text-lg transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredClubs.map((club) => (
            <div
              key={club.id}
              onClick={() => goToClub(club.id)}
              className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full relative cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={club.bannerImage} alt={club.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/95 via-maroon-900/20 to-transparent"></div>

                {isAuthorizedAdmin && (
                  <button
                    onClick={(e) => openDeleteModal(e, club)}
                    className="absolute top-6 right-6 z-30 w-14 h-14 bg-red-600 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-red-700 transition-all border border-white/20 shadow-[0_10px_30px_rgba(220,38,38,0.4)] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0"
                    title="Permanently Decommission Club"
                  >
                    <i className="fa-solid fa-trash-can text-xl"></i>
                  </button>
                )}

                <div className="absolute bottom-8 left-8 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-2xl flex-shrink-0">
                    <img src={club.logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-black text-2xl tracking-tight uppercase truncate">{club.name}</h3>
                    <p className="text-maroon-300 text-[10px] font-black uppercase tracking-widest mt-1 line-clamp-1">{club.tagline}</p>
                  </div>
                </div>
              </div>
              <div className="p-10 flex-grow">
                <p className="text-gray-500 font-medium leading-relaxed text-sm line-clamp-3">{club.description}</p>
              </div>
              <div className="p-10 pt-0 flex justify-between items-center text-maroon-800 font-black text-[10px] uppercase tracking-[0.25em]">
                <span className="flex items-center gap-2">Explore Chapter <i className="fa-solid fa-compass"></i></span>
                <i className="fa-solid fa-arrow-right-long group-hover:translate-x-3 transition-transform text-lg"></i>
              </div>
            </div>
          ))}
        </div>

        {filteredClubs.length === 0 && (
          <div className="py-48 text-center opacity-10 flex flex-col items-center">
            <i className="fa-solid fa-layer-group text-[12rem] mb-8"></i>
            <h3 className="text-4xl font-black uppercase tracking-[0.5em]">No Chapters Provisioned</h3>
          </div>
        )}
      </div>

      {clubToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-white rounded-[1.5cm] w-full max-w-lg p-12 shadow-2xl border-t-[16px] border-red-600">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-4">Decommission Chapter</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                You are about to permanently erase the <span className="text-red-600 font-black">"{clubToDelete.name}"</span> chapter and all associated records.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Type the club name exactly to confirm:
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-5 font-bold text-center outline-none focus:border-red-600 focus:bg-white transition-all text-xl"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={clubToDelete.name}
              />
            </div>

            <div className="flex gap-4 mt-12">
              <button
                onClick={() => { setClubToDelete(null); setDeleteConfirmation(''); }}
                className="flex-grow bg-gray-100 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all"
              >
                Abort
              </button>
              <button
                disabled={deleteConfirmation.trim() !== clubToDelete.name.trim()}
                onClick={confirmDelete}
                className={`flex-grow py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all ${deleteConfirmation.trim() === clubToDelete.name.trim()
                    ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                    : 'bg-red-200 cursor-not-allowed'
                  }`}
              >
                Delete Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-12 shadow-2xl border border-gray-100 my-10 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-maroon-800 transition-colors">
              <i className="fa-solid fa-circle-xmark text-4xl"></i>
            </button>

            <h3 className="text-3xl font-black tracking-tighter uppercase text-gray-900 mb-8 leading-none">Provision Chapter</h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Club Designation</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-8 py-5 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner text-lg" placeholder="Official Chapter Name" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Brand Identity (Logo)</label>
                  <button onClick={() => logoInputRef.current?.click()} className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center overflow-hidden hover:bg-maroon-50 transition-all">
                    {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain p-4" alt="Logo" /> : <i className="fa-solid fa-image text-gray-200 text-3xl"></i>}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Primary Color Profile</label>
                  <div className="w-full h-32 bg-gray-50 border-2 border-gray-100 rounded-3xl flex items-center justify-center p-3 relative overflow-hidden">
                    <input type="color" value={formData.themeColor} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-full h-full rounded-2xl shadow-inner border border-white/20" style={{ backgroundColor: formData.themeColor }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Visual Hero Manifest (Banner)</label>
                <button onClick={() => bannerInputRef.current?.click()} className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center overflow-hidden hover:bg-maroon-50 transition-all">
                  {formData.bannerImage ? <img src={formData.bannerImage} className="w-full h-full object-cover" alt="Banner" /> : <i className="fa-solid fa-panorama text-gray-200 text-4xl"></i>}
                </button>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'bannerImage')} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Chapter Strategic Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-8 py-5 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner h-32 resize-none" placeholder="Elaborate on the club's mission and scope..." />
              </div>
            </div>

            <div className="flex gap-6 mt-12">
              <button onClick={() => setShowAddModal(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200">Abort</button>
              <button onClick={handleAddSubmit} className="flex-grow bg-maroon-800 text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-maroon-900 active:scale-95 transition-all">Deploy Chapter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubsView;
