import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useControlPlane } from '../auth/ControlPlane';
import { Lab, type RuntimeContext } from './Lab';

export default function ScaleGate() {
  const { organization, getToken } = useControlPlane();
  const [state, setState] = useState<'loading' | 'blocked' | 'ready' | 'error'>('loading');
  const [context, setContext] = useState<RuntimeContext | null>(null);

  useEffect(() => {
    let active = true;
    async function verify() {
      try {
        const token = await getToken();
        const query = new URLSearchParams({ organizationId: organization.id });
        const response = await fetch(`/api/minuta?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 409) { if (active) setState('blocked'); return; }
        if (!response.ok) throw new Error('unavailable');
        const body = await response.json();
        if (active) { setContext(body.context); setState('ready'); }
      } catch { if (active) setState('error'); }
    }
    verify();
    return () => { active = false; };
  }, [getToken, organization.id]);

  if (state === 'ready' && context) return <Lab initialContext={context} />;
  if (state === 'loading') return <main className="shell-session-state" role="status">VERIFICANDO VERSIÓN…</main>;
  return <main className="shell-session-state"><LockKeyhole size={28} /><strong>{state === 'blocked' ? 'CONSTRUYE UNA VERSIÓN PRIMERO' : 'NO PUDIMOS VERIFICAR LA VERSIÓN'}</strong><p>La Escala solo se abre después de guardar y aprobar la Radiografía.</p><a href="/lab/minuta-comite/radiografia">VOLVER A RADIOGRAFÍA</a></main>;
}
