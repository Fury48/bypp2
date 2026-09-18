import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SignageTitle } from '../../components/SignageTitle';
import { CardView } from '../../components/Card';
import type { Card } from '../../types';

interface Profile {
  id: string;
  nickname: string;
}

export function SocialScreen() {
  const [nicknameInput, setNicknameInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [target, setTarget] = useState<Profile | null>(null);
  const [tab, setTab] = useState<'cards' | 'compliment'>('cards');
  const [targetCards, setTargetCards] = useState<Card[]>([]);

  const [myCompliment, setMyCompliment] = useState<string | null>(null);
  const [complimentInput, setComplimentInput] = useState('');
  const [complimentLoading, setComplimentLoading] = useState(false);
  const [complimentError, setComplimentError] = useState<string | null>(null);
  const [complimentSent, setComplimentSent] = useState(false);

  async function handleSearch() {
    const nickname = nicknameInput.trim();
    if (!nickname) return;
    setSearching(true);
    setSearchError(null);
    setTarget(null);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('nickname', nickname)
      .maybeSingle();

    if (!profile) {
      setSearchError('그런 닉네임의 유저를 찾을 수 없어요.');
      setSearching(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const myId = userData.user?.id;

    const [{ data: cards }, { data: existingCompliment }] = await Promise.all([
      supabase.from('cards').select('*').eq('user_id', profile.id).order('created_at', { ascending: true }),
      myId
        ? supabase
            .from('compliments')
            .select('text')
            .eq('from_user_id', myId)
            .eq('to_user_id', profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setTarget(profile);
    setTargetCards(cards ?? []);
    setMyCompliment(existingCompliment?.text ?? null);
    setComplimentSent(false);
    setComplimentInput('');
    setTab('cards');
    setSearching(false);
  }

  async function handleSendCompliment() {
    if (!target || !complimentInput.trim()) return;
    setComplimentLoading(true);
    setComplimentError(null);
    const { error } = await supabase.functions.invoke('social-compliment', {
      body: { toUserId: target.id, text: complimentInput.trim() },
    });
    if (error) {
      setComplimentError(error.message ?? '전달에 실패했어요.');
    } else {
      setMyCompliment(complimentInput.trim());
      setComplimentSent(true);
    }
    setComplimentLoading(false);
  }

  return (
    <div className="social-screen">
      <SignageTitle title="SOCIAL" subtitle="다른 사람의 강점을 구경해보세요" />

      <div className="social-search">
        <input
          className="social-search-input"
          placeholder="닉네임을 입력하세요"
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="social-search-btn" onClick={handleSearch} disabled={searching || !nicknameInput.trim()}>
          {searching ? '찾는 중...' : '조회'}
        </button>
      </div>
      {searchError && <div className="social-error">{searchError}</div>}

      {target && (
        <div className="social-result">
          <h2 className="social-target-name">{target.nickname}</h2>
          <div className="social-tabs">
            <button
              className={`social-tab ${tab === 'cards' ? 'social-tab--active' : ''}`}
              onClick={() => setTab('cards')}
            >
              카드 보기
            </button>
            <button
              className={`social-tab ${tab === 'compliment' ? 'social-tab--active' : ''}`}
              onClick={() => setTab('compliment')}
            >
              장점 남기기
            </button>
          </div>

          {tab === 'cards' && (
            <div className="social-cards-grid">
              {targetCards.length === 0 ? (
                <p className="deck-empty">아직 발견한 강점이 없어요.</p>
              ) : (
                targetCards.map((c) => (
                  <CardView key={c.id} name={c.name} description={c.description} type={c.type} subtype={c.subtype} />
                ))
              )}
            </div>
          )}

          {tab === 'compliment' && (
            <div className="social-compliment">
              {myCompliment ? (
                <div className="social-compliment-done">
                  <p>{complimentSent ? '강점을 전달했어요!' : '이미 남긴 강점이에요:'}</p>
                  <p className="social-compliment-text">"{myCompliment}"</p>
                </div>
              ) : (
                <>
                  <textarea
                    className="discover-answer"
                    placeholder={`${target.nickname}님의 장점이나 매력을 적어주세요...`}
                    value={complimentInput}
                    onChange={(e) => setComplimentInput(e.target.value)}
                    rows={4}
                  />
                  {complimentError && <div className="social-error">{complimentError}</div>}
                  <button
                    className="discover-submit"
                    onClick={handleSendCompliment}
                    disabled={complimentLoading || !complimentInput.trim()}
                  >
                    {complimentLoading ? '전달 중...' : '전달하기'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
