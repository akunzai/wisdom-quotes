import { useEffect, useRef, useState } from 'react';
import { getPetsEnabled } from '@/lib/prefs';

const PET_LINES = ['喵～一起讀名言嗎？', '今天也要好好思考喔', '伸個懶腰…', '這則語錄好棒！'];
const READ_LINES = ['認真閱讀中…', '嗯…有意思', '喵～再看一次'];
const FOCUS_LINES = ['靜靜品味這句話…', '嗯…', '好喜歡這則語錄'];

function pickLine(lines: string[]) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function baselineY() {
  return window.innerHeight - (window.innerWidth <= 720 ? 56 : 72) - 20;
}

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function PageCat({ focusMode = false }: { focusMode?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const petRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    x: window.innerWidth * 0.42,
    y: baselineY(),
    dir: 1,
    state: 'walk' as 'walk' | 'idle' | 'goto' | 'read',
    stateUntil: 0,
    targetX: 0,
    targetY: 0,
    walkTicks: 0,
  });

  useEffect(() => {
    setEnabled(getPetsEnabled());
    const onStorage = () => setEnabled(getPetsEnabled());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!enabled || !focusMode || !petRef.current) return;

    const el = petRef.current;
    const petW = el.offsetWidth || 72;
    const s = stateRef.current;
    const clampX = (px: number) =>
      Math.max(8, Math.min(window.innerWidth - petW - 8, px));

    const goToFocusSlot = () => {
      s.targetX = clampX(window.innerWidth * 0.5 - petW * 0.5);
      s.targetY = window.innerHeight * 0.72;
      s.state = 'goto';
      s.dir = s.targetX > s.x ? 1 : -1;
      el.classList.toggle('facing-left', s.dir < 0);
    };

    goToFocusSlot();
    const onResize = () => goToFocusSlot();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled, focusMode]);

  useEffect(() => {
    if (!enabled || !petRef.current) return;

    const el = petRef.current;
    const bubble = bubbleRef.current!;
    const petW = () => el.offsetWidth || 72;
    const petH = () => el.offsetHeight || 72;
    let bubbleTimer: ReturnType<typeof setTimeout>;
    let raf = 0;

    const showBubble = (text: string) => {
      bubble.textContent = text;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 2400);
    };

    const setPos = (px: number, py: number) => {
      const s = stateRef.current;
      s.x = px;
      s.y = py;
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
    };

    const clampX = (px: number) =>
      Math.max(8, Math.min(window.innerWidth - petW() - 8, px));

    const updatePointerEvents = () => {
      const s = stateRef.current;
      const petRect = el.getBoundingClientRect();
      const overlapsCard = [...document.querySelectorAll('.quote-card')].some((card) => {
        const rect = card.getBoundingClientRect();
        return rect.width > 0 && rectsIntersect(petRect, rect);
      });
      const passThrough = overlapsCard || s.state === 'read' || s.state === 'goto';
      el.style.pointerEvents = passThrough ? 'none' : 'auto';
    };

    const tick = (now: number) => {
      const s = stateRef.current;

      if (s.state === 'walk') {
        s.walkTicks++;
        s.x += s.dir * (0.4 + Math.random() * 0.3);
        s.y += (baselineY() - s.y) * 0.06;
        if (s.x <= 8 || s.x >= window.innerWidth - petW() - 8) {
          s.dir *= -1;
          if (Math.random() < 0.3) {
            s.state = 'idle';
            s.stateUntil = now + 2000;
          }
        }
        s.x = clampX(s.x);
        el.classList.toggle('facing-left', s.dir < 0);
        el.classList.remove('reading');
        setPos(s.x, s.y);

        if (!focusMode && s.walkTicks > 120) {
          const cards = [...document.querySelectorAll('.quote-card')].filter((card) => {
            const r = card.getBoundingClientRect();
            return r.width > 0 && r.top < window.innerHeight;
          });
          if (cards.length && Math.random() < 0.15) {
            const card = cards[Math.floor(Math.random() * cards.length)];
            const rect = card.getBoundingClientRect();
            s.targetX = clampX(rect.left + rect.width * 0.5 - petW() * 0.5);
            s.targetY = Math.max(80, rect.bottom - petH() + 4);
            s.state = 'goto';
            s.walkTicks = 0;
          }
        }
      } else if (s.state === 'goto') {
        s.x += (s.targetX - s.x) * 0.07;
        s.y += (s.targetY - s.y) * 0.07;
        el.classList.toggle('facing-left', s.targetX > s.x);
        setPos(s.x, s.y);
        if (Math.abs(s.targetX - s.x) < 3 && Math.abs(s.targetY - s.y) < 3) {
          s.state = 'read';
          s.stateUntil = now + 2800 + Math.random() * 3200;
          el.classList.add('reading');
          showBubble(pickLine(focusMode ? FOCUS_LINES : READ_LINES));
        }
      } else if (s.state === 'read') {
        if (now > s.stateUntil) {
          if (focusMode) {
            s.stateUntil = now + 3500 + Math.random() * 2000;
            el.classList.add('reading');
            showBubble(pickLine(FOCUS_LINES));
          } else {
            el.classList.remove('reading');
            s.state = 'goto';
            s.targetX = clampX(s.x);
            s.targetY = baselineY();
          }
        }
      } else if (s.state === 'idle' && now > s.stateUntil) {
        s.state = 'walk';
      }

      updatePointerEvents();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onClick = () => {
      el.classList.remove('happy');
      void el.offsetWidth;
      el.classList.add('happy');
      showBubble(pickLine(PET_LINES));
      stateRef.current.state = 'idle';
      stateRef.current.stateUntil = performance.now() + 1800;
    };

    el.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('click', onClick);
      clearTimeout(bubbleTimer);
    };
  }, [enabled, focusMode]);

  if (!enabled) return null;

  return (
    <div id="pets-layer" aria-label="網頁小夥伴">
      <div className="pet cat" ref={petRef} title="點點我～">
        <div className="pet-bubble" ref={bubbleRef} />
        <div className="pet-figure">
          <span className="pet-book" aria-hidden="true">
            📖
          </span>
          <svg className="pet-svg" viewBox="0 0 64 64" aria-hidden="true">
            <ellipse className="pet-tail" cx="18" cy="44" rx="10" ry="4" fill="var(--pet-body)" />
            <ellipse cx="36" cy="40" rx="20" ry="16" fill="var(--pet-body)" />
            <polygon points="24,26 28,14 34,26" fill="var(--pet-body)" />
            <polygon points="38,26 44,14 48,26" fill="var(--pet-body)" />
            <g className="pet-eye">
              <circle cx="30" cy="36" r="2.2" fill="var(--text)" />
              <circle cx="42" cy="36" r="2.2" fill="var(--text)" />
            </g>
            <ellipse cx="26" cy="40" rx="3" ry="2" fill="var(--pet-blush)" />
            <ellipse cx="46" cy="40" rx="3" ry="2" fill="var(--pet-blush)" />
            <path
              d="M32 42 Q36 46 40 42"
              stroke="var(--pet-mouth)"
              strokeWidth="1.3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}