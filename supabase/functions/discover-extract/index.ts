import { corsHeaders } from '../_shared/cors.ts';
import { callGroqTool } from '../_shared/groq.ts';

interface ExtractResult {
  cards: { name: string; description: string; subtype: 'character' | 'talent' }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question, answer } = await req.json();
    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'question and answer are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await callGroqTool<ExtractResult>({
      system:
        '당신은 사용자의 답변에서 실제 "강점 카드"를 추출하는 역할입니다. ' +
        '질문과 답변이 주어지면, 답변에 등장하는 구체적인 행동·소재·대상을 근거로 ' +
        '강점을 1~3개, 짧은 카드 이름(2~6글자)과 한 줄 설명으로 추출하세요. ' +
        '카드 이름과 설명은 답변에 나온 구체적인 단어(예: 컴퓨터, 아이디어, 기획, 친구 등)와 ' +
        '직접 연결되어야 합니다. 답변과 무관한 일반적인 성격 단어(끈기, 노력 등)로 뭉뚱그리지 마세요.\n' +
        '예시: 답변이 "컴퓨터 문제를 자주 해결해준다"라면 → [문제 해결], [컴퓨터 활용] 같은 카드가 적절합니다.\n' +
        '답변에 구체적인 내용이 조금이라도 있다면 최소 1개 이상의 강점을 찾아내세요. ' +
        '하지만 답변이 "없음", "몰라요"처럼 실제로 추출할 내용이 전혀 없다면 ' +
        '절대 카드를 억지로 지어내지 말고 빈 배열을 반환하세요. "정보 없음" 같은 카드는 절대 만들지 마세요.\n' +
        '각 카드는 subtype을 반드시 "character" 또는 "talent" 중 하나로 분류하세요. ' +
        '"character"는 성향·태도·기질에 가까운 강점(예: 끈기, 공감, 침착함, 책임감), ' +
        '"talent"는 구체적인 기술·재능에 가까운 강점(예: 코딩, 글쓰기, 그림, 분석, 운동)입니다.',
      userMessage: `질문: ${question}\n답변: ${answer}`,
      temperature: 0.2,
      toolName: 'report_cards',
      toolDescription: '답변에서 추출한 강점 카드 목록을 보고합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            minItems: 0,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                subtype: { type: 'string', enum: ['character', 'talent'] },
              },
              required: ['name', 'description', 'subtype'],
            },
          },
        },
        required: ['cards'],
      },
    });

    result.cards = result.cards.slice(0, 3);

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
