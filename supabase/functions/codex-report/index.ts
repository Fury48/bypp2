import { corsHeaders } from '../_shared/cors.ts';
import { callGroqTool } from '../_shared/groq.ts';

interface ReportResult {
  verdict: string;
  reason: string;
  missions: string[];
}

const SUBTYPE_LABEL: Record<string, string> = {
  character: '성격',
  talent: '재능',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cards } = await req.json();
    if (!Array.isArray(cards) || cards.length === 0) {
      return new Response(JSON.stringify({ error: 'cards must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const cardList = cards
      .map((c: { name: string; description?: string | null; type: string; subtype?: string | null }) => {
        const label = c.type === 'composite' ? '융합' : SUBTYPE_LABEL[c.subtype ?? ''] ?? '강점';
        return `[${label}] ${c.name}${c.description ? `: ${c.description}` : ''}`;
      })
      .join('\n');

    const result = await callGroqTool<ReportResult>({
      system:
        '당신은 여행 중 잠시 들른, 사람을 한눈에 꿰뚫어보는 지나가는 현자입니다. ' +
        '아래는 한 사람이 지금까지 모아온 강점 카드 목록입니다(성격/재능 카드와, 그것들을 조합해 만들어진 융합 카드 포함). ' +
        '이 카드들의 이름과 설명을 실제 근거로 삼아 이 사람을 진단하세요. ' +
        'verdict는 "당신은"이라는 말 뒤에 자연스럽게 이어지는 한 문장으로 이 사람을 정의하세요. ' +
        '(예: "겉으로는 차분하지만 속에는 뜨거운 실행력을 감춘 사람이군요.") ' +
        'reason은 왜 그렇게 판단했는지, 카드 이름과 내용을 구체적으로 언급하며 2~4문장으로 설명하세요. ' +
        'missions는 이 사람의 카드 조합에 비추어 지금 현실에서 시도해볼 만한 구체적 자기계발 활동을 2~3개 제안하세요. ' +
        '각 미션은 추상적인 조언이 아니라, 오늘이라도 실천할 수 있는 구체적 행동 한 문장이어야 합니다.',
      userMessage: cardList,
      temperature: 0.6,
      toolName: 'report_reading',
      toolDescription: '강점 카드 목록을 바탕으로 한 현자의 진단을 보고합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          verdict: { type: 'string' },
          reason: { type: 'string' },
          missions: {
            type: 'array',
            minItems: 2,
            maxItems: 3,
            items: { type: 'string' },
          },
        },
        required: ['verdict', 'reason', 'missions'],
      },
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
