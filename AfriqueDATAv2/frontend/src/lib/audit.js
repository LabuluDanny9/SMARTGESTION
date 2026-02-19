import { supabase } from './supabase';

/**
 * Enregistre une action dans le journal d'audit (si la table existe et que l'admin est connecté)
 */
export async function logAudit(action, entityType, entityId, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (err) {
    console.warn('Audit log failed:', err);
  }
}
