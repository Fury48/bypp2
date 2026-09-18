import type { DragEvent } from 'react';
import type { CardType } from '../types';
import './Card.css';

interface CardProps {
  name?: string;
  description?: string | null;
  type?: CardType;
  recipe?: string;
  faceDown?: boolean;
  unknown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
}

export function CardView({
  name,
  description,
  type = 'base',
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

  return (
    <div
      className={classes}
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
