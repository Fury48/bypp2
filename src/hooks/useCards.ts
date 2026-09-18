import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Card } from '../types';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true });
    setCards(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cards, loading, refresh };
}
