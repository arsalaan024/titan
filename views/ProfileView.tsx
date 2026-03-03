import React, { useState, useRef } from 'react';
import { User, Club, Activity, Achievement, AchievementPost } from '../types';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

interface ProfileViewProps {
    user: User | null;
    clubs: Club[];
    activities: Activity[];
    achievements: Achievement[];
    posts: AchievementPost[];
    onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, clubs, activities, achievements, posts, onLogout }) => {
    const { user: clerkUser } = useUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'activities' | 'achievements'>('overview');
    const [uploading, setUploading] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

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
                    <Link
                        to="/register"
                        className="block w-full mt-3 bg-gray-50 text-gray-700 font-black py-4 rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-sm text-center border border-gray-100"
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        );
    }

    // Filter data relevant to this student
    const myClubs = clubs.filter(c =>
        user.clubMembership?.includes(c.id) ||
        activities.some(a => a.clubId === c.id && achievements.some(ach => ach.userId === user.id && ach.activityId === a.id))
    );

    const myAchievements = achievements.filter(a =>
        a.userId === user.id ||
        a.participantName?.toLowerCase() === user.name?.toLowerCase()
    );

    const myActivities = activities.filter(a =>
        myClubs.some(c => c.id === a.clubId) ||
        myAchievements.some(ach => ach.activityId === a.id)
    );

    const myPosts = posts.filter(p => p.userId === user.id);

    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '⚡' },
        { id: 'clubs', label: 'Clubs', icon: '🏛️', count: myClubs.length },
        { id: 'activities', label: 'Activities', icon: '📅', count: myActivities.length },
        { id: 'achievements', label: 'Achievements', icon: '🏆', count: myAchievements.length },
    ] as const;

    return (
        <div className="min-h-screen bg-gray-50 py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Hero Banner */}
                <div className="relative bg-gradient-to-br from-[#800000] via-[#6b0000] to-[#4a0000] rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="relative p-10 md:p-14 flex flex-col md:flex-row items-center gap-8">
                        {/* Avatar with upload overlay */}
                        <div className="relative group cursor-pointer" onClick={() => !uploading && photoInputRef.current?.click()}>
                            {clerkUser?.imageUrl ? (
                                <img src={clerkUser.imageUrl} alt={user.name} className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white/20 shadow-2xl" />
                            ) : (
                                <div className="w-28 h-28 bg-white/15 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl ring-4 ring-white/20">
                                    {initials}
                                </div>
                            )}
                            {/* Camera overlay */}
                            <div className={`absolute inset-0 rounded-3xl flex items-center justify-center bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {uploading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-2xl">📷</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-[#800000]" />
                            {/* Hidden file input */}
                            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{user.name}</h1>
                            <p className="text-white/60 mt-1 font-medium">{user.email}</p>
                            <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                                <span className="bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                                    {user.role.replace('_', ' ')}
                                </span>
                                <span className="bg-green-400/20 text-green-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-green-400/20">
                                    ● Active
                                </span>
                                <button
                                    onClick={onLogout}
                                    className="bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 transition-all"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex gap-6 md:gap-8">
                            {[
                                { label: 'Clubs', value: myClubs.length },
                                { label: 'Activities', value: myActivities.length },
                                { label: 'Achievements', value: myAchievements.length },
                                { label: 'Posts', value: myPosts.length },
                            ].map(stat => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-3xl font-black text-white">{stat.value}</div>
                                    <div className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-1">{stat.label}</div>
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
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#800000] text-white shadow-md' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {'count' in tab && <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* My Clubs Summary */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">🏛️ My Clubs</h3>
                            {myClubs.length === 0 ? (
                                <p className="text-gray-400 text-sm font-medium">Not a member of any club yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {myClubs.slice(0, 3).map(club => (
                                        <div key={club.id} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50">
                                            {club.logo ? (
                                                <img src={club.logo} alt={club.name} className="w-10 h-10 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-[#800000]/10 flex items-center justify-center text-[#800000] font-black text-sm">{club.name[0]}</div>
                                            )}
                                            <div>
                                                <div className="font-black text-gray-900 text-sm">{club.name}</div>
                                                <div className="text-gray-400 text-xs">{club.tagline}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {myClubs.length > 3 && <p className="text-gray-400 text-xs text-center pt-2">+{myClubs.length - 3} more clubs</p>}
                                </div>
                            )}
                        </div>

                        {/* Achievements Summary */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">🏆 My Achievements</h3>
                            {myAchievements.length === 0 ? (
                                <p className="text-gray-400 text-sm font-medium">No achievements recorded yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {myAchievements.slice(0, 3).map(ach => (
                                        <div key={ach.id} className="flex items-start gap-4 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                                            <div className="text-2xl">🥇</div>
                                            <div>
                                                <div className="font-black text-gray-900 text-sm">{ach.achievement}</div>
                                                <div className="text-gray-500 text-xs">{ach.activityName}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {myAchievements.length > 3 && <p className="text-amber-500 text-xs text-center pt-2 font-bold">+{myAchievements.length - 3} more achievements</p>}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 md:col-span-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">📅 Recent Activities</h3>
                            {myActivities.length === 0 ? (
                                <p className="text-gray-400 text-sm font-medium">No activities found. Join a club to get started!</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myActivities.slice(0, 6).map(act => (
                                        <div key={act.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="font-black text-gray-900 text-sm mb-1">{act.name}</div>
                                            <div className="text-gray-400 text-xs">{act.clubName}</div>
                                            <div className="text-gray-400 text-xs mt-1">📅 {act.date}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Clubs Tab */}
                {activeTab === 'clubs' && (
                    <div>
                        {myClubs.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                                <div className="text-5xl mb-4">🏛️</div>
                                <h3 className="text-xl font-black text-gray-900">Not in any clubs yet</h3>
                                <p className="text-gray-400 mt-2 text-sm">Participate in club activities to see your memberships here.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myClubs.map(club => (
                                    <div key={club.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                        {club.bannerImage && <img src={club.bannerImage} alt={club.name} className="w-full h-28 object-cover" />}
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-3">
                                                {club.logo ? <img src={club.logo} alt="" className="w-10 h-10 rounded-2xl object-cover" /> : <div className="w-10 h-10 rounded-2xl bg-[#800000]/10 flex items-center justify-center text-[#800000] font-black">{club.name[0]}</div>}
                                                <div>
                                                    <div className="font-black text-gray-900">{club.name}</div>
                                                    <div className="text-gray-400 text-xs">{club.tagline}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-400">
                                                {activities.filter(a => a.clubId === club.id).length} activities
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Activities Tab */}
                {activeTab === 'activities' && (
                    <div>
                        {myActivities.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                                <div className="text-5xl mb-4">📅</div>
                                <h3 className="text-xl font-black text-gray-900">No activities yet</h3>
                                <p className="text-gray-400 mt-2 text-sm">Your club activities will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {myActivities.map(act => (
                                    <div key={act.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-[#800000]/10 rounded-2xl flex items-center justify-center text-[#800000] text-xl flex-shrink-0">📅</div>
                                        <div>
                                            <div className="font-black text-gray-900">{act.name}</div>
                                            <div className="text-sm text-gray-500 mt-1">{act.clubName}</div>
                                            <div className="text-xs text-gray-400 mt-1">{act.date}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                    <div>
                        {myAchievements.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                                <div className="text-5xl mb-4">🏆</div>
                                <h3 className="text-xl font-black text-gray-900">No achievements yet</h3>
                                <p className="text-gray-400 mt-2 text-sm">Participate in activities and win competitions to earn achievements.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {myAchievements.map((ach, i) => (
                                    <div key={ach.id} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 flex gap-4 items-start">
                                        <div className="text-4xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</div>
                                        <div className="flex-1">
                                            <div className="font-black text-gray-900">{ach.achievement}</div>
                                            <div className="text-sm text-gray-500 mt-1">{ach.activityName}</div>
                                            {ach.certificateUrl && (
                                                <a href={ach.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-black text-[#800000] bg-[#800000]/10 px-3 py-1 rounded-full hover:bg-[#800000]/20 transition-all">
                                                    View Certificate ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfileView;
