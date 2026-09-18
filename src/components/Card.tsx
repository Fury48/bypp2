import type { DragEvent } from 'react';
import type { CardSubtype, CardType } from '../types';
import characterCardArt from '../../assets/cards/character_card.png';
import talentCardArt from '../../assets/cards/talent_card.png';
import fusionCardArt from '../../assets/cards/fusion_card.png';
import './Card.css';

interface CardProps {
  name?: string;
  description?: string | null;
  type?: CardType;
  subtype?: CardSubtype | null;
  recipe?: string;
  faceDown?: boolean;
  unknown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
}

function cardArtFor(type: CardType, subtype?: CardSubtype | null) {
  if (type === 'composite') return fusionCardArt;
  return subtype === 'character' ? characterCardArt : talentCardArt;
}

export function CardView({
  name,
  description,
  type = 'base',
  subtype,
  recipe,
  faceDown,
  unknown,
  size = 'md',
  selected,
  draggable,
  onClick,
  onDragStart,
}: CardProps) {
  const classes = [
    'card',
    `card--${size}`,
    `card--${type}`,
    faceDown ? 'card--face-down' : '',
    unknown ? 'card--unknown' : '',
    selected ? 'card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style =
    faceDown || unknown ? undefined : { backgroundImage: `url(${cardArtFor(type, subtype)})` };

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {faceDown ? (
        <div className="card__back">?</div>
      ) : unknown ? (
        <div className="card__unknown">???</div>
      ) : (
        <div className="card__face">
          <div className="card__name">{name}</div>
          {description && <div className="card__desc">{description}</div>}
          {recipe && <div className="card__recipe">{recipe}</div>}
        </div>
      )}
    </div>
  );
}
