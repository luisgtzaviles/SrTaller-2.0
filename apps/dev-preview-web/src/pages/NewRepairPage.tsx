import { CalendarClock, Check, ChevronLeft, ChevronRight, CircleCheck, ClipboardPenLine, Eye, EyeOff, LockKeyhole, Save, ShieldAlert, Smartphone, UserRound } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { createRepair, getOperationalNewRepairPolicy, getOperationalRepairBrands, getOperationalRepairDeviceTypes, getOperationalRepairModels, getOperationalRepairRisks, searchCustomers, searchPreviousRepairs } from '../api.js';
import type { CustomerSearchResponse, NewRepairPolicyResponse, OperationalRepairBrand, OperationalRepairDeviceType, OperationalRepairModel, OperationalRepairRisk, RepairWorklistItem } from '../api.js';
import { DevicePatternDialog } from '../components/DevicePatternDialog.js';
import { InterventionRiskCheckboxList } from '../components/InterventionRiskCheckboxList.js';
import { ReportedProblemsInput } from '../components/ReportedProblemsInput.js';
import type { ReportedProblemValue } from '../components/ReportedProblemsInput.js';
import { autocompleteInputProps, SearchAutocomplete } from '../components/ui/SearchAutocomplete.js';
import { Button, Field, FormSection, Input, Textarea } from '../components/ui/controls.js';
import { Alert } from '../components/ui/feedback.js';
import { Dialog } from '../components/ui/overlays.js';
import { isDevicePatternValid } from '../device-access-pattern.mjs';
import { formatGuidedLocalDateTime, formatGuidedMoney, guidedAccessSummary, resolveGuidedNewRepairSteps } from '../new-repair-guided.mjs';
import type { GuidedNewRepairStepId } from '../new-repair-guided.mjs';
import { receptionColorPresets } from '../new-repair-form-policy.js';
import { collectNewRepairValidationIssues } from '../new-repair-validation.mjs';
import type { NewRepairValidationIssue, NewRepairValidationSection } from '../new-repair-validation.mjs';
import { compactInputWhitespace, normalizeNewRepairInput } from '../../../../src/modules/repairs/domain/new-repair-input-normalization.js';
import { canOfferCustomerPhoneOwnership, phoneDigits, resolveCustomerPhoneSelection } from '../customer-phone-selection.mjs';
import styles from './pages.module.css';

const receptionColorSwatchClass = Object.freeze({
  Negro: styles.deviceColorTone1,
  Blanco: styles.deviceColorTone2,
  Azul: styles.deviceColorTone3,
  Rojo: styles.deviceColorTone4,
  Verde: styles.deviceColorTone5,
  Dorado: styles.deviceColorTone6,
});

type CustomerCandidate = CustomerSearchResponse['items'][number];
type ExplicitDecision = boolean | null;
type CustomerLookupState = 'idle' | 'loading' | 'empty' | 'error';

function ReceptionDecision({ id, name, label, value, required, error, onChange }: Readonly<{
  id: string;
  name: string;
  label: string;
  value: ExplicitDecision;
  required: boolean;
  error?: string | undefined;
  onChange(value: boolean): void;
}>): React.JSX.Element {
  if (!required) return <label className={styles.optionalDecision}><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} /><span><strong>{label}</strong><small>{value === true ? 'Sí' : 'No'} · Opcional</small></span></label>;
  return <fieldset className={`${styles.binaryField} ${styles.policyDecision}`} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-description` : undefined}><legend>{label} *</legend><label><input id={`${id}-no`} type="radio" name={name} value="no" checked={value === false} required onChange={() => onChange(false)} />No</label><label><input id={`${id}-yes`} type="radio" name={name} value="yes" checked={value === true} required onChange={() => onChange(true)} />Sí</label>{error ? <small id={`${id}-description`} className={styles.decisionError}>{error}</small> : null}</fieldset>;
}

function nullableBoolean(value: FormDataEntryValue | null): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function nationalPhone(value: string, countryCode = ''): string {
  const normalized = value.replace(/[^0-9]/gu, '');
  const callingCode = countryCode.replace(/[^0-9]/gu, '');
  if (callingCode && normalized.startsWith(callingCode) && normalized.length > 10) {
    return normalized.slice(callingCode.length, callingCode.length + 15);
  }
  return normalized.slice(0, 15);
}

function countryCallingCode(value: string): string {
  const digits = value.replace(/[^0-9]/gu, '').slice(0, 4);
  return digits ? `+${digits}` : '';
}

function formatCustomerPhone(value: string | null): string {
  if (!value) return 'Sin teléfono';
  const normalized = phoneDigits(value);
  if (normalized.startsWith('52') && normalized.length === 12) {
    const national = normalized.slice(2);
    return `+52 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  return normalized ? `+${normalized}` : 'Sin teléfono';
}

function moneyInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/gu, '');
  const [whole = '', ...fractions] = cleaned.split('.');
  return fractions.length ? `${whole.slice(0, 10)}.${fractions.join('').slice(0, 2)}` : whole.slice(0, 10);
}

function formatRepairLookupDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone }).format(new Date(value));
}

function GuidedReviewGroup({ title, items, onEdit }: Readonly<{
  title: string;
  items: readonly Readonly<{ label?: string; value: string }>[];
  onEdit(): void;
}>): React.JSX.Element | null {
  const meaningfulItems = items.filter((item) => item.value.trim() !== '' && item.value !== 'No indicado' && item.value !== 'Pendiente');
  if (meaningfulItems.length === 0) return null;
  return <section className={styles.guidedReviewGroup}>
    <header><h3>{title}</h3><Button type="button" size="compact" tone="quiet" onClick={onEdit}>Editar</Button></header>
    <ul>{meaningfulItems.map((item, index) => <li key={`${item.label ?? 'summary'}-${index}`}>{item.label ? <strong>{item.label}: </strong> : null}<span>{item.value}</span></li>)}</ul>
  </section>;
}

export function NewRepairPage({ csrfToken, timeZone, preferenceNotice = null, mode = 'classic' }: Readonly<{
  csrfToken: string;
  timeZone: string;
  preferenceNotice?: string | null;
  mode?: 'classic' | 'guided_v2';
}>): React.JSX.Element {
  const prefix = useId();
  const formId = `${prefix}-${mode}-new-repair`;
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const clientRequestId = useRef(crypto.randomUUID());
  const customerGivenNameRef = useRef<HTMLInputElement>(null);
  const selectedCustomerChangeRef = useRef<HTMLButtonElement>(null);
  const previousRepairSearchRef = useRef<HTMLInputElement>(null);
  const previousRepairChangeRef = useRef<HTMLButtonElement>(null);
  const acceptedRiskGroupRef = useRef<HTMLFieldSetElement>(null);
  const guidedHeadingRef = useRef<HTMLHeadingElement>(null);
  const routeState = location.state as Readonly<{ backgroundLocation?: Location; returnTo?: string; restoreFocusSelector?: string }> | null;
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [, setValidationRevision] = useState(0);
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [phone, setPhone] = useState('');
  const [candidates, setCandidates] = useState<readonly CustomerCandidate[]>([]);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCandidate | null>(null);
  const [addCustomerContactPhone, setAddCustomerContactPhone] = useState(false);
  const [customerLookupState, setCustomerLookupState] = useState<CustomerLookupState>('idle');
  const [customerLookupError, setCustomerLookupError] = useState<string | null>(null);
  const [customerLookupSuppressed, setCustomerLookupSuppressed] = useState(false);
  const [customerLookupFocused, setCustomerLookupFocused] = useState(false);
  const [identifierUnavailable, setIdentifierUnavailable] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [deviceTypeCandidates, setDeviceTypeCandidates] = useState<readonly OperationalRepairDeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<OperationalRepairDeviceType | null>(null);
  const [activeDeviceTypeIndex, setActiveDeviceTypeIndex] = useState(-1);
  const [deviceTypeSearching, setDeviceTypeSearching] = useState(false);
  const [deviceTypeLookupFocused, setDeviceTypeLookupFocused] = useState(false);
  const [deviceBrand, setDeviceBrand] = useState('');
  const [brandCandidates, setBrandCandidates] = useState<readonly OperationalRepairBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<OperationalRepairBrand | null>(null);
  const [activeBrandIndex, setActiveBrandIndex] = useState(-1);
  const [brandSearching, setBrandSearching] = useState(false);
  const [brandLookupFocused, setBrandLookupFocused] = useState(false);
  const [deviceModel, setDeviceModel] = useState('');
  const [modelCandidates, setModelCandidates] = useState<readonly OperationalRepairModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<OperationalRepairModel | null>(null);
  const [activeModelIndex, setActiveModelIndex] = useState(-1);
  const [modelSearching, setModelSearching] = useState(false);
  const [modelLookupFocused, setModelLookupFocused] = useState(false);
  const [deviceColor, setDeviceColor] = useState('');
  const [customColor, setCustomColor] = useState(false);
  const [registerOtherAccessories, setRegisterOtherAccessories] = useState(false);
  const [otherAccessories, setOtherAccessories] = useState('');
  const [reportedProblems, setReportedProblems] = useState<readonly ReportedProblemValue[]>([]);
  const [warrantyReview, setWarrantyReview] = useState<ExplicitDecision>(null);
  const [previousRepairQuery, setPreviousRepairQuery] = useState('');
  const [previousRepairCandidates, setPreviousRepairCandidates] = useState<readonly RepairWorklistItem[]>([]);
  const [activePreviousRepairIndex, setActivePreviousRepairIndex] = useState(-1);
  const [selectedPreviousRepair, setSelectedPreviousRepair] = useState<RepairWorklistItem | null>(null);
  const [previousRepairLookupState, setPreviousRepairLookupState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [previousRepairLookupError, setPreviousRepairLookupError] = useState<string | null>(null);
  const [previousRepairLookupFocused, setPreviousRepairLookupFocused] = useState(false);
  const [differentDeliverer, setDifferentDeliverer] = useState<ExplicitDecision>(null);
  const [requiresRiskAcceptance, setRequiresRiskAcceptance] = useState<ExplicitDecision>(null);
  const [acceptedRiskIds, setAcceptedRiskIds] = useState<readonly string[]>([]);
  const [riskOptions, setRiskOptions] = useState<readonly OperationalRepairRisk[]>([]);
  const [riskCatalogLoading, setRiskCatalogLoading] = useState(true);
  const [riskCatalogError, setRiskCatalogError] = useState<string | null>(null);
  const [deviceAccessType, setDeviceAccessType] = useState('');
  const [deviceAccessSecret, setDeviceAccessSecret] = useState('');
  const [deviceAccessSecretVisible, setDeviceAccessSecretVisible] = useState(false);
  const [devicePattern, setDevicePattern] = useState<readonly number[]>([]);
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [initialBudgetAmount, setInitialBudgetAmount] = useState('');
  const [policy, setPolicy] = useState<NewRepairPolicyResponse | null>(null);
  const [guidedStepId, setGuidedStepId] = useState<GuidedNewRepairStepId>('customer');

  useEffect(() => {
    const controller = new AbortController();
    void getOperationalNewRepairPolicy(controller.signal)
      .then(setPolicy)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(cause instanceof Error ? cause.message : 'No fue posible cargar la configuración del formulario.');
      });
    return () => controller.abort();
  }, []);

  const loadRiskCatalog = useCallback((signal?: AbortSignal): void => {
    setRiskCatalogLoading(true);
    setRiskCatalogError(null);
    void getOperationalRepairRisks(signal)
      .then((response) => {
        setRiskOptions(response.items);
        setAcceptedRiskIds((current) => current.filter((riskId) => response.items.some((risk) => risk.riskId === riskId)));
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setRiskOptions([]);
        setRiskCatalogError(cause instanceof Error ? cause.message : 'No fue posible cargar el catálogo de riesgos.');
      })
      .finally(() => setRiskCatalogLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRiskCatalog(controller.signal);
    return () => controller.abort();
  }, [loadRiskCatalog]);

  useEffect(() => {
    if (!visible('deviceType') || selectedDeviceType || deviceType.trim().length < 1) { setDeviceTypeCandidates([]); setActiveDeviceTypeIndex(-1); setDeviceTypeSearching(false); return undefined; }
    const controller = new AbortController(); const timer = window.setTimeout(() => { setDeviceTypeSearching(true); void getOperationalRepairDeviceTypes(deviceType, controller.signal).then((response) => { setDeviceTypeCandidates(response.items); setActiveDeviceTypeIndex(-1); }).catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setDeviceTypeCandidates([]); }).finally(() => setDeviceTypeSearching(false)); }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [deviceType, policy, selectedDeviceType]);

  useEffect(() => {
    if (!visible('deviceBrand') || selectedBrand || deviceBrand.trim().length < 1) {
      setBrandCandidates([]);
      setActiveBrandIndex(-1);
      setBrandSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setBrandSearching(true);
      void getOperationalRepairBrands(deviceBrand, controller.signal)
        .then((response) => { setBrandCandidates(response.items); setActiveBrandIndex(-1); })
        .catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setBrandCandidates([]); })
        .finally(() => setBrandSearching(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [deviceBrand, policy, selectedBrand]);

  useEffect(() => {
    if (!visible('deviceModel') || !selectedBrand || selectedModel || deviceModel.trim().length < 1) {
      setModelCandidates([]);
      setActiveModelIndex(-1);
      setModelSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setModelSearching(true);
      void getOperationalRepairModels(selectedBrand.brandId, deviceModel, controller.signal)
        .then((response) => { setModelCandidates(response.items); setActiveModelIndex(-1); })
        .catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setModelCandidates([]); })
        .finally(() => setModelSearching(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [deviceModel, policy, selectedBrand, selectedModel]);

  const visible = (key: string): boolean => policy?.fieldStates[key] !== 'hidden';
  const requiredByPolicy = (key: string): boolean => {
    const state = policy?.fieldStates[key];
    return state === 'required' || state === 'fixed';
  };

  function riskValidationMessage(): string {
    if (riskCatalogLoading) return 'Espera a que termine de cargar el catálogo de riesgos.';
    if (riskCatalogError) return 'No fue posible cargar los riesgos. Reintenta antes de guardar.';
    if (riskOptions.length === 0) return 'No hay riesgos activos disponibles. Crea o reactiva uno desde Catálogos antes de guardar.';
    return 'Selecciona al menos un riesgo aceptado para continuar.';
  }

  function validationIssuesFor(form: HTMLFormElement): readonly NewRepairValidationIssue[] {
    if (!policy) return [];
    const values = new FormData(form);
    const textValue = (name: string): string => String(values.get(name) ?? '');
    return collectNewRepairValidationIssues({
      fieldStates: policy.fieldStates,
      selectedCustomer: selectedCustomer !== null,
      identifierUnavailable,
      reportedProblemCount: reportedProblems.length,
      acceptedRiskCount: acceptedRiskIds.length,
      patternValid: isDevicePatternValid(devicePattern),
      riskSelectionMessage: riskValidationMessage(),
      values: {
        customerGivenName: givenName,
        customerFamilyName: familyName,
        customerPhone: phone,
        deviceType: textValue('deviceType'),
        deviceBrand,
        deviceModel,
        deviceIdentifier: textValue('deviceIdentifier'),
        deviceColor,
        physicalConditionSummary: textValue('physicalConditionSummary'),
        simIncluded: nullableBoolean(values.get('simIncluded')),
        memoryCardIncluded: nullableBoolean(values.get('memoryCardIncluded')),
        receivedPowerState: textValue('receivedPowerState'),
        customerNarrative: textValue('customerNarrative'),
        warrantyReviewRequested: warrantyReview,
        differentDeliverer,
        deliveredByName: textValue('deliveredByName'),
        requiresRiskAcceptance,
        deviceAccessType,
        deviceAccessSecret,
        estimatedDeliveryLocal: textValue('estimatedDeliveryLocal'),
        initialBudgetAmount,
      },
    });
  }

  useEffect(() => {
    if (selectedCustomer || customerLookupSuppressed) {
      setCandidates([]);
      setActiveCustomerIndex(-1);
      setCustomerLookupState('idle');
      setCustomerLookupError(null);
      return undefined;
    }
    const nameTerm = compactInputWhitespace(`${givenName} ${familyName}`);
    const phoneTerm = nationalPhone(phone);
    const terms = [...new Set([nameTerm.length >= 2 ? nameTerm : '', phoneTerm.length >= 2 ? phoneTerm : ''].filter(Boolean))];
    if (terms.length === 0) {
      setCandidates([]);
      setActiveCustomerIndex(-1);
      setCustomerLookupState('idle');
      setCustomerLookupError(null);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCandidates([]);
      setCustomerLookupState('loading');
      setCustomerLookupError(null);
      void Promise.all(terms.map((term) => searchCustomers(term, controller.signal)))
        .then((responses) => {
          const unique = new Map<string, CustomerCandidate>();
          for (const response of responses) for (const candidate of response.items) unique.set(candidate.id, candidate);
          const nextCandidates = [...unique.values()];
          setCandidates(nextCandidates);
          setActiveCustomerIndex(-1);
          setCustomerLookupState(nextCandidates.length > 0 ? 'idle' : 'empty');
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === 'AbortError') return;
          setCandidates([]);
          setCustomerLookupState('error');
          setCustomerLookupError(cause instanceof Error ? cause.message : 'No fue posible buscar clientes.');
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [customerLookupSuppressed, familyName, givenName, phone, selectedCustomer]);

  useEffect(() => {
    if (warrantyReview !== true || selectedPreviousRepair) {
      setPreviousRepairCandidates([]);
      setActivePreviousRepairIndex(-1);
      setPreviousRepairLookupState('idle');
      setPreviousRepairLookupError(null);
      return undefined;
    }
    const query = compactInputWhitespace(previousRepairQuery);
    if (query.length < 2) {
      setPreviousRepairCandidates([]);
      setActivePreviousRepairIndex(-1);
      setPreviousRepairLookupState('idle');
      setPreviousRepairLookupError(null);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPreviousRepairLookupState('loading');
      setPreviousRepairLookupError(null);
      setPreviousRepairCandidates([]);
      setActivePreviousRepairIndex(-1);
      void searchPreviousRepairs(query, controller.signal)
        .then((response) => {
          setPreviousRepairCandidates(response.items);
          setActivePreviousRepairIndex(-1);
          setPreviousRepairLookupState(response.items.length > 0 ? 'idle' : 'empty');
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === 'AbortError') return;
          setPreviousRepairLookupState('error');
          setPreviousRepairLookupError(cause instanceof Error ? cause.message : 'No fue posible buscar la reparación anterior.');
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [previousRepairQuery, selectedPreviousRepair, warrantyReview]);

  function chooseCustomer(candidate: CustomerCandidate): void {
    setDirty(true);
    setSelectedCustomer(candidate);
    setGivenName(candidate.givenName);
    setFamilyName(candidate.familyName ?? '');
    setCandidates([]);
    setActiveCustomerIndex(-1);
    setCustomerLookupState('idle');
    setCustomerLookupError(null);
    setCustomerLookupSuppressed(false);
    setAddCustomerContactPhone(false);
    const resolvedPhone = resolveCustomerPhoneSelection({ countryCode, phone, candidate });
    setCountryCode(resolvedPhone.countryCode);
    setPhone(resolvedPhone.phone);
    window.requestAnimationFrame(() => selectedCustomerChangeRef.current?.focus());
  }

  function changeSelectedCustomer(): void {
    setSelectedCustomer(null);
    setAddCustomerContactPhone(false);
    setActiveCustomerIndex(-1);
    setCustomerLookupSuppressed(false);
    window.requestAnimationFrame(() => customerGivenNameRef.current?.focus());
  }

  function removeSelectedCustomer(): void {
    setSelectedCustomer(null);
    setAddCustomerContactPhone(false);
    setCandidates([]);
    setActiveCustomerIndex(-1);
    setCustomerLookupState('idle');
    setCustomerLookupError(null);
    setCustomerLookupSuppressed(true);
    window.requestAnimationFrame(() => customerGivenNameRef.current?.focus());
  }

  function handleCustomerComboboxKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' && candidates.length > 0) {
      event.preventDefault();
      setActiveCustomerIndex((current) => current < candidates.length - 1 ? current + 1 : 0);
    } else if (event.key === 'ArrowUp' && candidates.length > 0) {
      event.preventDefault();
      setActiveCustomerIndex((current) => current > 0 ? current - 1 : candidates.length - 1);
    } else if (event.key === 'Enter' && activeCustomerIndex >= 0) {
      event.preventDefault();
      const candidate = candidates[activeCustomerIndex];
      if (candidate) chooseCustomer(candidate);
    }
  }

  function dismissCustomerAutocomplete(): void {
    setCandidates([]);
    setActiveCustomerIndex(-1);
    setCustomerLookupState('idle');
    setCustomerLookupError(null);
  }

  function clearPreviousRepairLookup(): void {
    setSelectedPreviousRepair(null);
    setPreviousRepairQuery('');
    setPreviousRepairCandidates([]);
    setActivePreviousRepairIndex(-1);
    setPreviousRepairLookupState('idle');
    setPreviousRepairLookupError(null);
  }

  function changeWarrantyReview(value: boolean): void {
    setWarrantyReview(value);
    if (!value) clearPreviousRepairLookup();
  }

  function choosePreviousRepair(repair: RepairWorklistItem): void {
    setSelectedPreviousRepair(repair);
    setPreviousRepairQuery('');
    setPreviousRepairCandidates([]);
    setActivePreviousRepairIndex(-1);
    setPreviousRepairLookupState('idle');
    setPreviousRepairLookupError(null);
    window.requestAnimationFrame(() => previousRepairChangeRef.current?.focus());
  }

  function changePreviousRepair(): void {
    clearPreviousRepairLookup();
    window.requestAnimationFrame(() => previousRepairSearchRef.current?.focus());
  }

  function removePreviousRepair(): void {
    clearPreviousRepairLookup();
    window.requestAnimationFrame(() => previousRepairSearchRef.current?.focus());
  }

  function handlePreviousRepairComboboxKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' && previousRepairCandidates.length > 0) {
      event.preventDefault();
      setActivePreviousRepairIndex((current) => current < previousRepairCandidates.length - 1 ? current + 1 : 0);
    } else if (event.key === 'ArrowUp' && previousRepairCandidates.length > 0) {
      event.preventDefault();
      setActivePreviousRepairIndex((current) => current > 0 ? current - 1 : previousRepairCandidates.length - 1);
    } else if (event.key === 'Enter' && activePreviousRepairIndex >= 0) {
      event.preventDefault();
      const repair = previousRepairCandidates[activePreviousRepairIndex];
      if (repair) choosePreviousRepair(repair);
    }
  }

  function dismissPreviousRepairAutocomplete(): void {
    setPreviousRepairCandidates([]);
    setActivePreviousRepairIndex(-1);
    setPreviousRepairLookupState('idle');
    setPreviousRepairLookupError(null);
  }

  function chooseBrand(brand: OperationalRepairBrand): void {
    setDeviceBrand(brand.label);
    setSelectedBrand(brand);
    setBrandCandidates([]);
    setActiveBrandIndex(-1);
    setSelectedModel(null);
    setModelCandidates([]);
    setActiveModelIndex(-1);
    setDirty(true);
  }
  function chooseDeviceType(item: OperationalRepairDeviceType): void { setDeviceType(item.label); setSelectedDeviceType(item); setDeviceTypeCandidates([]); setActiveDeviceTypeIndex(-1); setDirty(true); }
  function handleDeviceTypeKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void { if (event.key === 'ArrowDown' && deviceTypeCandidates.length > 0) { event.preventDefault(); setActiveDeviceTypeIndex((current) => current < deviceTypeCandidates.length - 1 ? current + 1 : 0); } else if (event.key === 'ArrowUp' && deviceTypeCandidates.length > 0) { event.preventDefault(); setActiveDeviceTypeIndex((current) => current > 0 ? current - 1 : deviceTypeCandidates.length - 1); } else if (event.key === 'Enter' && activeDeviceTypeIndex >= 0) { event.preventDefault(); const item = deviceTypeCandidates[activeDeviceTypeIndex]; if (item) chooseDeviceType(item); } }

  function chooseModel(model: OperationalRepairModel): void {
    if (!selectedBrand || model.brandId !== selectedBrand.brandId) return;
    setDeviceModel(model.label);
    setSelectedModel(model);
    setModelCandidates([]);
    setActiveModelIndex(-1);
    setDirty(true);
  }

  function handleModelKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' && modelCandidates.length > 0) {
      event.preventDefault();
      setActiveModelIndex((current) => current < modelCandidates.length - 1 ? current + 1 : 0);
    } else if (event.key === 'ArrowUp' && modelCandidates.length > 0) {
      event.preventDefault();
      setActiveModelIndex((current) => current > 0 ? current - 1 : modelCandidates.length - 1);
    } else if (event.key === 'Enter' && activeModelIndex >= 0) {
      event.preventDefault();
      const model = modelCandidates[activeModelIndex];
      if (model) chooseModel(model);
    }
  }

  function handleBrandKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' && brandCandidates.length > 0) {
      event.preventDefault();
      setActiveBrandIndex((current) => current < brandCandidates.length - 1 ? current + 1 : 0);
    } else if (event.key === 'ArrowUp' && brandCandidates.length > 0) {
      event.preventDefault();
      setActiveBrandIndex((current) => current > 0 ? current - 1 : brandCandidates.length - 1);
    } else if (event.key === 'Enter' && activeBrandIndex >= 0) {
      event.preventDefault();
      const brand = brandCandidates[activeBrandIndex];
      if (brand) chooseBrand(brand);
    }
  }

  function clearDeviceAccessSecrets(): void {
    setDeviceAccessSecret('');
    setDeviceAccessSecretVisible(false);
    setDevicePattern([]);
    setPatternDialogOpen(false);
  }

  function changeDeviceAccessType(nextType: string): void {
    setDeviceAccessType(nextType);
    setDeviceAccessSecret('');
    setDeviceAccessSecretVisible(false);
    setDevicePattern([]);
    setPatternDialogOpen(nextType === 'pattern');
  }

  function closeNow(): void {
    clearDeviceAccessSecrets();
    void navigate(routeState?.returnTo ?? '/reparaciones', { replace: true });
  }

  function requestClose(): void {
    if (saving) return;
    if (dirty) setConfirmClose(true);
    else closeNow();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    const validationIssues = validationIssuesFor(event.currentTarget);
    setValidationAttempted(true);
    if (validationIssues.length > 0) {
      const firstIssue = validationIssues[0];
      if (mode === 'guided_v2' && firstIssue) setGuidedStepId(firstIssue.section);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        const target = document.getElementById(`${prefix}-${firstIssue?.focusTarget}`);
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: 'center', inline: 'nearest' });
      }));
      return;
    }
    setSaving(true);
    const values = new FormData(event.currentTarget);
    const optional = (name: string): string | null => {
      const value = compactInputWhitespace(String(values.get(name) ?? ''));
      return value || null;
    };
    const normalizedOptional = (name: string, field: Parameters<typeof normalizeNewRepairInput>[0]): string | null => {
      const value = normalizeNewRepairInput(field, String(values.get(name) ?? ''));
      return value || null;
    };
    const phoneSnapshot = phone.trim() ? `${countryCode.trim()} ${phone.trim()}`.trim() : '';
    const canAddCustomerContactPhone = canOfferCustomerPhoneOwnership({ candidate: selectedCustomer, countryCode, phone });
    if (!policy) {
      setError('La configuración del formulario todavía no está disponible.');
      setSaving(false);
      return;
    }
    const decisionValue = (key: string, value: ExplicitDecision): ExplicitDecision => requiredByPolicy(key) ? value : value ?? false;
    try {
      const repair = await createRepair({
        customerId: selectedCustomer?.id ?? null,
        customerGivenName: selectedCustomer ? null : normalizeNewRepairInput('customerGivenName', givenName),
        ...(visible('customerFamilyName') ? { customerFamilyName: selectedCustomer ? null : normalizeNewRepairInput('customerFamilyName', familyName) || null } : {}),
        ...(visible('customerPhone') ? { customerPhone: phoneSnapshot || null } : {}),
        ...(canAddCustomerContactPhone && addCustomerContactPhone ? { addCustomerContactPhone: true } : {}),
        ...(visible('deviceType') ? { deviceType: normalizeNewRepairInput('deviceType', deviceType, selectedDeviceType?.label) || null, canonicalDeviceTypeId: selectedDeviceType?.deviceTypeId ?? null } : {}),
        ...(visible('deviceBrand') ? { deviceBrand: normalizeNewRepairInput('deviceBrand', deviceBrand, selectedBrand?.label) || null, canonicalBrandId: selectedBrand?.brandId ?? null } : {}),
        ...(visible('deviceModel') ? { deviceModel: normalizeNewRepairInput('deviceModel', deviceModel, selectedModel?.label) || null, canonicalModelId: selectedModel?.modelId ?? null } : {}),
        ...(visible('deviceIdentifier') ? { deviceIdentifier: identifierUnavailable ? null : normalizedOptional('deviceIdentifier', 'deviceIdentifier'), deviceIdentifierUnavailable: identifierUnavailable } : {}),
        ...(visible('deviceColor') ? { deviceColor: normalizeNewRepairInput('deviceColor', deviceColor) || null } : {}),
        ...(visible('simIncluded') ? { simIncluded: nullableBoolean(values.get('simIncluded')) } : {}),
        ...(visible('memoryCardIncluded') ? { memoryCardIncluded: nullableBoolean(values.get('memoryCardIncluded')) } : {}),
        ...(registerOtherAccessories
          ? { otherAccessories: normalizeNewRepairInput('otherAccessories', otherAccessories) || null }
          : {}),
        reportedProblems,
        ...(visible('customerNarrative') ? { customerNarrative: normalizedOptional('customerNarrative', 'customerNarrative') } : {}),
        ...(visible('physicalConditionSummary') ? { physicalConditionSummary: normalizedOptional('physicalConditionSummary', 'physicalConditionSummary') } : {}),
        ...(visible('requiresRiskAcceptance') ? { requiresRiskAcceptance: decisionValue('requiresRiskAcceptance', requiresRiskAcceptance) } : {}),
        acceptedRiskIds: requiresRiskAcceptance === true ? acceptedRiskIds : [],
        documentedRiskSummary: requiresRiskAcceptance === true ? normalizedOptional('documentedRiskSummary', 'documentedRiskSummary') : null,
        ...(visible('receivedPowerState') ? { receivedPowerState: optional('receivedPowerState') as 'powered_on' | 'powered_off' | null } : {}),
        ...(visible('deviceAccessType') ? { deviceAccessType: deviceAccessType as 'none' | 'pin' | 'password' | 'pattern' } : {}),
        ...(visible('warrantyReviewRequested') ? { warrantyReviewRequested: decisionValue('warrantyReviewRequested', warrantyReview) } : {}),
        ...(warrantyReview === true ? { previousRepairId: selectedPreviousRepair?.id ?? null } : {}),
        ...(visible('differentDeliverer') ? { differentDeliverer: decisionValue('differentDeliverer', differentDeliverer) } : {}),
        deliveredByName: differentDeliverer === true ? normalizedOptional('deliveredByName', 'deliveredByName') : null,
        ...(visible('estimatedDeliveryLocal') ? { estimatedDeliveryLocal: optional('estimatedDeliveryLocal') } : {}),
        ...(visible('initialBudgetAmount') ? { initialBudgetAmount: initialBudgetAmount || null } : {}),
        clientRequestId: clientRequestId.current,
      }, csrfToken);
      setDirty(false);
      clearDeviceAccessSecrets();
      window.dispatchEvent(new CustomEvent('srtaller:repairs-changed'));
      const backgroundLocation = routeState?.backgroundLocation;
      await navigate(`/reparaciones/${repair.id}${backgroundLocation?.search ?? ''}`, {
        replace: true,
        state: backgroundLocation ? {
          backgroundLocation,
          returnTo: routeState?.returnTo ?? '/reparaciones',
          restoreFocusSelector: `[data-repair-detail-trigger="${repair.id}"]`,
        } : undefined,
      });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar la reparación.');
      setSaving(false);
    }
  }

  const allValidationIssues = policy && formRef.current ? validationIssuesFor(formRef.current) : [];
  const presentedValidationIssues = validationAttempted ? allValidationIssues : [];
  const issueFor = (fieldKey: string): NewRepairValidationIssue | undefined => presentedValidationIssues.find((issue) => issue.fieldKey === fieldKey);
  const fieldError = (fieldKey: string): string | undefined => issueFor(fieldKey)?.message;
  const invalidProps = (fieldKey: string, id = `${prefix}-${fieldKey}`): Readonly<{ 'aria-invalid'?: true; 'aria-describedby'?: string }> => issueFor(fieldKey)
    ? { 'aria-invalid': true, 'aria-describedby': `${id}-description` }
    : {};
  const sectionStatus = (section: NewRepairValidationSection): string | undefined => {
    const count = presentedValidationIssues.filter((issue) => issue.section === section).length;
    return count > 0 ? `${count} ${count === 1 ? 'pendiente' : 'pendientes'}` : undefined;
  };
  const footerStatus = saving
    ? 'Guardando reparación…'
    : allValidationIssues.length === 0 && policy
      ? '✓ Lista para guardar'
      : validationAttempted
        ? `Faltan ${allValidationIssues.length} ${allValidationIssues.length === 1 ? 'dato' : 'datos'}`
        : null;
  const canAddCustomerContactPhone = canOfferCustomerPhoneOwnership({ candidate: selectedCustomer, countryCode, phone });
  const selectedCustomerHasPhones = Boolean(selectedCustomer && (selectedCustomer.contactPhones.length > 0 || selectedCustomer.contactPhone));
  const guidedSteps = resolveGuidedNewRepairSteps(policy?.fieldStates);
  const resolvedGuidedIndex = guidedSteps.findIndex((step) => step.id === guidedStepId);
  const guidedStepIndex = resolvedGuidedIndex >= 0 ? resolvedGuidedIndex : 0;
  const guidedStep = guidedSteps[guidedStepIndex] ?? guidedSteps[0];
  const guidedOnReview = guidedStep?.id === 'review';
  const guidedSectionClass = (section: NewRepairValidationSection): string => mode !== 'guided_v2'
    ? ''
    : guidedStep?.id === section ? styles.guidedActiveSection ?? '' : styles.guidedStepHidden ?? '';

  function focusIssue(issue: NewRepairValidationIssue): void {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = document.getElementById(`${prefix}-${issue.focusTarget}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }));
  }

  function goToGuidedStep(stepId: GuidedNewRepairStepId): void {
    setValidationAttempted(false);
    setGuidedStepId(stepId);
  }

  function advanceGuided(): void {
    if (!formRef.current || !guidedStep || guidedOnReview) return;
    const issues = validationIssuesFor(formRef.current).filter((issue) => issue.section === guidedStep.id);
    setValidationAttempted(true);
    if (issues[0]) {
      focusIssue(issues[0]);
      return;
    }
    const next = guidedSteps[guidedStepIndex + 1];
    if (next) goToGuidedStep(next.id);
  }

  useEffect(() => {
    if (mode !== 'guided_v2') return;
    window.requestAnimationFrame(() => guidedHeadingRef.current?.focus({ preventScroll: true }));
  }, [guidedStepId, mode]);

  const guidedStepIssueCount = guidedStep && guidedStep.id !== 'review'
    ? allValidationIssues.filter((issue) => issue.section === guidedStep.id).length
    : allValidationIssues.length;
  const guidedFooterStatus = saving
    ? 'Guardando reparación…'
    : validationAttempted && guidedStepIssueCount > 0
      ? `Faltan ${guidedStepIssueCount} ${guidedStepIssueCount === 1 ? 'dato' : 'datos'} en este paso`
      : guidedOnReview && allValidationIssues.length === 0 && policy
        ? '✓ Lista para guardar'
        : null;
  const classicFooter = <div className={styles.modalFooter}><span>Folio automático al guardar</span><div className={styles.modalFooterActions}><span className={styles.validationStatus} role="status" aria-live="polite" aria-atomic="true">{footerStatus}</span><Button disabled={saving} onClick={requestClose}>Cancelar</Button><Button type="submit" form={formId} tone="primary" disabled={saving || !policy}><Save aria-hidden="true" size={18} />{saving ? 'Guardando…' : 'Guardar reparación'}</Button></div></div>;
  const guidedFooter = <div className={`${styles.modalFooter} ${styles.guidedFooter}`}><span>Folio automático al guardar</span><div className={styles.modalFooterActions}><span className={styles.validationStatus} role="status" aria-live="polite" aria-atomic="true">{guidedFooterStatus}</span><Button type="button" disabled={saving} onClick={requestClose}>Cancelar</Button>{guidedStepIndex > 0 ? <Button type="button" disabled={saving} onClick={() => { const previous = guidedSteps[guidedStepIndex - 1]; if (previous) goToGuidedStep(previous.id); }}><ChevronLeft aria-hidden="true" size={17} />Atrás</Button> : null}{guidedOnReview ? <Button key="guided-save" type="submit" form={formId} tone="primary" disabled={saving || !policy}><Save aria-hidden="true" size={18} />{saving ? 'Guardando…' : 'Guardar reparación'}</Button> : <Button key="guided-continue" type="button" tone="primary" disabled={saving || !policy} onClick={(event) => { event.preventDefault(); advanceGuided(); }}>Continuar<ChevronRight aria-hidden="true" size={17} /></Button>}</div></div>;

  const reviewValues = formRef.current ? new FormData(formRef.current) : null;
  const reviewText = (name: string): string => compactInputWhitespace(String(reviewValues?.get(name) ?? ''));
  const reviewPowerState = reviewText('receivedPowerState') === 'powered_on' ? 'Encendido' : reviewText('receivedPowerState') === 'powered_off' ? 'Apagado' : 'No indicado';
  const reviewRiskLabels = acceptedRiskIds.map((riskId) => riskOptions.find((risk) => risk.riskId === riskId)?.label).filter((label): label is string => Boolean(label));
  const reviewPhone = phone.trim() ? `${countryCode} ${phone}` : 'Sin teléfono';

  return <>
    <Dialog open title="Nueva reparación" description={`Recepción Avicell · ${mode === 'guided_v2' ? 'Guided V2' : 'Classic 2.0'}`} size={mode === 'guided_v2' ? 'wide' : 'workspace'} variant="workspace" footer={mode === 'guided_v2' ? guidedFooter : classicFooter} restoreFocusSelector={routeState?.restoreFocusSelector} onClose={requestClose}>
      <form ref={formRef} id={formId} className={`${styles.formSurface} ${styles.classicModalForm} ${mode === 'guided_v2' ? styles.guidedModalForm : ''}`} noValidate onInput={() => { if (validationAttempted) setValidationRevision((current) => current + 1); }} onChange={() => setDirty(true)} onSubmit={(event) => { if (mode === 'guided_v2' && !guidedOnReview) { event.preventDefault(); advanceGuided(); } else void submit(event); }}>
        {preferenceNotice ? <div className={styles.formAlert}><Alert tone="warning" title="Modo Classic temporal">{preferenceNotice}</Alert></div> : null}
        {error ? <div className={styles.formAlert}><Alert tone="danger" title="No fue posible completar la operación">{error}</Alert></div> : null}
        {mode === 'guided_v2' && guidedStep ? <div className={styles.guidedHeader}>
          <div className={styles.guidedHeaderCurrent}><h2 id={`${prefix}-guided-step-title`} ref={guidedHeadingRef} tabIndex={-1}>{guidedStep.title}</h2><span>Paso {guidedStepIndex + 1} de {guidedSteps.length}</span></div>
          <p className={styles.guidedStepDescription}>{guidedStep.description}</p>
          <ol aria-label="Progreso de Nueva Reparación">{guidedSteps.map((step, index) => <li key={step.id} aria-current={step.id === guidedStep.id ? 'step' : undefined} data-complete={index < guidedStepIndex ? 'true' : undefined}><span>{index < guidedStepIndex ? <Check aria-hidden="true" size={13} /> : index + 1}</span><small>{step.title}</small></li>)}</ol>
        </div> : null}
        <FormSection compact step={1} icon={UserRound} className={`${styles.customerSection} ${guidedSectionClass('customer')}`} title="Cliente" description="Identificación y contacto" status={sectionStatus('customer')}>
          <SearchAutocomplete
            className={styles.customerFields}
            listboxId={`${prefix}-customerOptions`}
            label="Clientes coincidentes"
            options={candidates.map((candidate, index) => ({ id: `${prefix}-customerOption-${index}`, key: candidate.id, primary: candidate.name, secondary: formatCustomerPhone(candidate.matchedPhone ?? candidate.contactPhone), icon: <UserRound size={16} /> }))}
            activeIndex={activeCustomerIndex}
            status={customerLookupState === 'loading'
              ? { kind: 'loading', message: 'Buscando coincidencias…' }
              : customerLookupState === 'empty'
                ? { kind: 'empty', message: 'Sin coincidencias. Puedes continuar como cliente nuevo.' }
                : customerLookupState === 'error'
                  ? { kind: 'error', message: customerLookupError ?? 'No fue posible buscar clientes.' }
                  : { kind: 'idle' }}
            width="wide"
            focused={customerLookupFocused}
            onFocusWithinChange={setCustomerLookupFocused}
            onActiveIndexChange={setActiveCustomerIndex}
            onSelect={(index) => { const candidate = candidates[index]; if (candidate) chooseCustomer(candidate); }}
            onDismiss={dismissCustomerAutocomplete}
          >
            {selectedCustomer ? <div className={`${styles.selectedIdentity} ${styles.selectedCustomerIdentity}`}><UserRound aria-hidden="true" size={18} /><div className={styles.selectedCustomerCopy}><div><strong>{selectedCustomer.name}</strong><span className={styles.linkedCustomerStatus}><CircleCheck aria-hidden="true" size={14} />Cliente vinculado</span></div><small>{formatCustomerPhone(selectedCustomer.matchedPhone ?? selectedCustomer.contactPhone)}</small></div><div className={styles.selectedCustomerActions}><Button ref={selectedCustomerChangeRef} type="button" size="compact" tone="quiet" onClick={changeSelectedCustomer}>Cambiar</Button><Button type="button" size="compact" tone="quiet" onClick={removeSelectedCustomer}>Quitar</Button></div></div> : <><Field id={`${prefix}-customerGivenName`} label="Nombre" required error={fieldError('customerGivenName')}><Input ref={customerGivenNameRef} id={`${prefix}-customerGivenName`} name="customerGivenName" required={!selectedCustomer} value={givenName} {...invalidProps('customerGivenName')} onChange={(event) => { setGivenName(event.target.value); setCustomerLookupSuppressed(false); }} onKeyDown={handleCustomerComboboxKeyDown} onBlur={() => setGivenName(normalizeNewRepairInput('customerGivenName', givenName))} placeholder="Nombre" {...autocompleteInputProps(`${prefix}-customerOptions`, customerLookupFocused && candidates.length > 0, customerLookupFocused && activeCustomerIndex >= 0 ? `${prefix}-customerOption-${activeCustomerIndex}` : undefined)} /></Field>{visible('customerFamilyName') ? <Field id={`${prefix}-customerFamilyName`} label="Apellido(s)" required={requiredByPolicy('customerFamilyName')} error={fieldError('customerFamilyName')}><Input id={`${prefix}-customerFamilyName`} name="customerFamilyName" required={requiredByPolicy('customerFamilyName')} value={familyName} {...invalidProps('customerFamilyName')} onChange={(event) => { setFamilyName(event.target.value); setCustomerLookupSuppressed(false); }} onKeyDown={handleCustomerComboboxKeyDown} onBlur={() => setFamilyName(normalizeNewRepairInput('customerFamilyName', familyName))} placeholder="Apellido(s)" {...autocompleteInputProps(`${prefix}-customerOptions`, customerLookupFocused && candidates.length > 0, customerLookupFocused && activeCustomerIndex >= 0 ? `${prefix}-customerOption-${activeCustomerIndex}` : undefined)} /></Field> : null}</>}
            {visible('customerPhone') ? <Field id={`${prefix}-customerPhone`} label="Teléfono de esta reparación" required={requiredByPolicy('customerPhone')} error={fieldError('customerPhone')} className={styles.customerPhoneField}><><div className={styles.phoneGrid}><Input aria-label="Código de país" value={countryCode} onChange={(event) => setCountryCode(countryCallingCode(event.currentTarget.value))} inputMode="tel" maxLength={5} /><Input id={`${prefix}-customerPhone`} name="customerPhone" value={phone} {...invalidProps('customerPhone')} onChange={(event) => { setPhone(nationalPhone(event.currentTarget.value, countryCode)); setCustomerLookupSuppressed(false); }} onKeyDown={handleCustomerComboboxKeyDown} required={requiredByPolicy('customerPhone')} inputMode="numeric" placeholder="6620000000" {...autocompleteInputProps(`${prefix}-customerOptions`, customerLookupFocused && candidates.length > 0, customerLookupFocused && activeCustomerIndex >= 0 ? `${prefix}-customerOption-${activeCustomerIndex}` : undefined, 'telephone')} /></div>{canAddCustomerContactPhone ? <label className={`${styles.inlineCheck} ${styles.customerPhoneOwnership}`}><input type="checkbox" checked={addCustomerContactPhone} onChange={(event) => setAddCustomerContactPhone(event.target.checked)} />{selectedCustomerHasPhones ? 'Agregar este número al cliente' : 'Guardar también en el cliente'}</label> : null}</></Field> : null}
          </SearchAutocomplete>
        </FormSection>

        <FormSection compact step={2} icon={Smartphone} className={`${styles.equipmentSection} ${guidedSectionClass('equipment')}`} title="Equipo" description="Identificación y recepción física" status={sectionStatus('equipment')}>
          {visible('deviceType') ? <Field id={`${prefix}-deviceType`} label="Tipo" required={requiredByPolicy('deviceType')} error={fieldError('deviceType')}><SearchAutocomplete listboxId={`${prefix}-deviceTypeOptions`} label="Tipos de equipo sugeridos" options={deviceTypeCandidates.map((item, index) => ({ id: `${prefix}-deviceTypeOption-${index}`, key: item.deviceTypeId, primary: item.label, secondary: item.scope === 'platform' ? 'Plataforma' : 'Organización' }))} activeIndex={activeDeviceTypeIndex} status={deviceTypeSearching ? { kind: 'loading', message: 'Buscando tipos de equipo…' } : { kind: 'idle' }} width="narrow" focused={deviceTypeLookupFocused} onFocusWithinChange={setDeviceTypeLookupFocused} onActiveIndexChange={setActiveDeviceTypeIndex} onSelect={(index) => { const item = deviceTypeCandidates[index]; if (item) chooseDeviceType(item); }} onDismiss={() => { setDeviceTypeCandidates([]); setActiveDeviceTypeIndex(-1); }}><Input id={`${prefix}-deviceType`} name="deviceType" type="search" value={deviceType} autoCapitalize="sentences" spellCheck={false} required={requiredByPolicy('deviceType')} {...invalidProps('deviceType')} onChange={(event) => { setDeviceType(event.target.value); setSelectedDeviceType(null); }} onBlur={() => setDeviceType(normalizeNewRepairInput('deviceType', deviceType, selectedDeviceType?.label))} onKeyDown={handleDeviceTypeKeyDown} placeholder="Teléfono, tablet…" {...autocompleteInputProps(`${prefix}-deviceTypeOptions`, deviceTypeLookupFocused && deviceTypeCandidates.length > 0, deviceTypeLookupFocused && activeDeviceTypeIndex >= 0 ? `${prefix}-deviceTypeOption-${activeDeviceTypeIndex}` : undefined, 'search')} /></SearchAutocomplete></Field> : null}
          {visible('deviceBrand') ? <Field id={`${prefix}-deviceBrand`} label="Marca" required={requiredByPolicy('deviceBrand')} error={fieldError('deviceBrand')}><SearchAutocomplete listboxId={`${prefix}-brandOptions`} label="Marcas sugeridas" options={brandCandidates.map((brand, index) => ({ id: `${prefix}-brandOption-${index}`, key: brand.brandId, primary: brand.label, secondary: brand.scope === 'platform' ? 'Plataforma' : 'Organización' }))} activeIndex={activeBrandIndex} status={brandSearching ? { kind: 'loading', message: 'Buscando marcas…' } : { kind: 'idle' }} width="narrow" focused={brandLookupFocused} onFocusWithinChange={setBrandLookupFocused} onActiveIndexChange={setActiveBrandIndex} onSelect={(index) => { const brand = brandCandidates[index]; if (brand) chooseBrand(brand); }} onDismiss={() => { setBrandCandidates([]); setActiveBrandIndex(-1); }}><Input id={`${prefix}-deviceBrand`} name="deviceBrand" required={requiredByPolicy('deviceBrand')} value={deviceBrand} {...invalidProps('deviceBrand')} placeholder="Apple" {...autocompleteInputProps(`${prefix}-brandOptions`, brandLookupFocused && brandCandidates.length > 0, brandLookupFocused && activeBrandIndex >= 0 ? `${prefix}-brandOption-${activeBrandIndex}` : undefined)} onChange={(event) => { setDeviceBrand(event.target.value); setSelectedBrand(null); setSelectedModel(null); setModelCandidates([]); }} onBlur={() => setDeviceBrand(normalizeNewRepairInput('deviceBrand', deviceBrand, selectedBrand?.label))} onKeyDown={handleBrandKeyDown} /></SearchAutocomplete></Field> : null}
          {visible('deviceModel') ? <Field id={`${prefix}-deviceModel`} label="Modelo" required={requiredByPolicy('deviceModel')} error={fieldError('deviceModel')}><SearchAutocomplete listboxId={`${prefix}-modelOptions`} label="Modelos sugeridos" options={modelCandidates.map((model, index) => ({ id: `${prefix}-modelOption-${index}`, key: model.modelId, primary: model.label, secondary: `${model.brandLabel} · ${model.scope === 'platform' ? 'Plataforma' : 'Organización'}` }))} activeIndex={activeModelIndex} status={modelSearching ? { kind: 'loading', message: 'Buscando modelos…' } : { kind: 'idle' }} focused={modelLookupFocused} onFocusWithinChange={setModelLookupFocused} onActiveIndexChange={setActiveModelIndex} onSelect={(index) => { const model = modelCandidates[index]; if (model) chooseModel(model); }} onDismiss={() => { setModelCandidates([]); setActiveModelIndex(-1); }}><Input id={`${prefix}-deviceModel`} name="deviceModel" required={requiredByPolicy('deviceModel')} value={deviceModel} {...invalidProps('deviceModel')} onChange={(event) => { setDeviceModel(event.target.value); setSelectedModel(null); }} onBlur={() => setDeviceModel(normalizeNewRepairInput('deviceModel', deviceModel, selectedModel?.label))} onKeyDown={handleModelKeyDown} placeholder="iPhone 15 Pro Max" {...autocompleteInputProps(`${prefix}-modelOptions`, modelLookupFocused && modelCandidates.length > 0, modelLookupFocused && activeModelIndex >= 0 ? `${prefix}-modelOption-${activeModelIndex}` : undefined)} /></SearchAutocomplete></Field> : null}
          {visible('deviceIdentifier') ? <Field id={`${prefix}-deviceIdentifier`} label="IMEI / Serie" required={requiredByPolicy('deviceIdentifier')} error={fieldError('deviceIdentifier')}><div className={styles.identifierRow}><Input id={`${prefix}-deviceIdentifier`} name="deviceIdentifier" type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode="text" required={requiredByPolicy('deviceIdentifier') && !identifierUnavailable} disabled={identifierUnavailable} {...invalidProps('deviceIdentifier')} onBlur={(event) => { event.currentTarget.value = normalizeNewRepairInput('deviceIdentifier', event.currentTarget.value); }} placeholder="IMEI o número de serie" /><label className={`${styles.inlineCheck} ${styles.identifierUnavailable}`}><input type="checkbox" checked={identifierUnavailable} onChange={(event) => setIdentifierUnavailable(event.target.checked)} />No disponible</label></div></Field> : null}
          {visible('deviceColor') ? <Field id={`${prefix}-deviceColor`} label="Color" required={requiredByPolicy('deviceColor')} error={fieldError('deviceColor')} className={styles.colorField}><div className={styles.colorPicker} role="group" aria-label="Color del equipo" {...invalidProps('deviceColor')}>{receptionColorPresets.map((preset, index) => <button id={index === 0 ? `${prefix}-deviceColor` : undefined} key={preset.value} type="button" aria-pressed={deviceColor === preset.value} title={preset.value} onClick={() => { setDirty(true); setDeviceColor(preset.value); setCustomColor(false); }}><span className={receptionColorSwatchClass[preset.value]} />{preset.value}</button>)}<button type="button" aria-pressed={customColor} onClick={() => { setDirty(true); setCustomColor(true); if (!deviceColor.startsWith('#')) setDeviceColor('#64748B'); }}>Otro</button></div>{customColor ? <div className={styles.customColor}><Input aria-label="Color personalizado" type="color" value={deviceColor.startsWith('#') ? deviceColor : '#64748B'} onChange={(event) => setDeviceColor(normalizeNewRepairInput('deviceColor', event.target.value))} /><code>{deviceColor.startsWith('#') ? deviceColor : '#64748B'}</code></div> : null}{requiredByPolicy('deviceColor') ? <Input aria-label="Color seleccionado" value={deviceColor} readOnly required placeholder="Selecciona un color" /> : null}</Field> : null}
          {visible('physicalConditionSummary') ? <Field id={`${prefix}-physicalConditionSummary`} label="Condición física" required={requiredByPolicy('physicalConditionSummary')} error={fieldError('physicalConditionSummary')} className={styles.conditionField}><Textarea id={`${prefix}-physicalConditionSummary`} name="physicalConditionSummary" required={requiredByPolicy('physicalConditionSummary')} {...invalidProps('physicalConditionSummary')} rows={2} onBlur={(event) => { event.currentTarget.value = normalizeNewRepairInput('physicalConditionSummary', event.currentTarget.value); }} placeholder="Estado visible al recibir" /></Field> : null}
          {visible('simIncluded') ? <fieldset className={styles.binaryField} aria-invalid={fieldError('simIncluded') ? 'true' : undefined} aria-describedby={fieldError('simIncluded') ? `${prefix}-simIncluded-description` : undefined}><legend>SIM / chip{requiredByPolicy('simIncluded') ? ' *' : ''}</legend><label><input id={`${prefix}-simIncluded-no`} type="radio" name="simIncluded" value="no" required={requiredByPolicy('simIncluded')} />No trae</label><label><input id={`${prefix}-simIncluded-yes`} type="radio" name="simIncluded" value="yes" required={requiredByPolicy('simIncluded')} />Sí trae</label>{fieldError('simIncluded') ? <small id={`${prefix}-simIncluded-description`} className={styles.decisionError}>{fieldError('simIncluded')}</small> : null}</fieldset> : null}
          {visible('memoryCardIncluded') ? <fieldset className={styles.binaryField} aria-invalid={fieldError('memoryCardIncluded') ? 'true' : undefined} aria-describedby={fieldError('memoryCardIncluded') ? `${prefix}-memoryCardIncluded-description` : undefined}><legend>Memoria / tarjeta{requiredByPolicy('memoryCardIncluded') ? ' *' : ''}</legend><label><input id={`${prefix}-memoryCardIncluded-no`} type="radio" name="memoryCardIncluded" value="no" required={requiredByPolicy('memoryCardIncluded')} />No trae</label><label><input id={`${prefix}-memoryCardIncluded-yes`} type="radio" name="memoryCardIncluded" value="yes" required={requiredByPolicy('memoryCardIncluded')} />Sí trae</label>{fieldError('memoryCardIncluded') ? <small id={`${prefix}-memoryCardIncluded-description`} className={styles.decisionError}>{fieldError('memoryCardIncluded')}</small> : null}</fieldset> : null}
          {visible('receivedPowerState') ? <fieldset className={styles.binaryField} aria-invalid={fieldError('receivedPowerState') ? 'true' : undefined} aria-describedby={fieldError('receivedPowerState') ? `${prefix}-receivedPowerState-description` : undefined}><legend>Estado al recibir{requiredByPolicy('receivedPowerState') ? ' *' : ''}</legend><label><input id={`${prefix}-receivedPowerState-on`} type="radio" name="receivedPowerState" value="powered_on" required={requiredByPolicy('receivedPowerState')} />Encendido</label><label><input id={`${prefix}-receivedPowerState-off`} type="radio" name="receivedPowerState" value="powered_off" required={requiredByPolicy('receivedPowerState')} />Apagado</label>{fieldError('receivedPowerState') ? <small id={`${prefix}-receivedPowerState-description`} className={styles.decisionError}>{fieldError('receivedPowerState')}</small> : null}</fieldset> : null}
          <label className={`${styles.inlineCheck} ${styles.accessoriesToggle}`}><input type="checkbox" checked={registerOtherAccessories} onChange={(event) => { setRegisterOtherAccessories(event.target.checked); if (!event.target.checked) setOtherAccessories(''); }} />Registrar otros accesorios</label>
          {registerOtherAccessories ? <Field id={`${prefix}-otherAccessories`} label="Otros accesorios"><Input id={`${prefix}-otherAccessories`} name="otherAccessories" value={otherAccessories} onChange={(event) => setOtherAccessories(event.target.value)} onBlur={() => setOtherAccessories(normalizeNewRepairInput('otherAccessories', otherAccessories))} placeholder="Funda, cargador…" /></Field> : null}
        </FormSection>

        <FormSection compact step={3} icon={ClipboardPenLine} className={`${styles.receptionSection} ${guidedSectionClass('reception')}`} title="Recepción" description="Motivo y condiciones de ingreso" status={sectionStatus('reception')}>
          <Field id={`${prefix}-reportedProblems`} label="Problemas reportados" required fullWidth error={fieldError('reportedProblems')} className={styles.reportedProblemsField}><ReportedProblemsInput id={`${prefix}-reportedProblems`} value={reportedProblems} error={fieldError('reportedProblems')} describedBy={fieldError('reportedProblems') ? `${prefix}-reportedProblems-description` : undefined} onChange={(next) => { setReportedProblems(next); setDirty(true); }} /></Field>
          {visible('customerNarrative') ? <Field id={`${prefix}-customerNarrative`} label="Relato del cliente" required={requiredByPolicy('customerNarrative')} fullWidth error={fieldError('customerNarrative')} className={styles.secondaryNarrative}><Textarea id={`${prefix}-customerNarrative`} name="customerNarrative" required={requiredByPolicy('customerNarrative')} {...invalidProps('customerNarrative')} rows={2} onBlur={(event) => { event.currentTarget.value = normalizeNewRepairInput('customerNarrative', event.currentTarget.value); }} placeholder="Contexto adicional opcional" /></Field> : null}
          <div className={styles.conditionalTriggers}>
            {visible('warrantyReviewRequested') ? <ReceptionDecision id={`${prefix}-warrantyReviewRequested`} name={`${prefix}-warrantyReviewRequested`} label="Solicita revisión por garantía" value={warrantyReview} required={requiredByPolicy('warrantyReviewRequested')} error={fieldError('warrantyReviewRequested')} onChange={changeWarrantyReview} /> : null}
            {visible('differentDeliverer') ? <ReceptionDecision id={`${prefix}-differentDeliverer`} name={`${prefix}-differentDeliverer`} label="Entrega una persona distinta al cliente" value={differentDeliverer} required={requiredByPolicy('differentDeliverer')} error={fieldError('differentDeliverer')} onChange={(value) => setDifferentDeliverer(value)} /> : null}
            {visible('requiresRiskAcceptance') ? <ReceptionDecision id={`${prefix}-requiresRiskAcceptance`} name={`${prefix}-requiresRiskAcceptance`} label="¿La reparación requiere aceptar algún riesgo?" value={requiresRiskAcceptance} required={requiredByPolicy('requiresRiskAcceptance')} error={fieldError('requiresRiskAcceptance')} onChange={(value) => { setRequiresRiskAcceptance(value); if (!value) setAcceptedRiskIds([]); }} /> : null}
          </div>
          {visible('warrantyReviewRequested') && warrantyReview === true ? (
            <div className={`${styles.conditionalPanel} ${styles.previousRepairPanel}`}>
              <Field id={`${prefix}-previousRepairSearch`} label="Reparación anterior" fullWidth>
                <SearchAutocomplete listboxId={`${prefix}-previousRepairOptions`} label="Reparaciones coincidentes" options={previousRepairCandidates.map((repair, index) => ({ id: `${prefix}-previousRepairOption-${index}`, key: repair.id, primary: repair.folio, secondary: `${repair.customer.name} · ${repair.device.label}`, meta: <time dateTime={repair.receivedAt}>{formatRepairLookupDate(repair.receivedAt, timeZone)}</time>, icon: <Smartphone size={16} /> }))} activeIndex={activePreviousRepairIndex} status={previousRepairLookupState === 'loading' ? { kind: 'loading', message: 'Buscando reparaciones…' } : previousRepairLookupState === 'empty' ? { kind: 'empty', message: 'No se encontraron reparaciones en esta sucursal.' } : previousRepairLookupState === 'error' ? { kind: 'error', message: previousRepairLookupError ?? 'No fue posible buscar la reparación anterior.' } : { kind: 'idle' }} width="wide" focused={previousRepairLookupFocused} onFocusWithinChange={setPreviousRepairLookupFocused} onActiveIndexChange={setActivePreviousRepairIndex} onSelect={(index) => { const repair = previousRepairCandidates[index]; if (repair) choosePreviousRepair(repair); }} onDismiss={dismissPreviousRepairAutocomplete}>
                  {selectedPreviousRepair ? (
                    <div className={`${styles.selectedIdentity} ${styles.selectedPreviousRepair}`}>
                      <Smartphone aria-hidden="true" size={18} />
                      <div><strong>{selectedPreviousRepair.folio}</strong><small>{selectedPreviousRepair.customer.name} · {selectedPreviousRepair.device.label}</small></div>
                      <div className={styles.selectedPreviousRepairActions}><Button ref={previousRepairChangeRef} type="button" size="compact" tone="quiet" onClick={changePreviousRepair}>Cambiar</Button><Button type="button" size="compact" tone="quiet" onClick={removePreviousRepair}>Quitar</Button></div>
                    </div>
                  ) : (
                    <Input ref={previousRepairSearchRef} id={`${prefix}-previousRepairSearch`} value={previousRepairQuery} onChange={(event) => setPreviousRepairQuery(event.target.value)} onKeyDown={handlePreviousRepairComboboxKeyDown} placeholder="Escribe el folio de la reparación" {...autocompleteInputProps(`${prefix}-previousRepairOptions`, previousRepairLookupFocused && previousRepairCandidates.length > 0, previousRepairLookupFocused && activePreviousRepairIndex >= 0 ? `${prefix}-previousRepairOption-${activePreviousRepairIndex}` : undefined)} />
                  )}
                </SearchAutocomplete>
              </Field>
            </div>
          ) : null}
          {differentDeliverer === true ? <Field id={`${prefix}-deliveredByName`} label="Persona que entrega" required error={fieldError('deliveredByName')}><Input id={`${prefix}-deliveredByName`} name="deliveredByName" type="text" autoComplete="off" autoCapitalize="words" autoCorrect="off" spellCheck={false} inputMode="text" required {...invalidProps('deliveredByName')} onBlur={(event) => { event.currentTarget.value = normalizeNewRepairInput('deliveredByName', event.currentTarget.value); }} placeholder="Nombre" /></Field> : null}
          {requiresRiskAcceptance === true ? <div className={styles.conditionalPanel}><div className={styles.riskSelectionField}><InterventionRiskCheckboxList ref={acceptedRiskGroupRef} id={`${prefix}-acceptedRiskIds`} options={riskOptions} selectedRiskIds={acceptedRiskIds} loading={riskCatalogLoading} catalogError={riskCatalogError} selectionError={fieldError('acceptedRiskIds')} onRetry={() => loadRiskCatalog()} onChange={(riskIds) => { setAcceptedRiskIds(riskIds); setDirty(true); }} /></div><Field id={`${prefix}-documentedRiskSummary`} label="Detalle adicional" fullWidth><Textarea id={`${prefix}-documentedRiskSummary`} name="documentedRiskSummary" rows={2} onBlur={(event) => { event.currentTarget.value = normalizeNewRepairInput('documentedRiskSummary', event.currentTarget.value); }} placeholder="Contexto adicional comunicado al cliente" /></Field><p className={styles.riskNotice}>Estos riesgos fueron comunicados y el cliente aceptó continuar. La aceptación fue registrada por el recepcionista; no constituye firma ni evidencia legal.</p></div> : null}
        </FormSection>

        <FormSection compact step={4} icon={LockKeyhole} className={`${styles.accessSection} ${guidedSectionClass('access')}`} title="Acceso" description="Bloqueo del dispositivo" status={sectionStatus('access')}>
          {visible('deviceAccessType') ? <Field id={`${prefix}-deviceAccessType`} label="Tipo de bloqueo" required={requiredByPolicy('deviceAccessType')} error={fieldError('deviceAccessType')}><select id={`${prefix}-deviceAccessType`} name="deviceAccessType" required={requiredByPolicy('deviceAccessType')} value={deviceAccessType} {...invalidProps('deviceAccessType')} onChange={(event) => changeDeviceAccessType(event.target.value)}><option value="">Seleccionar</option><option value="none">Ninguno</option><option value="pin">PIN</option><option value="password">Contraseña</option><option value="pattern">Patrón</option></select></Field> : null}
          {visible('deviceAccessType') && deviceAccessType === 'none' ? <div className={styles.accessNoneState}><LockKeyhole aria-hidden="true" size={16} /><span>Sin credencial de acceso para esta recepción.</span></div> : null}
          {visible('deviceAccessType') && deviceAccessType && deviceAccessType !== 'none' ? <div className={styles.deviceAccessPanel}><ShieldAlert aria-hidden="true" size={18} /><div><div className={styles.deviceAccessCopy}><strong>Credencial temporal</strong><span>Sólo se usa durante esta captura y no se almacena.</span></div>{deviceAccessType === 'pattern' ? <div className={styles.patternCaptureField}><div className={styles.patternCaptureState}><span>{isDevicePatternValid(devicePattern) ? 'Patrón capturado' : 'Patrón pendiente'}</span><Button id={`${prefix}-devicePatternTrigger`} type="button" data-device-pattern-trigger="true" aria-invalid={fieldError('devicePattern') ? 'true' : undefined} aria-describedby={fieldError('devicePattern') ? `${prefix}-devicePattern-description` : undefined} onClick={() => setPatternDialogOpen(true)}>{isDevicePatternValid(devicePattern) ? 'Reemplazar patrón' : 'Capturar patrón'}</Button></div>{fieldError('devicePattern') ? <small id={`${prefix}-devicePattern-description`} className={styles.decisionError}>{fieldError('devicePattern')}</small> : null}</div> : <Field id={`${prefix}-deviceAccessSecret`} label={deviceAccessType === 'pin' ? 'PIN' : 'Contraseña'} error={fieldError('deviceAccessSecret')}><div className={styles.secretInputRow}><Input id={`${prefix}-deviceAccessSecret`} type={deviceAccessSecretVisible ? 'text' : 'password'} value={deviceAccessSecret} {...invalidProps('deviceAccessSecret')} inputMode={deviceAccessType === 'pin' ? 'numeric' : 'text'} autoComplete="one-time-code" autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(event) => setDeviceAccessSecret(event.target.value)} /><Button type="button" aria-label={deviceAccessSecretVisible ? 'Ocultar credencial' : 'Mostrar credencial'} onClick={() => setDeviceAccessSecretVisible((visible) => !visible)}>{deviceAccessSecretVisible ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}{deviceAccessSecretVisible ? 'Ocultar' : 'Mostrar'}</Button></div></Field>}</div></div> : null}
        </FormSection>

        <FormSection compact step={5} icon={CalendarClock} className={`${styles.commitmentSection} ${guidedSectionClass('commitment')}`} title="Compromiso" description="Tiempo y referencia inicial" status={sectionStatus('commitment')}>
          {visible('estimatedDeliveryLocal') ? <Field id={`${prefix}-estimatedDeliveryLocal`} label="Estimación de entrega" required={requiredByPolicy('estimatedDeliveryLocal')} hint={fieldError('estimatedDeliveryLocal') ? undefined : 'Hora local de la sucursal'} error={fieldError('estimatedDeliveryLocal')} className={styles.commitmentField}><Input id={`${prefix}-estimatedDeliveryLocal`} name="estimatedDeliveryLocal" required={requiredByPolicy('estimatedDeliveryLocal')} type="datetime-local" {...invalidProps('estimatedDeliveryLocal')} aria-describedby={`${prefix}-estimatedDeliveryLocal-description`} /></Field> : null}
          {visible('initialBudgetAmount') ? <Field id={`${prefix}-initialBudgetAmount`} label="Presupuesto inicial" required={requiredByPolicy('initialBudgetAmount')} hint={fieldError('initialBudgetAmount') ? undefined : 'Aproximación; no es precio final'} error={fieldError('initialBudgetAmount')} className={styles.commitmentField}><div className={styles.moneyInput}><span>$</span><Input id={`${prefix}-initialBudgetAmount`} name="initialBudgetAmount" required={requiredByPolicy('initialBudgetAmount')} value={initialBudgetAmount} {...invalidProps('initialBudgetAmount')} onChange={(event) => setInitialBudgetAmount(moneyInput(event.target.value))} inputMode="decimal" placeholder="0.00" aria-describedby={`${prefix}-initialBudgetAmount-description`} /><span>MXN</span></div></Field> : null}
          <div className={`${styles.commitmentField} ${styles.depositField}`} aria-label="Anticipo, próximamente; requiere Caja"><div className={styles.depositHeading}><strong>Anticipo</strong><span>Próximamente</span></div><small>Requiere Caja</small></div>
        </FormSection>
        {mode === 'guided_v2' && guidedOnReview ? <section className={styles.guidedReview} aria-labelledby={`${prefix}-guided-step-title`}>
          <p className={styles.guidedReviewIntro}>Confirma los datos esenciales. Las credenciales temporales nunca se muestran ni se envían al servidor.</p>
          <div className={styles.guidedReviewGrid}>
            <GuidedReviewGroup title="Cliente" onEdit={() => goToGuidedStep('customer')} items={[
              { value: selectedCustomer?.name ?? compactInputWhitespace(`${givenName} ${familyName}`) },
              ...(visible('customerPhone') ? [{ value: reviewPhone }] : []),
            ]} />
            {guidedSteps.some((step) => step.id === 'equipment') ? <GuidedReviewGroup title="Equipo" onEdit={() => goToGuidedStep('equipment')} items={[
              { value: compactInputWhitespace(`${deviceBrand} ${deviceModel}`) },
              { value: [visible('deviceType') ? reviewText('deviceType') : '', visible('deviceColor') ? deviceColor : '', visible('receivedPowerState') ? reviewPowerState : ''].filter((value) => value && value !== 'No indicado').join(' · ') },
              ...(visible('deviceIdentifier') ? [{ value: identifierUnavailable ? 'IMEI no disponible' : reviewText('deviceIdentifier') ? `IMEI / Serie: ${reviewText('deviceIdentifier')}` : '' }] : []),
              { value: [visible('simIncluded') ? nullableBoolean(reviewValues?.get('simIncluded') ?? null) === true ? 'Con SIM' : nullableBoolean(reviewValues?.get('simIncluded') ?? null) === false ? 'Sin SIM' : '' : '', visible('memoryCardIncluded') ? nullableBoolean(reviewValues?.get('memoryCardIncluded') ?? null) === true ? 'Con memoria' : nullableBoolean(reviewValues?.get('memoryCardIncluded') ?? null) === false ? 'Sin memoria' : '' : ''].filter(Boolean).join(' · ') },
              ...(registerOtherAccessories ? [{ label: 'Accesorios', value: otherAccessories }] : []),
            ]} /> : null}
            <GuidedReviewGroup title="Problemas" onEdit={() => goToGuidedStep('reception')} items={[{ value: reportedProblems.map((problem) => `${problem.label}${problem.categoryId === null ? ' (Por revisar)' : ''}`).join(' · ') }]} />
            <GuidedReviewGroup title="Recepción" onEdit={() => goToGuidedStep('reception')} items={[
              ...(visible('physicalConditionSummary') ? [{ label: 'Condición física', value: reviewText('physicalConditionSummary') }] : []),
              ...(visible('customerNarrative') ? [{ value: reviewText('customerNarrative') }] : []),
              ...(warrantyReview === true ? [{ value: `Garantía${selectedPreviousRepair?.folio ? ` · ${selectedPreviousRepair.folio}` : ''}` }] : []),
              ...(differentDeliverer === true ? [{ label: 'Entrega', value: reviewText('deliveredByName') }] : []),
              ...(requiresRiskAcceptance === true ? [{ label: 'Riesgos aceptados', value: reviewRiskLabels.join(' · ') }] : []),
              ...(requiresRiskAcceptance === true ? [{ label: 'Detalle de riesgo', value: reviewText('documentedRiskSummary') }] : []),
            ]} />
            {guidedSteps.some((step) => step.id === 'access') ? <GuidedReviewGroup title="Acceso" onEdit={() => goToGuidedStep('access')} items={[{ value: guidedAccessSummary(deviceAccessType, deviceAccessType === 'pattern' ? isDevicePatternValid(devicePattern) : deviceAccessSecret.trim().length > 0) }]} /> : null}
            {guidedSteps.some((step) => step.id === 'commitment') ? <GuidedReviewGroup title="Compromiso" onEdit={() => goToGuidedStep('commitment')} items={[
              ...(visible('estimatedDeliveryLocal') ? [{ label: 'Entrega', value: formatGuidedLocalDateTime(reviewText('estimatedDeliveryLocal')) }] : []),
              ...(visible('initialBudgetAmount') ? [{ label: 'Presupuesto inicial', value: formatGuidedMoney(initialBudgetAmount) }] : []),
            ]} /> : null}
          </div>
        </section> : null}
      </form>
    </Dialog>
    <DevicePatternDialog open={patternDialogOpen} savedPattern={devicePattern} restoreFocusSelector='[data-device-pattern-trigger="true"]' onCancel={() => setPatternDialogOpen(false)} onSave={(pattern) => { setDevicePattern(pattern); setPatternDialogOpen(false); setDirty(true); }} />
    <Dialog open={confirmClose} title="¿Descartar esta captura?" description="Los datos escritos todavía no se han guardado." footer={<><Button onClick={() => setConfirmClose(false)}>Seguir capturando</Button><Button tone="danger" onClick={closeNow}>Descartar</Button></>} onClose={() => setConfirmClose(false)}><p className={styles.confirmCopy}>La reparación no será creada y el folio no será consumido.</p></Dialog>
  </>;
}
