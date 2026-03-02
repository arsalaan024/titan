import { UserRole } from '../types';
import { turso, initSchema } from './tursoClient';

// Initialize schema when the module loads
initSchema().catch(console.error);

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const parseJSON = (val: any, fallback: any = []) => {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
};

export const db = {

  // --- Clubs ---
  getClubs: async () => {
    const { rows } = await turso.execute('SELECT * FROM clubs ORDER BY name');
    return rows.map((c: any) => ({
      id: c.id, name: c.name, tagline: c.tagline, description: c.description,
      bannerImage: c.banner_image, logo: c.logo, facultyName: c.faculty_name,
      facultyPhoto: c.faculty_photo, facultyRole: c.faculty_role, themeColor: c.theme_color
    }));
  },
  addClub: async (club: any) => {
    const id = club.id || generateId();
    await turso.execute({
      sql: `INSERT INTO clubs (id, name, tagline, description, banner_image, logo, faculty_name, faculty_photo, faculty_role, theme_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, club.name, club.tagline || '', club.description || '', club.bannerImage || '', club.logo || '',
        club.facultyName || '', club.facultyPhoto || '', club.facultyRole || '', club.themeColor || '']
    });
    return { ...club, id };
  },
  updateClub: async (club: any) => {
    await turso.execute({
      sql: `UPDATE clubs SET name=?, tagline=?, description=?, banner_image=?, logo=?, faculty_name=?, faculty_photo=?, faculty_role=?, theme_color=? WHERE id=?`,
      args: [club.name, club.tagline || '', club.description || '', club.bannerImage || '', club.logo || '',
      club.facultyName || '', club.facultyPhoto || '', club.facultyRole || '', club.themeColor || '', club.id]
    });
  },
  deleteClub: async (id: string) => {
    await turso.execute({ sql: 'DELETE FROM clubs WHERE id=?', args: [id] });
  },

  // --- Activities ---
  getActivities: async () => {
    const { rows } = await turso.execute('SELECT * FROM activities ORDER BY date DESC');
    return rows.map((a: any) => ({
      id: a.id, name: a.name, clubId: a.club_id, clubName: a.club_name,
      date: a.date, reportUrl: a.report_url, photos: parseJSON(a.photos), videoUrl: a.video_url
    }));
  },
  addActivity: async (act: any) => {
    const id = act.id || generateId();
    await turso.execute({
      sql: `INSERT INTO activities (id, name, club_id, club_name, date, report_url, photos, video_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, act.name, act.clubId || '', act.clubName || '', act.date || '',
        act.reportUrl || '', JSON.stringify(act.photos || []), act.videoUrl || '']
    });
    return { ...act, id };
  },
  updateActivity: async (act: any) => {
    await turso.execute({
      sql: `UPDATE activities SET name=?, club_id=?, club_name=?, date=?, report_url=?, photos=?, video_url=? WHERE id=?`,
      args: [act.name, act.clubId || '', act.clubName || '', act.date || '',
      act.reportUrl || '', JSON.stringify(act.photos || []), act.videoUrl || '', act.id]
    });
  },
  deleteActivity: async (id: string) => {
    await turso.execute({ sql: 'DELETE FROM activities WHERE id=?', args: [id] });
  },

  // --- Achievements ---
  getAchievements: async () => {
    const { rows } = await turso.execute('SELECT * FROM achievements ORDER BY created_at DESC');
    return rows.map((a: any) => ({
      id: a.id, participantName: a.participant_name, activityId: a.activity_id,
      activityName: a.activity_name, achievement: a.achievement,
      certificateUrl: a.certificate_url, userId: a.user_id
    }));
  },
  addAchievement: async (ach: any) => {
    const id = ach.id || generateId();
    await turso.execute({
      sql: `INSERT INTO achievements (id, participant_name, activity_id, activity_name, achievement, certificate_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, ach.participantName || '', ach.activityId || '', ach.activityName || '',
        ach.achievement || '', ach.certificateUrl || '', ach.userId || '']
    });
    return { ...ach, id };
  },
  updateAchievement: async (ach: any) => {
    await turso.execute({
      sql: `UPDATE achievements SET participant_name=?, activity_id=?, activity_name=?, achievement=?, certificate_url=?, user_id=? WHERE id=?`,
      args: [ach.participantName || '', ach.activityId || '', ach.activityName || '',
      ach.achievement || '', ach.certificateUrl || '', ach.userId || '', ach.id]
    });
  },
  deleteAchievement: async (id: string) => {
    await turso.execute({ sql: 'DELETE FROM achievements WHERE id=?', args: [id] });
  },

  // --- Team Members ---
  getTeamMembers: async () => {
    const { rows } = await turso.execute('SELECT * FROM team_members');
    return rows.map((m: any) => ({
      id: m.id, name: m.name, role: m.role, image: m.image, clubId: m.club_id
    }));
  },
  addTeamMember: async (member: any) => {
    const id = member.id || generateId();
    await turso.execute({
      sql: `INSERT INTO team_members (id, name, role, image, club_id) VALUES (?, ?, ?, ?, ?)`,
      args: [id, member.name, member.role || '', member.image || '', member.clubId || '']
    });
    return { ...member, id };
  },
  updateTeamMember: async (member: any) => {
    await turso.execute({
      sql: `UPDATE team_members SET name=?, role=?, image=?, club_id=? WHERE id=?`,
      args: [member.name, member.role || '', member.image || '', member.clubId || '', member.id]
    });
  },

  // --- Announcements ---
  getAnnouncements: async () => {
    const { rows } = await turso.execute('SELECT * FROM announcements ORDER BY timestamp DESC');
    return rows.map((a: any) => ({
      id: a.id, text: a.text, timestamp: a.timestamp,
      senderName: a.sender_name, isGlobal: !!a.is_global, clubId: a.club_id
    }));
  },
  addAnnouncement: async (ann: any) => {
    const id = ann.id || generateId();
    await turso.execute({
      sql: `INSERT INTO announcements (id, text, sender_name, is_global, club_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, ann.text, ann.senderName || '', ann.isGlobal ? 1 : 0,
        ann.clubId || '', ann.timestamp || new Date().toISOString()]
    });
    return { ...ann, id };
  },

  // --- Student Posts ---
  getStudentPosts: async () => {
    const { rows } = await turso.execute('SELECT * FROM student_posts ORDER BY timestamp DESC');
    return rows.map((p: any) => ({
      id: p.id, userId: p.user_id, userName: p.user_name, userPhoto: p.user_photo,
      timestamp: p.timestamp, topic: p.topic, domain: p.domain, rank: p.rank,
      description: p.description, photos: parseJSON(p.photos), videoUrl: p.video_url,
      likes: parseJSON(p.likes), comments: []
    }));
  },
  addStudentPost: async (post: any) => {
    const id = post.id || generateId();
    await turso.execute({
      sql: `INSERT INTO student_posts (id, user_id, user_name, user_photo, topic, domain, rank, description, photos, video_url, likes, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, post.userId || '', post.userName || '', post.userPhoto || '', post.topic || '',
        post.domain || '', post.rank || '', post.description || '', JSON.stringify(post.photos || []),
        post.videoUrl || '', JSON.stringify(post.likes || []), post.timestamp || new Date().toISOString()]
    });
    return { ...post, id };
  },

  // --- Career ---
  getCareer: async () => {
    const { rows } = await turso.execute('SELECT * FROM career_items ORDER BY posted_at DESC');
    return rows.map((item: any) => ({
      id: item.id, type: item.type, title: item.title, company: item.company,
      description: item.description, link: item.link, date: item.date,
      isRecord: !!item.is_record, studentName: item.student_name, package: item.package,
      studentPhoto: item.student_photo, resumeUrl: item.resume_url, linkedinUrl: item.linkedin_url,
      batch: item.batch, quote: item.quote, requirements: item.requirements, whoCanApply: item.who_can_apply
    }));
  },
  addCareer: async (item: any) => {
    const id = item.id || generateId();
    await turso.execute({
      sql: `INSERT INTO career_items (id, type, title, company, description, link, date, is_record, student_name, package, student_photo, resume_url, linkedin_url, batch, quote, requirements, who_can_apply)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, item.type || '', item.title, item.company || '', item.description || '', item.link || '',
        item.date || '', item.isRecord ? 1 : 0, item.studentName || '', item.package || '',
        item.studentPhoto || '', item.resumeUrl || '', item.linkedinUrl || '', item.batch || '',
        item.quote || '', item.requirements || '', item.whoCanApply || '']
    });
    return { ...item, id };
  },
  deleteCareer: async (id: string) => {
    await turso.execute({ sql: 'DELETE FROM career_items WHERE id=?', args: [id] });
  },

  // --- Global Chat ---
  getGlobalChat: async () => {
    const { rows } = await turso.execute('SELECT * FROM global_chat ORDER BY timestamp ASC LIMIT 200');
    return rows.map((msg: any) => ({
      id: String(msg.id), senderName: msg.sender_name, senderRole: msg.sender_role,
      text: msg.text, timestamp: msg.timestamp, clubId: msg.club_id, poll: parseJSON(msg.poll, null)
    }));
  },
  addGlobalChat: async (msg: any) => {
    await turso.execute({
      sql: `INSERT INTO global_chat (sender_name, sender_role, text, club_id, poll, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [msg.senderName || '', msg.senderRole || '', msg.text,
      msg.clubId || '', msg.poll ? JSON.stringify(msg.poll) : null,
      msg.timestamp || new Date().toISOString()]
    });
  },

  // --- Users (stubs — managed by Clerk) ---
  getUsers: async () => [],
  updateUserStatus: async (_userId: string, _status: string) => { },
  updateUserRole: async (_userId: string, _role: UserRole) => { },
  updateUserGameStats: async (_userId: string, _points: number, _accuracy: number, _levelCleared: boolean, _isCodingGauntlet: boolean = false) => { },
  getLeaderboard: async () => [],
};

// Remove old setDbToken export (no longer needed)
export const setDbToken = (_token: string | null) => { };
