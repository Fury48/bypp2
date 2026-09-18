import type { Card } from '../types';

export interface Question {
  id: string;
  text: string;
  category?: string;
}

export const ONBOARDING_QUESTIONS: Question[] = [
  { id: 'onboard-1', text: '나는 무엇을 할 때 가장 몰입이 잘되는가?', category: 'onboarding' },
  { id: 'onboard-2', text: '사소하더라도 내가 꾸준히 하는 활동은?', category: 'onboarding' },
  { id: 'onboard-3', text: '내가 그래도 상위 25프로 안에 든다고 생각하는 나의 첫번째 강점은?', category: 'onboarding' },
  { id: 'onboard-4', text: '내가 그래도 상위 25프로 안에 든다고 생각하는 나의 두번째 강점은?', category: 'onboarding' },
  { id: 'onboard-5', text: '내가 그래도 상위 25프로 안에 든다고 생각하는 나의 세번째 강점은?', category: 'onboarding' },
];

export const QUESTIONS: Question[] = [
  { id: 'q1', text: '주변 사람들이 나에게 자주 부탁하는 것은?', category: 'relationships' },
  { id: 'q2', text: '어떤 일을 할 때 시간이 가장 빨리 가나요?', category: 'flow' },
  { id: 'q3', text: '최근에 스스로 뿌듯했던 순간은 언제였나요?', category: 'achievement' },
  { id: 'q4', text: '친구들이 고민이 있을 때 나에게 오는 이유는 뭘까요?', category: 'relationships' },
  { id: 'q5', text: '남들은 어려워하는데 나는 쉽게 해내는 일이 있다면?', category: 'skill' },
  { id: 'q6', text: '실패했을 때 나는 보통 어떻게 다시 일어서나요?', category: 'resilience' },
  { id: 'q7', text: '새로운 것을 배울 때 나만의 방식이 있다면?', category: 'learning' },
  { id: 'q8', text: '팀 프로젝트에서 나는 주로 어떤 역할을 맡게 되나요?', category: 'teamwork' },
  { id: 'q9', text: '누군가 나를 한 문장으로 칭찬한다면 뭐라고 할까요?', category: 'identity' },
  { id: 'q10', text: '스트레스를 받을 때 나는 어떻게 풀어내나요?', category: 'resilience' },
  { id: 'q11', text: '어떤 이야기를 할 때 눈이 반짝인다는 말을 듣나요?', category: 'passion' },
  { id: 'q12', text: '완성도보다 속도, 속도보다 완성도 중 나는 어느 쪽에 더 가깝나요?', category: 'workstyle' },
  { id: 'q13', text: '낯선 문제를 만났을 때 나는 제일 먼저 무엇을 하나요?', category: 'problem-solving' },
  { id: 'q14', text: '지금까지 받아본 피드백 중 가장 기억에 남는 말은?', category: 'identity' },
  { id: 'q15', text: '혼자 있을 때 자연스럽게 하게 되는 활동은?', category: 'passion' },
];

function answeredIds(cards: Card[]) {
  return new Set(cards.map((c) => c.source_question_id).filter(Boolean));
}

export function isOnboardingComplete(cards: Card[]) {
  const answered = answeredIds(cards);
  return ONBOARDING_QUESTIONS.every((q) => answered.has(q.id));
}

export function getNextOnboardingQuestion(cards: Card[]): Question | null {
  const answered = answeredIds(cards);
  return ONBOARDING_QUESTIONS.find((q) => !answered.has(q.id)) ?? null;
}

/** 모든 유저에게 동일한, 하루에 하나씩 바뀌는 질문. */
export function getDailyQuestion(): Question {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  return QUESTIONS[daysSinceEpoch % QUESTIONS.length];
}

function isSameUTCDate(isoA: string, isoB: string) {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** 오늘의 질문에 이미 답했는지 여부 (온보딩 완료 이후에만 의미 있음). */
export function hasAnsweredToday(cards: Card[]): boolean {
  const today = getDailyQuestion();
  const now = new Date().toISOString();
  return cards.some((c) => c.source_question_id === today.id && isSameUTCDate(c.created_at, now));
}
