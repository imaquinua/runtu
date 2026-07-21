import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useControlPlane } from '../auth/ControlPlane';
import { Lab } from './Lab';

export default function ScaleGate() {
  const { organization, getToken } = useControlPlane();
  const [state, setState] = useState<'loading' | 'blocked' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    async function verify() {
      try {
        const token = await getToken();
        const query = new URLSearchParams({ organizationId: organization.id });
        const response = await fetch(`/api/radiography?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('unavailable');
        const body = await response.json();
        if (active) setState(body.radiography?.status === 'BUILT' ? 'ready' : 'blocked');
      } catch { if (active) setState('error'); }
    }
    verify();
    return () => { active = false; };
  }, [getToken, organization.id]);

  if (state === 'ready') return <Lab />;
  if (state === 'loading') return <main className="shell-session-state" role="status">VERIFICANDO VERSIÓN…</main>;
  return <main className="shell-session-state"><LockKeyhole size={28} /><strong>{state === 'blocked' ? 'CONSTRUYE UNA VERSIÓN PRIMERO' : 'NO PUDIMOS VERIFICAR LA VERSIÓN'}</strong><p>La Escala solo se abre después de guardar y aprobar la Radiografía.</p><a href="/lab/minuta-comite/radiografia">VOLVER A RADIOGRAFÍA</a></main>;
}
