import React, { useState, useMemo, useEffect } from 'react';
import { Achievement, User, UserRoles, AchievementPost, Activity, PortalSettings } from '../types';
import { db } from '../services/db';
import MediaInput from '../components/MediaInput';

interface AchievementsViewProps {
  user: User | null;
  achievements: Achievement[];
  activities: Activity[];
  posts: AchievementPost[];
  allStudents: User[];
  onAdd: (ach: Achievement) => void;
  onUpdate: (ach: Achievement) => void;
  onDelete: (id: string) => void;
  onRefreshPosts: () => void;
  portalSettings: PortalSettings | null;
}

const AutoCarousel: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!photos || photos.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [photos]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {photos.map((src, i) => (
        <img
          key={i}
          src={src}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ease-in-out ${i === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'
            }`}
          alt="Manifest Proof"
        />
      ))}
    </div>
  );
};

const AchievementsView: React.FC<AchievementsViewProps> = ({
  user,
  achievements,
  activities,
  posts,
  allStudents,
  onAdd,
  onUpdate,
  onDelete,
  onRefreshPosts,
  portalSettings
}) => {
  const [viewMode, setViewMode] = useState<'official' | 'community'>('official');
  const [officialSearch, setOfficialSearch] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingAch, setEditingAch] = useState<Achievement | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Achievement>>({
    participantName: '',
    activityId: '',
    activityName: '',
    achievement: '',
    certificateUrl: '',
    userId: ''
  });

  const [postData, setPostData] = useState<Partial<AchievementPost>>({
    topic: '',
    domain: '',
    rank: '',
    description: '',
    photos: [],
    videoUrl: ''
  });

  const canManage = !!user && (
    user.role === UserRoles.ADMIN ||
    user.role === UserRoles.SUPER_ADMIN ||
    user.role === UserRoles.CLUB_ADMIN
  );

  const filteredAchievements = useMemo(() => {
    return achievements.filter(ach =>
      ach.participantName.toLowerCase().includes(officialSearch.toLowerCase()) ||
      ach.activityName.toLowerCase().includes(officialSearch.toLowerCase()) ||
      ach.achievement.toLowerCase().includes(officialSearch.toLowerCase())
    );
  }, [achievements, officialSearch]);

  const handleDownloadCertificate = (ach: Achievement) => {
    if (!ach.certificateUrl) {
      alert("No certificate available.");
      return;
    }
    const link = document.createElement('a');
    link.href = ach.certificateUrl;
    link.download = `TITAN_HONOR_${ach.participantName.replace(/\s+/g, '_').toUpperCase()}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 200);
  };

  const handlePostSubmit = async () => {
    if (!user) return;
    if (!postData.topic || !postData.description || (postData.photos?.length === 0 && !postData.videoUrl)) {
      alert("Victory log requires a topic, description, and visual manifest proof.");
      return;
    }

    const newPost: any = {
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      topic: postData.topic!,
      domain: postData.domain || 'Uncategorized',
      rank: postData.rank || 'Participant',
      description: postData.description!,
      photos: postData.photos || [],
      videoUrl: postData.videoUrl,
      likes: [],
      comments: []
    };

    try {
      await db.addStudentPost(newPost);
      onRefreshPosts();
      setShowPostModal(false);
      setPostData({ topic: '', domain: '', rank: '', description: '', photos: [], videoUrl: '' });
    } catch (err) {
      alert("Failed to sync victory log.");
    }
  };

  const handleOfficialSubmit = () => {
    if (!formData.participantName || !formData.activityId || !formData.achievement || !formData.certificateUrl) {
      alert("Official Registry Error: Honoree, Activity, Achievement Rank and Proof are required.");
      return;
    }

    const activity = activities.find(a => a.id === formData.activityId);
    const achData: any = {
      participantName: formData.participantName!,
      activityId: formData.activityId!,
      activityName: activity?.name || formData.activityName || 'General Chapter Event',
      achievement: formData.achievement!,
      certificateUrl: formData.certificateUrl!,
      userId: formData.userId
    };

    if (editingAch) {
      db.updateAchievement({ ...achData, id: editingAch.id }).then(() => {
        onRefreshPosts();
        setShowModal(false);
        setEditingAch(null);
      });
    } else {
      db.addAchievement(achData).then(() => {
        onRefreshPosts();
        setShowModal(false);
      });
    }

    setFormData({ participantName: '', activityId: '', activityName: '', achievement: '', certificateUrl: '', userId: '' });
  };

  const handleOfficialEdit = (e: React.MouseEvent, ach: Achievement) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAch(ach);
    setFormData({
      participantName: ach.participantName,
      activityId: ach.activityId,
      activityName: ach.activityName,
      achievement: ach.achievement,
      certificateUrl: ach.certificateUrl,
      userId: ach.userId || ''
    });
    setShowModal(true);
  };

  const renderCardMedia = (post: AchievementPost) => {
    if (post.photos && post.photos.length > 0) return <AutoCarousel photos={post.photos} />;
    if (post.videoUrl && post.videoUrl.trim() !== '') {
      let videoId = '';
      try {
        const url = new URL(post.videoUrl);
        if (url.hostname.includes('youtube.com')) videoId = url.searchParams.get('v') || '';
        else if (url.hostname.includes('youtu.be')) videoId = url.pathname.slice(1);
      } catch (e) { }
      if (videoId) return <iframe src={`https://www.youtube.com/embed/${videoId}?modestbranding=1`} className="w-full h-full" allowFullScreen></iframe>;
      return <video src={post.videoUrl} controls className="w-full h-full object-cover bg-black" />;
    }
    return <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700 font-black uppercase tracking-widest text-[10px]">Asset Missing</div>;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${viewMode === 'official' ? 'bg-[#fcfcfc]' : 'bg-[#0a0a0a]'}`}>

      {/* View Mode Switcher */}
      <div className="fixed top-0 right-16 z-[1000] hidden lg:block">
        <button onClick={() => setViewMode(viewMode === 'official' ? 'community' : 'official')} className="relative group focus:outline-none transition-transform duration-300">
          <div className={`w-14 h-48 relative flex flex-col items-center rounded-b-3xl border-x-4 transition-all duration-700 ${viewMode === 'official' ? 'bg-[#800000] border-maroon-950' : 'bg-gray-800 border-gray-900'}`}>
            <span className="text-white font-black text-[9px] uppercase tracking-[0.4em] transform -rotate-180 mt-12 mb-auto select-none" style={{ writingMode: 'vertical-rl' }}>{viewMode === 'official' ? 'COMMUNITY WINS' : 'HALL OF FAME'}</span>
            <div className="mb-4">
              <div className="w-8 h-8 rounded-full border-[2px] border-yellow-500 bg-white shadow-xl flex items-center justify-center">
                <i className={`fa-solid ${viewMode === 'official' ? 'fa-people-group' : 'fa-medal'} text-maroon-800 text-xs`}></i>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className={`${viewMode === 'community' ? 'max-w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-24`}>

        {viewMode === 'official' ? (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-l-[16px] border-[#800000] pl-10">
              <div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2">Hall of Fame.</h2>
                <p className="text-gray-400 font-medium italic">Certified academic and technical milestones.</p>
              </div>
              <div className="flex gap-4">
                <input type="text" placeholder="Filter registry..." className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm font-bold text-sm w-64" value={officialSearch} onChange={e => setOfficialSearch(e.target.value)} />
                {canManage && (
                  <button onClick={() => setShowModal(true)} className="bg-[#800000] text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-[#6b0000] text-[10px] uppercase tracking-widest transition-all">Publish Honor</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {filteredAchievements.map((ach) => (
                <div key={ach.id} className="group bg-white rounded-[3rem] overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-[500px]">
                  <div className="relative h-[72%] bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                    <img src={ach.certificateUrl} className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-[2s]" alt="" />
                    {canManage && (
                      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => handleOfficialEdit(e, ach)} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><i className="fa-solid fa-pen"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Purge record?')) onDelete(ach.id); }} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    )}
                  </div>
                  <div className="h-[28%] p-8 flex items-center gap-6 bg-white border-t border-gray-50">
                    <div className="w-16 h-16 bg-[#800000]/5 rounded-2xl flex items-center justify-center text-[#800000] font-black text-2xl uppercase">{ach.participantName.charAt(0)}</div>
                    <div className="flex-grow">
                      <h4 className="font-black text-gray-900 text-2xl tracking-tighter uppercase leading-none mb-1">{ach.participantName}</h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#800000] text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">{ach.achievement}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{ach.activityName}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDownloadCertificate(ach)} className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#800000] hover:text-white transition-all flex items-center justify-center shadow-inner"><i className="fa-solid fa-file-arrow-down"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="w-full max-w-6xl flex justify-between items-center mb-16">
              <div>
                <h2 className="text-6xl font-black text-white tracking-tighter uppercase mb-4">Victory <br /><span className="text-[#800000]">Manifest.</span></h2>
                <p className="text-gray-500 font-medium">Live feed of student victories and breakthroughs.</p>
              </div>
              {user && (
                <button onClick={() => setShowPostModal(true)} className="bg-[#800000] text-white px-12 py-6 rounded-[2rem] font-black shadow-[0_20px_40px_rgba(128,0,0,0.4)] hover:bg-[#6b0000] transition-all uppercase text-[10px] tracking-widest flex items-center gap-3"><i className="fa-solid fa-plus-circle text-lg"></i> Add Victory</button>
              )}
            </div>

            <div className="w-full max-w-6xl space-y-32 pb-48">
              {posts.map(post => (
                <div key={post.id} className="flex flex-col lg:flex-row gap-16 items-start">
                  <div className="w-full lg:w-3/5 aspect-[16/10] bg-gray-950 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5">
                    {renderCardMedia(post)}
                    <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
                      <span className="bg-[#800000]/90 backdrop-blur text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">{post.domain}</span>
                      <span className="bg-black/40 backdrop-blur text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">{post.rank}</span>
                    </div>
                  </div>
                  <div className="w-full lg:w-2/5 pt-4">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-2xl border border-white/10 uppercase">{post.userName.charAt(0)}</div>
                      <div>
                        <div className="text-white font-black text-lg uppercase tracking-tight">{post.userName}</div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{formatTime(post.timestamp)}</div>
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">{post.topic}</h3>
                    <div className="bg-white/5 p-10 rounded-[2.5rem] border-l-8 border-[#800000] shadow-xl">
                      <p className="text-gray-300 leading-relaxed font-medium">{post.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Official Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl relative my-10 border border-gray-100">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-[#800000] transition-all"><i className="fa-solid fa-circle-xmark text-5xl"></i></button>
            <h3 className="text-3xl font-black uppercase text-gray-900 mb-10 tracking-tight">Record <span className="text-[#800000]">Honor.</span></h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Select Honoree</label>
                <select value={formData.userId} onChange={(e) => { const sid = e.target.value; const student = allStudents.find(s => s.id === sid); setFormData({ ...formData, userId: sid, participantName: student ? student.name : formData.participantName }); }} className="w-full bg-gray-50 rounded-2xl p-6 font-black border-none shadow-inner outline-none">
                  <option value="">Guest (Unlinked)</option>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Host Activity</label>
                <select value={formData.activityId} onChange={(e) => setFormData({ ...formData, activityId: e.target.value })} className="w-full bg-gray-50 rounded-2xl p-6 font-black border-none shadow-inner outline-none">
                  <option value="">Select Registry Activity</option>
                  {activities.map(act => <option key={act.id} value={act.id}>{act.name} ({act.clubName})</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Achievement Rank</label>
                <input type="text" value={formData.achievement} onChange={(e) => setFormData({ ...formData, achievement: e.target.value })} className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="e.g. Winner, Top Scout" />
              </div>

              <MediaInput
                label="Certificate Proof"
                value={formData.certificateUrl || ''}
                onChange={(val) => setFormData({ ...formData, certificateUrl: val })}
                storageMode={portalSettings?.storageMode || 'database'}
                type="image"
              />
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setShowModal(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] text-gray-400">Abort</button>
              <button onClick={handleOfficialSubmit} className="flex-grow bg-[#800000] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Publish</button>
            </div>
          </div>
        </div>
      )}

      {/* Community Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl relative my-10 border border-gray-100">
            <button onClick={() => setShowPostModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-[#800000] transition-all"><i className="fa-solid fa-circle-xmark text-5xl"></i></button>
            <h3 className="text-3xl font-black uppercase text-gray-900 mb-10 tracking-tight">Sync <span className="text-[#800000]">Victory.</span></h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" className="bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="Domain (e.g. Web Dev)" value={postData.domain} onChange={e => setPostData({ ...postData, domain: e.target.value })} />
                <input type="text" className="bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="Rank (e.g. Gold)" value={postData.rank} onChange={e => setPostData({ ...postData, rank: e.target.value })} />
              </div>
              <input type="text" className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="Victory Topic" value={postData.topic} onChange={e => setPostData({ ...postData, topic: e.target.value })} />
              <textarea className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner h-32 outline-none resize-none" placeholder="Tell the story..." value={postData.description} onChange={e => setPostData({ ...postData, description: e.target.value })} />

              <div className="space-y-4">
                <div className="flex justify-between px-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Manifest Photos</label>
                  <span className="text-[10px] font-black uppercase text-[#800000]">{(postData.photos || []).length} / 4</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {(postData.photos || []).map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group shadow-md">
                      <img src={p} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => setPostData({ ...postData, photos: postData.photos?.filter((_, idx) => idx !== i) })} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  ))}
                </div>
                {((postData.photos || []).length < 4) && (
                  <MediaInput
                    label="Add Proof Asset"
                    value=""
                    onChange={(val) => setPostData(prev => ({ ...prev, photos: [...(prev.photos || []), val] }))}
                    storageMode={portalSettings?.storageMode || 'database'}
                    type="image"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Video Evidence (Optional)</label>
                <input type="text" className="w-full bg-gray-50 rounded-2xl p-6 font-bold shadow-inner outline-none" placeholder="YouTube Link" value={postData.videoUrl} onChange={e => setPostData({ ...postData, videoUrl: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setShowPostModal(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] text-gray-400">Abort</button>
              <button onClick={handlePostSubmit} className="flex-grow bg-[#800000] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Broadcast Victory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
