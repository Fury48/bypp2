import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RevealAnimation } from '../screens/Discover/RevealAnimation';
import type { Candidate } from '../types';

interface Notification {
  id: string;
  message: string;
  card_id: string | null;
  claimed: boolean;
  read: boolean;
  created_at: string;
}

const POLL_INTERVAL_MS = 15000;

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState<{ notifId: string; candidate: Candidate } | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data ?? []);
  }, []);

  useEffect(() => {
    refresh();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => refresh()
        )
        .subscribe();
    });

    const poll = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      clearInterval(poll);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  const unreadCount = items.filter((n) => !n.read).length;

  async function handleClaim(n: Notification) {
    if (!n.card_id) return;
    const { data: card } = await supabase
      .from('cards')
      .select('name, description, subtype')
      .eq('id', n.card_id)
      .maybeSingle();
    if (!card) return;
    setOpen(false);
    setClaiming({
      notifId: n.id,
      candidate: { name: card.name, description: card.description ?? '', subtype: card.subtype ?? undefined },
    });
  }

  async function handleRevealDone() {
    if (claiming) {
      await supabase.from('notifications').update({ claimed: true, read: true }).eq('id', claiming.notifId);
      setClaiming(null);
      refresh();
    }
  }

  async function markRead(n: Notification) {
    if (n.read) return;
    await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    refresh();
  }

  if (claiming) {
    return <RevealAnimation cards={[claiming.candidate]} type="base" onDone={handleRevealDone} />;
  }

  return (
    <div className="notif-wrap">
      <button
        className="notif-bell-btn"
        onClick={() => {
          setOpen((o) => !o);
          refresh();
        }}
        title="알림"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 10a6 6 0 1 1 12 0c0 3 1 5 1.5 6H4.5C5 15 6 13 6 10Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          {items.length === 0 ? (
            <p className="notif-empty">알림이 없어요.</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
                onClick={() => markRead(n)}
              >
                <p>{n.message}</p>
                {n.card_id && !n.claimed && (
                  <button
                    className="notif-claim-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim(n);
                    }}
                  >
                    카드 수령하기
                  </button>
                )}
                {n.card_id && n.claimed && <span className="notif-claimed-tag">수령 완료</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
