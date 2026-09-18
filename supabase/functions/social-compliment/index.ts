import { corsHeaders } from '../_shared/cors.ts';
import { callGroqTool } from '../_shared/groq.ts';

interface ExtractResult {
  name: string;
  description: string;
  subtype: 'character' | 'talent';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'content-type': 'application/json' };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'missing Authorization header' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'invalid session' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }
    const fromUser = await userRes.json();
    const fromUserId: string = fromUser.id;

    const { toUserId, text } = await req.json();
    if (!toUserId || !text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'toUserId and text are required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    if (toUserId === fromUserId) {
      return new Response(JSON.stringify({ error: '자기 자신에게는 남길 수 없어요.' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const svc = (path: string, init: RequestInit = {}) =>
      fetch(`${supabaseUrl}/rest/v1/${path}`, {
        ...init,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
          ...(init.headers ?? {}),
        },
      });

    const fromProfileRes = await svc(`profiles?id=eq.${fromUserId}&select=nickname`);
    const fromProfile = (await fromProfileRes.json())[0];
    const fromNickname = fromProfile?.nickname ?? '누군가';

    const extracted = await callGroqTool<ExtractResult>({
      system:
        '당신은 어떤 사람에 대해 다른 사람이 남긴 한줄평에서 그 사람의 "강점 카드"를 만드는 역할입니다. ' +
        '입력된 글은 제3자가 이 사람에 대해 느낀 장점이나 매력입니다. ' +
        '이를 바탕으로 짧은 카드 이름(2~6글자)과 한 줄 설명을 만들고, ' +
        'subtype을 "character"(성향·태도·기질) 또는 "talent"(구체적 기술·재능) 중 하나로 분류하세요. ' +
        '과장하지 말고 글의 내용에 근거해 현실적으로 만드세요.',
      userMessage: text,
      temperature: 0.3,
      toolName: 'report_card',
      toolDescription: '한줄평에서 추출한 강점 카드를 보고합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          subtype: { type: 'string', enum: ['character', 'talent'] },
        },
        required: ['name', 'description', 'subtype'],
      },
    });

    const cardRes = await svc('cards', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: toUserId,
        name: extracted.name,
        description: extracted.description,
        type: 'base',
        subtype: extracted.subtype,
      }),
    });
    if (!cardRes.ok) throw new Error(`failed to create card: ${await cardRes.text()}`);
    const [newCard] = await cardRes.json();

    const complimentRes = await svc('compliments', {
      method: 'POST',
      body: JSON.stringify({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        text,
        card_id: newCard.id,
      }),
    });
    if (!complimentRes.ok) {
      const errText = await complimentRes.text();
      if (errText.includes('duplicate key')) {
        return new Response(JSON.stringify({ error: '이미 이 사람에게 강점을 남겼어요.' }), {
          status: 409,
          headers: jsonHeaders,
        });
      }
      throw new Error(`failed to record compliment: ${errText}`);
    }

    await svc('notifications', {
      method: 'POST',
      body: JSON.stringify({
        user_id: toUserId,
        message: `${fromNickname}님이 장점 카드를 남겨주었습니다.`,
        card_id: newCard.id,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown error' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
