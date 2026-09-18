# 강점의 조각 (bypp2)

질문에 답하며 자신의 강점을 발견하고, 카드로 모으고, 조합해 새로운 잠재력을 찾아가는 자기발견 카드 수집 웹 게임입니다.

## 게임 흐름

1. **가입 & 온보딩** — 닉네임으로 가입 후, 자신에 대한 5개의 질문에 답하며 첫 강점 카드를 얻습니다.
2. **Discover** — 온보딩 이후 매일 전 유저 공통 질문이 하나씩 올라오고, 답변에서 AI가 구체적인 강점 카드를 추출해 지급합니다.
3. **Forge** — 보유한 카드 2~3장을 조합대에 올리면 AI가 새로운 "잠재력" 후보 3개를 제시하고, 그중 하나를 골라 융합(composite) 카드를 얻습니다. 하루 3회로 제한됩니다.
4. **Codex** — 지금까지 발견한 조합과 아직 시도하지 않은 조합을 도감 형태로 보여줍니다. 융합 카드를 3장 이상 모으면, 보유 카드 전체를 근거로 "지나가는 현자"가 한 줄 진단·판단 근거·추천 자기계발 활동을 생성해 보여줍니다.
5. **Social** — 닉네임으로 다른 유저를 검색해 카드를 구경하고, 내가 느낀 그 사람의 장점을 한 줄 남길 수 있습니다. 이 코멘트는 AI를 통해 카드로 변환되어 상대방에게 알림과 함께 지급됩니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript, Vite, GSAP(연출 애니메이션)
- **Backend**: Supabase — Postgres(+ Row Level Security), Auth, Realtime, Edge Functions(Deno)
- **AI**: Groq(`openai/gpt-oss-20b`)를 Edge Function에서 tool-calling 방식으로 호출해 카드 생성·조합·진단 텍스트를 만듭니다.

## 아키텍처

### 클라이언트 (`src/`)

- `screens/` — 화면 단위 컴포넌트 (Auth, Discover, Forge, Codex, MyDeck, Social)
- `components/` — 공용 UI (카드, 하단 탭, 알림 벨, 타이틀 배너)
- `hooks/useCards.ts` — 로그인한 유저의 카드 목록을 불러오고 갱신
- `data/questions.ts` — 온보딩/데일리 질문 정의와 진행 상태 계산
- `lib/supabase.ts` — Supabase 클라이언트 초기화

화면 전환은 `App.tsx`의 로컬 상태로 관리되며, 온보딩을 마치지 않은 유저는 Discover 탭에 잠겨 있습니다(`NavTabs`의 `locked`).

### 서버 (`supabase/`)

- `migrations/` — `cards`, `profiles`, `compliments`, `notifications` 테이블과 RLS 정책
- `functions/discover-extract` — 질문 답변 → 강점 카드 1~3장 추출
- `functions/forge-combine` — 카드 조합 → 새로운 잠재력 후보 3개 제안
- `functions/social-compliment` — 다른 유저에게 남긴 한줄평 → 카드 생성 + 알림 발송(서비스 롤 키 사용)
- `functions/codex-report` — 보유 카드 전체 → "지나가는 현자"의 진단·추천 활동 생성
- `functions/_shared` — CORS 헤더, Groq 호출 공통 유틸

### 데이터 모델

- `cards` — `type`(base/composite), `subtype`(character/talent), 조합 시 `parent_a/b/c_id`로 계보를 기록
- `profiles` — 닉네임(유니크), 소셜 검색에 사용
- `compliments` — 유저 쌍(from/to)당 1회로 제한된 한줄평 기록
- `notifications` — 카드 지급 알림, Realtime으로 즉시 반영

## 로컬 개발

```bash
npm install
cp .env.local.example .env.local   # Supabase URL / anon key 입력
npm run dev
```

Edge Function을 수정했다면 배포도 필요합니다.

```bash
npx supabase login
npx supabase functions deploy <function-name> --project-ref <project-ref>
```
