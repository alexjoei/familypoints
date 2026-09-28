import { supabase } from './supabase';

export type Invitation = { code: string; expires: string };

export async function getInvitation(groupId: string, rotate = false): Promise<Invitation> {
  if (!supabase) throw new Error('not_configured');
  const { data, error } = await supabase.rpc('fp_invite', {
    p_group: groupId,
    p_rotate: rotate,
  });
  if (error) throw error;
  const invitation = data as Invitation;
  if (!rotate && (invitation.code.length > 12 || new Date(invitation.expires).getTime() <= Date.now()))
    return getInvitation(groupId, true);
  return invitation;
}
