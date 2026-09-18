import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CardView } from '../../components/Card';
import type { Candidate, CardType } from '../../types';

export function RevealAnimation({
  cards,
  type = 'base',
  onDone,
}: {
  cards: Candidate[];
  type?: CardType;
  onDone: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll('.reveal-card');
    if (!items || items.length === 0) return;

    gsap.fromTo(
      items,
      { opacity: 0, scale: 0.4, rotateY: 180, y: 40 },
      {
        opacity: 1,
        scale: 1,
        rotateY: 0,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'back.out(1.6)',
      }
    );
  }, [cards]);

  return (
    <div className="reveal-overlay">
      <div className="reveal-title">NEW DISCOVERY!</div>
      <div className="reveal-cards" ref={containerRef}>
        {cards.map((c, i) => (
          <div className="reveal-card" key={i}>
            <CardView name={c.name} description={c.description} type={type} subtype={c.subtype} size="lg" />
          </div>
        ))}
      </div>
      <button className="reveal-close" onClick={onDone}>
        확인
      </button>
    </div>
  );
}
