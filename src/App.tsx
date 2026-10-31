import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Circle,
  ExternalLink,
  Headphones,
  Mic,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Category = 'Interview' | 'Pitch' | 'Story' | 'Small Talk';
type Task = { id: number; minutes: number; title: string; icon: typeof Mic; color: string; dark?: boolean };

const tasks: Task[] = [
  { id: 1, minutes: 5, title: 'Warm-up Spoken Sprint', icon: Mic, color: 'pink' },
  { id: 2, minutes: 6, title: 'Speed Read & Shadowing', icon: RotateCcw, color: 'green' },
  { id: 3, minutes: 4, title: 'Master 1 Nuanced Word', icon: Sparkles, color: 'yellow' },
  { id: 4, minutes: 5, title: 'Micro-Journal Quickwrite', icon: RotateCcw, color: 'hotpink' },
  { id: 5, minutes: 8, title: 'Active Listening & Mimic', icon: Headphones, color: 'blue' },
  { id: 6, minutes: 7, title: 'Real-World Mini Convo', icon: Volume2, color: 'cream' },
];

const prompts: Record<Category, string[]> = {
  Interview: [
    'Describe a decision you made under intense pressure and explain what you learned from the final outcome.',
    'How do you persuade someone who strongly disagrees with your approach?',
    'Talk about a mistake you made early in your career and how you handled accountability.',
  ],
  Pitch: [
    'Pitch a subscription service for renting house plants in under 2 minutes.',
    'Convince your team that remote async work is more productive than daily standups.',
    'Explain why every developer needs to practice public speaking daily.',
  ],
  Story: [
    'Tell the story of the worst travel delay or flight mix-up you ever experienced.',
    'Recall an unexpected encounter with a stranger that changed your worldview.',
    'Describe your first impression of your hometown compared to how you see it now.',
  ],
  'Small Talk': [
    'Start a casual coffee-shop conversation about local weekend markets.',
    'How would you break an awkward silence in an elevator with a new executive?',
    'Comment on a recent film or podcast in a casual, warm, punchy way.',
  ],
};

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function App() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [streak, setStreak] = useState(14);
  const [category, setCategory] = useState<Category>('Interview');
  const [duration, setDuration] = useState(120);
  const [remaining, setRemaining] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [prompt, setPrompt] = useState(prompts.Interview[0]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [showSignIn, setShowSignIn] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<number | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      const { data } = await supabase.from('daily_coach_progress').select('completed_tasks, streak_days').eq('id', 1).maybeSingle();
      if (data) {
        setCompleted(data.completed_tasks ?? []);
        setStreak(data.streak_days ?? 14);
      }
    };
    void loadProgress();
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (audioRef.current) window.clearInterval(audioRef.current);
  }, []);

  const saveProgress = async (nextCompleted: number[]) => {
    await supabase.from('daily_coach_progress').upsert({ id: 1, completed_tasks: nextCompleted, streak_days: streak, updated_at: new Date().toISOString() });
  };

  const toggleTask = (id: number) => {
    const next = completed.includes(id) ? completed.filter((taskId) => taskId !== id) : [...completed, id];
    setCompleted(next);
    void saveProgress(next);
  };

  const resetTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setRemaining(duration);
  };

  const toggleTimer = () => {
    if (remaining === 0) {
      setRemaining(duration);
      return;
    }
    if (isTimerRunning) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setIsTimerRunning(false);
      return;
    }
    setIsTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setIsTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const chooseDuration = (seconds: number) => {
    setDuration(seconds);
    setRemaining(seconds);
    setIsTimerRunning(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const chooseCategory = (nextCategory: Category) => {
    setCategory(nextCategory);
    setPrompt(prompts[nextCategory][0]);
  };

  const shufflePrompt = () => {
    const choices = prompts[category].filter((item) => item !== prompt);
    setPrompt(choices[Math.floor(Math.random() * choices.length)] ?? prompts[category][0]);
  };

  const openRelatedVideo = () => {
    window.open('https://www.youtube.com/results?search_query=technology+talks+communication+skills+learning', '_blank', 'noopener,noreferrer');
  };

  const toggleAudio = () => {
    if (audioSeconds >= 220) setAudioSeconds(0);
    setIsAudioPlaying((playing) => !playing);
  };

  useEffect(() => {
    if (!isAudioPlaying) return;
    audioRef.current = window.setInterval(() => {
      setAudioSeconds((current) => {
        if (current >= 220) {
          setIsAudioPlaying(false);
          return 220;
        }
        return current + 1;
      });
    }, 1000);
    return () => {
      if (audioRef.current) window.clearInterval(audioRef.current);
    };
  }, [isAudioPlaying]);

  const progress = Math.round((completed.length / tasks.length) * 100);
  const timerProgress = duration ? remaining / duration : 0;
  const audioProgress = (audioSeconds / 220) * 100;
  const currentAudio = `${Math.floor(audioSeconds / 60)}:${String(audioSeconds % 60).padStart(2, '0')}`;

  const streakDays = useMemo(() => ['M', 'T', 'W', 'T', 'F'], []);

  return (
    <div className="paper-grid min-h-screen text-ink">
      <header className="fixed left-0 right-0 top-0 z-40 px-4 pt-3 md:px-8 md:pt-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border-[2.5px] border-ink bg-white px-4 shadow-[4px_4px_0_#141414] md:px-6">
          <a href="#top" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            <span className="flex h-9 w-9 -rotate-3 items-center justify-center rounded-full border-2 border-ink bg-lilac shadow-[2px_2px_0_#141414]"><Mic size={18} /></span>
            Muse
          </a>
          <nav className="hidden items-center gap-1 rounded-full border-2 border-ink bg-paper px-1 py-1 md:flex">
            {['Today', 'Streak', 'Word', 'Listen'].map((item, index) => <a key={item} href={`#${index === 0 ? 'plan' : item.toLowerCase()}`} className={`rounded-full px-4 py-2 text-xs font-bold transition ${index === 0 ? 'border-2 border-ink bg-yellow shadow-[2px_2px_0_#141414]' : 'hover:bg-white'}`}>{item}</a>)}
          </nav>
          <button onClick={() => setShowSignIn(true)} className="tactile-button rounded-full bg-yellow px-5 py-2 text-xs font-bold">Sign In</button>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8">
        <section className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <h1 className="max-w-xl font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] md:text-7xl">Your plan for today is ready.</h1>
              <span className="mt-16 hidden h-12 w-12 rotate-6 items-center justify-center rounded-2xl border-2 border-ink bg-yellow shadow-[3px_3px_0_#141414] sm:flex"><Mic size={24} /></span>
            </div>
            <p className="max-w-lg text-lg leading-7 text-muted">One focused 35-minute routine to build speaking confidence and real-world clarity.</p>
            <a href="#plan" className="tactile-button inline-flex items-center gap-2 rounded-full bg-yellow px-7 py-3.5 text-sm font-bold"><Play size={16} fill="currentColor" /> Start Today's Routine</a>
          </div>

          <div className="rounded-2xl border-[3px] border-ink bg-white p-5 shadow-[6px_6px_0_#141414] md:p-7">
            <div className="flex items-center gap-2 border-b-2 border-ink pb-4"><Timer size={22} className="text-coral" /><h2 className="font-display text-xl font-bold">Speaking Drill Timer</h2></div>
            <div className="flex flex-wrap gap-2 pt-4">
              {(Object.keys(prompts) as Category[]).map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`pill-button ${category === item ? 'bg-yellow' : 'bg-paper'}`}>{item}</button>)}
            </div>
            <div className="flex gap-2 pt-3">{[60, 120, 180].map((seconds) => <button key={seconds} onClick={() => chooseDuration(seconds)} className={`pill-button font-mono text-xs ${duration === seconds ? 'bg-yellow' : 'bg-paper'}`}>{seconds / 60} min</button>)}</div>
            <div className="mt-5 rounded-xl border-2 border-ink bg-beige p-4 shadow-[3px_3px_0_#141414]">
              <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[10px] font-bold uppercase">{category} Topic</span><button onClick={shufflePrompt} className="flex items-center gap-1 rounded-full border border-ink bg-white px-2.5 py-1 text-[10px] font-bold"><Shuffle size={12} /> New topic</button></div>
              <p className="text-sm leading-5">“{prompt}”</p>
            </div>
            <div className="my-6 flex flex-col items-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 140 140"><circle cx="70" cy="70" r="58" fill="none" stroke="#ece8dc" strokeWidth="10" /><circle cx="70" cy="70" r="58" fill="none" stroke="#f0cf5e" strokeWidth="10" strokeLinecap="round" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - timerProgress)} /></svg>
                <div className="text-center"><div className="font-mono text-3xl font-bold">{formatTime(remaining)}</div><div className="text-[10px] font-bold uppercase text-muted">{remaining === 0 ? 'Done!' : isTimerRunning ? 'Speaking...' : 'Ready'}</div></div>
              </div>
              <div className={`mt-2 flex h-7 items-center gap-1 ${isTimerRunning ? 'opacity-100' : 'opacity-40'}`}>{[8, 16, 24, 12, 20, 28, 12, 20, 8].map((height, index) => <span key={index} className="w-1 rounded-full bg-ink" style={{ height: isTimerRunning ? `${8 + ((audioSeconds + index * 7) % 22)}px` : `${height}px` }} />)}</div>
            </div>
            <div className="flex justify-center gap-3"><button onClick={toggleTimer} className="tactile-button flex items-center gap-2 rounded-full bg-yellow px-6 py-3 text-sm font-bold">{isTimerRunning ? <Pause size={17} /> : <Mic size={17} />}{isTimerRunning ? 'Pause' : remaining === 0 ? 'Start Again' : 'Start Speaking'}</button><button onClick={resetTimer} aria-label="Reset timer" className="tactile-button rounded-full bg-paper p-3"><RefreshCw size={18} /></button></div>
          </div>
        </section>

        <section id="plan" className="scroll-mt-24 py-14 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h2 className="section-title">Today's Plan</h2><p className="text-sm text-muted">35 focused minutes across 6 simple spoken rituals.</p></div><div className="w-full rounded-xl border-2 border-ink bg-white p-3 shadow-[4px_4px_0_#141414] md:w-72"><div className="mb-2 flex justify-between font-mono text-[10px] font-bold"><span>{completed.length} / 6 COMPLETED</span><span className="text-coral">{progress}%</span></div><div className="h-3 rounded-full border border-ink bg-beige p-0.5"><div className="h-full rounded-full bg-yellow transition-all" style={{ width: `${progress}%` }} /></div></div></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(({ id, minutes, title, icon: Icon, color }) => {
              const done = completed.includes(id);
              return (
                <article key={id} className={`task-card ${color} text-black ${done ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-black">{minutes} mins</span>
                      <h3 className="mt-1 font-display text-lg font-bold leading-tight text-black">{title}</h3>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white text-ink shadow-[2px_2px_0_#141414]">
                      <Icon size={21} />
                    </span>
                  </div>
                  <button onClick={() => toggleTask(id)} className="mt-8 ml-auto flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 text-xs font-bold text-ink shadow-[2px_2px_0_#141414]">
                    {done ? <Check size={15} /> : <Circle size={15} />}
                    {done ? 'Done!' : 'Mark Done'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section id="streak" className="grid scroll-mt-24 gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="rounded-2xl border-[3px] border-ink bg-hotpink p-6 text-white shadow-[6px_6px_0_#141414] md:p-8"><div className="flex items-center gap-2 font-display text-xl font-bold"><Sparkles size={21} /> Consistency Streak</div><div className="my-6 flex flex-wrap items-center gap-3"><span className="rounded-xl border-2 border-ink bg-white px-4 py-2 font-mono text-2xl font-bold text-ink shadow-[4px_4px_0_#141414]">{streak} DAYS</span><span className="text-sm">Keep today's practice moving!</span></div><div className="grid grid-cols-7 gap-2 border-t border-white/40 pt-5">{[...streakDays, 'TODAY', 'S'].map((day, index) => <div key={`${day}-${index}`} className="flex flex-col items-center gap-2 text-center"><span className="font-mono text-[9px] font-bold">{day}</span><span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink ${index === 5 ? 'bg-white text-coral' : index === 6 ? 'border-dashed border-white bg-transparent text-white' : 'bg-yellow text-ink'} shadow-[2px_2px_0_#141414]`}>{index === 6 ? '—' : index === 5 ? <Circle size={15} /> : <Star size={16} fill="currentColor" />}</span></div>)}</div></div>
          <div id="word" className="scroll-mt-24 rounded-2xl border-[3px] border-ink bg-white p-6 shadow-[6px_6px_0_#141414] md:p-8"><div className="flex items-center justify-between border-b-2 border-ink pb-4"><h2 className="font-display text-xl font-bold">Word of the Day</h2><button onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance('Salient'))} className="pill-button bg-lilac"><Volume2 size={15} /> Listen</button></div><div className="pt-5"><h3 className="font-display text-4xl font-extrabold">Salient</h3><p className="font-mono text-xs text-muted">/ˈseɪ.li.ənt/ · Adjective</p></div><p className="mt-4 rounded-xl border-2 border-ink bg-beige p-4 text-sm leading-5">Most noticeable, prominent, or of central importance in a given context.</p><p className="mt-4 rounded-xl border-2 border-ink bg-[#fff9b8] p-4 font-handwriting text-xl leading-6 shadow-[2px_2px_0_#141414]">“The most salient point of his argument was that consistency beats short-lived intensity.”</p><p className="mt-4 rounded-xl border-2 border-ink bg-yellow p-4 text-sm leading-5 shadow-[2px_2px_0_#141414]"><strong>Today's Challenge:</strong> Use “salient” in your afternoon conversation or team update.</p></div>
        </section>

        <section id="listen" className="scroll-mt-24 py-14 lg:py-20"><div onClick={openRelatedVideo} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openRelatedVideo(); }} role="link" tabIndex={0} className="cursor-pointer rounded-3xl border-[3px] border-ink bg-ink p-6 text-paper shadow-[8px_8px_0_#141414] transition-transform hover:-translate-y-1 md:p-10"><div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]"><div><span className="font-mono text-[10px] font-bold tracking-widest text-yellow">DAILY TECH TALK</span><h2 className="mt-2 font-display text-2xl font-bold text-white md:text-3xl">A Better Way to Learn Every Day</h2><p className="mt-2 text-sm leading-6 text-[#cfc6b0]">Tap anywhere to open a useful technology talk on YouTube and practice listening, ideas, and communication.</p><div className="mt-8"><div className="h-2 rounded-full bg-[#2e2d26]"><div className="h-full rounded-full bg-yellow transition-all" style={{ width: `${Math.max(8, audioProgress)}%` }} /></div><div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={toggleAudio} className="tactile-button flex items-center gap-2 rounded-full bg-yellow px-5 py-2.5 text-sm font-bold">{isAudioPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}{isAudioPlaying ? 'Pause' : audioSeconds >= 220 ? 'Replay' : 'Open Video'}</button><span className="font-mono text-xs text-[#cfc6b0]">{currentAudio} / 3:40</span></div><span className="flex items-center gap-1 rounded-md border border-[#4c4636] bg-[#232320] px-2 py-1 font-mono text-xs"><ExternalLink size={12} /> YouTube</span></div></div></div><div className="rounded-2xl border-2 border-paper bg-[#232320] p-4 shadow-[5px_5px_0_#faf6ea]"><div className="relative h-32 overflow-hidden rounded-xl border border-[#4c4636]"><span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-ink bg-yellow px-2 py-1 text-[10px] font-bold text-ink"><ExternalLink size={11} /> Watch related video</span><img className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxZCbyKfnV-yeadSQDvCBhUTJbNcHlDWZMEkk5BbKzM6t7YIOey36Tqy8coo2Tp9J_Av7PHYp5Uac6aJ4z70xi_W-9yaqq1p_wgECoi8V6XhSGkDy-75RpQYGyj04nIWgozVOBZCukkUR4wFx2fdcOi3hgEZzVF8hA204lwam_uDcEIyzTkblXKHigmTkI5qnkBFZ8mIJP0bjA6c4zW-4MtphqCH3auiGnvMeCnHIC1VOroYjtBUn94w" alt="Analog audio equipment and notebook" /><div className="absolute inset-0 flex items-center justify-center bg-ink/30"><span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-yellow text-ink shadow-[3px_3px_0_#141414]"><Headphones size={23} /></span></div></div><div className="mt-4 flex h-8 items-end justify-between gap-2">{[12, 28, 20, 32, 16, 24, 28, 12, 20].map((height, index) => <span key={index} className="w-2 rounded bg-lilac" style={{ height: `${isAudioPlaying ? 8 + ((audioSeconds + index * 5) % 25) : height}px` }} />)}</div></div></div></div></section>

        <section className="py-14 lg:py-20"><div className="mx-auto mb-10 max-w-xl text-center"><h2 className="section-title">How Muse Works</h2><p className="mt-2 text-sm text-muted">Three mechanical steps every day. Zero anxiety about what to study.</p></div><div className="grid gap-5 md:grid-cols-3">{[['01', 'Open', 'One daily plan generated every morning.', 'bg-yellow'], ['02', 'Do', '35 guided minutes of spoken practice and audio mimicry.', 'bg-lilac'], ['03', 'Done', 'Lock in the streak and get on with your day.', 'bg-green']].map(([number, title, text, badge]) => <article key={number} className="rounded-2xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_#141414]"><span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink ${badge} font-mono text-xs font-bold shadow-[2px_2px_0_#141414]`}>{number}</span><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-5 text-muted">{text}</p></article>)}</div></section>
      </main>

      <footer className="bg-ink px-4 py-8 text-paper md:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-2 font-display font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper bg-yellow text-ink"><Mic size={16} /></span>Muse</div><div className="text-xs text-[#cfc6b0]">© 2025 Muse. Built with tactile papercraft.</div><div className="font-mono text-[9px] font-bold tracking-widest text-yellow">READY TO LEARN <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow" /></div></div></footer>

      {showSignIn && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-2xl border-[3px] border-ink bg-white p-7 shadow-[8px_8px_0_#141414]"><button onClick={() => { setShowSignIn(false); setEmailSent(false); }} aria-label="Close sign in" className="absolute right-4 top-4 rounded-full border-2 border-ink bg-paper p-1.5"><X size={16} /></button><div className="mx-auto mb-6 max-w-xs text-center"><span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-yellow shadow-[3px_3px_0_#141414]"><Mic size={22} /></span><h2 className="font-display text-2xl font-bold">Keep Your Practice Sync</h2><p className="mt-2 text-sm text-muted">Enter your email to sync progress seamlessly.</p></div>{emailSent ? <div className="rounded-xl border-2 border-ink bg-green p-4 text-center text-sm font-bold">Your sign-in link is on its way.</div> : <form onSubmit={(event) => { event.preventDefault(); setEmailSent(true); }} className="space-y-4"><label className="block text-xs font-bold">Email Address<input required type="email" placeholder="you@practice.com" className="mt-2 w-full rounded-xl border-2 border-ink bg-beige px-4 py-3 text-sm outline-none focus:bg-white" /></label><button className="tactile-button w-full rounded-full bg-yellow py-3 text-sm font-bold">Send Sign-in Link</button></form>}</div></div>}
    </div>
  );
}

export default App;
