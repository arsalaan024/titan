import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { User, Club, Activity, UserRoles, Announcement, ChatMessage, PortalSettings } from '../types';
import { db } from '../services/db';
import MediaInput from '../components/MediaInput';

interface ClubDetailViewProps {
  user: User | null;
  clubs: Club[];
  activities: Activity[];
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
  onUpdate: () => void;
  portalSettings: PortalSettings | null;
}

const ClubDetailView: React.FC<ClubDetailViewProps> = ({
  user,
  clubs,
  activities,
  announcements,
  onAddAnnouncement,
  onUpdate,
  portalSettings
}) => {
  const { clubId } = useParams();
  const club = clubs.find(c => c.id === clubId);

  const [activeTab, setActiveTab] = useState<'activities' | 'chat' | 'members'>('activities');
  const [chatMessage, setChatMessage] = useState('');
  const [clubChats, setClubChats] = useState<ChatMessage[]>([]);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [newAnn, setNewAnn] = useState('');
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  const themeColor = club?.themeColor || '#800000';

  const [clubEditForm, setClubEditForm] = useState({
    name: club?.name || '',
    tagline: club?.tagline || '',
    description: club?.description || '',
    logo: club?.logo || '',
    bannerImage: club?.bannerImage || '',
    facultyName: club?.facultyName || '',
    facultyPhoto: club?.facultyPhoto || '',
    facultyRole: club?.facultyRole || '',
    themeColor: club?.themeColor || '#800000'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState({
    name: '',
    date: '',
    reportUrl: '',
    reportName: '',
    photos: [] as string[]
  });

  useEffect(() => {
    if (activeTab === 'chat' && clubChats.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clubChats, activeTab]);

  useEffect(() => {
    if (clubId) {
      db.getClubMembers(clubId).then(setClubMembers);
    }
  }, [clubId, activeTab]);

  if (!club) return <Navigate to="/clubs" />;

  const clubActivities = activities.filter(a => a.clubId === clubId);
  const clubAnnouncements = announcements.filter(a => a.clubId === clubId);

  const isClubAdmin = user?.role === UserRoles.CLUB_ADMIN || [UserRoles.ADMIN, UserRoles.SUPER_ADMIN].includes(user?.role as any);
  const isMember = user?.clubMembership?.includes(club.id) || isClubAdmin;

  const handleSendChat = () => {
    if (!chatMessage.trim() || !user) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: user.name,
      senderRole: user.role,
      text: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clubId: club.id
    };
    setClubChats([...clubChats, msg]);
    setChatMessage('');
  };

  const handlePostAnnouncement = () => {
    if (!newAnn.trim() || !user) return;
    onAddAnnouncement({
      id: Date.now().toString(),
      text: newAnn,
      timestamp: new Date().toLocaleDateString(),
      senderName: user.name,
      clubId: club.id
    });
    setNewAnn('');
  };

  const handleUpdateClubSettings = () => {
    db.updateClub({ ...club, ...clubEditForm }).then(() => {
      onUpdate();
      setIsEditingClub(false);
    });
  };

  const handleDownloadReport = (url: string, fileName: string) => {
    if (!url || url === '#' || url === '') {
      alert("No report found.");
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `TITAN_REPORT_${fileName.replace(/\s+/g, '_').toUpperCase()}.pdf`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => document.body.removeChild(anchor), 200);
  };

  const openActivityModal = (act?: Activity) => {
    if (act) {
      setEditingActivity(act);
      setActivityForm({
        name: act.name,
        date: act.date,
        reportUrl: act.reportUrl || '',
        reportName: act.reportUrl ? 'Existing Document' : '',
        photos: [...act.photos]
      });
    } else {
      setEditingActivity(null);
      setActivityForm({ name: '', date: '', reportUrl: '', reportName: '', photos: [] });
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = () => {
    if (!activityForm.name || !activityForm.date) {
      alert("Required fields missing.");
      return;
    }
    const activityPayload = {
      name: activityForm.name,
      date: activityForm.date,
      reportUrl: activityForm.reportUrl,
      photos: activityForm.photos,
      clubId: club.id,
      clubName: club.name
    };
    if (editingActivity) db.updateActivity({ ...editingActivity, ...activityPayload }).then(() => {
      setIsActivityModalOpen(false);
      onUpdate();
    });
    else db.addActivity({ id: 'act_' + Date.now(), ...activityPayload }).then(() => {
      setIsActivityModalOpen(false);
      onUpdate();
    });
  };

  return (
    <div className="bg-white min-h-screen relative pb-24">
      <div className="relative h-[320px] md:h-[480px] overflow-hidden">
        <img src={club.bannerImage} className="w-full h-full object-cover" alt={club.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 z-50">
          {isClubAdmin && (
            <button
              onClick={() => setIsEditingClub(!isEditingClub)}
              className="backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/20 text-white"
            >
              <i className={`fa-solid ${isEditingClub ? 'fa-xmark' : 'fa-gear'} text-sm`}></i>
              <span>{isEditingClub ? 'Exit' : 'Config'}</span>
            </button>
          )}
        </div>

        <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-white rounded-3xl p-3 shadow-2xl shrink-0">
              <img src={club.logo} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div className="text-white">
              <h2 className="text-6xl font-black tracking-tighter uppercase leading-none mb-3">{club.name}</h2>
              <p className="text-xl font-bold opacity-70 tracking-tight line-clamp-1">{club.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="flex gap-4 mb-12 border-b-2 border-gray-100 overflow-x-auto scroll-hide">
              {['activities', 'chat', 'members'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-4 rounded-t-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white shadow-xl' : 'text-gray-400'}`}
                  style={activeTab === tab ? { backgroundColor: themeColor } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>

            {isEditingClub ? (
              <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 space-y-8 animate-fade-in">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Chapter Configuration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Club Name</label>
                    <input value={clubEditForm.name} onChange={e => setClubEditForm({ ...clubEditForm, name: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-none shadow-inner font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Theme Color</label>
                    <input type="color" value={clubEditForm.themeColor} onChange={e => setClubEditForm({ ...clubEditForm, themeColor: e.target.value })} className="w-full h-16 rounded-2xl overflow-hidden cursor-pointer" />
                  </div>
                </div>

                <MediaInput label="Chapter Logo" value={clubEditForm.logo} onChange={val => setClubEditForm({ ...clubEditForm, logo: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
                <MediaInput label="Hero Banner" value={clubEditForm.bannerImage} onChange={val => setClubEditForm({ ...clubEditForm, bannerImage: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />

                <div className="pt-8 border-t border-gray-200 space-y-6">
                  <h4 className="font-black uppercase tracking-widest text-[#800000] text-sm">Faculty Oversight</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <input placeholder="Faculty Name" value={clubEditForm.facultyName} onChange={e => setClubEditForm({ ...clubEditForm, facultyName: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-none shadow-inner font-bold" />
                    <input placeholder="Faculty Role" value={clubEditForm.facultyRole} onChange={e => setClubEditForm({ ...clubEditForm, facultyRole: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-none shadow-inner font-bold" />
                  </div>
                  <MediaInput label="Faculty Photo" value={clubEditForm.facultyPhoto} onChange={val => setClubEditForm({ ...clubEditForm, facultyPhoto: val })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
                </div>

                <button onClick={handleUpdateClubSettings} className="w-full py-6 bg-[#800000] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl">Broadcast Updates</button>
              </div>
            ) : (
              <>
                {activeTab === 'activities' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Activity Registry</h3>
                      {isClubAdmin && <button onClick={() => openActivityModal()} className="px-8 py-4 rounded-2xl text-white font-black uppercase text-[10px]" style={{ backgroundColor: themeColor }}>New Entry</button>}
                    </div>
                    <div className="grid gap-8">
                      {clubActivities.map(act => (
                        <div key={act.id} className="group bg-gray-50 rounded-[3rem] p-10 border border-gray-100 hover:bg-white transition-all duration-500 relative">
                          {isClubAdmin && (
                            <div className="absolute top-6 right-6 flex gap-2">
                              <button onClick={() => openActivityModal(act)} className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center" style={{ color: themeColor }}><i className="fa-solid fa-pen-nib"></i></button>
                              <button onClick={() => { if (confirm('Purge?')) db.deleteActivity(act.id).then(onUpdate); }} className="w-10 h-10 bg-red-600 shadow-lg rounded-xl text-white flex items-center justify-center"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          )}
                          <div className="flex gap-10">
                            <div className="w-1/3 aspect-square rounded-[2.5rem] overflow-hidden bg-gray-200">
                              <img src={act.photos[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-grow">
                              <span className="text-[10px] font-black uppercase tracking-widest mb-3 block" style={{ color: themeColor }}>{act.date}</span>
                              <h4 className="text-3xl font-black tracking-tighter uppercase mb-6">{act.name}</h4>
                              <div className="flex gap-4">
                                <button onClick={() => handleDownloadReport(act.reportUrl || '', act.name)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 ${act.reportUrl ? 'bg-white' : 'bg-gray-100 text-gray-300 opacity-50'}`} style={act.reportUrl ? { color: themeColor, borderColor: themeColor } : {}}>
                                  <i className="fa-solid fa-file-pdf"></i> Report
                                </button>
                                <Link to={`/gallery?clubId=${club.id}`} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 bg-white" style={{ color: themeColor, borderColor: themeColor }}>
                                  <i className="fa-solid fa-images"></i> Visuals
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="grid grid-cols-4 gap-6">
                    {clubMembers.map(m => (
                      <Link key={m.clerkId} to={`/profile/${m.clerkId}`} className="group bg-white border border-gray-100 rounded-[2.5rem] p-6 text-center hover:shadow-2xl transition-all">
                        <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden mb-4 ring-4 ring-transparent group-hover:ring-[#800000]/10 transition-all">
                          {m.photoUrl ? <img src={m.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-black text-2xl">{m.displayName?.[0]}</div>}
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 line-clamp-1">{m.displayName}</h4>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.role}</p>
                      </Link>
                    ))}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="bg-gray-50 rounded-[3.5rem] p-12 border border-gray-100 flex flex-col h-[700px]">
                    <div className="flex-grow overflow-y-auto space-y-6 pr-4 mb-6 scroll-hide">
                      {clubChats.map(m => (
                        <div key={m.id} className={`flex ${m.senderName === user?.name ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-6 rounded-3xl ${m.senderName === user?.name ? 'text-white rounded-tr-none' : 'bg-white border shadow-sm rounded-tl-none'}`} style={m.senderName === user?.name ? { backgroundColor: themeColor } : {}}>
                            <div className="flex justify-between items-center gap-8 mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{m.senderName}</span>
                              <span className="text-[7px] font-bold opacity-40">{m.timestamp}</span>
                            </div>
                            <p className="text-sm font-medium">{m.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="bg-white rounded-[2rem] p-3 flex gap-4 shadow-sm border border-gray-100">
                      <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} placeholder="Draft message..." className="flex-grow bg-transparent border-none px-6 py-4 font-bold outline-none text-sm" />
                      <button onClick={handleSendChat} className="w-14 h-14 rounded-2xl text-white flex items-center justify-center hover:opacity-90 transition-all" style={{ backgroundColor: themeColor }}><i className="fa-solid fa-paper-plane"></i></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-4 space-y-12">
            <div className="rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden" style={{ backgroundColor: themeColor }}>
              <div className="absolute top-0 right-0 p-6 opacity-10"><i className="fa-solid fa-bullhorn text-8xl"></i></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-60">Chapter Broadcasts</h4>
              <div className="space-y-8 max-h-[300px] overflow-y-auto pr-2 scroll-hide">
                {clubAnnouncements.map(ann => (
                  <div key={ann.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                    <p className="text-base font-medium leading-relaxed mb-3">{ann.text}</p>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{ann.timestamp}</span>
                  </div>
                ))}
              </div>
              {isClubAdmin && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <textarea value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-white outline-none mb-4 resize-none" placeholder="New broadcast..." rows={2} />
                  <button onClick={handlePostAnnouncement} className="w-full bg-white py-3 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl" style={{ color: themeColor }}>Broadcast</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-10">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Chapter Overview</h4>
                <p className="text-base text-gray-600 font-medium leading-relaxed">{club.description}</p>
              </div>
              {club.facultyName && (
                <div className="pt-10 border-t border-gray-50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Faculty Supervisor</h4>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={club.facultyPhoto || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 uppercase tracking-tighter">{club.facultyName}</h5>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>{club.facultyRole}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-16 shadow-2xl relative my-10 border border-gray-100">
            <button onClick={() => setIsActivityModalOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-[#800000] transition-all"><i className="fa-solid fa-circle-xmark text-6xl"></i></button>
            <h3 className="text-4xl font-black uppercase text-gray-900 mb-10 tracking-tight">{editingActivity ? 'Modify' : 'Log'} Activity.</h3>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Activity Name</label>
                <input value={activityForm.name} onChange={e => setActivityForm({ ...activityForm, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-8 py-5 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner text-lg" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Engagement Date</label>
                <input type="date" value={activityForm.date} onChange={e => setActivityForm({ ...activityForm, date: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-8 py-5 font-bold border-none shadow-inner" />
              </div>

              <MediaInput label="Official Report (PDF)" value={activityForm.reportUrl} onChange={val => setActivityForm({ ...activityForm, reportUrl: val })} storageMode={portalSettings?.storageMode || 'database'} type="document" />

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Visual Manifest (Photos)</label>
                <div className="grid grid-cols-4 gap-4">
                  {activityForm.photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={p} className="w-full h-full object-cover" />
                      <button onClick={() => setActivityForm({ ...activityForm, photos: activityForm.photos.filter((_, idx) => idx !== i) })} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  ))}
                </div>
                <MediaInput label="Add Asset" value="" onChange={val => setActivityForm({ ...activityForm, photos: [...activityForm.photos, val] })} storageMode={portalSettings?.storageMode || 'database'} type="image" />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setIsActivityModalOpen(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] text-gray-400">Abort</button>
              <button onClick={handleSaveActivity} className="flex-grow bg-[#800000] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Sync Registry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetailView;
