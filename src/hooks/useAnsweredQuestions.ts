import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AnsweredQuestion } from '../data/questions';

export function useAnsweredQuestions() {
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setAnswers([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('question_answers')
      .select('question_id, created_at')
      .eq('user_id', userId);
    setAnswers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { answers, loading, refresh };
}
