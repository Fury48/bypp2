import { useEffect, useRef, useState } from 'react';
import { CardView } from '../../components/Card';
import { RevealAnimation } from '../Discover/RevealAnimation';
import { supabase } from '../../lib/supabase';
import type { Card, Candidate } from '../../types';
import { Altar } from './Altar';
import { useForgeAnimation, type ForgeRefs } from './useForgeAnimation';

const SLOT_COUNT = 3;

export function ForgeScreen({
  cards,
  refresh,
}: {
  cards: Card[];
  refresh: () => Promise<void>;
}) {
  const refs: ForgeRefs = {
    overlay: useRef<HTMLDivElement>(null),
    stage: useRef<HTMLDivElement>(null),
    altar: useRef<HTMLDivElement>(null),
    slotA: useRef<HTMLDivElement>(null),
    slotB: useRef<HTMLDivElement>(null),
    slotC: useRef<HTMLDivElement>(null),
    flash: useRef<HTMLDivElement>(null),
    backCard: useRef<HTMLDivElement>(null),
    particles: useRef<HTMLDivElement>(null),
  };
  const { playIntro, playCombine, reset, killIntro } = useForgeAnimation(refs);

  const [slots, setSlots] = useState<(Card | null)[]>(Array(SLOT_COUNT).fill(null));
  const [combining, setCombining] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [reveal, setReveal] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filledCards = slots.filter((c): c is Card => c !== null);

  useEffect(() => {
    playIntro();
    return () => killIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isInSlots(cardId: string) {
    return slots.some((c) => c?.id === cardId);
  }

  function selectCard(card: Card) {
    setSlots((prev) => {
      if (prev.some((c) => c?.id === card.id)) return prev;
      const emptyIndex = prev.findIndex((c) => c === null);
      if (emptyIndex === -1) return prev;
      return prev.map((c, i) => (i === emptyIndex ? card : c));
    });
  }

  function dropCard(index: number, cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    setSlots((prev) => {
      if (prev.some((c) => c?.id === card.id)) return prev;
      return prev.map((c, i) => (i === index ? card : c));
    });
  }

  function clearSlot(index: number) {
    if (combining) return;
    setSlots((prev) => prev.map((c, i) => (i === index ? null : c)));
  }

  function handleCombine() {
    if (filledCards.length < 2 || combining) return;
    setCombining(true);
    setError(null);
    playCombine(async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('forge-combine', {
          body: { cards: filledCards.map((c) => c.name) },
        });
        if (fnError) throw fnError;
        setCandidates(data.candidates ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : '조합에 실패했어요.');
        setCombining(false);
        reset();
        setSlots(Array(SLOT_COUNT).fill(null));
      }
    });
  }

  async function chooseCandidate(candidate: Candidate) {
    if (filledCards.length < 2) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    await supabase.from('cards').insert({
      user_id: userId,
      name: candidate.name,
      description: candidate.description,
      type: 'composite',
      parent_a_id: filledCards[0].id,
      parent_b_id: filledCards[1].id,
      parent_c_id: filledCards[2]?.id ?? null,
    });

    setCandidates(null);
    setReveal([candidate]);
    setSlots(Array(SLOT_COUNT).fill(null));
    setCombining(false);
    reset();
    await refresh();
  }

  if (reveal) {
    return <RevealAnimation cards={reveal} onDone={() => setReveal(null)} />;
  }

  return (
    <div className="forge-screen">
      <Altar
        refs={refs}
        slots={slots}
        onClearSlot={clearSlot}
        onDropCard={dropCard}
        onCombine={handleCombine}
        canCombine={filledCards.length >= 2}
        combining={combining}
      />

      {error && <div className="forge-error">{error}</div>}

      {candidates && (
        <div className="forge-candidates">
          <h3>어떤 잠재력이 나와 가장 닮았나요?</h3>
          <div className="forge-candidates__grid">
            {candidates.map((c, i) => (
              <div key={i} onClick={() => chooseCandidate(c)}>
                <CardView name={c.name} description={c.description} type="composite" size="lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!candidates && (
        <div className="forge-rail">
          <div className="forge-rail__grid">
            {cards.map((c) => (
              <CardView
                key={c.id}
                name={c.name}
                description={c.description}
                type={c.type}
                size="sm"
                draggable
                selected={isInSlots(c.id)}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                onClick={() => selectCard(c)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
