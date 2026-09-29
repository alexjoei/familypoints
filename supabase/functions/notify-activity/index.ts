// Called by the acting member's own client right after a command succeeds.
// The event already happened (fp_action wrote it); this only fans it out as
// push to the OTHER members, using each recipient's own stored language and
// preferences. The caller's client never sees other members' tokens or
// prefs: this function reads them with the service role, which is only
// available server-side.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Copy = { title: string; body: string };
type Prefs = { requests: boolean; decisions: boolean; changes: boolean };
const defaultPrefs: Prefs = { requests: true, decisions: true, changes: false };

function notificationFor(
  event: { type: string; title: string; points: number | null; actor: string },
  proposal: { kind: string; author: string; electorate: string[] } | null,
  actorName: string,
  viewer: string,
  language: 'es' | 'en',
  prefs: Prefs,
): Copy | null {
  if (event.actor === viewer) return null;
  const es = language === 'es';
  if (prefs.decisions && event.type === 'granted' && proposal?.author === viewer) {
    return {
      title: es ? 'Te han otorgado puntos' : 'You got points',
      body: es
        ? `${actorName} te dio ${event.points} puntos por ${event.title}.`
        : `${actorName} gave you ${event.points} points for ${event.title}.`,
    };
  }
  if (proposal) {
    if (prefs.requests && ['submitted', 'resubmitted'].includes(event.type) && proposal.electorate.includes(viewer)) {
      const verbEs = proposal.kind === 'redemption' ? 'canjear' : 'sumar';
      const verbEn = proposal.kind === 'redemption' ? 'redeem' : 'add';
      return {
        title: es ? 'Te toca decidir' : 'Your call',
        body: es
          ? `${actorName} quiere ${verbEs} ${event.points} puntos por ${event.title}. Revisa y acepta o rechaza.`
          : `${actorName} wants to ${verbEn} ${event.points} points for ${event.title}. Review and decide.`,
      };
    }
    if (prefs.decisions && proposal.author === viewer) {
      if (event.type === 'adjusted')
        return {
          title: es ? 'Te proponen otros puntos' : 'A new points suggestion',
          body: es
            ? `${actorName} propone ${event.points} puntos para ${event.title}.`
            : `${actorName} suggests ${event.points} points for ${event.title}.`,
        };
      if (['approved', 'rejected'].includes(event.type))
        return {
          title:
            event.type === 'approved'
              ? proposal.kind === 'redemption'
                ? es ? 'Canje aprobado' : 'Redemption approved'
                : proposal.kind === 'contribution'
                  ? es ? '¡Puntos aceptados!' : 'Points approved!'
                  : es ? 'Acuerdo aprobado' : 'Agreement approved'
              : es ? 'Solicitud rechazada' : 'Request declined',
          body: es ? `${event.title} · ${event.points} puntos.` : `${event.title} · ${event.points} points.`,
        };
      if (['adjustment_accepted', 'adjustment_declined'].includes(event.type))
        return {
          title: es ? 'Respuesta al ajuste' : 'Adjustment reply',
          body: es ? `${actorName} ha respondido sobre ${event.title}.` : `${actorName} replied about ${event.title}.`,
        };
    }
  }
  if (prefs.changes && ['joined', 'member_removed', 'category', 'category_removed', 'template', 'template_removed'].includes(event.type)) {
    return { title: es ? 'Novedad en el grupo' : 'Group update', body: `${actorName}: ${event.title}` };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { groupId, eventId } = await req.json();
    if (!groupId || !eventId) return new Response('bad_request', { status: 400, headers: corsHeaders });

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const auth = req.headers.get('Authorization') ?? '';
    const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const asService = createClient(url, serviceKey);

    const { data: userData } = await asCaller.auth.getUser();
    const actorId = userData?.user?.id;
    if (!actorId) return new Response('unauthorized', { status: 401, headers: corsHeaders });

    // RLS on fp_activity/fp_proposals/fp_members restricts these to the
    // caller's own group, so a non-member gets zero rows here.
    const [{ data: eventRow }, { data: members }] = await Promise.all([
      asCaller.from('fp_activity').select('data').eq('group_id', groupId).filter('data->>id', 'eq', eventId).maybeSingle(),
      asCaller.from('fp_members').select('user_id,name').eq('group_id', groupId),
    ]);
    if (!eventRow?.data || !members) return new Response('ok', { headers: corsHeaders });
    const event = eventRow.data as { id: string; type: string; title: string; points: number | null; proposalId: string | null; actor: string };
    if (event.actor !== actorId) return new Response('ok', { headers: corsHeaders });

    let proposal: { kind: string; author: string; electorate: string[] } | null = null;
    if (event.proposalId) {
      const { data } = await asCaller.from('fp_proposals').select('data').eq('group_id', groupId).eq('id', event.proposalId).maybeSingle();
      if (data?.data) proposal = data.data;
    }

    const actorName = (members as { user_id: string; name: string }[]).find((m) => m.user_id === actorId)?.name ?? 'Family Points';
    const recipientIds = (members as { user_id: string; name: string }[]).map((m) => m.user_id).filter((id) => id !== actorId);
    if (!recipientIds.length) return new Response('ok', { headers: corsHeaders });

    const { data: prefRows } = await asService.from('fp_notification_prefs').select('user_id,prefs,language').in('user_id', recipientIds);
    const prefsByUser = new Map((prefRows ?? []).map((r: { user_id: string; prefs: Prefs; language: 'es' | 'en' }) => [r.user_id, r]));

    const copyByRecipient = new Map<string, Copy>();
    for (const id of recipientIds) {
      const row = prefsByUser.get(id);
      const copy = notificationFor(event, proposal, actorName, id, row?.language ?? 'es', row?.prefs ?? defaultPrefs);
      if (copy) copyByRecipient.set(id, copy);
    }
    if (!copyByRecipient.size) return new Response('ok', { headers: corsHeaders });

    const { data: tokenRows } = await asService
      .from('fp_push_tokens')
      .select('user_id,token')
      .in('user_id', Array.from(copyByRecipient.keys()));

    const messages = (tokenRows ?? [])
      .map((t: { user_id: string; token: string }) => {
        const copy = copyByRecipient.get(t.user_id);
        return copy && { to: t.token, title: copy.title, body: copy.body, sound: 'default', data: { proposalId: event.proposalId ?? '', eventId } };
      })
      .filter(Boolean)
      .filter((message, index, all) => all.findIndex((other) => other?.to === message?.to) === index);
    if (!messages.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // The unique database claim is atomic across concurrent requests. Do not
    // release it after a partial send: a retry could duplicate earlier pushes.
    const { data: claimed, error: claimError } = await asService.rpc('fp_claim_push_event', {
      p_group: groupId,
      p_event: eventId,
    });
    if (claimError) throw claimError;
    if (!claimed) return new Response(JSON.stringify({ sent: 0, duplicate: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    for (let i = 0; i < messages.length; i += 100) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
      if (!response.ok) throw new Error(`Expo push HTTP ${response.status}: ${await response.text()}`);
      const result = await response.json();
      const tickets = Array.isArray(result.data) ? result.data : [result.data];
      for (const ticket of tickets) {
        if (ticket?.status === 'error') {
          console.error('Expo push ticket rejected', ticket.details ?? ticket.message);
          throw new Error(`Expo push ticket rejected: ${ticket.message ?? 'unknown error'}`);
        }
      }
    }
    return new Response(JSON.stringify({ sent: messages.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('notify-activity failed', error);
    return new Response('push_failed', { status: 500, headers: corsHeaders });
  }
});
