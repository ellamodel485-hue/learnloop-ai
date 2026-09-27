import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Film,
  Layers3,
  Lightbulb,
  LoaderCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Video = {
  id: string;
  title: string;
  source: string;
  duration: string;
  level: string;
  description: string;
  timestamps: { time: string; label: string }[];
  colors: string;
};

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  hint: string;
};

type ReviewStatus = 'known' | 'review';

interface VideoSearchAdapter {
  search(topic: string): Promise<Video[]>;
}

// Integration seam: replace this adapter with the future Oriane video search adapter.
const mockVideoSearchAdapter: VideoSearchAdapter = {
  search: async () => {
    await new Promise((resolve) => setTimeout(resolve, 950));
    return [
      {
        id: 'photosynthesis-101',
        title: 'Photosynthesis: the elegant 3-step story',
        source: 'Crash Course Biology',
        duration: '08:42',
        level: 'Foundations',
        description:
          'A visual tour of how light becomes stored chemical energy — no textbook fog required.',
        timestamps: [
          { time: '00:48', label: 'The big picture' },
          { time: '03:12', label: 'Light reactions' },
          { time: '06:05', label: 'Building sugar' },
        ],
        colors: 'from-[#315c65] via-[#438c78] to-[#e7bd55]',
      },
      {
        id: 'inside-the-chloroplast',
        title: 'Inside a chloroplast',
        source: 'Amoeba Sisters',
        duration: '06:18',
        level: 'Visual explainer',
        description:
          'Zoom in on the tiny green rooms where plants turn sunlight into sugar.',
        timestamps: [
          { time: '00:32', label: 'Chloroplast tour' },
          { time: '02:20', label: 'Thylakoids' },
        ],
        colors: 'from-[#342a57] via-[#7162a8] to-[#dfa36e]',
      },
      {
        id: 'light-reactions',
        title: 'Light-dependent reactions, slowly explained',
        source: 'Science Simplified',
        duration: '11:05',
        level: 'Deep dive',
        description:
          'Follow electrons, ATP, and NADPH through the first half of the process.',
        timestamps: [
          { time: '01:16', label: 'Electron flow' },
          { time: '04:50', label: 'ATP + NADPH' },
          { time: '08:24', label: 'Why it matters' },
        ],
        colors: 'from-[#8f4f4e] via-[#d37b5c] to-[#f2cf83]',
      },
    ];
  },
};

const learningPoints = [
  {
    number: '01',
    title: 'Catch the light',
    body: 'Chlorophyll absorbs light energy in the thylakoid membranes of a chloroplast.',
    tint: 'bg-[#e9e5fb] text-[#494183]',
  },
  {
    number: '02',
    title: 'Charge the battery',
    body: 'That energy makes ATP and NADPH — temporary energy carriers for the next move.',
    tint: 'bg-[#f8e4aa] text-[#735817]',
  },
  {
    number: '03',
    title: 'Build the sugar',
    body: 'The Calvin cycle uses those carriers to assemble carbon dioxide into glucose.',
    tint: 'bg-[#d8eee5] text-[#2c6255]',
  },
];

const flashcards: Flashcard[] = [
  {
    id: 'what-is-input',
    question: 'What are the two main inputs plants need for photosynthesis?',
    answer: 'Light energy and carbon dioxide, with water as a crucial co-input.',
    hint: 'One comes from the sun. One comes from the air.',
  },
  {
    id: 'where-it-happens',
    question: 'Where does photosynthesis happen inside a plant cell?',
    answer: 'Inside chloroplasts. Light reactions happen in thylakoid membranes; the Calvin cycle happens in the stroma.',
    hint: 'Think: the cell has a dedicated solar workshop.',
  },
  {
    id: 'energy-carriers',
    question: 'What do ATP and NADPH do in photosynthesis?',
    answer: 'They carry energy and high-energy electrons from the light reactions to power sugar-building in the Calvin cycle.',
    hint: 'They are not the finished food — they are the charged tools.',
  },
  {
    id: 'big-picture',
    question: 'In one sentence, what is photosynthesis?',
    answer: 'It is the process plants use to convert light energy, water, and carbon dioxide into glucose and oxygen.',
    hint: 'Complete the loop: light in, stored food out.',
  },
];

const steps = [
  { key: 'search', label: 'Search topic', icon: Search },
  { key: 'find', label: 'Find videos', icon: Film },
  { key: 'learn', label: 'Learn', icon: BookOpen },
  { key: 'generate', label: 'Make cards', icon: Sparkles },
  { key: 'review', label: 'Review', icon: BrainCircuit },
];

function AppLogo() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-learnloop">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f7c84b] text-[#2e2347] shadow-[4px_4px_0_hsl(256_25%_17%/.16)]">
        <div className="absolute h-5 w-5 rounded-full border-[3px] border-[#2e2347] border-t-transparent rotate-45" />
        <div className="absolute h-1.5 w-1.5 rounded-full bg-[#2e2347] translate-x-1.5 -translate-y-1.5" />
      </div>
      <div>
        <div className="font-serif text-[21px] font-bold tracking-[-0.04em] text-[hsl(var(--foreground))]">
          LearnLoop
        </div>
        <div className="-mt-1 font-mono text-[9px] uppercase tracking-[0.19em] text-[hsl(var(--muted-foreground))]">
          Your next clear step
        </div>
      </div>
    </div>
  );
}

function TopProgress({
  activeStep,
  completed,
}: {
  activeStep: number;
  completed: Set<string>;
}) {
  return (
    <div className="flex min-w-[620px] items-center gap-1" data-testid="progress-loop">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isComplete = completed.has(step.key);
        const isActive = activeStep === index;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <div
              className={`flex items-center gap-2 rounded-full px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                isComplete
                  ? 'text-[#2c6b61]'
                  : isActive
                    ? 'bg-[#ebe7fb] text-[#4c438b]'
                    : 'text-[hsl(var(--muted-foreground))]'
              }`}
              data-testid={`step-${step.key}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isComplete
                    ? 'bg-[#d8eee5]'
                    : isActive
                      ? 'bg-[#5148a8] text-[#fbf8f0]'
                      : 'bg-[hsl(var(--muted))]'
                }`}
              >
                {isComplete ? <Check size={13} strokeWidth={3} /> : <Icon size={12} />}
              </span>
              <span className="hidden xl:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-px flex-1 ${isComplete ? 'bg-[#8bc4ae]' : 'bg-[hsl(var(--border))]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function VideoArtwork({ video, compact = false }: { video: Video; compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${video.colors} ${
        compact ? 'h-[112px] w-[178px] shrink-0' : 'aspect-video w-full'
      }`}
    >
      <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px] border-[#f7c84b]/30" />
      <div className="absolute bottom-[-28px] left-[-15px] h-28 w-28 rounded-full border-[12px] border-[#f8f2e8]/20" />
      <div className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#fbf8f0]/75">
        learning film / 2024
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fbf8f0]/90 text-[#2e2347] shadow-lg transition-transform group-hover:scale-110">
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </div>
      </div>
      <div className="absolute bottom-3 right-3 rounded-md bg-[#2e2347]/75 px-2 py-1 font-mono text-[10px] text-[#fbf8f0]">
        {video.duration}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  selected,
  onSelect,
}: {
  video: Video;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-[hsl(var(--card))] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_-18px_hsl(256_25%_17%/.45)] ${
        selected
          ? 'border-[#5148a8] ring-2 ring-[#5148a8]/15'
          : 'border-[hsl(var(--card-border))]'
      }`}
      data-testid={`card-video-${video.id}`}
    >
      <VideoArtwork video={video} />
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
            {video.source}
          </span>
          <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
            {video.level}
          </span>
        </div>
        <h3 className="font-serif text-[21px] leading-[1.08] tracking-[-0.03em] text-[hsl(var(--foreground))]">
          {video.title}
        </h3>
        <p className="mt-2 min-h-[42px] text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">
          {video.description}
        </p>
        {video.timestamps.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Video chapters">
            {video.timestamps.map((timestamp) => (
              <span
                key={`${video.id}-${timestamp.time}`}
                className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 font-mono text-[9px] font-medium text-[hsl(var(--muted-foreground))]"
              >
                {timestamp.time} <span className="font-sans">{timestamp.label}</span>
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onSelect}
          className={`mt-4 flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[12px] font-bold transition-all ${
            selected
              ? 'bg-[#5148a8] text-[#fbf8f0]'
              : 'bg-[#f0ece3] text-[#2e2347] hover:bg-[#e8e1d5]'
          }`}
          data-testid={`button-select-video-${video.id}`}
        >
          <span>{selected ? 'Selected for your loop' : 'Learn from this'}</span>
          {selected ? <Check size={15} /> : <ArrowRight size={15} />}
        </button>
      </div>
    </article>
  );
}

function SkeletonVideo() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid="skeleton-video">
      <div className="h-[168px] animate-pulse bg-[hsl(var(--muted))]" />
      <div className="space-y-3 p-4">
        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
        <div className="h-6 w-4/5 animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-[hsl(var(--muted))]" />
      </div>
    </div>
  );
}

function LoopRail({
  activeStep,
  reviewedCount,
  totalCards,
}: {
  activeStep: number;
  reviewedCount: number;
  totalCards: number;
}) {
  const railCopy = [
    ['Start with a question', 'A good topic is a door, not a destination.'],
    ['Pick one perspective', 'Short, clear, and made for this exact moment.'],
    ['Give it your attention', 'One focused watch beats ten open tabs.'],
    ['Make it yours', 'Turn the big idea into small, retrievable clues.'],
    ['Strengthen the memory', 'A little recall now saves a lot of cramming later.'],
  ];
  return (
    <aside className="hidden w-[252px] shrink-0 lg:block" data-testid="loop-rail">
      <div className="sticky top-7 rounded-[22px] border border-[#494183]/20 bg-[#ebe7fb] p-5">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5148a8]">
            The learning loop
          </div>
          <Zap size={15} className="text-[#d58e2e]" />
        </div>
        <p className="mt-3 font-serif text-[22px] leading-tight tracking-[-0.03em] text-[#2e2347]">
          Keep the next step small.
        </p>
        <div className="mt-6 space-y-1">
          {railCopy.map(([title, copy], index) => {
            const isActive = activeStep === index;
            const isComplete = index < activeStep;
            return (
              <div key={title} className="relative flex gap-3 pb-4 last:pb-0">
                {index < railCopy.length - 1 && (
                  <div className={`absolute left-[11px] top-7 h-[calc(100%-12px)] w-px ${isComplete ? 'bg-[#8c83c9]' : 'bg-[#c8c2e7]'}`} />
                )}
                <div
                  className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    isComplete
                      ? 'border-[#5148a8] bg-[#5148a8] text-[#fbf8f0]'
                      : isActive
                        ? 'border-[#5148a8] bg-[#f7c84b] text-[#2e2347]'
                        : 'border-[#c8c2e7] bg-[#ebe7fb] text-[#8078af]'
                  }`}
                >
                  {isComplete ? <Check size={12} strokeWidth={3} /> : index + 1}
                </div>
                <div className="pt-0.5">
                  <div className={`text-[12px] font-bold ${isActive ? 'text-[#2e2347]' : 'text-[#615b83]'}`}>
                    {title}
                  </div>
                  {isActive && <div className="mt-1 text-[11px] leading-snug text-[#716b91]">{copy}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {totalCards > 0 && (
          <div className="mt-5 border-t border-[#c8c2e7] pt-4">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5148a8]">
              <span>Loop progress</span>
              <span>{reviewedCount}/{totalCards}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#d8d3ee]">
              <div
                className="h-full rounded-full bg-[#5148a8] transition-all duration-500"
                style={{ width: `${(reviewedCount / totalCards) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <CircleHelp size={18} className="text-[#d58e2e]" />
        <div className="mt-3 font-serif text-[18px] leading-tight tracking-[-0.02em]">No pressure, just progress.</div>
        <p className="mt-2 text-[12px] leading-relaxed text-[hsl(var(--muted-foreground))]">
          You can pause after any step. Your brain likes a clear stopping point too.
        </p>
      </div>
    </aside>
  );
}

function Home() {
  const [topic, setTopic] = useState('How does photosynthesis work?');
  const [searchedTopic, setSearchedTopic] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewStatus>>({});
  const [lastAction, setLastAction] = useState<ReviewStatus | null>(null);

  const reviewedCount = Object.keys(reviewStatuses).length;
  const currentCard = flashcards[activeCard];
  const activeStep = !searchedTopic
    ? 0
    : !selectedVideo
      ? 1
      : !lessonStarted
        ? 2
        : !cardsReady
          ? 3
          : 4;
  const completed = useMemo(() => {
    const items = new Set<string>();
    if (searchedTopic) items.add('search');
    if (selectedVideo) items.add('find');
    if (lessonStarted) items.add('learn');
    if (cardsReady) items.add('generate');
    if (reviewedCount > 0) items.add('review');
    return items;
  }, [searchedTopic, selectedVideo, lessonStarted, cardsReady, reviewedCount]);

  const runSearch = async () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic || isSearching) return;
    setIsSearching(true);
    setSearchError('');
    setSearchedTopic(cleanTopic);
    setSelectedVideo(null);
    setLessonStarted(false);
    setCardsReady(false);
    setReviewStatuses({});
    setActiveCard(0);
    try {
      const result = await mockVideoSearchAdapter.search(cleanTopic);
      setVideos(result);
    } catch {
      setSearchError('The search paused before it found a trail. Try once more.');
      setVideos([]);
    } finally {
      setIsSearching(false);
    }
  };

  const generateCards = () => {
    if (!lessonStarted || isGenerating) return;
    setIsGenerating(true);
    window.setTimeout(() => {
      setCardsReady(true);
      setIsGenerating(false);
      setActiveCard(0);
      setRevealed(false);
    }, 900);
  };

  const markCard = (status: ReviewStatus) => {
    if (!currentCard || !revealed) return;
    setReviewStatuses((previous) => ({ ...previous, [currentCard.id]: status }));
    setLastAction(status);
    window.setTimeout(() => {
      setLastAction(null);
      if (activeCard < flashcards.length - 1) {
        setActiveCard((index) => index + 1);
        setRevealed(false);
      }
    }, 480);
  };

  const resetLoop = () => {
    setSearchedTopic('');
    setVideos([]);
    setSelectedVideo(null);
    setLessonStarted(false);
    setCardsReady(false);
    setReviewStatuses({});
    setRevealed(false);
    setActiveCard(0);
    setTopic('How does photosynthesis work?');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedVideo) {
      window.setTimeout(() => {
        document.getElementById('learn-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [selectedVideo]);

  return (
    <div className="grain min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-5 py-4 lg:px-10">
          <AppLogo />
          <TopProgress activeStep={activeStep} completed={completed} />
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.17em] text-[hsl(var(--muted-foreground))]">Today</div>
              <div className="text-[12px] font-bold">1 focused loop</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2e2347] font-serif text-[14px] font-bold text-[#f7c84b]">
              AO
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-8 lg:px-10 lg:pt-12">
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <section className="reveal mb-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div>
                <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#5148a8]">
                  <span className="pulse-dot h-2 w-2 rounded-full bg-[#ef6a50]" />
                  A gentler way to begin
                </div>
                <h1 className="max-w-[650px] font-serif text-[clamp(3.15rem,7vw,6.3rem)] font-semibold leading-[.91] tracking-[-0.065em] text-[#2e2347]">
                  Learn one thing.
                  <span className="block text-[#5148a8]">Keep the spark.</span>
                </h1>
                <p className="mt-5 max-w-[510px] text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Start with a question. We&apos;ll help you find a clear explanation, pull out what matters, and practice until it sticks.
                </p>
              </div>
              <div className="relative hidden min-h-[160px] overflow-hidden rounded-[24px] bg-[#2e2347] p-6 lg:block">
                <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full border-[24px] border-[#f7c84b]/20" />
                <div className="absolute -bottom-12 left-14 h-32 w-32 rounded-full bg-[#ef6a50]/80 blur-[1px]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d6d0ec]">The small promise</div>
                  <div className="max-w-[230px] font-serif text-[27px] leading-[1.03] tracking-[-0.04em] text-[#fbf8f0]">
                    No blank page.
                    <br />
                    Just the next move.
                  </div>
                </div>
              </div>
            </section>

            <section className="reveal reveal-delay-1 rounded-[24px] border border-[#5148a8]/20 bg-[#ebe7fb] p-4 shadow-[0_18px_30px_-26px_hsl(256_25%_17%/.65)] sm:p-5" data-testid="search-panel">
              <div className="mb-3 flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#494183]">
                  <Search size={15} />
                  <span>{searchedTopic ? 'Explore another topic' : 'What are you curious about?'}</span>
                </div>
                <div className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#8178a9] sm:flex">
                  <Timer size={12} />
                  10–15 min loop
                </div>
              </div>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void runSearch();
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#c8c2e7] bg-[#f9f7f0] px-4 py-3.5 transition-colors focus-within:border-[#5148a8] focus-within:ring-2 focus-within:ring-[#5148a8]/10">
                  <span className="font-mono text-[11px] text-[#9b93be]">ask /</span>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Why do leaves change color?"
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#2e2347] outline-none placeholder:text-[#9d98ad]"
                    data-testid="input-topic"
                  />
                  {topic && (
                    <button
                      type="button"
                      onClick={() => setTopic('')}
                      className="rounded-full p-1 text-[#8279aa] hover:bg-[#ebe7fb] hover:text-[#5148a8]"
                      aria-label="Clear topic"
                      data-testid="button-clear-topic"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!topic.trim() || isSearching}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#5148a8] px-5 py-3.5 text-[13px] font-bold text-[#fbf8f0] shadow-[0_5px_0_#37316f] transition-all hover:-translate-y-0.5 hover:bg-[#5c53b8] hover:shadow-[0_7px_0_#37316f] active:translate-y-0.5 active:shadow-[0_3px_0_#37316f] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                  data-testid="button-search-topic"
                >
                  {isSearching ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isSearching ? 'Finding your trail…' : 'Start the loop'}
                </button>
              </form>
              {!searchedTopic && (
                <div className="mt-4 flex flex-wrap items-center gap-2 px-1">
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8178a9]">Try a doorway</span>
                  {['Why do leaves change color?', 'How do black holes work?', 'The story of jazz'].map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => setTopic(suggestion)}
                      className="rounded-full border border-[#c8c2e7] bg-[#f9f7f0]/70 px-3 py-1.5 text-[11px] font-medium text-[#615b83] transition-colors hover:border-[#5148a8] hover:text-[#5148a8]"
                      data-testid={`button-suggestion-${suggestion.slice(0, 8).replaceAll(' ', '-')}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {isSearching && (
              <section className="reveal mt-10" data-testid="search-loading">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5148a8]">Finding your trail</div>
                    <h2 className="mt-1 font-serif text-[31px] tracking-[-0.04em]">Looking for a good first explanation.</h2>
                  </div>
                  <div className="hidden items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] sm:flex">
                    <span className="pulse-dot h-2 w-2 rounded-full bg-[#ef6a50]" /> searching the library
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <SkeletonVideo />
                  <SkeletonVideo />
                  <SkeletonVideo />
                </div>
              </section>
            )}

            {!isSearching && searchError && (
              <div className="reveal mt-10 flex items-center justify-between gap-4 rounded-2xl border border-[#ef6a50]/25 bg-[#fbe8e1] p-5" data-testid="status-search-error">
                <div>
                  <div className="font-bold text-[#8c4132]">A tiny detour.</div>
                  <p className="mt-1 text-[13px] text-[#9b5a4c]">{searchError}</p>
                </div>
                <button type="button" onClick={() => void runSearch()} className="flex items-center gap-2 rounded-xl bg-[#ef6a50] px-3 py-2 text-[12px] font-bold text-[#fbf8f0]" data-testid="button-retry-search">
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            )}

            {!isSearching && searchedTopic && videos.length > 0 && (
              <section className="reveal mt-10" data-testid="video-results">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5148a8]">01 / Find videos</div>
                    <h2 className="mt-1 font-serif text-[clamp(2rem,4vw,2.8rem)] tracking-[-0.05em]">A few ways into it.</h2>
                    <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">Pick the explanation that feels easiest to enter.</p>
                  </div>
                  <div className="rounded-full bg-[#d8eee5] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#2c6255]">
                    {videos.length} good starting points
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {videos.map((video, index) => (
                    <div key={video.id} className={`reveal reveal-delay-${index + 1}`}>
                      <VideoCard video={video} selected={selectedVideo?.id === video.id} onSelect={() => setSelectedVideo(video)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isSearching && !searchedTopic && (
              <section className="reveal reveal-delay-2 mt-12 grid gap-5 md:grid-cols-[1fr_.8fr]" data-testid="empty-start-state">
                <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8">
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-[#f8e4aa] p-2.5 text-[#735817]"><Lightbulb size={19} /></div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">A note for starting</span>
                  </div>
                  <h2 className="mt-8 max-w-[440px] font-serif text-[32px] leading-[1.03] tracking-[-0.05em]">You don&apos;t need the whole map.</h2>
                  <p className="mt-3 max-w-[410px] text-[14px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                    One honest question is enough. LearnLoop will turn it into a short, satisfying path you can actually finish.
                  </p>
                  <div className="mt-8 flex items-center gap-3 text-[12px] font-bold text-[#5148a8]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebe7fb]">1</span>
                    <span>Ask what you really want to know</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[24px] bg-[#d8eee5] p-6">
                  <div className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full border-[22px] border-[#2c6b61]/15" />
                  <div className="relative flex h-full min-h-[220px] flex-col justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2c6255]">Your loop, in five moves</div>
                    <div className="space-y-2 text-[15px] font-bold text-[#28564d]">
                      {['Search a question', 'Choose a video', 'Catch the main idea', 'Make it memorable', 'See what stuck'].map((item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-[#579082]">0{index + 1}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedVideo && (
              <section id="learn-section" className="reveal mt-12 scroll-mt-8" data-testid="learning-section">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5148a8]">02 / Learn</div>
                    <h2 className="mt-1 font-serif text-[clamp(2rem,4vw,2.8rem)] tracking-[-0.05em]">Stay with one idea.</h2>
                  </div>
                  <span className="hidden rounded-full bg-[#f8e4aa] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#735817] sm:block">
                    {selectedVideo.duration} to watch
                  </span>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_18px_36px_-30px_hsl(256_25%_17%/.7)]">
                  <div className="grid lg:grid-cols-[1.05fr_.95fr]">
                    <div className="relative min-h-[280px] bg-[#2e2347] p-5 sm:p-7">
                      <div className="absolute inset-0 opacity-50">
                        <div className="absolute right-[-10%] top-[-20%] h-72 w-72 rounded-full border-[42px] border-[#5148a8]" />
                        <div className="absolute bottom-[-35%] left-[-4%] h-72 w-72 rounded-full border-[36px] border-[#ef6a50]" />
                      </div>
                      <div className="relative flex h-full min-h-[248px] flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d6d0ec]">{selectedVideo.source}</span>
                          <span className="rounded-full bg-[#fbf8f0]/10 px-2.5 py-1 font-mono text-[10px] text-[#d6d0ec]">selected</span>
                        </div>
                        <div>
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7c84b] text-[#2e2347] shadow-[0_0_0_8px_hsl(44_94%_60%/.15)]">
                            <Play size={24} fill="currentColor" className="ml-1" />
                          </div>
                          <h3 className="max-w-[390px] font-serif text-[28px] leading-[1.05] tracking-[-0.04em] text-[#fbf8f0]">{selectedVideo.title}</h3>
                          <button
                            type="button"
                            onClick={() => setLessonStarted(true)}
                            className="mt-5 flex items-center gap-2 rounded-xl bg-[#fbf8f0] px-4 py-2.5 text-[12px] font-bold text-[#2e2347] transition-transform hover:-translate-y-0.5"
                            data-testid="button-start-lesson"
                          >
                            {lessonStarted ? <Check size={15} /> : <Play size={15} fill="currentColor" />}
                            {lessonStarted ? 'Lesson marked complete' : 'Begin focused lesson'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5148a8]">What to notice</div>
                        <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">3 points</span>
                      </div>
                      <div className="mt-5 space-y-4">
                        {learningPoints.map((point) => (
                          <div key={point.number} className="flex gap-3" data-testid={`learning-point-${point.number}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${point.tint}`}>{point.number}</span>
                            <div>
                              <div className="text-[13px] font-bold">{point.title}</div>
                              <p className="mt-1 text-[12px] leading-relaxed text-[hsl(var(--muted-foreground))]">{point.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`mt-6 rounded-xl p-3.5 text-[12px] leading-relaxed ${lessonStarted ? 'bg-[#d8eee5] text-[#2c6255]' : 'bg-[#f0ece3] text-[hsl(var(--muted-foreground))]'}`}>
                        {lessonStarted ? (
                          <span className="flex items-center gap-2 font-bold"><CheckCircle2 size={15} /> Nice. You watched for the structure, not every detail.</span>
                        ) : (
                          <span className="flex items-center gap-2"><Clock3 size={15} /> Watch once, then come back here for the short version.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedVideo && lessonStarted && (
              <section className="reveal mt-12" data-testid="flashcard-generation-section">
                <div className="rounded-[24px] border border-[#ef6a50]/20 bg-[#fbe8e1] p-5 sm:p-7">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a34e3f]">03 / Generate flashcards</div>
                      <h2 className="mt-1 font-serif text-[clamp(2rem,4vw,2.8rem)] tracking-[-0.05em] text-[#512e2b]">Make the idea retrievable.</h2>
                      <p className="mt-2 max-w-[550px] text-[13px] leading-relaxed text-[#94564b]">We&apos;ll turn the lesson into four small questions. No busywork, just a better way to see what stayed.</p>
                    </div>
                    {!cardsReady && (
                      <button
                        type="button"
                        onClick={generateCards}
                        disabled={isGenerating}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ef6a50] px-4 py-3 text-[12px] font-bold text-[#fbf8f0] shadow-[0_4px_0_#ad4d40] transition-all hover:-translate-y-0.5 hover:bg-[#f17860] disabled:cursor-wait disabled:opacity-70"
                        data-testid="button-generate-flashcards"
                      >
                        {isGenerating ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        {isGenerating ? 'Writing your cards…' : 'Generate flashcards'}
                      </button>
                    )}
                    {cardsReady && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#d8eee5] px-4 py-3 text-[12px] font-bold text-[#2c6255]" data-testid="status-cards-ready">
                        <CheckCircle2 size={16} /> 4 cards ready
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {cardsReady && (
              <section className="reveal mt-12" data-testid="review-section">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5148a8]">04 / Review</div>
                    <h2 className="mt-1 font-serif text-[clamp(2rem,4vw,2.8rem)] tracking-[-0.05em]">Let&apos;s see what stuck.</h2>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">card</div>
                    <div className="font-serif text-[22px] tracking-[-0.04em]"><span className="text-[#5148a8]">{Math.min(activeCard + 1, flashcards.length)}</span> / {flashcards.length}</div>
                  </div>
                </div>

                {reviewedCount === flashcards.length ? (
                  <div className="card-pop relative overflow-hidden rounded-[24px] bg-[#2e2347] p-7 text-[#fbf8f0] sm:p-10" data-testid="review-complete">
                    <div className="absolute -right-8 -top-14 h-44 w-44 rounded-full border-[22px] border-[#f7c84b]/25" />
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7c84b] text-[#2e2347]"><Check size={24} strokeWidth={3} /></div>
                      <div className="mt-7 max-w-[600px] font-serif text-[clamp(2.2rem,5vw,4rem)] leading-[.95] tracking-[-0.06em]">That&apos;s a loop worth keeping.</div>
                      <p className="mt-4 max-w-[470px] text-[14px] leading-relaxed text-[#d6d0ec]">You gave {searchedTopic || 'this idea'} a place to land. Come back tomorrow and see what got stronger.</p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <button type="button" onClick={resetLoop} className="flex items-center gap-2 rounded-xl bg-[#f7c84b] px-4 py-3 text-[12px] font-bold text-[#2e2347] transition-transform hover:-translate-y-0.5" data-testid="button-start-new-loop">
                          <RotateCcw size={15} /> Start another loop
                        </button>
                        <div className="flex items-center gap-2 rounded-xl border border-[#615a85] px-4 py-3 text-[12px] font-bold text-[#d6d0ec]">
                          <Zap size={15} /> {flashcards.length} memories strengthened
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-[1fr_.65fr]">
                    <div className={`card-pop relative min-h-[310px] overflow-hidden rounded-[24px] border border-[#5148a8]/25 bg-[#ebe7fb] p-6 sm:p-8 ${lastAction ? 'ring-2 ring-[#f7c84b]' : ''}`} data-testid={`flashcard-${currentCard.id}`}>
                      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-[#5148a8]/10" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-[#d8d3ee] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#625b8b]">Recall card</span>
                          <span className="font-mono text-[10px] text-[#8178a9]">{currentCard.id === 'what-is-input' ? 'core idea' : 'keep going'}</span>
                        </div>
                        <div className="py-9">
                          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#71699e]">{revealed ? 'The short answer' : 'Your turn'}</div>
                          <div className="max-w-[610px] font-serif text-[clamp(1.8rem,4vw,3rem)] leading-[1.02] tracking-[-0.05em] text-[#2e2347]">
                            {revealed ? currentCard.answer : currentCard.question}
                          </div>
                          {!revealed && <p className="mt-5 text-[12px] italic text-[#71699e]">Hint: {currentCard.hint}</p>}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {!revealed ? (
                            <button type="button" onClick={() => setRevealed(true)} className="flex items-center gap-2 rounded-xl bg-[#5148a8] px-4 py-3 text-[12px] font-bold text-[#fbf8f0] shadow-[0_4px_0_#37316f] transition-all hover:-translate-y-0.5" data-testid="button-reveal-card">
                              Reveal answer <ArrowUpRight size={15} />
                            </button>
                          ) : (
                            <>
                              <button type="button" onClick={() => markCard('known')} className="flex items-center gap-2 rounded-xl bg-[#2c6b61] px-4 py-3 text-[12px] font-bold text-[#fbf8f0] shadow-[0_4px_0_#205248] transition-all hover:-translate-y-0.5" data-testid="button-know-card">
                                <Check size={15} /> I know this
                              </button>
                              <button type="button" onClick={() => markCard('review')} className="flex items-center gap-2 rounded-xl border border-[#d58e2e]/50 bg-[#f8e4aa] px-4 py-3 text-[12px] font-bold text-[#735817] transition-all hover:-translate-y-0.5" data-testid="button-review-card">
                                <RotateCcw size={15} /> I need to review this
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5148a8]">
                        <Layers3 size={14} /> Your memory map
                      </div>
                      <div className="mt-5 space-y-2">
                        {flashcards.map((card, index) => {
                          const status = reviewStatuses[card.id];
                          const isCurrent = index === activeCard;
                          return (
                            <button
                              type="button"
                              key={card.id}
                              onClick={() => {
                                setActiveCard(index);
                                setRevealed(Boolean(status));
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                isCurrent ? 'border-[#5148a8]/35 bg-[#ebe7fb]' : 'border-transparent hover:bg-[#f0ece3]'
                              }`}
                              data-testid={`button-jump-card-${index + 1}`}
                            >
                              <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${status === 'known' ? 'bg-[#d8eee5] text-[#2c6255]' : status === 'review' ? 'bg-[#f8e4aa] text-[#735817]' : 'bg-[#f0ece3] text-[#8a8395]'}`}>
                                {status ? (status === 'known' ? <Check size={13} /> : <RotateCcw size={12} />) : `0${index + 1}`}
                              </span>
                              <span className={`flex-1 truncate text-[12px] font-bold ${isCurrent ? 'text-[#2e2347]' : 'text-[hsl(var(--muted-foreground))]'}`}>{card.question}</span>
                              {isCurrent && <ChevronRight size={14} className="text-[#5148a8]" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-6 rounded-xl bg-[#f0ece3] p-4">
                        <div className="flex items-start gap-2.5">
                          <BookOpen size={15} className="mt-0.5 text-[#d58e2e]" />
                          <p className="text-[12px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                            The goal is not a perfect score. It&apos;s noticing which idea wants another pass.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
          <LoopRail activeStep={activeStep} reviewedCount={reviewedCount} totalCards={cardsReady ? flashcards.length : 0} />
        </div>
      </main>
      <footer className="border-t border-[hsl(var(--border))] px-5 py-6 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 text-[11px] text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center">
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ef6a50]" /> LearnLoop is a prototype learning companion.</div>
          <div className="font-mono uppercase tracking-[0.14em]">Built for curious beginnings</div>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;