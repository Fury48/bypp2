import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ONBOARDING_QUESTIONS, getNextQuestion } from '../../data/questions';
import type { Card, Candidate } from '../../types';
import { RevealAnimation } from './RevealAnimation';
import { SignageTitle } from '../../components/SignageTitle';

export function DiscoverScreen({
  cards,
  refresh,
}: {
  cards: Card[];
  refresh: () => Promise<void>;
}) {
  const question = useMemo(() => getNextQuestion(cards), [cards]);
  const onboardingStep = ONBOARDING_QUESTIONS.findIndex((q) => q.id === question.id);
  const isOnboarding = onboardingStep !== -1;

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealCards, setRevealCards] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!answer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('discover-extract', {
        body: { question: question.text, answer },
      });
      if (fnError) throw fnError;
      const newCards: Candidate[] = data.cards ?? [];
      if (newCards.length === 0) {
        setError('강점을 발견하지 못했어요. 조금 더 구체적으로 답해볼까요?');
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      await supabase.from('cards').insert(
        newCards.map((c) => ({
          user_id: userId,
          name: c.name,
          description: c.description,
          type: 'base' as const,
          source_question_id: question.id,
        }))
      );

      setRevealCards(newCards);
      setAnswer('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  if (revealCards) {
    return <RevealAnimation cards={revealCards} onDone={() => setRevealCards(null)} />;
  }

  return (
    <div className="discover-screen">
      <SignageTitle title="DISCOVER" subtitle="질문에 답하고 나의 강점을 발견하세요" />
      <div className="discover-card">
        {isOnboarding && (
          <div className="discover-onboarding-badge">
            첫 걸음 {onboardingStep + 1} / {ONBOARDING_QUESTIONS.length}
          </div>
        )}
        <h2 className="discover-question">{question.text}</h2>
        <textarea
          className="discover-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="솔직하게 답해보세요..."
          rows={4}
        />
        {error && <div className="discover-error">{error}</div>}
        <button className="discover-submit" onClick={handleSubmit} disabled={loading || !answer.trim()}>
          {loading ? '발견 중...' : '강점 발견하기'}
        </button>
      </div>
    </div>
  );
}
