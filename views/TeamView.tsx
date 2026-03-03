import React, { useState } from 'react';
import { TeamMember, User, UserRoles, PortalSettings } from '../types';
import MediaInput from '../components/MediaInput';

interface TeamViewProps {
  members: TeamMember[];
  user: User | null;
  onAdd?: (member: TeamMember) => void;
  onUpdate?: (member: TeamMember) => void;
  onDelete?: (id: string) => void;
  portalSettings: PortalSettings | null;
}

const TeamView: React.FC<TeamViewProps> = ({ members, user, onAdd, onUpdate, onDelete, portalSettings }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [formData, setFormData] = useState<Partial<TeamMember>>({ name: '', role: '', image: '' });

  const isAuthorizedAdmin = user && [UserRoles.ADMIN, UserRoles.SUPER_ADMIN, UserRoles.CLUB_ADMIN].includes(user.role as UserRoles);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({ name: '', role: '', image: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingMember(m);
    setFormData({ ...m });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.role || !formData.image) return alert("Required fields missing.");
    if (editingMember) onUpdate?.({ ...editingMember, ...formData } as TeamMember);
    else onAdd?.({ id: 't' + Date.now(), name: formData.name!, role: formData.role!, image: formData.image! });
    setShowModal(false);
  };

  return (
    <div className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-l-8 border-maroon-800 pl-8">
          <div>
            <h2 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4">Core Committee</h2>
            <p className="text-gray-500 text-xl max-w-2xl font-medium">Visionary leadership steering Titan Club toward excellence.</p>
          </div>
          {isAuthorizedAdmin && (
            <button onClick={handleOpenAdd} className="bg-maroon-800 text-white px-12 py-6 rounded-2xl font-black shadow-2xl hover:bg-maroon-900 transition-all uppercase tracking-widest text-xs">Provision Member</button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map((member) => (
            <div key={member.id} className="group bg-white rounded-[1cm] p-2 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 relative">
              {isAuthorizedAdmin && (
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button aria-label="Edit member" onClick={() => handleOpenEdit(member)} className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center text-maroon-800"><i className="fa-solid fa-pen text-xs"></i></button>
                  <button aria-label="Delete member" onClick={() => setMemberToDelete(member)} className="w-10 h-10 bg-red-600 shadow-lg rounded-xl flex items-center justify-center text-white"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              )}
              <div className="aspect-[3.2/4] overflow-hidden rounded-[0.8cm] bg-gray-50">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="pt-6 pb-2 px-2 border-t-4 border-maroon-800 mt-2">
                <p className="text-maroon-800 font-black uppercase tracking-[0.3em] text-[9px] mb-1">{member.role}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase line-clamp-1">{member.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {memberToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-white rounded-[1.5cm] w-full max-w-lg p-12 shadow-2xl border-t-[16px] border-red-600 text-center">
            <h3 className="text-3xl font-black uppercase mb-4">Decommission Identity</h3>
            <p className="mb-8">Confirm deletion of <span className="font-black text-red-600">{memberToDelete.name}</span></p>
            <input aria-label="Confirmation name" type="text" className="w-full bg-gray-50 border-2 p-5 rounded-2xl mb-8" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="Type name to confirm" />
            <div className="flex gap-4">
              <button onClick={() => setMemberToDelete(null)} className="flex-grow bg-gray-100 py-5 rounded-2xl">Abort</button>
              <button disabled={deleteConfirmation !== memberToDelete.name} onClick={() => { onDelete?.(memberToDelete.id); setMemberToDelete(null); }} className="flex-grow bg-red-600 text-white rounded-2xl disabled:bg-red-200">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-6 overflow-y-auto">
          <div className="bg-white rounded-[2cm] w-full max-w-xl p-16 relative">
            <button aria-label="Close modal" onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-gray-300"><i className="fa-solid fa-circle-xmark text-4xl"></i></button>
            <h3 className="text-4xl font-black mb-12 uppercase">{editingMember ? 'Modify Record' : 'Provision Leader'}</h3>
            <div className="space-y-10">
              <input aria-label="Member name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-6 shadow-inner text-lg font-bold" placeholder="Official Name" />
              <input aria-label="Member role" type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-6 shadow-inner text-lg font-bold" placeholder="Designated Role" />

              <MediaInput
                label="Leader Portrait"
                value={formData.image || ''}
                onChange={(val) => setFormData({ ...formData, image: val })}
                storageMode={portalSettings?.storageMode || 'database'}
                type="image"
              />
            </div>
            <button onClick={handleSubmit} className="w-full bg-maroon-800 text-white font-black py-6 rounded-2xl shadow-2xl mt-12 uppercase tracking-widest text-xs">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
