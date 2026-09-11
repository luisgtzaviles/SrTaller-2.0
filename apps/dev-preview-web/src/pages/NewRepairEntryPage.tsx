import { Spinner } from '../components/ui/feedback.js';
import { resolveNewRepairPresentation } from '../new-repair-presentation.mjs';
import { useUserPreferences } from '../user-preferences/UserPreferencesProvider.js';
import { NewRepairPage } from './NewRepairPage.js';

export function NewRepairEntryPage({
  csrfToken,
  timeZone,
}: Readonly<{
  csrfToken: string;
  timeZone: string;
}>): React.JSX.Element {
  const preferences = useUserPreferences();
  if (preferences.status === 'loading') {
    return <Spinner label="Cargando tu modo de Nueva Reparación" />;
  }
  const presentation = resolveNewRepairPresentation(preferences.mode, true);
  return <NewRepairPage
    csrfToken={csrfToken}
    timeZone={timeZone}
    mode={presentation}
    preferenceNotice={preferences.status === 'fallback' ? preferences.message : null}
  />;
}
