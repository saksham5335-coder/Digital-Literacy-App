import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, Grade, Subject, DeviceType, TeachingAssignment, ScoreUpdate } from './types';
import { db } from './store/localDb';
import { EscapeTheChapter, BossBattle, FlashRecallSprint, InteractiveStory } from './components/Games';

const ADMIN_SECRET_KEY = 'LQGTS';
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast: React.FC<{ notification: Notification | null; onClose: () => void }> = ({ notification, onClose }) => {
  if (!notification) return null;
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [notification, onClose]);
  const bg = notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'error' ? 'bg-rose-500' : 'bg-indigo-600';
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
      <div className={`${bg} text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20`}>
        <span className="text-xl">{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
        <p className="font-bold text-sm tracking-tight">{notification.message}</p>
      </div>
    </div>
  );
};

const Certificate: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={onClose}>
    <div className="bg-white max-w-4xl w-full p-1 border-[16px] border-amber-400 rounded-lg relative shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400 rotate-45 -translate-x-16 -translate-y-16"></div>
      <div className="border-4 border-amber-100 p-12 text-center space-y-8 bg-white">
        <div className="text-indigo-600 font-game text-4xl">LinguoQuest</div>
        <div className="space-y-2">
          <h2 className="text-5xl font-serif text-slate-800 tracking-tight">Certificate of Mastery</h2>
          <p className="text-slate-500 uppercase tracking-[0.4em] font-bold text-sm">Presented To</p>
        </div>
        <div className="text-6xl font-game text-indigo-800 border-b-4 border-slate-100 pb-4 inline-block px-12 italic">{user.fullName}</div>
        <div className="max-w-xl mx-auto text-lg text-slate-600 leading-relaxed font-serif">
          For exceptional dedication and mastery of the <span className="text-indigo-600 font-bold">English, Hindi, and French</span> curricula for Grade {user.grade}. This student has surpassed 1,000 XP in the LinguoQuest Digital Revision Program.
        </div>
        <div className="flex justify-between items-end pt-12 px-12">
          <div className="text-left">
            <div className="w-48 border-b-2 border-slate-200 mb-2"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digital Registrar</p>
          </div>
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-game border-8 border-indigo-100">LQ</div>
          <div className="text-right">
            <div className="w-48 border-b-2 border-slate-200 mb-2"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">✕</button>
    </div>
  </div>
);

const TeacherPanel: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeAssignment, setActiveAssignment] = useState<TeachingAssignment | 'ALL'>(
    user.teachingAssignments && user.teachingAssignments.length > 0 ? user.teachingAssignments[0] : 'ALL'
  );

  const users = db.getUsers();
  const scores = db.getScores();

  const students = useMemo(() => {
    const allStudents = users.filter(u => u.role === UserRole.STUDENT);
    if (activeAssignment === 'ALL') {
      return allStudents.filter(s => user.teachingAssignments?.some(ta => ta.grade === s.grade && ta.section === s.section));
    }
    return allStudents.filter(s => s.grade === activeAssignment.grade && s.section === activeAssignment.section);
  }, [users, activeAssignment, user.teachingAssignments]);

  const subjectStats = useMemo(() => {
    const relevantScores = scores.filter(s => students.some(stu => stu.id === s.userId));
    return [Subject.ENGLISH, Subject.HINDI, Subject.FRENCH].map(sub => {
      const subScores = relevantScores.filter(s => s.subject === sub);
      const avg = subScores.length ? Math.round(subScores.reduce((a, b) => a + b.pointsEarned, 0) / subScores.length) : 0;
      return { subject: sub, avg, count: subScores.length };
    });
  }, [scores, students]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 md:p-12 text-left">
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center text-white font-game shadow-lg">LQ</div>
          <div><h1 className="text-xl font-bold text-white">Staff Console</h1><p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{user.fullName}</p></div>
        </div>
        <div className="flex items-center gap-6">
          <select className="bg-slate-800 text-sm font-bold text-indigo-400 p-2 rounded-xl border border-slate-700 outline-none" 
            value={activeAssignment === 'ALL' ? 'ALL' : JSON.stringify(activeAssignment)}
            onChange={(e) => setActiveAssignment(e.target.value === 'ALL' ? 'ALL' : JSON.parse(e.target.value))}>
            <option value="ALL">All Classes</option>
            {user.teachingAssignments?.map((ta, i) => <option key={i} value={JSON.stringify(ta)}>Grade {ta.grade} {ta.section}</option>)}
          </select>
          <button onClick={onLogout} className="px-6 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-bold">Sign Out</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subjectStats.map((stat, i) => (
            <div key={i} className="bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-700 relative group overflow-hidden">
              <div className="text-4xl mb-4">{stat.subject === Subject.ENGLISH ? '🇬🇧' : stat.subject === Subject.HINDI ? '🇮🇳' : '🇫🇷'}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.subject} Mastery</div>
              <div className="text-4xl font-game text-white">{stat.avg} XP</div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (stat.avg/1000)*100)}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{stat.count} Units</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/30 border border-slate-700 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-slate-700"><h2 className="text-xl font-bold text-white">Student Roster - Performance Tracking</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-900/50"><th className="p-6 text-[10px] uppercase font-bold text-slate-500">Name</th><th className="p-6 text-[10px] uppercase font-bold text-slate-500">ID</th><th className="p-6 text-[10px] uppercase font-bold text-slate-500">XP</th><th className="p-6 text-[10px] uppercase font-bold text-slate-500">Level</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {students.sort((a,b) => b.points - a.points).map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/20">
                    <td className="p-6 font-bold text-white">{s.fullName}</td>
                    <td className="p-6 font-mono text-xs text-indigo-400">{s.username}</td>
                    <td className="p-6 font-game text-amber-500">{s.points}</td>
                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${s.points >= 1000 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-500'}`}>{s.points >= 1000 ? 'Master' : 'Novice'}</span></td>
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
  const [view, setView] = useState<'DEVICE_SELECT' | 'LOGIN' | 'SIGNUP' | 'DASHBOARD' | 'LEADERBOARD' | 'REWARDS' | 'TEACHER_PANEL' | 'INFO' | 'TEACHER_SIGNUP' | 'STAFF_VERIFY'>('DEVICE_SELECT');
  const [leaderboardTab, setLeaderboardTab] = useState<'SECTION' | 'SCHOOL'>('SECTION');
  const [adminGatePassed, setAdminGatePassed] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [authData, setAuthData] = useState({ username: '', fullName: '', password: '', recoveryEmail: '', grade: Grade.GRADE_6, section: 'A' });
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeachingAssignment[]>([{ grade: Grade.GRADE_6, section: 'A' }]);

  useEffect(() => {
    const saved = localStorage.getItem('linguoquest_session');
    if (saved) {
      const u = JSON.parse(saved);
      setCurrentUser(u);
      setView(u.role === UserRole.TEACHER ? 'TEACHER_PANEL' : 'DASHBOARD');
    }
  }, []);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => setNotification({ message, type }), []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.getUsers().find(u => u.username === authData.username && u.password === authData.password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('linguoquest_session', JSON.stringify(user));
      setView(user.role === UserRole.TEACHER ? 'TEACHER_PANEL' : 'DASHBOARD');
      notify(`Welcome back, ${user.fullName}!`, 'success');
    } else notify("Invalid ID or Password.", 'error');
  };

  const onGameComplete = (points: number) => {
    if (!currentUser) return;
    if (points > 0) {
      db.addScore({ userId: currentUser.id, gameType: selectedGame || 'unknown', pointsEarned: points, grade: currentUser.grade!, subject: selectedSubject!, timestamp: new Date().toISOString() });
      const updated = db.getUsers().find(u => u.id === currentUser.id)!;
      setCurrentUser(updated);
      localStorage.setItem('linguoquest_session', JSON.stringify(updated));
      notify(`Unit Mastery! +${points} XP`, 'success');
    }
    setSelectedGame(null); setView('DASHBOARD');
  };

  if (view === 'DEVICE_SELECT') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-12"><div className="text-8xl font-game text-indigo-600 mb-6 drop-shadow-xl">LQ</div><h1 className="text-4xl font-bold text-slate-800">LinguoQuest Portal</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {[DeviceType.PHONE, DeviceType.LAPTOP, DeviceType.DESKTOP].map(t => (
          <button key={t} onClick={() => { setDeviceType(t); setView('LOGIN'); }} className="bg-white p-12 rounded-[3.5rem] shadow-xl hover:scale-105 transition-all border-4 border-transparent hover:border-indigo-600 group">
            <div className="text-8xl mb-4">{t === DeviceType.PHONE ? '📱' : t === DeviceType.LAPTOP ? '💻' : '🖥️'}</div>
            <div className="text-2xl font-bold">{t}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (['LOGIN', 'SIGNUP', 'TEACHER_SIGNUP', 'STAFF_VERIFY'].includes(view)) return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${adminGatePassed || view === 'TEACHER_SIGNUP' ? 'bg-[#0F172A]' : 'bg-slate-50'}`}>
      <Toast notification={notification} onClose={() => setNotification(null)} />
      <div className={`max-w-md w-full p-10 rounded-[2.5rem] ${adminGatePassed || view === 'TEACHER_SIGNUP' ? 'bg-[#1E293B] text-white' : 'bg-white shadow-2xl'}`}>
        <div className="text-center mb-10"><div className="text-5xl font-game text-indigo-600 mb-2">LQ</div><h2 className="text-2xl font-bold">{view === 'TEACHER_SIGNUP' ? 'Educator Setup' : 'Student Login'}</h2></div>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <input type="text" placeholder="Login ID" className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none text-slate-800" value={authData.username} onChange={e => setAuthData({...authData, username: e.target.value})}/>
          <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none text-slate-800" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})}/>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl">Enter Portal</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toast notification={notification} onClose={() => setNotification(null)} />
      {showCertificate && currentUser && <Certificate user={currentUser} onClose={() => setShowCertificate(false)} />}
      
      <nav className="p-5 flex justify-between items-center bg-white border-b sticky top-0 z-40 px-12 h-20">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-game">LQ</div>
          <div className="text-left"><div className="text-[10px] font-bold text-slate-400">Grade {currentUser?.grade}{currentUser?.section}</div><div className="text-sm font-bold text-slate-800">{currentUser?.fullName}</div></div>
        </div>
        <div className="flex gap-8">
          {['DASHBOARD', 'LEADERBOARD', 'REWARDS', 'INFO'].map(v => (
            <button key={v} onClick={() => setView(v as any)} className={`text-xs font-bold uppercase tracking-widest ${view === v ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>{v}</button>
          ))}
          <button onClick={() => { localStorage.removeItem('linguoquest_session'); setView('LOGIN'); }} className="text-xs font-bold text-red-400">Exit</button>
        </div>
        <div className="bg-amber-50 px-4 py-2 rounded-full border border-amber-200 flex items-center gap-2"><span className="text-amber-500">⭐</span><span className="font-bold text-amber-700">{currentUser?.points}</span></div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-12 text-left">
        {view === 'DASHBOARD' && !selectedGame && (
          <div className="space-y-12">
            <div className="bg-indigo-600 p-12 rounded-[3rem] text-white shadow-xl flex justify-between items-center">
              <div><h2 className="text-4xl font-game mb-2">Master Your Syllabus!</h2><p className="opacity-70 font-bold uppercase tracking-widest text-xs">Syllabus-aligned units for Grade {currentUser?.grade}</p></div>
              <div className="text-6xl animate-bounce">🚀</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="grid grid-cols-3 gap-6">
                {[Subject.ENGLISH, Subject.HINDI, Subject.FRENCH].map(s => (
                  <button key={s} onClick={() => setSelectedSubject(s)} className={`p-8 rounded-[2.5rem] text-center border-4 transition-all ${selectedSubject === s ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-slate-100 bg-white shadow-sm'}`}>
                    <div className="text-5xl mb-4">{s === Subject.ENGLISH ? '🇬🇧' : s === Subject.HINDI ? '🇮🇳' : '🇫🇷'}</div>
                    <div className="text-xs font-bold uppercase tracking-widest">{s}</div>
                  </button>
                ))}
              </div>
              <div className={`grid grid-cols-2 gap-6 ${!selectedSubject ? 'opacity-30 pointer-events-none' : ''}`}>
                {[
                  { id: 'Escape', name: 'Escape the Chapter', icon: '🔓', color: 'bg-indigo-600' },
                  { id: 'Boss', name: 'The Boss Battle', icon: '👹', color: 'bg-rose-500' },
                  { id: 'Story', name: 'Interactive Story', icon: '📖', color: 'bg-emerald-500' },
                  { id: 'Sprint', name: 'Recall Sprint', icon: '⚡', color: 'bg-amber-500' }
                ].map(g => (
                  <button key={g.id} onClick={() => setSelectedGame(g.name)} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
                    <div className={`w-14 h-14 ${g.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>{g.icon}</div>
                    <div className="font-bold text-slate-800 text-xs uppercase leading-tight">{g.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedGame === 'Escape the Chapter' && <EscapeTheChapter subject={selectedSubject!} grade={currentUser!.grade!} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />}
        {selectedGame === 'The Boss Battle' && <BossBattle subject={selectedSubject!} grade={currentUser!.grade!} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />}
        {selectedGame === 'Interactive Story' && <InteractiveStory subject={selectedSubject!} grade={currentUser!.grade!} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />}
        {selectedGame === 'Recall Sprint' && <FlashRecallSprint subject={selectedSubject!} grade={currentUser!.grade!} onComplete={onGameComplete} onCancel={() => setSelectedGame(null)} />}

        {view === 'REWARDS' && (
          <div className="space-y-12">
            <h2 className="text-4xl font-bold">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`p-12 rounded-[3.5rem] border-4 transition-all ${currentUser!.points >= 1000 ? 'bg-amber-50 border-amber-400' : 'bg-slate-100 border-slate-200 grayscale opacity-50'}`}>
                <div className="text-7xl mb-6">📜</div>
                <h3 className="text-3xl font-game mb-2 text-amber-800">Mastery Certificate</h3>
                <p className="text-amber-600 mb-8 font-medium">Unlocked at 1,000 XP. Recognized by teachers.</p>
                <button disabled={currentUser!.points < 1000} onClick={() => setShowCertificate(true)} className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl hover:bg-amber-600 shadow-xl disabled:bg-slate-300">View Certificate</button>
              </div>
              <div className="p-12 rounded-[3.5rem] bg-indigo-50 border-4 border-indigo-100 relative group overflow-hidden">
                <div className="text-7xl mb-6">💎</div>
                <h3 className="text-3xl font-game mb-2 text-indigo-800">Title: Revision Wizard</h3>
                <p className="text-indigo-600 mb-8 font-medium">Active status: Top 10% in Grade {currentUser?.grade}</p>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">Permanent Reward</div>
              </div>
            </div>
          </div>
        )}

        {view === 'INFO' && (
          <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border-4 border-slate-50 grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</div><div className="text-3xl font-bold text-slate-800">{currentUser?.fullName}</div></div>
              <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Login ID</div><div className="text-2xl font-mono text-indigo-600 bg-indigo-50 p-4 rounded-2xl inline-block border-2 border-indigo-100">{currentUser?.username}</div></div>
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white text-center flex flex-col justify-center">
              <div className="text-6xl font-game text-emerald-400 mb-2">{currentUser?.points}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Mastery XP</div>
              <div className="mt-8 h-2 w-full bg-slate-800 rounded-full"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (currentUser!.points/5000)*100)}%` }}></div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
