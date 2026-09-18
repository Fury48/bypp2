import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { NavTabs, type Screen } from './components/NavTabs';
import { supabase } from './lib/supabase';
import { useCards } from './hooks/useCards';
import { isOnboardingComplete } from './data/questions';
import { AuthScreen } from './screens/Auth/AuthScreen';
import { DiscoverScreen } from './screens/Discover/DiscoverScreen';
import { MyDeckScreen } from './screens/MyDeck/MyDeckScreen';
import { ForgeScreen } from './screens/Forge/ForgeScreen';
import { CodexScreen } from './screens/Codex/CodexScreen';
import { SocialScreen } from './screens/Social/SocialScreen';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [screen, setScreen] = useState<Screen>('codex');
  const { cards, loading, refresh } = useCards();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  const onboardingDone = isOnboardingComplete(cards);

  useEffect(() => {
    if (!loading && !onboardingDone) setScreen('discover');
  }, [loading, onboardingDone]);

  if (session === undefined) {
    return <div className="app-loading">불러오는 중...</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="app">
      <button className="settings-btn" onClick={() => supabase.auth.signOut()} title="로그아웃">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
        </svg>
      </button>
      <main className="app-main">
        {screen === 'discover' && (
          <DiscoverScreen cards={cards} refresh={refresh} onOnboardingComplete={() => setScreen('deck')} />
        )}
        {screen === 'deck' && <MyDeckScreen cards={cards} />}
        {screen === 'forge' && <ForgeScreen cards={cards} refresh={refresh} />}
        {screen === 'codex' && <CodexScreen cards={cards} />}
        {screen === 'social' && <SocialScreen />}
      </main>
      <NavTabs active={screen} onChange={setScreen} locked={!onboardingDone} />
    </div>
  );
}
