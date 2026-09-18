import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ONBOARDING_QUESTIONS,
  getNextOnboardingQuestion,
  getDailyQuestion,
  hasAnsweredToday,
  isOnboardingComplete,
} from '../../data/questions';
import type { Card, Candidate } from '../../types';
import { RevealAnimation } from './RevealAnimation';
import { SignageTitle } from '../../components/SignageTitle';
import questionBoxArt from '../../../assets/discover/question_box.png';

export function DiscoverScreen({
  cards,
  refresh,
  onOnboardingComplete,
}: {
  cards: Card[];
  refresh: () => Promise<void>;
  onOnboardingComplete?: () => void;
}) {
  const onboardingDone = isOnboardingComplete(cards);
  const nextOnboardingQuestion = useMemo(() => getNextOnboardingQuestion(cards), [cards]);
  const onboardingStep = nextOnboardingQuestion
    ? ONBOARDING_QUESTIONS.findIndex((q) => q.id === nextOnboardingQuestion.id)
    : -1;
  const isLastOnboardingQuestion = onboardingStep === ONBOARDING_QUESTIONS.length - 1;

  const question = onboardingDone ? getDailyQuestion() : nextOnboardingQuestion!;
  const answeredToday = onboardingDone && hasAnsweredToday(cards);

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealCards, setRevealCards] = useState<Candidate[] | null>(null);
  const [revealWasFinalOnboarding, setRevealWasFinalOnboarding] = useState(false);
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
          subtype: c.subtype ?? null,
          source_question_id: question.id,
        }))
      );

      setRevealWasFinalOnboarding(!onboardingDone && isLastOnboardingQuestion);
      setRevealCards(newCards);
      setAnswer('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  function handleRevealDone() {
    setRevealCards(null);
    if (revealWasFinalOnboarding) onOnboardingComplete?.();
  }

  if (revealCards) {
    return <RevealAnimation cards={revealCards} onDone={handleRevealDone} />;
  }

  return (
    <div className="discover-screen">
      <SignageTitle title="DISCOVER" subtitle="질문에 답하고 나의 강점을 발견하세요" />
      {answeredToday ? (
        <div
          className="discover-card discover-waiting"
          style={{ backgroundImage: `url(${questionBoxArt})` }}
        >
          <p>내일 찾게 될 나의 강점을 기다려주세요</p>
        </div>
      ) : (
        <div className="discover-card" style={{ backgroundImage: `url(${questionBoxArt})` }}>
          {!onboardingDone && (
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
      )}
    </div>
  );
}
