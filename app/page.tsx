'use client';
import { trackUser } from '@/utils/tracking';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { CommitPulseLogo } from '@/components/commitpulse-logo';
import { CustomizeCTA } from './components/CustomizeCTA';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useTranslation } from '@/context/TranslationContext';
import { Footer } from '@/app/components/Footer';

import { FeatureCard, FeatureCardsSection } from '@/components/FeatureCards';
import { WallOfLove } from '@/components/WallOfLove';
import { DiscordButton } from '@/components/DiscordButton';

const Icons = {
  Github: () => (
    <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  ),
  Copy: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
  Zap: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z" />
    </svg>
  ),
  Box: () => <CommitPulseLogo className="h-6 w-6" />,
  Check: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10b981"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen overflow-x-hidden bg-transparent" />}>
      <LandingContent />
    </Suspense>
  );
}

const renderTitle = (title: string) => {
  const parts = title.split(/(\{.*?\})/g);
  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const word = part.slice(1, -1);
      return (
        <span
          key={index}
          className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent"
        >
          {word}
        </span>
      );
    }
    return part;
  });
};

function LandingContent() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgState, setSvgState] = useState<'idle' | 'loading' | 'loaded'>('idle');
  const guideRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const theme = searchParams?.get('theme') || 'neon';
  const { searches, addSearch, clearSearches } = useRecentSearches();
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;

  const badgeUrl = `/api/streak?user=${trimmedUsername}&theme=${theme}`;
  const markdown = `![CommitPulse](https://commitpulse.vercel.app/api/streak?user=${trimmedUsername}&theme=${theme})`;

  const [prevUsername, setPrevUsername] = useState('');
  if (trimmedUsername !== prevUsername) {
    setPrevUsername(trimmedUsername);
    setSvgContent(null);
    setSvgState(trimmedUsername ? 'loading' : 'idle');
  }

  // Fetch SVG content whenever username changes.
  // We fetch as text and render inline to avoid the browser CSP restriction
  // that blocks <img> from loading SVGs whose response has a restrictive
  // Content-Security-Policy header (default-src 'none').
  useEffect(() => {
    if (!hasUsername) return;

    const controller = new AbortController();

    fetch(badgeUrl, { signal: controller.signal })
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
        setSvgState('loaded');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setSvgState('loaded'); // show nothing rather than hang on loading
      });

    return () => controller.abort();
  }, [badgeUrl, hasUsername]);

  const copyToClipboard = () => {
    if (!hasUsername) return;

    trackUser(trimmedUsername);
    addSearch(trimmedUsername);

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => {
      guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setTimeout(() => setCopied(false), 50000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent font-sans text-black dark:text-white selection:bg-black/10 dark:selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-black/5 dark:bg-white/3 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-black/5 dark:bg-white/2 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 mt-32 pb-32">
        <div className="mb-16 text-center">
          <DiscordButton />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h1 className="mb-8 bg-gradient-to-br from-gray-900 via-black to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-500 bg-clip-text text-transparent text-5xl font-extrabold tracking-tight md:text-8xl pb-2 whitespace-pre-line leading-none">
              {renderTitle(t('landing.title'))}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-sm sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl"
          >
            {t('landing.subtitle')}
          </motion.p>
        </div>

        <section className="mx-auto mb-32 max-w-4xl">
          <div className="rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] p-4 md:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                copyToClipboard();
              }}
              className="mb-8 flex flex-col gap-4 md:flex-row"
            >
              <div className="relative flex-1 flex items-center flex-col">
                <div className="relative flex-1 flex items-center w-full">
                  <input
                    type="text"
                    suppressHydrationWarning
                    placeholder={t('landing.input_placeholder')}
                    className="flex-1 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent dark:border-white/10 dark:bg-black/60 dark:text-white dark:placeholder:text-gray-500 shadow-inner"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={39}
                  />
                  {username.length > 0 ? (
                    <button
                      onClick={() => setUsername('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-black dark:text-white/65 dark:hover:text-white"
                      aria-label={t('landing.clear_input')}
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
                {mounted && username.length === 0 && (
                  <p className="text-amber-500 text-xs mt-1 self-start pl-1">
                    {t('landing.empty_username_warning')}
                  </p>
                )}
                {username.length === 39 && (
                  <p className="text-red-500 text-xs mt-1 self-start pl-1">
                    {t('landing.max_length_warning')}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={!hasUsername}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    hasUsername
                      ? 'bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100'
                      : 'bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/35'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Check /> {t('landing.copied')}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Copy /> {t('landing.copy_link')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <Link
                  href={hasUsername ? `/dashboard/${trimmedUsername}` : '/'}
                  aria-disabled={!hasUsername}
                  onClick={(e) => {
                    if (!hasUsername) {
                      e.preventDefault();
                    } else {
                      trackUser(trimmedUsername);
                      addSearch(trimmedUsername);
                    }
                  }}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl border px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    hasUsername
                      ? 'border-black/20 bg-transparent text-black hover:bg-black/5 dark:border-[rgba(255,255,255,0.15)] dark:text-white dark:hover:bg-white/5'
                      : 'border-black/10 bg-black/[0.02] text-black/40 dark:border-[rgba(255,255,255,0.08)] dark:bg-white/[0.02] dark:text-white/35'
                  }`}
                >
                  {t('landing.watch_dashboard')}
                </Link>
              </div>
            </form>
          </div>

          {searches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 mt-3">
              <span className="text-xs text-gray-500 dark:text-[#A1A1AA]">
                {t('landing.recent')}
              </span>
              {searches.map((s) => (
                <button
                  key={s}
                  onClick={() => setUsername(s)}
                  className="rounded-full border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-gray-50 dark:bg-[#111] px-3 py-1 text-xs text-black/70 dark:text-white/70 transition-all hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.2)] hover:text-black dark:hover:text-white"
                >
                  {s}
                </button>
              ))}
              <button
                onClick={clearSearches}
                className="text-xs text-gray-500 dark:text-[#A1A1AA] underline hover:text-black dark:hover:text-white transition-colors"
              >
                {t('landing.clear')}
              </button>
            </div>
          )}

          <div className="group relative">
            <div className="absolute -inset-1 rounded-[2rem] bg-black/5 dark:bg-white/5 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100" />
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.06)] bg-gray-50 dark:bg-black p-6">
              {hasUsername ? (
                <div className="w-full flex items-center justify-center">
                  {svgState === 'loading' && (
                    <div className="h-[200px] w-full max-w-[600px] rounded-xl bg-white/5 animate-pulse" />
                  )}
                  {svgState === 'loaded' && svgContent && (
                    <div
                      className="w-full max-w-[600px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] [&>svg]:w-full [&>svg]:h-auto"
                      // Safe: SVG is generated server-side by our own trusted generator
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/[0.02] px-6 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/[0.04] text-black/60 dark:text-white/60">
                    <Icons.Github />
                  </div>
                  <p className="md:text-lg text-md font-semibold tracking-tight text-black dark:text-white">
                    {t('landing.preview_placeholder_title')}
                  </p>
                  <p className="mt-2 max-w-md text-xs xs:text-sm leading-relaxed text-[#A1A1AA]">
                    {t('landing.preview_placeholder_desc')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div ref={guideRef}>
          <AnimatePresence>
            {copied && (
              <SuccessGuide
                markdown={markdown}
                username={trimmedUsername}
                onDismiss={() => setCopied(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <CustomizeCTA />

        <FeatureCardsSection>
          <FeatureCard
            icon={<Icons.Zap />}
            accent="text-black dark:text-white"
            accentColor="#10b981"
            index={0}
            title={t('landing.features.sync_title')}
            desc={t('landing.features.sync_desc')}
          />
          <FeatureCard
            icon={<Icons.Copy />}
            accent="text-black dark:text-white"
            accentColor="#8b5cf6"
            index={1}
            title={t('landing.features.theme_title')}
            desc={t('landing.features.theme_desc')}
          />
          <FeatureCard
            icon={<Icons.Box />}
            accent="text-black dark:text-white"
            accentColor="#06b6d4"
            index={2}
            title={t('landing.features.isometric_title')}
            desc={t('landing.features.isometric_desc')}
          />
        </FeatureCardsSection>

        <WallOfLove />

        <Footer />
      </main>
    </div>
  );
}

function SuccessGuide({
  markdown,
  username,
  onDismiss,
}: {
  markdown: string;
  username: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const steps = [
    {
      n: '01',
      title: t('success_guide.step_1_title'),
      body: t('success_guide.step_1_body'),
    },
    {
      n: '02',
      title: t('success_guide.step_2_title'),
      body: t('success_guide.step_2_body'),
    },
    {
      n: '03',
      title: t('success_guide.step_3_title'),
      body: t('success_guide.step_3_body'),
    },
    {
      n: '04',
      title: t('success_guide.step_4_title'),
      body: t('success_guide.step_4_body'),
    },
  ];

  return (
    <motion.div
      key="success-guide"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="mx-auto mb-12 max-w-4xl"
    >
      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white dark:border-[rgba(255,255,255,0.1)] dark:bg-[#0a0a0a]">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-white/3 blur-[80px]" />

        <div className="flex items-start justify-between border-b border-black/10 px-8 pb-6 pt-8 dark:border-white/5">
          <div className="flex items-center gap-4">
            <span className="relative flex h-2 w-2 mt-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40 opacity-40 dark:bg-white/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-black dark:bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
            </span>
            <div>
              <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-[#A1A1AA]">
                {t('success_guide.markdown_copied')}
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">
                {t('success_guide.title')}
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="ml-4 mt-1 shrink-0 rounded-xl p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-black dark:text-white/55 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Dismiss guide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-px border-b border-black/10 bg-black/5 dark:border-white/5 dark:bg-white/5 sm:grid-cols-2">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="flex gap-4 bg-white p-6 dark:bg-[#050505]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-gray-100 text-xs font-bold tracking-widest text-gray-600 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111] dark:text-[#A1A1AA]">
                {step.n}
              </span>
              <div>
                <p className="mb-1 text-sm font-bold text-black dark:text-white">{step.title}</p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-500">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-8 py-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-white/55">
            {t('success_guide.copied_snippet_label')}
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-gray-100 px-4 py-3 font-mono text-sm dark:border-white/8 dark:bg-black/60">
            <span className="shrink-0 select-none text-gray-500 dark:text-[#A1A1AA]">$</span>
            <code className="flex-1 overflow-x-auto break-all leading-relaxed text-black dark:text-white/80">
              {markdown}
            </code>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-white/55">
            {t('success_guide.color_tip')}
          </p>
          <div className="mt-8 flex justify-center border-t border-black/10 pt-6 dark:border-white/5">
            <Link href={`/dashboard/${username}`} onClick={() => trackUser(username)}>
              <span className="border border-black/10 bg-gray-100 px-6 py-2.5 rounded-lg text-sm font-semibold text-black transition-all duration-200 hover:bg-gray-200 hover:scale-[1.01] active:scale-[0.99] dark:border-[rgba(255,255,255,0.15)] dark:bg-white dark:text-black dark:hover:bg-zinc-100">
                {t('success_guide.watch_dashboard_btn')}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
