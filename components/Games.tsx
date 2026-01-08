
import React, { useState, useEffect, useMemo } from 'react';
import { GameQuestion, Subject, Grade } from '../types';
import { geminiService } from '../services/geminiService';

interface GameProps {
  subject: Subject;
  grade: Grade;
  onComplete: (points: number, livesLost: boolean) => void;
  onCancel: () => void;
}

const BOSS_LIST = [
  { name: "The Exam Phantom", title: "Phobia of Paper", seed: "exam" },
  { name: "Grammar Goblin", title: "Sentence Mangler", seed: "grammar" },
  { name: "Procrastination Prince", title: "The Time Thief", seed: "clock" },
  { name: "Vocabulary Void", title: "The Word Swallower", seed: "void" },
  { name: "Deadline Dragon", title: "The Final Countdown", seed: "dragon" }
];

const LoadingScreen: React.FC<{ message: string; onCancel: () => void }> = ({ message, onCancel }) => (
  <div className="p-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95">
    <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    <div className="space-y-2">
      <div className="font-arcade text-indigo-500 uppercase tracking-widest text-sm">{message}</div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Syncing Syllabus Brain...</p>
    </div>
    <button onClick={onCancel} className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest">Abort Mission</button>
  </div>
);

const ErrorScreen: React.FC<{ onRetry: () => void; onCancel: () => void }> = ({ onRetry, onCancel }) => (
  <div className="p-20 flex flex-col items-center justify-center text-center space-y-8 animate-in slide-in-from-bottom-4">
    <div className="text-8xl">📡</div>
    <div className="space-y-2">
      <div className="font-arcade text-rose-500 uppercase text-lg">Signal Lost</div>
      <p className="text-slate-500 text-sm font-medium">LinguoQuest couldn't reach the Syllabus Server.</p>
    </div>
    <div className="flex gap-4">
      <button onClick={onRetry} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">Try Reconnecting</button>
      <button onClick={onCancel} className="px-8 py-3 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">Back to Hub</button>
    </div>
  </div>
);

// 1. ESCAPE THE CHAPTER 🔐
export const EscapeTheChapter: React.FC<GameProps> = ({ subject, grade, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); 
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isEscaping, setIsEscaping] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; selected: string } | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(false);
    geminiService.generateQuestions(subject, grade, 7).then(data => {
      if (!data || data.length === 0) {
        setError(true);
      } else {
        setQuestions(data);
        setLoading(false);
      }
    }).catch(() => setError(true));
  };

  useEffect(() => { loadData(); }, [subject, grade]);

  useEffect(() => {
    if (loading || isEscaping || error) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete(0, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isEscaping, error]);

  const handleAnswer = (option: string) => {
    if (feedback || isEscaping) return;
    const isCorrect = option === questions[currentIndex].correctAnswer;
    setFeedback({ isCorrect, selected: option });

    if (isCorrect) {
      setTimeout(() => {
        if (currentIndex === questions.length - 1) {
          setIsEscaping(true);
          setTimeout(() => onComplete(100 + (wrongAnswers === 0 ? 20 : 0), wrongAnswers > 0), 1500);
        } else {
          setCurrentIndex(prev => prev + 1);
          setFeedback(null);
        }
      }, 1200);
    } else {
      setWrongAnswers(prev => prev + 1);
      setTimeLeft(prev => Math.max(0, prev - 15));
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  if (error) return <ErrorScreen onRetry={loadData} onCancel={onCancel} />;
  if (loading) return <LoadingScreen message="Building Syllabus Maze..." onCancel={onCancel} />;

  const timerColor = timeLeft > 120 ? 'text-emerald-400' : timeLeft > 30 ? 'text-yellow-400' : 'text-red-500 animate-pulse';

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-8 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-10 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50">
        <div className={`font-arcade text-2xl ${timerColor} text-left`}>
           <span className="text-[10px] block opacity-50 mb-1">REMAINING</span>
           {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex gap-3">
          {questions.map((_, i) => (
            <div key={i} className={`w-10 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-700 border-2 ${
              i < currentIndex ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 lock-unlocked' : 'bg-slate-700 border-slate-600 text-slate-500 opacity-50'
            }`}>
              {i < currentIndex ? '🔓' : '🔒'}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl p-10 mb-8 min-h-[300px] flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden">
        <div className="text-[10px] font-arcade text-indigo-400 mb-6 uppercase tracking-widest">Door {currentIndex + 1} of {questions.length}</div>
        <h2 className="text-2xl font-game text-white leading-relaxed max-w-2xl">{questions[currentIndex]?.question}</h2>
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md z-20 animate-in fade-in">
             <div className={`text-6xl font-arcade ${feedback.isCorrect ? 'text-emerald-400 animate-bounce' : 'text-red-500 animate-shake'}`}>
               {feedback.isCorrect ? 'UNLOCKED!' : 'JAMMED!'}
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions[currentIndex]?.options.map((opt, i) => {
          const isCorrect = opt === questions[currentIndex].correctAnswer;
          const isSelected = opt === feedback?.selected;
          let variant = "bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500";
          if (feedback) {
            if (isCorrect) variant = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg scale-105 z-10";
            else if (isSelected) variant = "bg-red-500/20 border-red-500 text-red-400 animate-shake";
            else variant = "bg-slate-950 border-slate-900 text-slate-700 opacity-40";
          }
          return (
            <button key={i} disabled={!!feedback} onClick={() => handleAnswer(opt)} className={`p-6 rounded-2xl border-2 transition-all flex items-center group ${variant}`}>
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center mr-5 font-arcade text-xs ${feedback ? (isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500') : 'bg-slate-800 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {String.fromCharCode(65+i)}
              </span>
              <span className="font-medium text-lg text-left">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 2. BOSS BATTLE 👾
export const BossBattle: React.FC<GameProps> = ({ subject, grade, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; selected: string } | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);

  const boss = useMemo(() => BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)], []);

  const loadData = () => {
    setLoading(true);
    setError(false);
    geminiService.generateQuestions(subject, grade, 10).then(data => {
      if (!data || data.length === 0) setError(true);
      else { setQuestions(data); setLoading(false); }
    }).catch(() => setError(true));
  };

  useEffect(() => { loadData(); }, [subject, grade]);

  const handleAnswer = (opt: string) => {
    if (feedback) return;
    const isCorrect = opt === questions[currentIndex].correctAnswer;
    setFeedback({ isCorrect, selected: opt });

    if (isCorrect) {
      setCombo(prev => prev + 1);
      setDamageFlash(true);
      setBossHp(prev => Math.max(0, prev - 10));
      setTimeout(() => {
        setDamageFlash(false);
        if (currentIndex === 9) onComplete(100 + (playerHp === 3 ? 20 : 0), false);
        else { setFeedback(null); setCurrentIndex(prev => prev + 1); }
      }, 1200);
    } else {
      setCombo(0);
      setPlayerHp(prev => prev - 1);
      setTimeout(() => {
        if (playerHp <= 1 || currentIndex === 9) onComplete(0, true);
        else { setFeedback(null); setCurrentIndex(prev => prev + 1); }
      }, 1500);
    }
  };

  if (error) return <ErrorScreen onRetry={loadData} onCancel={onCancel} />;
  if (loading) return <LoadingScreen message="Summoning Boss..." onCancel={onCancel} />;

  return (
    <div className={`max-w-2xl mx-auto bg-black p-8 rounded-[3rem] border-8 border-red-950 shadow-2xl relative overflow-hidden crt-effect ${damageFlash ? 'animate-shake' : ''}`}>
      <div className="flex justify-between items-center mb-10">
        <div className="w-1/2 pr-4 text-left">
           <div className="flex justify-between text-[10px] font-arcade text-red-500 mb-1 uppercase"><span>Boss HP</span><span>{bossHp}%</span></div>
           <div className="h-4 bg-slate-900 border-2 border-red-900 p-0.5"><div className="h-full bg-red-600 transition-all duration-700" style={{ width: `${bossHp}%` }}></div></div>
        </div>
        <div className="w-1/2 pl-4 text-right">
           <div className="flex justify-end gap-2 mb-1">{Array.from({ length: 3 }).map((_, i) => <span key={i} className={`text-xl ${i < playerHp ? 'opacity-100' : 'opacity-20'}`}>❤️</span>)}</div>
           <div className="text-[10px] font-arcade text-emerald-500 uppercase">Your Health</div>
        </div>
      </div>

      <div className="flex justify-around items-center h-48 mb-10">
        <div className="text-6xl animate-bounce">🧑‍🎓</div>
        <div className="text-2xl font-arcade text-yellow-500 italic animate-pulse">VS</div>
        <div className={`relative ${damageFlash ? 'animate-hit' : 'animate-bounce'}`}>
          <div className="w-32 h-32 bg-slate-900 border-4 border-red-900 rounded-2xl overflow-hidden shadow-[0_0_20px_red]">
             <img src={`https://picsum.photos/seed/${boss.seed}/200/200`} className="w-full h-full grayscale invert opacity-60" alt="Boss" />
          </div>
          {feedback && !feedback.isCorrect && <div className="absolute -top-10 left-10 bg-red-600 text-white font-arcade text-[8px] p-2 rounded-lg">MUHAHA!</div>}
        </div>
      </div>

      <div className="bg-slate-900/90 p-8 rounded-[2rem] border-2 border-slate-800 relative">
        {combo >= 3 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full font-arcade text-[8px] animate-bounce">🔥 {combo} COMBO!</div>}
        <div className="text-center h-20 flex items-center justify-center"><p className="text-sm font-arcade text-slate-200 uppercase leading-tight">{questions[currentIndex]?.question}</p></div>
        <div className="grid grid-cols-1 gap-3">
          {questions[currentIndex]?.options.map((opt, i) => {
            const isCorrect = opt === questions[currentIndex].correctAnswer;
            const isSelected = opt === feedback?.selected;
            let btn = "bg-black border-slate-800 text-slate-500 hover:border-red-900";
            if (feedback) {
              if (isCorrect) btn = "bg-emerald-900 border-emerald-500 text-emerald-400 scale-105 z-10 shadow-lg";
              else if (isSelected) btn = "bg-red-950 border-red-500 text-red-500 animate-shake";
              else btn = "bg-black border-slate-950 text-slate-800 opacity-30";
            }
            return (
              <button key={i} disabled={!!feedback} onClick={() => handleAnswer(opt)} className={`p-4 rounded-xl border-2 transition-all flex items-center group ${btn}`}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-[10px] font-arcade ${feedback ? (isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-700') : 'bg-slate-900 text-slate-700 group-hover:bg-red-700 group-hover:text-white'}`}>{String.fromCharCode(65+i)}</span>
                <span className="text-[11px] font-arcade leading-tight text-left">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. INTERACTIVE CHAPTER 📖
export const InteractiveStory: React.FC<GameProps> = ({ subject, grade, onComplete, onCancel }) => {
  const [story, setStory] = useState<any>(null);
  const [currentNode, setCurrentNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [points, setPoints] = useState(100);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; selected: string } | null>(null);

  const loadStory = () => {
    setLoading(true);
    setError(false);
    geminiService.generateStory(subject, grade).then(data => {
      if (!data) setError(true);
      else { setStory(data); setCurrentNode(data?.startNode); setLoading(false); }
    }).catch(() => setError(true));
  };

  useEffect(() => { loadStory(); }, [subject, grade]);

  useEffect(() => {
    if (!currentNode) return;
    setDisplayText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(currentNode.text.substring(0, i + 1));
      i++;
      if (i >= currentNode.text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [currentNode]);

  const handleChoice = (choice: any) => {
    if (feedback) return;
    setFeedback({ isCorrect: choice.isCorrect, selected: choice.nextNodeId });
    if (!choice.isCorrect) setPoints(p => Math.max(0, p - 20));

    setTimeout(() => {
      const nextNode = story.nodes.find((n: any) => n.id === choice.nextNodeId);
      if (nextNode) {
        setFeedback(null);
        setCurrentNode(nextNode);
      } else {
        onComplete(points, points < 100);
      }
    }, 1500);
  };

  if (error) return <ErrorScreen onRetry={loadStory} onCancel={onCancel} />;
  if (loading) return <LoadingScreen message="Writing your story..." onCancel={onCancel} />;

  return (
    <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border-t-[20px] border-emerald-500 min-h-[600px] flex flex-col text-left">
      <div className="flex gap-8 mb-10 items-start">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-5xl border-4 border-white shadow-xl rotate-3">🧑‍🏫</div>
        <div className="flex-1 bg-slate-50 p-8 rounded-[2rem] rounded-tl-none border border-slate-100 relative shadow-sm text-left">
           <div className="text-xl font-serif leading-relaxed text-slate-800 italic">"{displayText}"</div>
           <div className="absolute -left-3 top-0 w-6 h-6 bg-slate-50 rotate-45 border-l border-t border-slate-100"></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-end space-y-4">
        {currentNode?.choices.map((choice: any, i: number) => {
          const isCorrect = choice.isCorrect;
          const isSelected = choice.nextNodeId === feedback?.selected;
          let variant = "bg-white border-slate-100 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50";
          if (feedback) {
            if (isCorrect) variant = "bg-emerald-100 border-emerald-500 text-emerald-800 shadow-lg scale-105 z-10";
            else if (isSelected) variant = "bg-red-50 border-red-300 text-red-700 animate-shake";
            else variant = "bg-white border-slate-100 text-slate-300 opacity-40";
          }
          return (
            <button key={i} disabled={!!feedback} onClick={() => handleChoice(choice)} className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center group ${variant}`}>
               <span className={`w-12 h-12 rounded-xl flex items-center justify-center mr-6 font-bold transition-all ${feedback ? (isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400') : 'bg-emerald-500 text-white shadow-lg group-hover:rotate-12'}`}>{i+1}</span>
               <span className="font-bold text-lg">{choice.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 4. FLASH-RECALL SPRINT ⚡
export const FlashRecallSprint: React.FC<GameProps> = ({ subject, grade, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(10);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [maxTimer, setMaxTimer] = useState(10);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; selected: string } | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(false);
    geminiService.generateQuestions(subject, grade, 15).then(data => {
      if (!data || data.length === 0) setError(true);
      else { setQuestions(data); setLoading(false); }
    }).catch(() => setError(true));
  };

  useEffect(() => { loadData(); }, [subject, grade]);

  useEffect(() => {
    if (loading || feedback || error) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0.1) { handleAnswer(""); return maxTimer; }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [loading, currentIndex, maxTimer, feedback, error]);

  const handleAnswer = (opt: string) => {
    if (feedback) return;
    const isCorrect = opt === questions[currentIndex].correctAnswer;
    setFeedback({ isCorrect, selected: opt });

    setTimeout(() => {
      if (isCorrect) {
        setStreak(s => s + 1);
        if ((streak + 1) % 3 === 0) setMaxTimer(prev => Math.max(3, prev - 1.5));
      } else { setStreak(0); setMaxTimer(10); }
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setTimer(maxTimer);
        setFeedback(null);
      } else { onComplete(100, streak < 10); }
    }, 800);
  };

  if (error) return <ErrorScreen onRetry={loadData} onCancel={onCancel} />;
  if (loading) return <LoadingScreen message="Warming up Sprinter..." onCancel={onCancel} />;

  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (timer / maxTimer) * circumference;

  return (
    <div className="max-w-xl mx-auto py-16 px-10 bg-white rounded-[4rem] border-8 border-amber-400 shadow-2xl flex flex-col items-center">
      <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90"><circle cx="80" cy="80" r="50" className="stroke-amber-100 fill-none" strokeWidth="10"/><circle cx="80" cy="80" r="50" className={`stroke-amber-500 fill-none transition-all duration-100 ease-linear ${timer < 2 ? 'animate-pulse stroke-red-500' : ''}`} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"/></svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-arcade"><span className="text-3xl text-amber-700">{Math.ceil(timer)}</span><span className="text-[8px] text-amber-400 uppercase text-center">SEC</span></div>
      </div>
      <div className="text-center mb-10 w-full">
         <div className="text-[10px] font-arcade text-amber-600 mb-4 uppercase tracking-widest">Streak: 🔥 {streak}</div>
         <div className={`bg-amber-50 p-10 rounded-[3rem] border-4 border-white shadow-inner min-h-[180px] flex items-center justify-center transition-all ${feedback ? (feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 animate-shake') : ''}`}>
            <p className="text-2xl font-game text-slate-800 leading-tight">{questions[currentIndex]?.question}</p>
         </div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full">
        {questions[currentIndex]?.options.map((opt, i) => {
          const isCorrect = opt === questions[currentIndex].correctAnswer;
          const isSelected = opt === feedback?.selected;
          let variant = "bg-white border-slate-100 text-slate-700 hover:border-amber-400 hover:bg-amber-50 shadow-md";
          if (feedback) {
            if (isCorrect) variant = "bg-emerald-500 border-emerald-500 text-white shadow-lg scale-105 z-10";
            else if (isSelected) variant = "bg-red-500 border-red-500 text-white animate-shake";
            else variant = "bg-white border-slate-100 text-slate-200 opacity-40 scale-95";
          }
          return (
            <button key={i} disabled={!!feedback} onClick={() => handleAnswer(opt)} className={`p-6 rounded-3xl font-bold border-b-8 transition-all active:border-b-0 active:translate-y-2 ${variant}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
