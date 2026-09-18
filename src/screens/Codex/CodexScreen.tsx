import { useMemo } from 'react';
import { CardView } from '../../components/Card';
import { RecipeBadge } from './RecipeBadge';
import { SageReport } from './SageReport';
import { SignageTitle } from '../../components/SignageTitle';
import type { Card } from '../../types';

const MAX_UNKNOWN_SHOWN = 20;

export function CodexScreen({ cards }: { cards: Card[] }) {
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const compositeCards = cards.filter((c) => c.type === 'composite');
  const baseCards = cards.filter((c) => c.type === 'base');

  const triedPairs = useMemo(() => {
    const set = new Set<string>();
    for (const c of compositeCards) {
      if (c.parent_a_id && c.parent_b_id) {
        const key = [c.parent_a_id, c.parent_b_id].sort().join('|');
        set.add(key);
      }
    }
    return set;
  }, [compositeCards]);

  const untriedPairs = useMemo(() => {
    const pairs: [Card, Card][] = [];
    for (let i = 0; i < baseCards.length; i++) {
      for (let j = i + 1; j < baseCards.length; j++) {
        const key = [baseCards[i].id, baseCards[j].id].sort().join('|');
        if (!triedPairs.has(key)) pairs.push([baseCards[i], baseCards[j]]);
      }
    }
    return pairs;
  }, [baseCards, triedPairs]);

  return (
    <div className="codex-screen">
      <SignageTitle title="CODEX" subtitle="발견한 복합 강점들을 모아보세요" />
      <div className="codex-layout">
        <div className="codex-left">
          <div className="codex-grid">
            {compositeCards.map((c) => {
              const a = c.parent_a_id ? cardsById.get(c.parent_a_id) : null;
              const b = c.parent_b_id ? cardsById.get(c.parent_b_id) : null;
              const c3 = c.parent_c_id ? cardsById.get(c.parent_c_id) : null;
              return (
                <div key={c.id} className="codex-entry">
                  <CardView name={c.name} description={c.description} type="composite" />
                  {a && b && <RecipeBadge a={a.name} b={b.name} c={c3?.name} />}
                </div>
              );
            })}
            {untriedPairs.slice(0, MAX_UNKNOWN_SHOWN).map(([a, b]) => (
              <div key={`${a.id}-${b.id}`} className="codex-entry">
                <CardView unknown />
                <RecipeBadge a={a.name} b={b.name} />
              </div>
            ))}
          </div>
          {untriedPairs.length > MAX_UNKNOWN_SHOWN && (
            <p className="codex-more">+ {untriedPairs.length - MAX_UNKNOWN_SHOWN}개의 조합이 더 남아있어요...</p>
          )}
        </div>
        <div className="codex-right">
          <SageReport cards={cards} />
        </div>
      </div>
    </div>
  );
}
