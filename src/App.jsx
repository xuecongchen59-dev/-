import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Add or remove lunch choices here; the drawing logic reads this array only.
const lunchOptions = [
  {
    name: '饺子',
    emoji: '🥟',
    tag: '稳妥型',
    reason: '简单快速，不容易踩雷，适合想吃得舒服一点的时候。',
    mood: '今天适合选个稳稳当当的答案，让午餐先把心安顿好。',
  },
  {
    name: '食堂',
    emoji: '🍱',
    tag: '效率型',
    reason: '距离近、出餐快，适合下午还有很多工作的时候。',
    mood: '今天适合把时间留给自己，吃得快一点，下午轻松一点。',
  },
  {
    name: '面',
    emoji: '🍜',
    tag: '满足型',
    reason: '热乎、有饱腹感，适合想吃点有温度的午餐。',
    mood: '今天适合吃点热乎的，把上午的疲惫压一压。',
  },
  {
    name: '炒菜',
    emoji: '🍛',
    tag: '改善型',
    reason: '选择多、适合多人一起吃，适合今天想认真吃顿饭。',
    mood: '今天值得认真吃一顿，把午休过成一点小小的改善。',
  },
  {
    name: '馄饨',
    emoji: '🥣',
    tag: '暖胃型',
    reason: '汤汤水水、清爽热乎，适合想吃得轻松又暖一点的时候。',
    mood: '今天适合喝口热汤，让中午变得柔软一点。',
  },
  {
    name: '寿司',
    emoji: '🍣',
    tag: '清爽型',
    reason: '清爽、不重口，适合想吃轻一点但又有点仪式感的午餐。',
    mood: '今天适合吃得轻盈一点，让下午也保持清清爽爽。',
  },
];

const rollDelays = [70, 80, 90, 105, 125, 150, 180, 220, 270, 330];

const phaseText = {
  idle: '先看看今天的候选菜单。',
  starting: '午餐命运正在启动……',
  rolling: '正在帮你认真纠结中……',
  revealed: '午餐签已经落定。',
  accepted: '安排已定，别再纠结。',
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFinalOption(lastSelectedName) {
  if (lunchOptions.length === 0) {
    return null;
  }

  const pool =
    lunchOptions.length > 1
      ? lunchOptions.filter((option) => option.name !== lastSelectedName)
      : lunchOptions;

  return pool[randomInt(0, pool.length - 1)];
}

function getOptionIndex(option) {
  return lunchOptions.findIndex((item) => item.name === option?.name);
}

export default function App() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [lastSelectedName, setLastSelectedName] = useState(null);

  const timeoutRefs = useRef([]);
  const mountedRef = useRef(true);
  const hasOptions = lunchOptions.length > 0;

  const highlightedOption = useMemo(() => {
    if (!hasOptions) {
      return null;
    }

    return lunchOptions[highlightedIndex] ?? lunchOptions[0];
  }, [hasOptions, highlightedIndex]);

  // Keep every timeout in one place so redraws and unmounts cannot leak updates.
  const clearTimers = useCallback(() => {
    timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutRefs.current = [];
  }, []);

  const queueTimeout = useCallback((callback, delay) => {
    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) {
        callback();
      }
    }, delay);

    timeoutRefs.current.push(timeoutId);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  const runDraw = useCallback(() => {
    if (!hasOptions || isDrawing) {
      return;
    }

    clearTimers();

    const finalOption = pickFinalOption(lastSelectedName);
    const finalIndex = getOptionIndex(finalOption);
    let cursor = highlightedIndex;
    let elapsed = 220;

    setIsDrawing(true);
    setAccepted(false);
    setSelectedOption(null);
    setMatchScore(null);
    setPhase('starting');

    queueTimeout(() => {
      setPhase('rolling');
    }, 220);

    rollDelays.forEach((delay, step) => {
      elapsed += delay;
      queueTimeout(() => {
        const isLastStep = step === rollDelays.length - 1;

        if (isLastStep) {
          setHighlightedIndex(finalIndex);
          setSelectedOption(finalOption);
          setMatchScore(randomInt(70, 99));
          setLastSelectedName(finalOption.name);
          setPhase('revealed');
          setIsDrawing(false);
          return;
        }

        const stepSize =
          lunchOptions.length > 1 ? randomInt(1, lunchOptions.length - 1) : 1;
        cursor = (cursor + stepSize) % lunchOptions.length;
        setHighlightedIndex(cursor);
      }, elapsed);
    });
  }, [
    clearTimers,
    hasOptions,
    highlightedIndex,
    isDrawing,
    lastSelectedName,
    queueTimeout,
  ]);

  const handleAccept = () => {
    if (!selectedOption || isDrawing) {
      return;
    }

    setAccepted(true);
    setPhase('accepted');
  };

  const displayOption = selectedOption ?? highlightedOption;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fff7ed_0%,#fef3c7_48%,#ecfdf5_100%)] px-4 py-6 text-[#2f2a23] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-80px] top-[-90px] h-56 w-56 rounded-full bg-orange-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-90px] h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[960px] flex-col justify-center">
        <motion.div
          className="rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur-xl sm:p-6 lg:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <header className="text-center">
            <span className="inline-flex rounded-full border border-orange-200/80 bg-white/70 px-3 py-1 text-xs font-bold text-orange-700 shadow-sm">
              今日午餐签
            </span>
            <h1 className="mt-3 text-[34px] font-extrabold leading-tight text-[#2f2a23] sm:text-5xl">
              今天中午吃什么？
            </h1>
            <p className="mt-2 text-[15px] font-medium text-[#7a6a58] sm:text-base">
              别纠结了，让午餐命运转起来。
            </p>
          </header>

          <motion.div
            className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
            animate={phase === 'starting' ? { scale: [1, 1.015, 1], y: [0, -2, 0] } : {}}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {hasOptions ? (
              lunchOptions.map((option, index) => {
                const isHighlighted = isDrawing && highlightedIndex === index;

                return (
                  <motion.article
                    key={option.name}
                    className={`rounded-[22px] border p-4 shadow-card transition-colors duration-200 ${
                      isHighlighted
                        ? 'border-orange-300 bg-orange-50/90'
                        : 'border-white/75 bg-white/68'
                    }`}
                    animate={{
                      scale: isHighlighted ? 1.035 : 1,
                      y: isHighlighted ? -3 : 0,
                      opacity: isDrawing && !isHighlighted ? 0.76 : 1,
                    }}
                    whileHover={!isDrawing ? { y: -3, scale: 1.015 } : undefined}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[30px] leading-none" aria-hidden="true">
                        {option.emoji}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {option.tag}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold text-[#34291f]">
                      {option.name}
                    </h2>
                  </motion.article>
                );
              })
            ) : (
              <div className="col-span-full rounded-[24px] border border-white/75 bg-white/70 p-5 text-center text-sm font-semibold text-[#7a6a58]">
                还没有午餐选项，先在 lunchOptions 里加几个吧。
              </div>
            )}
          </motion.div>

          <div className="mt-6 flex justify-center">
            <motion.button
              type="button"
              onClick={runDraw}
              disabled={!hasOptions || isDrawing}
              className="min-h-14 w-full max-w-sm rounded-full bg-gradient-to-r from-orange-400 to-orange-500 px-7 py-4 text-lg font-extrabold text-white shadow-button outline-none transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100"
              animate={phase === 'starting' ? { scale: [1, 0.97, 1] } : { scale: 1 }}
              whileTap={!isDrawing && hasOptions ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {isDrawing ? '正在抽取...' : '帮我决定！'}
            </motion.button>
          </div>

          <section className="mt-6 min-h-[230px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {!hasOptions && (
                <motion.div
                  key="empty"
                  className="mx-auto max-w-xl rounded-[28px] border border-white/80 bg-white/72 p-6 text-center shadow-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <p className="text-base font-bold text-[#7a6a58]">
                    还没有午餐选项，先在 lunchOptions 里加几个吧。
                  </p>
                </motion.div>
              )}

              {hasOptions && (phase === 'idle' || phase === 'starting' || phase === 'rolling') && (
                <motion.div
                  key={`rolling-${phase}-${displayOption?.name ?? 'none'}`}
                  className="mx-auto max-w-xl rounded-[28px] border border-white/80 bg-white/68 p-5 text-center shadow-card backdrop-blur"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                >
                  <p className="text-sm font-bold text-orange-700">
                    {phaseText[phase]}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-[34px]" aria-hidden="true">
                      {displayOption?.emoji}
                    </span>
                    <span className="text-3xl font-extrabold text-[#34291f]">
                      {displayOption?.name}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#8a7a68]">
                    轻轻点一下，今天中午就不再开会讨论。
                  </p>
                </motion.div>
              )}

              {selectedOption && (phase === 'revealed' || phase === 'accepted') && (
                <motion.div
                  key={`${selectedOption.name}-${matchScore}`}
                  className="relative mx-auto max-w-xl overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/92 to-orange-50/88 p-5 pt-16 text-left shadow-soft backdrop-blur sm:p-7 sm:pt-16"
                  initial={{ opacity: 0, y: 18, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: [1.03, 1] }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 23 }}
                >
                  <div className="result-shine" />
                  <div className="absolute right-4 top-4 rounded-full border border-white/80 bg-orange-100/85 px-3 py-1.5 text-xs font-extrabold text-orange-700 shadow-sm">
                    今日午餐匹配度：{matchScore}%
                  </div>

                  <p className="text-sm font-extrabold text-[#8a6a45]">
                    今天建议吃：
                  </p>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <span className="text-[34px] leading-none" aria-hidden="true">
                      {selectedOption.emoji}
                    </span>
                    <motion.h2
                      className="text-[36px] font-black leading-none text-[#2f2a23]"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 0.36, ease: 'easeOut' }}
                    >
                      {selectedOption.name}
                    </motion.h2>
                  </div>

                  <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-extrabold text-emerald-700">
                    今日午餐签：{selectedOption.tag}
                  </div>

                  <p className="mt-4 text-lg font-bold leading-relaxed text-[#4c3a2c]">
                    {selectedOption.mood}
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-[#7a6a58]">
                    推荐理由：{selectedOption.reason}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <motion.button
                      type="button"
                      onClick={runDraw}
                      disabled={isDrawing}
                      className="min-h-12 rounded-full border border-orange-200 bg-white/80 px-5 py-3 font-extrabold text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-70"
                      whileTap={!isDrawing ? { scale: 0.98 } : undefined}
                    >
                      再抽一次
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleAccept}
                      disabled={isDrawing}
                      className="min-h-12 rounded-full bg-[#1f3a2f] px-5 py-3 font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                      animate={accepted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                      whileTap={!isDrawing ? { scale: 0.98 } : undefined}
                    >
                      {accepted ? '已接受，出发吃饭' : '我接受这个安排'}
                    </motion.button>
                  </div>

                  {accepted && (
                    <motion.p
                      className="mt-4 text-center text-sm font-bold text-emerald-700"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      安排已定，别再纠结。
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </motion.div>

        <p className="py-5 text-center text-sm font-semibold text-[#8a7a68]">
          午餐可以随机，下午不能摸鱼。
        </p>
      </section>
    </main>
  );
}
