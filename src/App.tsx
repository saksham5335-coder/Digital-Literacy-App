import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, Grade, Subject, DeviceType, TeachingAssignment } from '../types';
import { db } from '../store/localDb';
import { EscapeTheChapter, BossBattle, FlashRecallSprint, InteractiveStory } from './components/Games';

const ADMIN_SECRET_KEY = 'LQGTS';
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast: React.FC<{ notification: Notification | null; onClose: () => void }> = ({ notification, onClose }) => {
  if (!notification) return null;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const bg = notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'error' ? 'bg-rose-500' : 'bg-indigo-600';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`${bg} text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20`}>
        <span className="text-xl">{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
        <p className="font-bold text-sm tracking-tight">{notification.message}</p>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">✕</button>
      </div>
    </div>
  );
};

const TeacherPanel: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeAssignment, setActiveAssignment] = useState<TeachingAssignment | 'ALL'>(
    user.teachingAssignments && user.teachingAssignments.length > 0 ? user.teachingAssignments[0] : 'ALL'
  );

  const users = db.getUsers();
  const students = useMemo(() => {
    const allStudents = users.filter(u => u.role === UserRole.STUDENT);
    
    if (activeAssignment === 'ALL') {
      return allStudents.filter(s => 
        user.teachingAssignments?.some(ta => ta.grade === s.grade && ta.section === s.section)
      );
    } else {
      return allStudents.filter(s => 
        s.grade === activeAssignment.grade && s.section === activeAssignment.section
      );
    }
  }, [users, activeAssignment, user.teachingAssignments]);

  const scores = db.getScores();

  const stats = useMemo(() => {
    const totalPoints = students.reduce((acc, s) => acc + s.points, 0);
    const avgPoints = students.length ? Math.round(totalPoints / students.length) : 0;
    const relevantScores = scores.filter(score => students.some(s => s.id === score.userId));
    
    const subjectCounts = relevantScores.reduce((acc: any, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalStudents: students.length,
      avgXP: avgPoints,
      activeSessions: relevantScores.length,
      topSubject: Object.entries(subjectCounts).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'
    };
  }, [students, scores]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 md:p-12">
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center text-white font-game shadow-lg shadow-indigo-500/20">LQ</div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-white leading-tight">Staff Console</h1>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{user.fullName} • Senior Educator</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Focus Group:</span>
            <select 
              className="bg-transparent text-sm font-bold text-indigo-400 outline-none pr-4 cursor-pointer"
              value={activeAssignment === 'ALL' ? 'ALL' : JSON.stringify(activeAssignment)}
              onChange={(e) => setActiveAssignment(e.target.value === 'ALL' ? 'ALL' : JSON.parse(e.target.value))}
            >
              <option value="ALL">All Assigned Classes</option>
              {user.teachingAssignments?.map((ta, idx) => (
                <option key={idx} value={JSON.stringify(ta)}>Grade {ta.grade} {ta.section}</option>
              ))}
            </select>
          </div>
          <button onClick={onLogout} className="px-6 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-bold">Sign Out</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Students in Scope', value: stats.totalStudents, icon: '👥', color: 'from-blue-600 to-indigo-600' },
            { label: 'Avg Mastery XP', value: stats.avgXP, icon: '⚡', color: 'from-amber-500 to-orange-600' },
            { label: 'Units Completed', value: stats.activeSessions, icon: '📚', color: 'from-emerald-500 to-teal-600' },
            { label: 'Primary Focus', value: stats.topSubject, icon: '🎯', color: 'from-purple-600 to-pink-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl relative overflow-hidden group text-left">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-[4rem] group-hover:scale-110 transition-transform`}></div>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-game text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/30 border border-slate-700 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white text-left">
              {activeAssignment === 'ALL' ? 'Comprehensive Roster' : `Students: Grade ${activeAssignment.grade}${activeAssignment.section}`}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Student Name</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Class</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Login ID</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Mastery XP</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.sort((a,b) => b.points - a.points).map(student => (
                  <tr key={student.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-6 font-bold text-white">{student.fullName}</td>
                    <td className="p-6 text-slate-400 text-sm">Grade {student.grade}{student.section}</td>
                    <td className="p-6 font-mono text-xs text-indigo-400">{student.username}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="font-game text-amber-500">{student.points}</span>
                        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (student.points/5000)*100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        new Date(student.lastActive).getTime() > Date.now() - 3600000 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-slate-700 text-slate-400'
                      }`}>
                        {new Date(student.lastActive).getTime() > Date.now() - 3600000 ? 'Online' : 'Recent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.LAPTOP);
  const [view, setView] = useState<'DEVICE_SELECT' | 'LOGIN' | 'SIGNUP' | 'RECOVERY' | 'DASHBOARD' | 'GAME' | 'LEADERBOARD' | 'REWARDS' | 'TEACHER_PANEL' | 'INFO' | 'TEACHER_SIGNUP' | 'STAFF_VERIFY'>('DEVICE_SELECT');
  const [leaderboardTab, setLeaderboardTab] = useState<'SECTION' | 'SCHOOL'>('SECTION');
  const [adminGatePassed, setAdminGatePassed] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tempAdminKey, setTempAdminKey] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeachingAssignment[]>([{ grade: Grade.GRADE_6, section: 'A' }]);

  const [authData, setAuthData] = useState({ 
    username: '', 
    fullName: '', 
    password: '', 
    recoveryEmail: '', 
    grade: Grade.GRADE_6, 
    section: 'A'
  });

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  }, []);

  const leaderboardFiltered = useMemo(() => {
    const allStudents = db.getUsers().filter(u => u.role === UserRole.STUDENT);
    if (!currentUser) return [];
    if (leaderboardTab === 'SECTION') {
        return allStudents.filter(u => u.grade === currentUser.grade && u.section === currentUser.section);
    } else {
        return allStudents.filter(u => u.grade === currentUser.grade);
    }
  }, [leaderboardTab, currentUser]);

  useEffect(() => {
    const saved = localStorage.getItem('linguoquest_session');
    const savedDevice = localStorage.getItem('linguoquest_device');
    
    if (savedDevice) setDeviceType(savedDevice as DeviceType);

    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        if (user.grade) setSelectedGrade(user.grade);
        if (savedDevice) {
          setView(user.role === UserRole.TEACHER ? 'TEACHER_PANEL' : 'DASHBOARD');
        }
      } catch (e) {
        localStorage.removeItem('linguoquest_session');
      }
    }
  }, []);

  const selectDevice = (type: DeviceType) => {
    setDeviceType(type);
    localStorage.setItem('linguoquest_device', type);
    if (currentUser) {
      setView(currentUser.role === UserRole.TEACHER ? 'TEACHER_PANEL' : 'DASHBOARD');
    } else {
      setView('LOGIN');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = db.getUsers();
    const user = users.find(u => u.username === authData.username && u.password === authData.password);
    
    if (user) {
      setCurrentUser(user);
      if (user.grade) setSelectedGrade(user.grade);
      localStorage.setItem('linguoquest_session', JSON.stringify(user));
      setView(user.role === UserRole.TEACHER ? 'TEACHER_PANEL' : 'DASHBOARD');
      notify(`Welcome back, ${user.fullName}!`, 'success');
    } else {
      notify("Invalid ID or Password.", 'error');
    }
  };

  const handleVerifyAdminKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAdminKey === ADMIN_SECRET_KEY) {
      setAdminGatePassed(true);
      setView('TEACHER_SIGNUP');
      setTempAdminKey('');
      notify("Staff Key Verified.", 'success');
    } else {
      notify("Unauthorized: Invalid Staff Key.", 'error');
    }
  };

  const handleTeacherSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherSubjects.length === 0) {
      notify("Select at least one subject.", 'error');
      return;
    }
    
    const newUser: User = {
      id: crypto.randomUUID(),
      username: authData.username,
      fullName: authData.fullName,
      email: authData.recoveryEmail || `${authData.username}@school.com`,
      role: UserRole.TEACHER,
      points: 0,
      password: authData.password,
      badges: [],
      titles: ['Senior Educator'],
      lastActive: new Date().toISOString(),
      teachingSubjects: teacherSubjects,
      teachingAssignments: teacherAssignments,
      numSections: teacherAssignments.length
    };

    db.saveUser(newUser);
    notify("Educator Profile Established. Sign in now.", 'success');
    setView('LOGIN');
    setAdminGatePassed(false);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const rawName = authData.fullName.trim();
    if (!rawName) {
      notify("Enter full name.", 'error');
      return;
    }

    const nameParts = rawName.toLowerCase().split(/\s+/);
    const firstName = nameParts[0] || 'student';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const users = db.getUsers();
    const sameNameCount = users.filter(u => u.fullName.toLowerCase() === rawName.toLowerCase()).length;
    const countSuffix = sameNameCount + 1;
    
    const generatedUsername = lastName 
      ? `${firstName}#${lastName}${countSuffix}`
      : `${firstName}#${countSuffix}`;
    
    const newUser: User = {
      id: crypto.randomUUID(),
      username: generatedUsername,
      fullName: rawName,
      email: `${generatedUsername}@linguoquest.com`,
      role: UserRole.STUDENT,
      grade: authData.grade,
      section: authData.section,
      points: 0,
      password: authData.password,
      recoveryEmail: authData.recoveryEmail,
      badges: [],
      titles: [],
      lastActive: new Date().toISOString()
    };
    
    db.saveUser(newUser);
    notify(`Registered! ID: ${generatedUsername}`, 'success');
    setAuthData({ ...authData, username: generatedUsername });
    setView('LOGIN');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    if (view === 'SIGNUP') handleSignup(e);
    else if (view === 'LOGIN') handleLogin(e);
  };

  const handleLogout = () => {
    localStorage.removeItem('linguoquest_session');
    setCurrentUser(null);
    setAdminGatePassed(false);
    setView('LOGIN');
    setAuthData({ username: '', fullName: '', password: '', recoveryEmail: '', grade: Grade.GRADE_6, section: 'A' });
    setTeacherSubjects([]);
    setTeacherAssignments([{ grade: Grade.GRADE_6, section: 'A' }]);
    setSelectedGrade(null);
    setSelectedSubject(null);
    notify("Logged out successfully.");
  };

  const onGameComplete = (points: number, livesLost: boolean) => {
    if (!currentUser) return;
    if (points > 0) {
        db.addScore({
            userId: currentUser.id,
            gameType: selectedGame || 'unknown',
            pointsEarned: points,
            grade: selectedGrade || Grade.GRADE_6,
            subject: selectedSubject || Subject.ENGLISH,
            timestamp: new Date().toISOString()
        });
        const users = db.getUsers();
        const updatedUser = users.find(u => u.id === currentUser.id)!;
        setCurrentUser(updatedUser);
        localStorage.setItem('linguoquest_session', JSON.stringify(updatedUser));
        notify(`Unit Mastery! XP Gained: ${points}`, 'success');
    } else {
        notify("Mission Failed. Keep practicing!", 'error');
    }
    setSelectedGame(null);
    setView('DASHBOARD');
  };

  const toggleSubject = (s: Subject) => {
    setTeacherSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addAssignment = () => {
    setTeacherAssignments([...teacherAssignments, { grade: Grade.GRADE_6, section: 'A' }]);
  };

  const updateAssignment = (index: number, field: 'grade' | 'section', value: string) => {
    const updated = [...teacherAssignments];
    updated[index] = { ...updated[index], [field]: value as any };
    setTeacherAssignments(updated);
  };

  const removeAssignment = (index: number) => {
    if (teacherAssignments.length > 1) {
      setTeacherAssignments(teacherAssignments.filter((_, i) => i !== index));
    }
  };

  const isMobile = deviceType === DeviceType.PHONE;
  const containerClass = isMobile ? "max-w-lg mx-auto bg-white min-h-screen shadow-2xl flex flex-col" : "w-full min-h-screen bg-slate-50 flex flex-col";

  // Auth/Onboarding Screens
  if (['LOGIN', 'SIGNUP', 'RECOVERY', 'TEACHER_SIGNUP', 'STAFF_VERIFY'].includes(view)) {
    return (
      <div className={`min-h-screen relative flex flex-col items-center justify-center p-4 transition-colors duration-700 ${adminGatePassed || view === 'TEACHER_SIGNUP' ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
        <Toast notification={notification} onClose={() => setNotification(null)} />
        <div className={`w-full ${view === 'TEACHER_SIGNUP' ? 'max-w-3xl' : 'max-w-md'} p-10 rounded-[2.5rem] shadow-2xl transition-all duration-500 relative z-10 ${adminGatePassed || view === 'TEACHER_SIGNUP' ? 'bg-[#1E293B] border border-slate-800 shadow-indigo-900/10' : 'bg-white'}`}>
          <div className="text-center mb-10">
             <div className={`text-6xl font-game mb-2 transition-colors ${adminGatePassed || view === 'TEACHER_SIGNUP' ? 'text-indigo-400' : 'text-indigo-600'}`}>LQ</div>
             <h1 className={`text-2xl font-bold tracking-tight ${adminGatePassed || view === 'TEACHER_SIGNUP' ? 'text-white' : 'text-slate-800'}`}>
               {view === 'TEACHER_SIGNUP' ? 'New Educator Profile' : adminGatePassed ? 'Staff Administration' : 'LinguoQuest Portal'}
             </h1>
          </div>

          {!adminGatePassed && view === 'LOGIN' && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200">
              <button onClick={() => setView('LOGIN')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${view === 'LOGIN' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>Student</button>
              <button onClick={() => setView('STAFF_VERIFY')} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Staff</button>
            </div>
          )}

          {view === 'STAFF_VERIFY' ? (
             <form onSubmit={handleVerifyAdminKey} className="space-y-6">
                <input type="password" required autoFocus placeholder="Institutional Key" className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 outline-none text-center font-mono" value={tempAdminKey} onChange={e => setTempAdminKey(e.target.value)} />
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-colors">Verify Staff</button>
                <div className="flex flex-col gap-3 mt-6">
                  <button type="button" onClick={() => { setView('LOGIN'); setAdminGatePassed(false); }} className="w-full text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-indigo-500 transition-colors">Back</button>
                  <button type="button" onClick={() => { setView('LOGIN'); setAdminGatePassed(false); }} className="w-full text-xs text-indigo-400 font-bold uppercase tracking-widest">I already have an account</button>
                </div>
             </form>
          ) : view === 'TEACHER_SIGNUP' ? (
             <form onSubmit={handleTeacherSignup} className="space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Account Details</h3>
                    <input type="text" required placeholder="Full Name" className="w-full px-5 py-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white outline-none focus:border-indigo-500" value={authData.fullName} onChange={e => setAuthData({...authData, fullName: e.target.value})}/>
                    <input type="text" required placeholder="Staff ID" className="w-full px-5 py-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white outline-none focus:border-indigo-500" value={authData.username} onChange={e => setAuthData({...authData, username: e.target.value})}/>
                    <input type="password" required placeholder="Access Password" className="w-full px-5 py-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white outline-none focus:border-indigo-500" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})}/>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mt-6">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {[Subject.ENGLISH, Subject.HINDI, Subject.FRENCH].map(s => (
                        <button key={s} type="button" onClick={() => toggleSubject(s)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${teacherSubjects.includes(s) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class Assignments</h3>
                      <button type="button" onClick={addAssignment} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase">+ Add Class</button>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {teacherAssignments.map((ta, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex gap-4 items-end relative group">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Grade</label>
                            <select className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-sm outline-none cursor-pointer" value={ta.grade} onChange={(e) => updateAssignment(idx, 'grade', e.target.value)}>
                              <option value={Grade.GRADE_6}>Grade 6</option>
                              <option value={Grade.GRADE_7}>Grade 7</option>
                              <option value={Grade.GRADE_8}>Grade 8</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Section</label>
                            <select className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-sm outline-none cursor-pointer" value={ta.section} onChange={(e) => updateAssignment(idx, 'section', e.target.value)}>
                              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                            </select>
                          </div>
                          {teacherAssignments.length > 1 && (
                            <button type="button" onClick={() => removeAssignment(idx)} className="text-slate-600 hover:text-red-500 p-2">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-6 space-y-4 text-center">
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">Create Staff Account</button>
                  <div className="flex flex-col gap-3 mt-4">
                    <button type="button" onClick={() => { setView('LOGIN'); setAdminGatePassed(false); }} className="text-xs text-indigo-400 font-bold uppercase tracking-widest hover:text-indigo-300">I already have a staff account</button>
                    <button type="button" onClick={() => { setView('LOGIN'); setAdminGatePassed(false); }} className="text-xs text-slate-500 font-bold uppercase py-2 hover:text-indigo-400">Cancel</button>
                  </div>
                </div>
             </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-6 text-left">
              <input type="text" required placeholder={view === 'SIGNUP' ? "Student Full Name" : "Student Login ID"} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500" value={view === 'SIGNUP' ? authData.fullName : authData.username} onChange={e => view === 'SIGNUP' ? setAuthData({...authData, fullName: e.target.value}) : setAuthData({...authData, username: e.target.value})}/>
              <input type="password" required placeholder="Access Password" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})}/>
              {view === 'SIGNUP' && (
                <div className="grid grid-cols-2 gap-4">
                    <select className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={authData.grade} onChange={e => setAuthData({...authData, grade: e.target.value as Grade})}>
                      <option value={Grade.GRADE_6}>Grade 6</option>
                      <option value={Grade.GRADE_7}>Grade 7</option>
                      <option value={Grade.GRADE_8}>Grade 8</option>
                    </select>
                    <select className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={authData.section} onChange={e => setAuthData({...authData, section: e.target.value})}>
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                </div>
              )}
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">{view === 'LOGIN' ? 'Login to Portal' : 'Register Student'}</button>
              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-xs text-indigo-600 font-bold">{view === 'LOGIN' ? 'No account? Join' : 'Have an ID? Login'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (view === 'DEVICE_SELECT') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Toast notification={notification} onClose={() => setNotification(null)} />
        <div className="mb-12">
          <div className="text-8xl font-game text-indigo-600 mb-6 drop-shadow-xl mx-auto">LQ</div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Access Terminal</h1>
          <p className="text-slate-500 mt-2 font-medium">Select your revision platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[
            { type: DeviceType.PHONE, icon: '📱', label: 'Mobile', desc: 'Touch Interface' },
            { type: DeviceType.LAPTOP, icon: '💻', label: 'Laptop', desc: 'Revision Standard' },
            { type: DeviceType.DESKTOP, icon: '🖥️', label: 'Desktop', desc: 'Master Station' }
          ].map((device) => (
            <button key={device.type} onClick={() => selectDevice(device.type)} className="bg-white p-12 rounded-[3.5rem] shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-4 border-transparent hover:border-indigo-600 group">
              <div className="text-8xl mb-8 group-hover:rotate-6 transition-transform mx-auto">{device.icon}</div>
              <div className="text-2xl font-bold text-slate-800 mb-3">{device.label}</div>
              <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">{device.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-[#F8FAFC]' : 'bg-slate-100'}`}>
      <Toast notification={notification} onClose={() => setNotification(null)} />
      {currentUser?.role === UserRole.TEACHER ? (
        <TeacherPanel user={currentUser} onLogout={handleLogout} />
      ) : (
        <div className={containerClass}>
          <nav className={`p-5 flex justify-between items-center border-b sticky top-0 bg-white/80 backdrop-blur-md z-40 ${!isMobile ? 'px-12 h-20' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`bg-indigo-600 rounded-xl flex items-center justify-center text-white font-game shadow-lg shadow-indigo-100 ${isMobile ? 'w-10 h-10 text-xs' : 'w-12 h-12 text-sm'}`}>LQ</div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-400 leading-none tracking-widest uppercase">Grade {currentUser?.grade}{currentUser?.section}</div>
                <div className="text-sm font-bold text-slate-800">{currentUser?.fullName}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {!isMobile && (
                <div className="flex gap-8 mr-12">
                  <button onClick={() => setView('DASHBOARD')} className={`text-xs font-bold uppercase tracking-widest ${view === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>Syllabus</button>
                  <button onClick={() => setView('LEADERBOARD')} className={`text-xs font-bold uppercase tracking-widest ${view === 'LEADERBOARD' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>Ranks</button>
                  <button onClick={() => setView('REWARDS')} className={`text-xs font-bold uppercase tracking-widest ${view === 'REWARDS' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>Rewards</button>
                  <button onClick={() => setView('INFO')} className={`text-xs font-bold uppercase tracking-widest ${view === 'INFO' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>Profile</button>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                   <span className="text-amber-500">⭐</span>
                   <span className="font-bold text-amber-700 text-xs">{currentUser?.points}</span>
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500">Exit</button>
              </div>
            </div>
          </nav>

          <div className={`flex-1 ${!isMobile ? 'max-w-7xl mx-auto w-full p-12' : 'p-6 pb-28'}`}>
            {view === 'DASHBOARD' && !selectedGame && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-10 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between text-left">
                  <div>
                    <div className="text-3xl font-game italic leading-tight mb-4">Master your curriculum!</div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Grade {currentUser?.grade} Section {currentUser?.section} Tracking</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-[0.2em] px-1 text-left">1. Choose Subject</h3>
                      <div className="grid grid-cols-3 gap-6">
                        {[Subject.ENGLISH, Subject.HINDI, Subject.FRENCH].map(sub => (
                          <button key={sub} onClick={() => setSelectedSubject(sub)} className={`p-8 rounded-[2.5rem] text-center border-4 transition-all active:scale-95 ${selectedSubject === sub ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xl' : 'border-slate-100 bg-white text-slate-500 shadow-sm'}`}>
                            <div className="text-5xl mb-4">{sub === Subject.ENGLISH ? '🇬🇧' : sub === Subject.HINDI ? '🇮🇳' : '🇫🇷'}</div>
                            <div className="text-xs font-bold uppercase tracking-widest">{sub}</div>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className={!(selectedSubject && currentUser?.grade) ? 'opacity-30 pointer-events-none' : ''}>
                    <h3 className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-[0.2em] px-1 text-left">2. Revision Units</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { id: 'Escape', name: 'Escape the Chapter', icon: '🔓', color: 'bg-indigo-600', desc: '10-Door Maze Puzzle' },
                        { id: 'Boss', name: 'The Boss Battle', icon: '👹', color: 'bg-rose-500', desc: 'Defeat in 10 Rounds' },
                        { id: 'Story', name: 'Interactive Chapter', icon: '📖', color: 'bg-emerald-500', desc: 'Story Adventures' },
                        { id: 'Sprint', name: 'Recall Sprint', icon: '⚡', color: 'bg-amber-500', desc: 'Fast Speed Quiz' }
                      ].map(game => (
                        <button key={game.id} onClick={() => setSelectedGame(game.name)} className="flex items-center p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group text-left">
                          <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center text-3xl mr-6 shadow-lg`}>{game.icon}</div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm mb-1">{game.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{game.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedGame === 'Escape the Chapter' && selectedSubject && currentUser?.grade && (
              <EscapeTheChapter subject={selectedSubject} grade={currentUser.grade} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />
            )}
            {selectedGame === 'The Boss Battle' && selectedSubject && currentUser?.grade && (
              <BossBattle subject={selectedSubject} grade={currentUser.grade} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />
            )}
            {selectedGame === 'Recall Sprint' && selectedSubject && currentUser?.grade && (
              <FlashRecallSprint subject={selectedSubject} grade={currentUser.grade} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />
            )}
            {selectedGame === 'Interactive Chapter' && selectedSubject && currentUser?.grade && (
              <InteractiveStory subject={selectedSubject} grade={currentUser.grade} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />
            )}

            {view === 'LEADERBOARD' && (
              <div className="max-w-4xl mx-auto py-10 animate-in fade-in text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                  <h2 className="text-4xl font-bold text-slate-800">Revision Rankings</h2>
                  <div className="flex bg-slate-200 p-1 rounded-2xl border border-slate-300">
                      <button onClick={() => setLeaderboardTab('SECTION')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${leaderboardTab === 'SECTION' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Inter-Section</button>
                      <button onClick={() => setLeaderboardTab('SCHOOL')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${leaderboardTab === 'SCHOOL' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Inter-School</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {leaderboardFiltered
                    .sort((a,b) => b.points - a.points)
                    .map((u, i) => (
                      <div key={u.id} className={`flex items-center p-8 rounded-[2rem] border-4 transition-all ${u.id === currentUser?.id ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-white bg-white shadow-sm hover:border-slate-100'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-game text-xl ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-600' : 'text-slate-200'}`}>
                            {i < 3 ? '🏆' : `#${i+1}`}
                          </div>
                          <div className="flex-1 ml-8 text-left">
                              <div className="font-bold text-slate-800 text-lg">{u.fullName} {u.id === currentUser?.id && '(You)'}</div>
                              <div className="text-xs text-slate-400 font-bold tracking-widest uppercase">Grade {u.grade}{u.section}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-game text-indigo-600 text-2xl">{u.points}</div>
                            <div className="text-[10px] text-indigo-400 font-bold tracking-tighter uppercase">XP Points</div>
                          </div>
                      </div>
                  ))}
                  {leaderboardFiltered.length === 0 && <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No rankings yet.</div>}
                </div>
              </div>
            )}

            {view === 'REWARDS' && (
              <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in slide-in-from-bottom-4 text-left">
                <h2 className="text-4xl font-bold text-slate-800">Your Rewards</h2>
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-16 rounded-[4rem] text-white shadow-2xl flex items-center gap-12">
                    <div className="text-9xl">📜</div>
                    <div>
                      <h3 className="text-4xl font-game mb-4">Merit Certificate</h3>
                      <p className="text-lg opacity-90 leading-relaxed font-medium">Earn 5000 XP to automatically unlock your official LinguoQuest Revision Certificate.</p>
                    </div>
                </div>
              </div>
            )}

            {view === 'INFO' && currentUser && (
              <div className="max-w-4xl mx-auto py-10 animate-in fade-in text-left">
                <h2 className="text-4xl font-bold text-slate-800 mb-12">Personal Profile</h2>
                <div className="bg-white p-12 rounded-[3rem] shadow-xl border-4 border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Identity</div>
                          <div className="font-bold text-3xl text-slate-800">{currentUser.fullName}</div>
                      </div>
                      <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tracking ID</div>
                          <div className="font-mono text-indigo-600 text-3xl bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">{currentUser.username}</div>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-center">
                      <div className="text-6xl mb-4 text-emerald-400 font-game">{currentUser.points}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Mastery XP</div>
                      <div className="mt-8 h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{width: `${(currentUser.points || 0) / 100}%`}}></div>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-2 font-bold uppercase">Progress Tier</div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
