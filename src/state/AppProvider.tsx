import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { applyCommand, Command, Group, Language, recordSeen, SeenReceipt } from '../domain/model';
import { createDemo } from '../domain/demo';
import { finishNativeAuth, supabase } from '../lib/supabase';
import { isThemeId, ThemeId } from '../theme/themes';

type Summary = { id: string; name: string };
type Context = {
  ready: boolean;
  busy: boolean;
  group: Group | null;
  actor: string;
  demo: boolean;
  session: Session | null;
  groups: Summary[];
  language: Language;
  humor: boolean;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  recovery: boolean;
  error: string | null;
  t: (es: string, en: string) => string;
  setLanguage: (l: Language) => void;
  setHumor: (v: boolean) => void;
  startDemo: () => Promise<void>;
  switchActor: (id: string) => void;
  exit: () => Promise<void>;
  execute: (cmd: Command) => Promise<boolean>;
  markSeen: (id: string, revision: number) => Promise<void>;
  refresh: () => Promise<void>;
  selectGroup: (id: string) => Promise<void>;
  openGroups: () => Promise<void>;
  createGroup: (name: string, display: string) => Promise<void>;
  joinGroup: (code: string, display: string) => Promise<void>;
  report: (e: unknown) => void;
  clearError: () => void;
  setRecovery: (v: boolean) => void;
};
const Ctx = createContext<Context | null>(null);
const errorCopy: Record<string, [string, string]> = {
  invalid_points: [
    'Usa puntos enteros entre 1 y 100.000.',
    'Use whole points between 1 and 100,000.',
  ],
  invalid_text: [
    'Revisa el texto: no puede estar vacío ni ser demasiado largo.',
    'Check the text: it cannot be empty or too long.',
  ],
  invalid_note: [
    'La nota admite hasta 1.000 caracteres.',
    'Notes can have up to 1,000 characters.',
  ],
  invalid_date: ['Usa una fecha válida: AAAA-MM-DD.', 'Use a valid date: YYYY-MM-DD.'],
  insufficient_balance: [
    'Todavía no tienes suficientes puntos disponibles.',
    'You do not have enough available points yet.',
  ],
  self_vote: [
    'Tu aportación necesita el voto de otras personas.',
    'Your contribution needs votes from other people.',
  ],
  already_voted: ['Tu voto ya está registrado.', 'Your vote is already recorded.'],
  stale_revision: [
    'La propuesta ha cambiado. Actualiza y revisa el nuevo valor.',
    'The proposal changed. Refresh and review the new value.',
  ],
  already_closed: [
    'Esta propuesta ya está resuelta. Actualiza para verla.',
    'This proposal is already closed. Refresh to see it.',
  ],
  adjustment_pending: [
    'El autor debe responder primero al ajuste propuesto.',
    'The author must respond to the proposed adjustment first.',
  ],
  invalid_invite: [
    'El código no existe o ha caducado. Pide una nueva invitación.',
    'This code is invalid or expired. Ask for a new invitation.',
  ],
  not_member: ['No tienes acceso a este grupo.', 'You do not have access to this group.'],
  owner_only: [
    'Solo quien administra el grupo puede hacer este cambio.',
    'Only the group administrator can make this change.',
  ],
  author_only: ['Esta decisión corresponde al autor.', 'This decision belongs to the author.'],
  not_allowed: ['Esta acción no está disponible.', 'This action is not available.'],
  duplicate: ['Ya existe. Actualiza para comprobarlo.', 'Already exists. Refresh to check.'],
  invalid_category: ['Selecciona una categoría del grupo.', 'Choose a group category.'],
  invalid_template: [
    'La plantilla ha cambiado. Selecciónala de nuevo.',
    'The template changed. Select it again.',
  ],
  invalid_reward: ['La recompensa todavía no está aprobada.', 'The reward is not approved yet.'],
  not_configured: [
    'El acceso real se activará al conectar el servicio. Mientras, puedes probar la demo.',
    'Live sign-in will be enabled when the service is connected. You can try the demo meanwhile.',
  ],
};
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [group, setGroup] = useState<Group | null>(null);
  const [demo, setDemo] = useState(false),
    [actor, setActor] = useState(''),
    [session, setSession] = useState<Session | null>(null);
  const [groups, setGroups] = useState<Summary[]>([]),
    [language, setLang] = useState<Language>('es'),
    [humor, setHum] = useState(true);
  const [themeId, setThemeId] = useState<ThemeId>('pop');
  const [error, setError] = useState<string | null>(null),
    [recovery, setRecovery] = useState(false);
  const groupRef = useRef(group);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);
  const locked = useRef(false),
    epoch = useRef(0);
  const pendingRequests = useRef(new Map<string, string>());
  const seenRequests = useRef(new Set<string>());
  const demoWrites = useRef(Promise.resolve());
  const persistDemo = useCallback((next: Group) => {
    const write = demoWrites.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem('fp.demo.couple.v2', JSON.stringify(next)));
    demoWrites.current = write;
    return write;
  }, []);
  const markSeen = useCallback(
    async (id: string, revision: number) => {
      const current = groupRef.current;
      if (!current || locked.current) return;
      const p = current.proposals.find((p) => p.id === id);
      if (
        !p ||
        !p.electorate.includes(actor) ||
        p.revision !== revision ||
        p.seen?.some((r) => r.actor === actor && r.revision === revision)
      )
        return;
      const request = `${current.id}:${id}:${revision}:${actor}`;
      if (seenRequests.current.has(request)) return;
      seenRequests.current.add(request);
      try {
        if (demo) {
          const next = recordSeen(current, actor, id, revision);
          groupRef.current = next;
          setGroup(next);
          await persistDemo(next);
        } else {
          const { data, error } = await supabase!.rpc('fp_mark_seen', {
            p_group: current.id,
            p_proposal: id,
            p_revision: revision,
          });
          if (error) throw error;
          const latest = groupRef.current;
          if (!latest || latest.id !== current.id) return;
          const receipt = data as SeenReceipt;
          const next = {
            ...latest,
            proposals: latest.proposals.map((p) =>
              p.id === id
                ? {
                    ...p,
                    seen: [
                      ...(p.seen ?? []).filter((r) => r.actor !== actor || r.revision !== revision),
                      receipt,
                    ],
                  }
                : p,
            ),
          };
          groupRef.current = next;
          setGroup(next);
        }
      } finally {
        seenRequests.current.delete(request);
      }
    },
    [actor, demo, persistDemo],
  );
  const t = (es: string, en: string) => (language === 'es' ? es : en);
  function report(e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e && 'message' in e
          ? String(e.message)
          : '';
    const known = Object.keys(errorCopy).find((code) => message.includes(code));
    if (known) setError(errorCopy[known][language === 'es' ? 0 : 1]);
    else if (/Invalid login credentials/.test(message))
      setError(t('Correo o contraseña incorrectos.', 'Incorrect email or password.'));
    else if (/Email not confirmed/.test(message))
      setError(t('Confirma tu correo antes de entrar.', 'Confirm your email before signing in.'));
    else
      setError(
        t(
          'No se ha podido completar. Comprueba la conexión y vuelve a intentarlo.',
          'Could not complete this. Check your connection and try again.',
        ),
      );
  }
  useEffect(() => {
    let alive = true;
    const subscription = supabase?.auth.onAuthStateChange((event, next) => {
      if (!alive) return;
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    Promise.all([AsyncStorage.getItem('fp.preferences'), supabase?.auth.getSession()])
      .then(([prefs, result]) => {
        if (!alive) return;
        if (prefs) {
          const p = JSON.parse(prefs);
          setLang(p.language === 'en' ? 'en' : 'es');
          setHum(p.humor !== false);
          if (isThemeId(p.themeId)) setThemeId(p.themeId);
        }
        if (result?.error) throw result.error;
        if (result) setSession(result.data.session);
      })
      .catch(() => {
        if (alive) setError('No se pudo restaurar la sesión / Could not restore your session.');
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    const link = Linking.addEventListener('url', ({ url }) => {
      finishNativeAuth(url).catch(() =>
        setError('No se pudo completar el acceso / Sign-in could not be completed.'),
      );
    });
    Linking.getInitialURL()
      .then((url) => {
        if (url) return finishNativeAuth(url);
      })
      .catch(() => setError('Enlace de acceso inválido / Invalid sign-in link.'));
    return () => {
      alive = false;
      subscription?.data.subscription.unsubscribe();
      link.remove();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem('fp.preferences', JSON.stringify({ language, humor, themeId })).catch(() =>
      setError(t('No se guardaron tus preferencias.', 'Your preferences could not be saved.')),
    );
    // Preferences are independent of session and group data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, humor, themeId, ready]);
  useEffect(() => {
    if (demo) return;
    const generation = ++epoch.current;
    // External authentication boundary: never keep another account's group visible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroup(null);
    setGroups([]);
    setActor(session?.user.id ?? '');
    if (session && supabase)
      supabase.rpc('fp_my_groups').then(({ data, error }) => {
        if (generation !== epoch.current) return;
        if (error) report(error);
        else setGroups(data as Summary[]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, demo]);
  async function selectGroup(id: string) {
    if (!supabase) return;
    const generation = ++epoch.current;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('fp_snapshot', { p_group: id });
      if (error) throw error;
      if (generation === epoch.current) setGroup(data as Group);
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    const current = groupRef.current;
    if (demo || !current || !supabase) return;
    const generation = epoch.current;
    const { data, error } = await supabase.rpc('fp_snapshot', { p_group: current.id });
    if (error) throw error;
    if (generation === epoch.current && !locked.current) setGroup(data as Group);
  }
  useEffect(() => {
    if (demo || !group?.id) return;
    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, 15000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh().catch(() => {});
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, group?.id]);
  async function execute(cmd: Command) {
    if (locked.current || !groupRef.current) return false;
    const fingerprint = `${groupRef.current.id}:${actor}:${JSON.stringify(cmd)}`;
    const request = pendingRequests.current.get(fingerprint) ?? Crypto.randomUUID();
    pendingRequests.current.set(fingerprint, request);
    locked.current = true;
    epoch.current++;
    setBusy(true);
    setError(null);
    try {
      let next: Group;
      if (demo) {
        next = applyCommand(groupRef.current, actor, cmd);
        await persistDemo(next);
      } else {
        const { data, error } = await supabase!.rpc('fp_action', {
          p_group: groupRef.current.id,
          p_command: cmd,
          p_request: request,
        });
        if (error) throw error;
        next = data as Group;
      }
      groupRef.current = next;
      setGroup(next);
      pendingRequests.current.delete(fingerprint);
      return true;
    } catch (e) {
      report(e);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function startDemo() {
    const raw = await AsyncStorage.getItem('fp.demo.couple.v2');
    let value: Group;
    try {
      value = raw ? JSON.parse(raw) : createDemo(language);
      if (value.id !== 'demo' || !Array.isArray(value.proposals)) throw new Error();
      if (!value.proposals.some((p) => p.kind === 'debt_limit' && p.status === 'approved'))
        value.debtLimit = 0;
    } catch {
      value = createDemo(language);
    }
    epoch.current++;
    setDemo(true);
    setActor('alex');
    setGroup(value);
    setError(null);
  }
  async function exit() {
    if (busy) return;
    epoch.current++;
    if (!demo && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setGroup(null);
    setDemo(false);
    setActor('');
    setError(null);
  }
  async function createGroup(name: string, display: string) {
    if (!supabase) throw new Error('not_configured');
    const { data, error } = await supabase.rpc('fp_create_group', {
      p_name: name.trim(),
      p_display_name: display.trim(),
      p_language: language,
    });
    if (error) throw error;
    setGroups((old) => [...old, { id: data, name }]);
    await selectGroup(data);
  }
  async function joinGroup(code: string, display: string) {
    if (!supabase) throw new Error('not_configured');
    const { data, error } = await supabase.rpc('fp_join_group', {
      p_code: code.replace(/[\s-]/g, '').toLowerCase(),
      p_display_name: display.trim(),
    });
    if (error) throw error;
    await selectGroup(data);
    await AsyncStorage.removeItem('fp.pendingInvite');
  }
  async function openGroups() {
    if (demo || !supabase || busy) return;
    epoch.current++;
    groupRef.current = null;
    setGroup(null);
    const { data, error } = await supabase.rpc('fp_my_groups');
    if (error) throw error;
    setGroups(data as Summary[]);
  }
  return (
    <Ctx.Provider
      value={{
        ready,
        busy,
        group,
        actor,
        demo,
        session,
        groups,
        language,
        humor,
        themeId,
        setThemeId,
        recovery,
        error,
        t,
        setLanguage: setLang,
        setHumor: setHum,
        startDemo,
        switchActor: (id) => {
          if (demo && !busy) setActor(id);
        },
        exit,
        execute,
        markSeen,
        refresh,
        selectGroup,
        openGroups,
        createGroup,
        joinGroup,
        report,
        clearError: () => setError(null),
        setRecovery,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AppProvider missing');
  return ctx;
}
