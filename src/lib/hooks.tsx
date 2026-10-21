import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Largura de um elemento, actualizada com ResizeObserver. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export type TipLine = { color?: string; label: string; value?: string };
export interface TipState {
  x: number;
  y: number;
  title: string;
  lines: TipLine[];
}

/** Tooltip que fica dentro da caixa do gráfico. */
export function useTooltip<T extends HTMLElement>(boxRef: React.RefObject<T>) {
  const [tip, setTip] = useState<TipState | null>(null);
  const show = useCallback(
    (ev: React.MouseEvent, title: string, lines: TipLine[]) => {
      const box = boxRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, title, lines });
    },
    [boxRef],
  );
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
}

export function Tooltip({ tip, boxWidth }: { tip: TipState | null; boxWidth: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    setPos({ left: Math.max(0, Math.min(boxWidth - w, tip.x + 12)), top: Math.max(0, tip.y - h - 10) });
  }, [tip, boxWidth]);
  if (!tip) return null;
  return (
    <div className="tip" ref={ref} style={pos}>
      <div className="tip-t">{tip.title}</div>
      {tip.lines.map((l, i) => (
        <div className="tip-r" key={i}>
          {l.color && <i style={{ background: l.color }} />}
          {l.label}
          {l.value !== undefined && `: ${l.value}`}
        </div>
      ))}
    </div>
  );
}

export type Tema = 'system' | 'light' | 'dark';

/** Tema claro/escuro guardado no browser; "system" segue o sistema operativo. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    try {
      return (localStorage.getItem('tema') as Tema) || 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const el = document.documentElement;
    if (tema === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', tema);
    try {
      localStorage.setItem('tema', tema);
    } catch {
      /* ignorar */
    }
  }, [tema]);
  return [tema, setTema] as const;
}

export function Card({ title, icon, note, children, id, className = '' }: { title?: string; icon?: ReactNode; note?: string; children: ReactNode; id?: string; className?: string }) {
  return (
    <section className={`card ${className}`} id={id}>
      {title && (
        <h3>
          {icon && <span className="badge">{icon}</span>}
          {title}
        </h3>
      )}
      {note && <p className="note">{note}</p>}
      {children}
    </section>
  );
}
