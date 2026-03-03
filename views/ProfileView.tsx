import React, { useState, useRef, useEffect } from 'react';
import { User, Club, Activity, Achievement, AchievementPost, UserRoles, PortalSettings, PortalTheme, StorageMode, UserRole } from '../types';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';

interface ProfileViewProps {
    user: User | null;
    clubs: Club[];
    activities: Activity[];
    achievements: Achievement[];
    posts: AchievementPost[];
    onLogout: () => void;
    portalSettings: PortalSettings | null;
    onUpdateSettings: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
    user,
    clubs,
    activities,
    achievements,
    posts,
    onLogout,
    portalSettings,
    onUpdateSettings
}) => {
    const { user: clerkUser } = useUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'activities' | 'achievements' | 'admin'>('overview');
    const [uploading, setUploading] = useState(false);
    const [description, setDescription] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [savingDescription, setSavingDescription] = useState(false);
    const [updatingGlobalSettings, setUpdatingGlobalSettings] = useState(false);
    const [targetStorageMode, setTargetStorageMode] = useState<StorageMode | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (clerkUser?.id) {
            db.getUserProfile(clerkUser.id).then(p => {
                if (p) setDescription(p.bio || '');
                // Auto-sync basic info if it's the first time
                if (!p) {
                    handleSaveDescription(p?.bio || '');
                }
            });
        }
    }, [clerkUser?.id]);

    const handleSaveDescription = async (text: string) => {
        if (!clerkUser) return;
        setSavingDescription(true);
        try {
            await db.saveUserProfile({
                clerkId: clerkUser.id,
                displayName: clerkUser.fullName || user?.name || '',
                email: clerkUser.primaryEmailAddress?.emailAddress || user?.email || '',
                photoUrl: clerkUser.imageUrl || '',
                bio: text,
                role: user?.role || 'STUDENT'
            });

            // Also sync memberships to Turso for discovery
            if (user?.clubMembership) {
                for (const clubId of user.clubMembership) {
                    await db.joinClub(clubId, clerkUser.id);
                }
            }

            setIsEditingDescription(false);
        } catch (err: any) {
            console.error('Failed to save profile:', err);
        } finally {
            setSavingDescription(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !clerkUser) return;
        setUploading(true);
        try {
            await clerkUser.setProfileImage({ file });
        } catch (err: any) {
            alert('Failed to upload photo: ' + (err?.message || err));
        } finally {
            setUploading(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    const handleThemeChange = async (theme: PortalTheme) => {
        setUpdatingGlobalSettings(true);
        try {
            await db.updatePortalSettings({ theme });
            onUpdateSettings();
        } catch (err) {
            console.error('Failed to update theme:', err);
        } finally {
            setUpdatingGlobalSettings(false);
        }
    };

    const handleStorageModeChange = async (newMode: StorageMode) => {
        if (newMode === portalSettings?.storageMode) return;

        const confirmMsg = newMode === 'google_drive'
            ? "⚠️ SWITCH TO GOOGLE DRIVE MODE?\n\nThis will shift the portal to accept EXTERNAL LINKS (G-Drive, Dropbox) for all new assets. Existing database assets will remain but new ones must be links.\n\nProceed?"
            : "⚠️ SWITCH TO DIRECT DATABASE MODE?\n\nThis will shift the portal to accept DIRECT DEVICE UPLOADS. You will no longer be able to paste external links for new assets.\n\nProceed?";

        if (!window.confirm(confirmMsg)) return;

        setUpdatingGlobalSettings(true);
        setTargetStorageMode(newMode);
        try {
            await db.updatePortalSettings({ storageMode: newMode });
            await onUpdateSettings();
            // Small delay to show success state
            setTimeout(() => {
                setUpdatingGlobalSettings(false);
                setTargetStorageMode(null);
            }, 500);
        } catch (err: any) {
            console.error('Failed to update storage mode:', err);
            alert('Critical: Failed to sync storage strategy to cloud.\nError: ' + (err?.message || JSON.stringify(err)));
            setUpdatingGlobalSettings(false);
            setTargetStorageMode(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24">
                <div className="text-center bg-white rounded-[2.5rem] p-14 shadow-xl border border-gray-100 max-w-sm w-full mx-4">
                    <div className="w-20 h-20 bg-[#800000] rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-6 shadow-xl">T</div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Welcome to Titan</h2>
                    <p className="text-gray-400 font-medium mb-8 text-sm">Sign in to view your profile, clubs, and achievements.</p>
                    <Link
                        to="/login"
                        className="block w-full bg-[#800000] text-white font-black py-4 rounded-2xl hover:bg-[#6b0000] transition-all shadow-lg uppercase tracking-widest text-sm text-center"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const myClubs = clubs.filter(c => user.clubMembership?.includes(c.id));
    const myAchievements = achievements.filter(a => a.userId === user.id);
    const myActivities = activities.filter(a => myClubs.some(c => c.id === a.clubId));
    const myPosts = posts.filter(p => p.userId === user.id);
    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '⚡' },
        { id: 'clubs', label: 'Clubs', icon: '🏛️', count: myClubs.length },
        { id: 'activities', label: 'Activities', icon: '📅', count: myActivities.length },
        { id: 'achievements', label: 'Achievements', icon: '🏆', count: myAchievements.length },
    ] as any[];

    if (user?.role === UserRoles.SUPER_ADMIN) {
        tabs.push({ id: 'admin', label: 'Admin Settings', icon: '⚙️' });
    }

    return (
        <div className="min-h-screen bg-gray-50 py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Banner */}
                <div className="relative bg-gradient-to-br from-[#800000] via-[#6b0000] to-[#4a0000] rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="relative p-10 md:p-14 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group cursor-pointer" onClick={() => !uploading && photoInputRef.current?.click()}>
                            {clerkUser?.imageUrl ? (
                                <img src={clerkUser.imageUrl} alt={user.name} className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white/20 shadow-2xl" />
                            ) : (
                                <div className="w-28 h-28 bg-white/15 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl ring-4 ring-white/20">
                                    {initials}
                                </div>
                            )}
                            <div className={`absolute inset-0 rounded-3xl flex items-center justify-center bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {uploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="text-2xl">📷</span>}
                            </div>
                            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{user.name}</h1>
                            <p className="text-white/60 mt-1 font-medium">{user.email}</p>

                            <div className="mt-4 max-w-md bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-id-card"></i> About Me
                                </h3>
                                {isEditingDescription ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-white/30 placeholder-white/30 resize-none h-32"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSaveDescription(description)} disabled={savingDescription} className="bg-white text-[#800000] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Update</button>
                                            <button onClick={() => setIsEditingDescription(false)} className="bg-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <p className="text-white/80 text-sm font-medium leading-relaxed italic pr-8">{description || "No description added yet."}</p>
                                        <button onClick={() => setIsEditingDescription(true)} className="absolute top-0 -right-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-all shadow-lg"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                                <span className="bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{user.role}</span>
                                <button onClick={onLogout} className="bg-white/10 hover:bg-red-500/30 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all">Sign Out</button>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            {[
                                { label: 'Clubs', value: myClubs.length },
                                { label: 'Achievements', value: myAchievements.length },
                            ].map(stat => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-3xl font-black text-white">{stat.value}</div>
                                    <div className="text-white/50 text-[10px] font-black uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#800000] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== undefined && <span className="ml-1 opacity-50">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#800000] mb-6">Recent Clubs</h3>
                                {myClubs.length === 0 ? <p className="text-gray-400 text-sm">No clubs joined.</p> : (
                                    <div className="space-y-4">
                                        {myClubs.slice(0, 3).map(c => (
                                            <Link to={`/clubs/${c.id}`} key={c.id} className="flex items-center gap-4 group">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#800000] group-hover:bg-[#800000] group-hover:text-white transition-all">{c.name[0]}</div>
                                                <div className="font-black text-gray-900">{c.name}</div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin' && (
                        <div className="space-y-12">
                            <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Portal Global Settings</h2>
                                    <p className="text-xs text-gray-400 font-medium">Manage global themes and storage strategies.</p>
                                </div>
                                <span className="bg-[#800000]/5 text-[#800000] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#800000]/10">Super Admin Access</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#800000]">Theme Selector</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['default', 'diwali', 'eid', 'ganpati', 'festive', 'dark'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => handleThemeChange(t as PortalTheme)}
                                                disabled={updatingGlobalSettings}
                                                className={`p-4 rounded-2xl border-2 transition-all text-left relative ${portalSettings?.theme === t ? 'border-[#800000] bg-[#800000]/5' : 'border-gray-100'}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#800000]">Storage Mode</h3>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'google_drive', label: 'Google Drive Mode', desc: 'Accepts external links (G-Drive, Dropbox).' },
                                            { id: 'database', label: 'Direct Database Mode', desc: 'Upload direct from device.' }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleStorageModeChange(m.id as StorageMode)}
                                                disabled={updatingGlobalSettings}
                                                className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left relative ${portalSettings?.storageMode === m.id ? 'border-[#800000] bg-[#800000]/5 shadow-inner' : 'border-gray-100 hover:border-gray-200'} ${updatingGlobalSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-widest">{m.label}</h4>
                                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{m.desc}</p>
                                                    </div>
                                                    {updatingGlobalSettings && targetStorageMode === m.id && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] font-black uppercase text-[#800000] animate-pulse">Syncing</span>
                                                            <div className="w-4 h-4 border-2 border-[#800000] border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    {portalSettings?.storageMode === m.id && !updatingGlobalSettings && (
                                                        <i className="fa-solid fa-circle-check text-[#800000]"></i>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
