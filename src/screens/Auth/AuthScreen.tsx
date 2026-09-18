import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { SignageTitle } from '../../components/SignageTitle';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data: existing } = await supabase.from('profiles').select('id').eq('nickname', nickname).maybeSingle();
      if (existing) {
        setError('이미 사용 중인 닉네임이에요.');
        setLoading(false);
        return;
      }

      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        const { error: profileError } = await supabase.from('profiles').insert({ id: userId, nickname });
        if (profileError) {
          setError('닉네임 등록에 실패했어요. 다른 닉네임으로 다시 시도해보세요: ' + profileError.message);
          setLoading(false);
          return;
        }
      }

      if (!data.session) setNotice('가입 완료! 이제 로그인해보세요.');
    }

    setLoading(false);
  }

  return (
    <div className="auth-screen">
      <SignageTitle title="강점의 조각" subtitle="나를 발견하고, 조합하고, 기록하세요" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          className="auth-input"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {mode === 'signup' && (
          <input
            className="auth-input"
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={16}
            required
          />
        )}
        {error && <div className="auth-error">{error}</div>}
        {notice && <div className="auth-notice">{notice}</div>}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
      <button
        className="auth-toggle"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
          setNotice(null);
        }}
      >
        {mode === 'login' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
      </button>
    </div>
  );
}
