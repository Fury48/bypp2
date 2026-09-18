import { corsHeaders } from '../_shared/cors.ts';
import { callGroqTool } from '../_shared/groq.ts';

interface CombineResult {
  candidates: { name: string; description: string }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cards } = await req.json();
    if (!Array.isArray(cards) || cards.length < 2 || cards.length > 3) {
      return new Response(JSON.stringify({ error: 'cards must be an array of 2 or 3 card names' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const cardList = cards.map((name: string, i: number) => `강점 카드 ${String.fromCharCode(65 + i)}: ${name}`).join('\n');

    const result = await callGroqTool<CombineResult>({
      system:
        `${cards.length}개의 강점 카드를 조합했을 때 나타날 수 있는 "새로운 잠재력"을 제안하는 역할입니다. ` +
        '정답은 없습니다. 이 강점들이 만났을 때 나올 수 있는 서로 다른 3가지 가능성을 제안하세요. ' +
        '각 후보는 이름(2~8글자)과 한 줄 설명으로 구성됩니다. 단정적으로 말하지 말고, ' +
        '사용자가 스스로 가장 맞는 것을 고를 수 있도록 서로 다른 관점의 3가지를 제시하세요.',
      userMessage: cardList,
      toolName: 'report_candidates',
      toolDescription: '강점 조합에서 나올 수 있는 3가지 새로운 잠재력 후보를 보고합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          candidates: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['name', 'description'],
            },
          },
        },
        required: ['candidates'],
      },
    });

    if (!Array.isArray(result.candidates) || result.candidates.length !== 3) {
      throw new Error('Groq did not return exactly 3 candidates');
    }

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
