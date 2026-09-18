import { CardView } from '../../components/Card';
import { SignageTitle } from '../../components/SignageTitle';
import type { Card } from '../../types';

export function MyDeckScreen({ cards }: { cards: Card[] }) {
  const baseCards = cards.filter((c) => c.type === 'base');

  return (
    <div className="deck-screen">
      <SignageTitle title="MY DECK" subtitle="지금까지 모은 강점 카드들" />
      {baseCards.length === 0 ? (
        <p className="deck-empty">아직 발견한 강점이 없어요. DISCOVER에서 시작해보세요.</p>
      ) : (
        <div className="deck-grid">
          {baseCards.map((c) => (
            <CardView key={c.id} name={c.name} description={c.description} type="base" subtype={c.subtype} />
          ))}
        </div>
      )}
    </div>
  );
}
