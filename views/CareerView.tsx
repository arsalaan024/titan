import React, { useState, useRef } from 'react';
import { CareerItem, User, UserRoles, PortalSettings } from '../types';
import MediaInput from '../components/MediaInput';

interface CareerViewProps {
  items: CareerItem[];
  user: User | null;
  onAdd: (item: CareerItem) => void;
  onDelete: (id: string) => void;
  portalSettings: PortalSettings | null;
}

const CareerView: React.FC<CareerViewProps> = ({ items, user, onAdd, onDelete, portalSettings }) => {
  const [activeTab, setActiveTab] = useState<'placement' | 'internship' | 'hackathon'>('placement');
  const [placementSubTab, setPlacementSubTab] = useState<'opportunities' | 'records'>('opportunities');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CareerItem | null>(null);

  const [formData, setFormData] = useState<Partial<CareerItem>>({
    title: '',
    company: '',
    description: '',
    link: '',
    date: '',
    studentName: '',
    package: '',
    studentPhoto: '',
    resumeUrl: '',
    requirements: '',
    whoCanApply: '',
    linkedinUrl: '',
    batch: '',
    quote: ''
  });

  const canEdit = user && [UserRoles.CAREER_ADMIN, UserRoles.ADMIN, UserRoles.SUPER_ADMIN].includes(user.role as UserRoles);

  const filteredItems = items.filter(item => {
    if (item.type !== activeTab) return false;
    if (activeTab === 'placement') {
      return placementSubTab === 'records' ? item.isRecord : !item.isRecord;
    }
    return true;
  });

  const handleDownloadResume = (url: string | undefined, studentName: string | undefined) => {
    if (!url || url === '#' || url === '') {
      alert("No resume found.");
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `TITAN_RESUME_${(studentName || 'STUDENT').replace(/\s+/g, '_').toUpperCase()}.pdf`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => document.body.removeChild(anchor), 200);
  };

  const handleAddSubmit = () => {
    if (activeTab === 'placement' && placementSubTab === 'records') {
      if (!formData.studentName || !formData.company || !formData.title || !formData.package) {
        alert("Required: Student name, company, post, and package.");
        return;
      }
    } else {
      if (!formData.title || !formData.company || !formData.description) {
        alert("Required: Title, company, and description.");
        return;
      }
    }

    const newItem: CareerItem = {
      id: Date.now().toString(),
      type: activeTab,
      isRecord: activeTab === 'placement' && placementSubTab === 'records',
      title: formData.title || '',
      company: formData.company || '',
      description: formData.description || '',
      link: formData.link,
      date: formData.date,
      studentName: formData.studentName,
      package: formData.package,
      studentPhoto: formData.studentPhoto,
      resumeUrl: formData.resumeUrl,
      requirements: formData.requirements,
      whoCanApply: formData.whoCanApply,
      linkedinUrl: formData.linkedinUrl,
      batch: formData.batch,
      quote: formData.quote
    };

    onAdd(newItem);
    setShowAddModal(false);
    setFormData({ title: '', company: '', description: '', link: '', date: '', studentName: '', package: '', studentPhoto: '', resumeUrl: '', requirements: '', whoCanApply: '', linkedinUrl: '', batch: '', quote: '' });
  };

  return (
    <div className="py-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4">Career Hub.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-xl font-medium">Gateway to elite placements and industrial insights.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {['placement', 'internship', 'hackathon'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                if (tab === 'placement') setPlacementSubTab('opportunities');
              }}
              className={`px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all border-2 ${activeTab === tab
                  ? 'bg-[#800000] border-[#800000] text-white shadow-2xl scale-105'
                  : 'bg-white border-gray-100 text-gray-400 hover:border-maroon-200 hover:text-maroon-800'
                }`}
            >
              {tab}s
            </button>
          ))}
        </div>

        {activeTab === 'placement' && (
          <div className="flex justify-center gap-12 mb-16 border-b-2 border-gray-50 pb-6">
            {['opportunities', 'records'].map(sub => (
              <button
                key={sub}
                onClick={() => setPlacementSubTab(sub as any)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all px-6 ${placementSubTab === sub ? 'text-[#800000] border-b-4 border-[#800000] pb-6 -mb-[26px]' : 'text-gray-300 hover:text-gray-500'}`}
              >
                {sub === 'opportunities' ? 'Active Openings' : 'Hall of Fame'}
              </button>
            ))}
          </div>
        )}

        <div className="mb-16 flex justify-between items-end border-l-[16px] border-[#800000] pl-10">
          <div>
            <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">
              {activeTab === 'placement' ? (placementSubTab === 'records' ? 'Elite Placements' : 'Active Intel') : `${activeTab}s`}
            </h3>
            <p className="text-gray-400 font-medium italic">Verified Titan Data Pipeline.</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#800000] text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#6b0000] active:scale-95 transition-all"
            >
              Provision Record
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative bg-white rounded-[3rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-700 cursor-pointer flex flex-col h-[520px]"
            >
              {item.isRecord ? (
                <div className="flex flex-col h-full">
                  <div className="relative h-[60%] overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={item.studentPhoto || `https://ui-avatars.com/api/?name=${item.studentName}&background=800000&color=fff`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20">
                      <span className="text-white font-black text-[12px] tabular-nums tracking-widest">{item.package}</span>
                    </div>
                    <div className="absolute bottom-8 left-8">
                      <span className="bg-[#800000] text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 inline-block shadow-lg">Batch {item.batch}</span>
                      <h4 className="text-white font-black text-3xl tracking-tighter uppercase leading-none">{item.studentName}</h4>
                    </div>
                  </div>

                  <div className="p-10 flex-grow flex flex-col bg-white border-t border-gray-50">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-[#800000]/5 rounded-2xl flex items-center justify-center text-[#800000] shadow-inner">
                        <i className="fa-solid fa-building"></i>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hiring Entity</p>
                        <p className="font-black text-gray-900 uppercase tracking-tight text-base">{item.company}</p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed italic line-clamp-2">"{item.quote}"</p>
                    {canEdit && <button onClick={(e) => { e.stopPropagation(); if (confirm('Purge?')) onDelete(item.id); }} className="absolute top-8 left-8 w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash"></i></button>}
                  </div>
                </div>
              ) : (
                <div className="p-10 flex flex-col h-full border-t-[12px] border-[#800000]">
                  <div className="w-16 h-16 bg-[#800000]/5 rounded-2xl flex items-center justify-center text-[#800000] text-3xl mb-8 group-hover:bg-[#800000] group-hover:text-white transition-all shadow-inner">
                    <i className={`fa-solid ${item.type === 'placement' ? 'fa-building' : item.type === 'internship' ? 'fa-user-graduate' : 'fa-code'}`}></i>
                  </div>
                  <div className="mb-8">
                    <p className="text-[#800000] font-black text-[10px] uppercase tracking-widest mb-2">{item.company}</p>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{item.title}</h3>
                    <p className="text-gray-400 font-medium text-sm leading-relaxed line-clamp-3">{item.description}</p>
                  </div>
                  <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-gray-300 font-black text-[10px] uppercase tracking-widest">{item.date}</span>
                    <span className="text-[#800000] font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">Details <i className="fa-solid fa-arrow-right ml-2"></i></span>
                  </div>
                  {canEdit && <button onClick={(e) => { e.stopPropagation(); if (confirm('Purge?')) onDelete(item.id); }} className="absolute top-8 right-8 w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash"></i></button>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-3xl overflow-hidden shadow-2xl relative border border-gray-100">
            <button onClick={() => setSelectedItem(null)} className="absolute top-10 right-10 text-gray-300 hover:text-[#800000] transition-all"><i className="fa-solid fa-circle-xmark text-6xl"></i></button>
            <div className="p-16">
              <div className="flex gap-12 items-center mb-16">
                <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-8 border-gray-50 shadow-2xl shrink-0">
                  {selectedItem.isRecord ? (
                    <img src={selectedItem.studentPhoto || `https://ui-avatars.com/api/?name=${selectedItem.studentName}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#800000] flex items-center justify-center text-white text-6xl">
                      <i className={`fa-solid ${selectedItem.type === 'placement' ? 'fa-building' : selectedItem.type === 'internship' ? 'fa-user-graduate' : 'fa-code'}`}></i>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-5xl font-black text-gray-900 uppercase tracking-tighter mb-2">{selectedItem.isRecord ? selectedItem.studentName : selectedItem.title}</h3>
                  <p className="text-2xl font-black text-[#800000] uppercase tracking-tight">{selectedItem.company}</p>
                  {selectedItem.package && <div className="mt-4 inline-block bg-green-50 text-green-600 px-6 py-2 rounded-2xl font-black uppercase text-xs tracking-widest">Comp: {selectedItem.package}</div>}
                </div>
              </div>

              <div className="space-y-10">
                <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 italic font-medium text-lg leading-relaxed text-gray-600">
                  "{selectedItem.isRecord ? (selectedItem.quote || 'Success is the only option.') : selectedItem.description}"
                </div>
                {!selectedItem.isRecord && (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 bg-white border-2 border-gray-50 rounded-3xl">
                      <h4 className="text-[10px] font-black text-[#800000] uppercase tracking-widest mb-4">Requirements</h4>
                      <p className="text-sm font-medium text-gray-400">{selectedItem.requirements || 'Contact career cell.'}</p>
                    </div>
                    <div className="p-8 bg-white border-2 border-gray-50 rounded-3xl">
                      <h4 className="text-[10px] font-black text-[#800000] uppercase tracking-widest mb-4">Eligibility</h4>
                      <p className="text-sm font-medium text-gray-400">{selectedItem.whoCanApply || 'Final year titans.'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-16 flex gap-6">
                {selectedItem.isRecord ? (
                  <button onClick={() => handleDownloadResume(selectedItem.resumeUrl, selectedItem.studentName)} className="flex-grow bg-gray-900 text-white py-8 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-4">
                    <i className="fa-solid fa-file-pdf"></i> Technical Resume
                  </button>
                ) : (
                  <a href={selectedItem.link} target="_blank" className="flex-grow bg-[#800000] text-white py-8 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-4">
                    Launch Application <i className="fa-solid fa-paper-plane"></i>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl p-16 my-10 shadow-2xl relative border border-gray-100">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-[#800000] transition-all"><i className="fa-solid fa-circle-xmark text-6xl"></i></button>
            <h3 className="text-4xl font-black uppercase text-gray-900 mb-12 tracking-tight">Provision <span className="text-[#800000]">Record.</span></h3>

            <div className="space-y-8">
              {activeTab === 'placement' && placementSubTab === 'records' ? (
                <>
                  <input placeholder="Student Identity Name" value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                  <div className="grid grid-cols-2 gap-6">
                    <input placeholder="Designation" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                    <input placeholder="Comp (LPA)" value={formData.package} onChange={e => setFormData({ ...formData, package: e.target.value })} className="p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <input placeholder="Company" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                    <input placeholder="Batch" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} className="p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                  </div>
                  <MediaInput label="Student Portrait" value={formData.studentPhoto || ''} onChange={val => setFormData({ ...formData, studentPhoto: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
                  <MediaInput label="Student Resume (PDF)" value={formData.resumeUrl || ''} onChange={val => setFormData({ ...formData, resumeUrl: val })} storageMode={portalSettings?.storageMode || 'database'} type="document" />
                  <textarea placeholder="Success Quote" value={formData.quote} onChange={e => setFormData({ ...formData, quote: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner h-24 resize-none" />
                </>
              ) : (
                <>
                  <input placeholder="Official Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                  <input placeholder="Entity / Company" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                  <textarea placeholder="Job Brief / Intelligence" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner h-32 resize-none" />
                  <input placeholder="Registry / Link" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full p-6 rounded-2xl bg-gray-50 border-none font-bold shadow-inner" />
                </>
              )}
            </div>

            <div className="flex gap-4 mt-16">
              <button onClick={() => setShowAddModal(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] text-gray-400">Abort</button>
              <button onClick={handleAddSubmit} className="flex-grow bg-[#800000] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Broadcast Intel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerView;
