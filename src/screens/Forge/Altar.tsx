import type { DragEvent } from 'react';
import { CardView } from '../../components/Card';
import type { Card } from '../../types';
import type { ForgeRefs } from './useForgeAnimation';
import forgeBackgroundArt from '../../../assets/forge/forge_background.png';
import forgeSlotArt from '../../../assets/forge/forge_slot.png';
import forgeButtonArt from '../../../assets/forge/forge_button.png';

const SLOT_REF_KEYS = ['slotA', 'slotB', 'slotC'] as const;

export function Altar({
  refs,
  slots,
  onClearSlot,
  onDropCard,
  onCombine,
  canCombine,
  combining,
}: {
  refs: ForgeRefs;
  slots: (Card | null)[];
  onClearSlot: (index: number) => void;
  onDropCard: (index: number, cardId: string) => void;
  onCombine: () => void;
  canCombine: boolean;
  combining: boolean;
}) {
  function handleDrop(index: number) {
    return (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      if (cardId) onDropCard(index, cardId);
    };
  }

  return (
    <div className="forge-stage" ref={refs.stage} style={{ backgroundImage: `url(${forgeBackgroundArt})` }}>
      <div className="forge-overlay" ref={refs.overlay} />
      <div className="forge-altar" ref={refs.altar}>
        {slots.map((card, i) => (
          <div
            key={i}
            className="forge-slot"
            style={{ backgroundImage: `url(${forgeSlotArt})` }}
            ref={refs[SLOT_REF_KEYS[i]]}
            onClick={() => card && onClearSlot(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(i)}
          >
            {card ? (
              <CardView name={card.name} description={card.description} type={card.type} subtype={card.subtype} />
            ) : (
              <div className="forge-slot__empty">카드를 놓으세요</div>
            )}
          </div>
        ))}
        <div className="forge-particles" ref={refs.particles} />
        <div className="forge-back-card" ref={refs.backCard}>
          <CardView faceDown size="lg" />
        </div>
        <div className="forge-flash" ref={refs.flash} />
      </div>
      <button
        className="forge-combine-btn"
        style={{ backgroundImage: `url(${forgeButtonArt})` }}
        onClick={onCombine}
        disabled={!canCombine || combining}
      >
        {combining ? '조합 중...' : '조합하기'}
      </button>
    </div>
  );
}
