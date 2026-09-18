import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Card } from '../../types';
import sageArt from '../../../assets/codex/hyunja.png';

const MIN_FUSION_CARDS = 3;

interface Reading {
  verdict: string;
  reason: string;
  missions: string[];
}

export function SageReport({ cards }: { cards: Card[] }) {
  const fusionCount = cards.filter((c) => c.type === 'composite').length;
  const unlocked = fusionCount >= MIN_FUSION_CARDS;

  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke('codex-report', {
        body: {
          cards: cards.map((c) => ({
            name: c.name,
            description: c.description,
            type: c.type,
            subtype: c.subtype,
          })),
        },
      })
      .then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError) throw fnError;
        setReading(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '현자가 자리를 비웠어요. 잠시 후 다시 찾아주세요.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  return (
    <div className="sage-wrap">
      <img className="sage-portrait" src={sageArt} alt="지나가는 현자" />
      <div className="sage-panel">
        <h3 className="sage-title">지나가는 현자의 조언</h3>

        {!unlocked && (
          <p className="sage-locked">
            융합 카드를 {MIN_FUSION_CARDS}개 모으면 지나가는 현자가 당신을 살펴봐줄 거예요.
            <br />
            (현재 {fusionCount} / {MIN_FUSION_CARDS})
          </p>
        )}

        {unlocked && loading && <p className="sage-loading">현자가 당신의 카드를 살펴보는 중...</p>}
        {unlocked && error && <p className="sage-error">{error}</p>}

        {unlocked && reading && (
          <div className="sage-reading">
            <p className="sage-line">
              <span className="sage-line__num">1.</span>
              제가 보기에 당신은 {reading.verdict}
            </p>
            <p className="sage-line">
              <span className="sage-line__num">2.</span>
              제가 그렇게 판단한 이유는, {reading.reason}
            </p>
            <div className="sage-line">
              <span className="sage-line__num">3.</span>
              제가 추천하는 자기계발 활동은
              <ul className="sage-missions">
                {reading.missions.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
