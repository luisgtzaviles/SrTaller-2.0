import { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  getUserPreferences,
  updateUserPreferences,
} from '../user-preferences-api.js';
import type { NewRepairFormMode } from '../user-preferences-api.js';

export type UserPreferencesState = Readonly<{
  mode: NewRepairFormMode;
  status: 'loading' | 'ready' | 'fallback';
  saving: boolean;
  priceListShowReferenceCost: boolean;
  message: string | null;
  setMode(mode: NewRepairFormMode): Promise<void>;
  setPriceListShowReferenceCost(show: boolean): Promise<void>;
}>;

const UserPreferencesContext = createContext<UserPreferencesState | null>(null);

export function UserPreferencesProvider({
  csrfToken,
  children,
}: Readonly<{
  csrfToken: string;
  children: React.ReactNode;
}>): React.JSX.Element {
  const [mode, setModeState] = useState<NewRepairFormMode>('classic');
  const [status, setStatus] = useState<UserPreferencesState['status']>('loading');
  const [priceListShowReferenceCost, setPriceListShowReferenceCostState] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mutationGeneration = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    void getUserPreferences(controller.signal).then((preferences) => {
      setModeState(preferences.newRepairFormMode);
      setPriceListShowReferenceCostState(preferences.priceListShowReferenceCost);
      setStatus('ready');
      setMessage(null);
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setModeState('classic');
      setPriceListShowReferenceCostState(false);
      setStatus('fallback');
      setMessage('No fue posible leer tu preferencia. Se usará Classic en esta sesión.');
    });
    return () => {
      mutationGeneration.current += 1;
      controller.abort();
    };
  }, []);

  const setMode = async (nextMode: NewRepairFormMode): Promise<void> => {
    if (nextMode === mode && status === 'ready') return;
    const generation = mutationGeneration.current + 1;
    mutationGeneration.current = generation;
    const previousMode = mode;
    const previousStatus = status;
    setModeState(nextMode);
    setStatus('ready');
    setSaving(true);
    setMessage(null);
    try {
      const saved = await updateUserPreferences(
        { newRepairFormMode: nextMode },
        csrfToken,
      );
      if (mutationGeneration.current !== generation) return;
      setModeState(saved.newRepairFormMode);
      setStatus('ready');
    } catch {
      if (mutationGeneration.current !== generation) return;
      setModeState(previousMode);
      setStatus(previousStatus);
      setMessage('No fue posible guardar tu preferencia. Conservamos la selección anterior.');
      throw new Error('No fue posible guardar la preferencia.');
    } finally {
      if (mutationGeneration.current === generation) setSaving(false);
    }
  };

  const setPriceListShowReferenceCost = async (show: boolean): Promise<void> => {
    if (show === priceListShowReferenceCost && status === 'ready') return;
    const generation = mutationGeneration.current + 1;
    mutationGeneration.current = generation;
    const previous = priceListShowReferenceCost;
    setPriceListShowReferenceCostState(show); setSaving(true); setMessage(null);
    try {
      const saved = await updateUserPreferences({ priceListShowReferenceCost: show }, csrfToken);
      if (mutationGeneration.current !== generation) return;
      setModeState(saved.newRepairFormMode);
      setPriceListShowReferenceCostState(saved.priceListShowReferenceCost);
      setStatus('ready');
    } catch {
      if (mutationGeneration.current !== generation) return;
      setPriceListShowReferenceCostState(previous);
      setMessage('No fue posible guardar tu preferencia de costos.');
      throw new Error('No fue posible guardar la preferencia.');
    } finally { if (mutationGeneration.current === generation) setSaving(false); }
  };

  return (
    <UserPreferencesContext.Provider value={{ mode, status, saving, message, priceListShowReferenceCost, setMode, setPriceListShowReferenceCost }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesState {
  const value = useContext(UserPreferencesContext);
  if (!value) throw new Error('UserPreferencesProvider is required.');
  return value;
}
