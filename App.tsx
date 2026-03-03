
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Club, Activity, Achievement, UserRoles, TeamMember, Announcement, CareerItem, ChatMessage, AchievementPost } from './types';
import { db, setDbToken } from './services/db';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';

import HomeView from './views/HomeView';
import AboutView from './views/AboutView';
import TeamView from './views/TeamView';
import ClubsView from './views/ClubsView';
import ClubDetailView from './views/ClubDetailView';
import ActivitiesView from './views/ActivitiesView';
import GalleryView from './views/GalleryView';
import AchievementsView from './views/AchievementsView';
import CareerView from './views/CareerView';
import CommunityChatView from './views/CommunityChatView';
import GamesView from './views/GamesView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import DashboardView from './views/DashboardView';
import ProfileView from './views/ProfileView';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [careerItems, setCareerItems] = useState<CareerItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [studentPosts, setStudentPosts] = useState<AchievementPost[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync Token with DB Service
  useEffect(() => {
    const syncToken = async () => {
      if (clerkUser) {
        const token = await getToken();
        setDbToken(token);
      } else {
        setDbToken(null);
      }
    };
    syncToken();
  }, [clerkUser, getToken]);

  useEffect(() => {
    if (isClerkLoaded) {
      if (clerkUser) {
        console.log('Clerk Session detected:', clerkUser.id);
        const mappedUser: User = {
          id: clerkUser.id,
          name: clerkUser.fullName || (clerkUser.unsafeMetadata?.name as string) || clerkUser.username || 'Titan Member',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: (clerkUser.publicMetadata?.role as any) || (clerkUser.unsafeMetadata?.role as any) || UserRoles.STUDENT,
          status: 'active'
        };
        setUser(mappedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
      fetchInitialData();
    }
  }, [clerkUser, isClerkLoaded]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  const fetchInitialData = async () => {
    try {
      const [c, ann] = await Promise.all([
        db.getClubs(),
        db.getAnnouncements()
      ]);
      setClubs(c || []);
      setAnnouncements(ann || []);
      // Load the rest in background
      fetchAdditionalData();
    } catch (err) {
      console.error("Error fetching initial data:", err);
    } finally {
      if (!user) setLoading(false);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      const [a, t, ach, car, msg, sp, u] = await Promise.all([
        db.getActivities(),
        db.getTeamMembers(),
        db.getAchievements(),
        db.getCareer(),
        db.getGlobalChat(),
        db.getStudentPosts(),
        db.getUsers()
      ]);
      setActivities(a || []);
      setTeamMembers(t || []);
      setAchievements(ach || []);
      setCareerItems(car || []);
      setMessages(msg || []);
      setStudentPosts(sp || []);
      setAllUsers(u || []);
    } catch (err) {
      console.error("Error fetching additional data:", err);
    }
  };

  if (loading) {
    // Safety fallback: if it takes more than 5 seconds, show an error instead of hanging
    setTimeout(() => { if (loading) setLoading(false); }, 5000);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-maroon-800 font-black uppercase tracking-widest animate-pulse">Initializing Titan Portal...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-grow pt-16">
          <Routes>
            <Route path="/" element={<HomeView user={user} announcements={announcements} />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/team" element={
              <TeamView
                members={teamMembers}
                user={user}
                onAdd={(m) => { db.addTeamMember(m).then(fetchInitialData); }}
                onUpdate={(m) => { db.updateTeamMember(m).then(fetchInitialData); }}
                onDelete={(id) => { db.getTeamMembers().then(fetchInitialData); }} // Fallback if deleteTeamMember is missing
              />
            } />
            <Route path="/clubs" element={<ClubsView clubs={clubs} user={user} onAddClub={async (newClub) => { try { await db.addClub(newClub); fetchInitialData(); } catch (e: any) { alert('Failed to save club: ' + (e?.message || e)); } }} onDeleteClub={(id) => { db.deleteClub(id).then(fetchInitialData); }} />} />
            <Route path="/clubs/:clubId" element={
              <ClubDetailView
                user={user}
                clubs={clubs}
                activities={activities}
                announcements={announcements}
                onAddAnnouncement={(ann) => { db.addAnnouncement(ann).then(fetchInitialData); }}
                onUpdate={fetchInitialData}
              />
            } />
            <Route path="/activities" element={
              <ActivitiesView
                activities={activities}
                user={user}
                clubs={clubs}
                onAdd={(act) => { db.addActivity(act).then(fetchInitialData); }}
                onUpdate={(act) => { db.updateActivity(act).then(fetchInitialData); }}
                onDelete={(id) => { db.deleteActivity(id).then(fetchInitialData); }}
              />
            } />
            <Route path="/gallery" element={<GalleryView activities={activities} clubs={clubs} />} />
            <Route path="/achievements" element={
              <AchievementsView
                user={user}
                achievements={achievements}
                activities={activities}
                posts={studentPosts}
                allStudents={allUsers.filter(u => u.role === UserRoles.STUDENT)}
                onAdd={(ach) => { db.addAchievement(ach).then(fetchInitialData); }}
                onUpdate={(ach) => { db.updateAchievement(ach).then(fetchInitialData); }}
                onDelete={(id) => {
                  db.deleteAchievement(id).then(fetchInitialData);
                }}
                onRefreshPosts={fetchInitialData}
              />
            } />
            <Route path="/career" element={
              <CareerView
                user={user}
                items={careerItems}
                onAdd={(item) => { db.addCareer(item).then(fetchInitialData); }}
                onDelete={(id) => { id && db.deleteCareer(id).then(fetchInitialData); }}
              />
            } />
            <Route path="/games" element={<GamesView user={user} onSync={fetchInitialData} />} />
            <Route path="/community-chat" element={<CommunityChatView user={user} messages={messages} onSendMessage={(m) => { db.addGlobalChat(m).then(fetchInitialData); }} />} />
            <Route path="/login" element={<LoginView onLogin={fetchInitialData} />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/profile" element={<ProfileView user={user} clubs={clubs} activities={activities} achievements={achievements} posts={studentPosts} onLogout={handleLogout} />} />
            <Route
              path="/dashboard"
              element={user?.role === UserRoles.SUPER_ADMIN ? <DashboardView /> : <Navigate to="/" />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
