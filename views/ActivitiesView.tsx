import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, UserRoles, Club, PortalSettings } from '../types';
import MediaInput from '../components/MediaInput';

interface ActivitiesViewProps {
  activities: Activity[];
  user: User | null;
  clubs: Club[];
  onAdd: (act: Activity) => void;
  onUpdate: (act: Activity) => void;
  onDelete: (id: string) => void;
  portalSettings: PortalSettings | null;
}

const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  activities,
  user,
  clubs,
  onAdd,
  onUpdate,
  onDelete,
  portalSettings
}) => {
  const [commonSearch, setCommonSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAct, setEditingAct] = useState<Activity | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    clubId: clubs[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    reportUrl: '',
    reportName: '',
    photos: [] as string[]
  });

  const filteredActivities = useMemo(() => {
    const term = commonSearch.toLowerCase();
    return activities.filter(act => {
      const matchName = act.name.toLowerCase().includes(term);
      const matchClub = act.clubName.toLowerCase().includes(term);
      const matchDate = act.date.includes(term);
      return matchName || matchClub || matchDate;
    });
  }, [activities, commonSearch]);

  const handleDownloadReport = (url: string, fileName: string) => {
    if (!url || url === '#' || url === '') {
      alert("No report document found for this registry entry.");
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

  const handleOpenAdd = () => {
    setEditingAct(null);
    setFormData({ name: '', clubId: clubs[0]?.id || '', date: new Date().toISOString().split('T')[0], reportUrl: '', reportName: '', photos: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingAct(act);
    setFormData({
      name: act.name,
      clubId: act.clubId,
      date: act.date,
      reportUrl: act.reportUrl || '',
      reportName: act.reportUrl ? 'Current Document' : '',
      photos: [...act.photos]
    });
    setShowModal(true);
  };

  const handlePublish = () => {
    if (!formData.name || !formData.date || !formData.clubId) {
      alert("Required fields missing.");
      return;
    }
    const selectedClub = clubs.find(c => c.id === formData.clubId);
    const activityData: Activity = {
      id: editingAct ? editingAct.id : 'act_' + Date.now(),
      name: formData.name,
      clubId: formData.clubId,
      clubName: selectedClub?.name || 'Unknown Club',
      date: formData.date,
      reportUrl: formData.reportUrl,
      photos: formData.photos
    };
    if (editingAct) onUpdate(activityData);
    else onAdd(activityData);
    setShowModal(false);
  };

  const canEdit = user && [UserRoles.ADMIN, UserRoles.SUPER_ADMIN, UserRoles.CLUB_ADMIN].includes(user.role as any);

  return (
    <div className="py-12 md:py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10 mb-12 md:mb-16">
          <div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 uppercase leading-[0.9] md:leading-[0.8] mb-4 md:mb-6">Activity <br /><span className="text-maroon-800">Master List.</span></h2>
            <p className="text-gray-500 text-base md:text-xl font-medium max-w-xl">Unified registry for all campus chapters. Download reports and view visual manifest evidence.</p>
          </div>
          {canEdit && (
            <button onClick={handleOpenAdd} className="bg-maroon-800 text-white px-8 py-4 md:px-12 md:py-6 rounded-xl md:rounded-[2rem] font-black shadow-2xl uppercase tracking-widest text-[10px] md:text-xs active:scale-95 hover:bg-maroon-900 flex items-center justify-center gap-3">
              <i className="fa-solid fa-plus-circle text-lg"></i> Register New
            </button>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 mb-8 md:mb-12">
          <input
            type="text"
            placeholder="Search by name, club, or date..."
            className="w-full px-8 py-4 md:py-6 bg-gray-50 border-none rounded-xl md:rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-maroon-800/10 transition-all outline-none font-bold text-base md:text-xl shadow-inner"
            value={commonSearch}
            onChange={(e) => setCommonSearch(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase">Activity</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase">Host Club</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase">Date</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase text-center">Report</th>
                  {canEdit && <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="group hover:bg-maroon-50/10 transition-all font-bold">
                    <td className="px-10 py-6 text-gray-900">{act.name}</td>
                    <td className="px-10 py-6 text-gray-500 text-xs uppercase">{act.clubName}</td>
                    <td className="px-10 py-6 text-gray-400 tabular-nums uppercase text-xs">{act.date}</td>
                    <td className="px-10 py-6 text-center">
                      <button onClick={() => handleDownloadReport(act.reportUrl || '', act.name)} className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${act.reportUrl ? 'bg-[#800000] text-white shadow-lg' : 'bg-gray-50 text-gray-200 border-gray-100'}`} disabled={!act.reportUrl}>
                        <i className="fa-solid fa-file-pdf"></i>
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-10 py-6 text-center space-x-2">
                        <button onClick={() => handleOpenEdit(act)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><i className="fa-solid fa-pen"></i></button>
                        <button onClick={() => onDelete(act.id)} className="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash"></i></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl relative my-10 border border-gray-100">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-maroon-800"><i className="fa-solid fa-circle-xmark text-4xl"></i></button>
            <h3 className="text-3xl font-black uppercase text-gray-900 mb-10 tracking-tighter">{editingAct ? 'Update Activity' : 'Register Activity'}</h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Title</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-8 py-5 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 shadow-inner text-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Club</label>
                  <select value={formData.clubId} onChange={(e) => setFormData({ ...formData, clubId: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-6 py-5 font-bold border-none shadow-inner">
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-6 py-5 font-bold border-none shadow-inner" />
                </div>
              </div>

              <MediaInput
                label="Activity Report (PDF)"
                value={formData.reportUrl || ''}
                onChange={(val) => setFormData({ ...formData, reportUrl: val, reportName: 'Updated Document' })}
                storageMode={portalSettings?.storageMode || 'database'}
                type="document"
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Visual Manifest (Photos)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {formData.photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                      <img src={p} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  ))}
                </div>
                <MediaInput
                  label="Add Photo"
                  value=""
                  onChange={(val) => setFormData(prev => ({ ...prev, photos: [...prev.photos, val] }))}
                  storageMode={portalSettings?.storageMode || 'database'}
                  type="image"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setShowModal(false)} className="flex-grow bg-gray-100 py-6 rounded-2xl font-black uppercase text-[10px] text-gray-400">Abort</button>
              <button onClick={handlePublish} className="flex-grow bg-[#800000] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesView;
