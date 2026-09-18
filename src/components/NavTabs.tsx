export type Screen = 'discover' | 'deck' | 'forge' | 'codex' | 'social';

const TABS: { id: Screen; label: string; sublabel: string; icon: JSX.Element }[] = [
  {
    id: 'deck',
    label: 'MY DECK',
    sublabel: '내 카드 보기',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="4" width="11" height="15" rx="1.5" transform="rotate(-6 10 11)" />
        <rect x="7" y="5" width="12" height="16" rx="1.5" fill="var(--bg-void)" />
      </svg>
    ),
  },
  {
    id: 'forge',
    label: 'FORGE',
    sublabel: '조합하기',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 18h9a2 2 0 0 0 2-2v-1H4z" />
        <path d="M9 15V9c0-1.7 1.3-3 3-3s3 1.3 3 3" />
        <path d="M9 6h6" />
        <path d="M7 20h6" />
      </svg>
    ),
  },
  {
    id: 'codex',
    label: 'CODEX',
    sublabel: '도감 보기',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
        <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z" />
      </svg>
    ),
  },
  {
    id: 'discover',
    label: 'DISCOVER',
    sublabel: '새 강점 찾기',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M15 9l-4 3-2 4 4-3z" />
      </svg>
    ),
  },
  {
    id: 'social',
    label: 'SOCIAL',
    sublabel: '친구 둘러보기',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="3" />
        <path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
        <circle cx="17" cy="8" r="2.3" />
        <path d="M14.8 13.8c2.5.2 4.5 2.4 4.5 5.2" />
      </svg>
    ),
  },
];

export function NavTabs({
  active,
  onChange,
  locked = false,
}: {
  active: Screen;
  onChange: (s: Screen) => void;
  locked?: boolean;
}) {
  return (
    <nav className="nav-tabs">
      {TABS.map((tab, i) => {
        const disabled = locked && tab.id !== 'discover';
        return (
          <div className="nav-tabs__item-wrap" key={tab.id}>
            <button
              className={`nav-tabs__btn ${active === tab.id ? 'nav-tabs__btn--active' : ''} ${disabled ? 'nav-tabs__btn--disabled' : ''}`}
              onClick={() => !disabled && onChange(tab.id)}
              disabled={disabled}
              title={disabled ? '온보딩 질문을 먼저 완료해주세요' : undefined}
            >
              <span className="nav-tabs__icon">{tab.icon}</span>
              <span className="nav-tabs__label">{tab.label}</span>
              <span className="nav-tabs__sublabel">{tab.sublabel}</span>
            </button>
            {i < TABS.length - 1 && <span className="nav-tabs__divider" />}
          </div>
        );
      })}
    </nav>
  );
}
