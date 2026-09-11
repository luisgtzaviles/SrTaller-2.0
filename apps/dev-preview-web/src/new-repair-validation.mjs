const requiredStates = new Set(['fixed', 'required']);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRequired(fieldStates, fieldKey) {
  return requiredStates.has(fieldStates[fieldKey]);
}

function add(issues, fieldKey, section, message, focusTarget = fieldKey) {
  issues.push(Object.freeze({ fieldKey, section, message, focusTarget }));
}

/**
 * New Repair-only operational validation. The effective Branch policy decides
 * which configurable fields participate; domain conditionals remain explicit.
 */
export function collectNewRepairValidationIssues(input) {
  const { fieldStates, values } = input;
  const issues = [];

  if (!input.selectedCustomer && !hasText(values.customerGivenName)) add(issues, 'customerGivenName', 'customer', 'Ingresa el nombre.');
  if (!input.selectedCustomer && isRequired(fieldStates, 'customerFamilyName') && !hasText(values.customerFamilyName)) add(issues, 'customerFamilyName', 'customer', 'Ingresa los apellidos.');
  if (isRequired(fieldStates, 'customerPhone') && !hasText(values.customerPhone)) add(issues, 'customerPhone', 'customer', 'Ingresa el teléfono de esta reparación.');

  if (isRequired(fieldStates, 'deviceType') && !hasText(values.deviceType)) add(issues, 'deviceType', 'equipment', 'Ingresa el tipo de equipo.');
  if (isRequired(fieldStates, 'deviceBrand') && !hasText(values.deviceBrand)) add(issues, 'deviceBrand', 'equipment', 'Ingresa la marca.');
  if (isRequired(fieldStates, 'deviceModel') && !hasText(values.deviceModel)) add(issues, 'deviceModel', 'equipment', 'Ingresa el modelo.');
  if (isRequired(fieldStates, 'deviceIdentifier') && !input.identifierUnavailable && !hasText(values.deviceIdentifier)) add(issues, 'deviceIdentifier', 'equipment', 'Ingresa el IMEI o número de serie, o marca No disponible.');
  if (isRequired(fieldStates, 'deviceColor') && !hasText(values.deviceColor)) add(issues, 'deviceColor', 'equipment', 'Selecciona el color.');
  if (isRequired(fieldStates, 'physicalConditionSummary') && !hasText(values.physicalConditionSummary)) add(issues, 'physicalConditionSummary', 'equipment', 'Describe la condición física.');
  if (isRequired(fieldStates, 'simIncluded') && values.simIncluded === null) add(issues, 'simIncluded', 'equipment', 'Indica si el equipo trae SIM.', 'simIncluded-no');
  if (isRequired(fieldStates, 'memoryCardIncluded') && values.memoryCardIncluded === null) add(issues, 'memoryCardIncluded', 'equipment', 'Indica si el equipo trae memoria.', 'memoryCardIncluded-no');
  if (isRequired(fieldStates, 'receivedPowerState') && !hasText(values.receivedPowerState)) add(issues, 'receivedPowerState', 'equipment', 'Selecciona el estado al recibir.', 'receivedPowerState-on');

  if (input.reportedProblemCount < 1) add(issues, 'reportedProblems', 'reception', 'Agrega al menos un problema reportado.');
  if (isRequired(fieldStates, 'customerNarrative') && !hasText(values.customerNarrative)) add(issues, 'customerNarrative', 'reception', 'Ingresa el relato del cliente.');
  if (isRequired(fieldStates, 'warrantyReviewRequested') && values.warrantyReviewRequested === null) add(issues, 'warrantyReviewRequested', 'reception', 'Indica si solicita revisión por garantía.', 'warrantyReviewRequested-no');
  if (isRequired(fieldStates, 'differentDeliverer') && values.differentDeliverer === null) add(issues, 'differentDeliverer', 'reception', 'Indica si entrega una persona distinta.', 'differentDeliverer-no');
  if (values.differentDeliverer === true && !hasText(values.deliveredByName)) add(issues, 'deliveredByName', 'reception', 'Ingresa el nombre de quien entrega.');
  if (isRequired(fieldStates, 'requiresRiskAcceptance') && values.requiresRiskAcceptance === null) add(issues, 'requiresRiskAcceptance', 'reception', 'Indica si se requiere aceptar algún riesgo.', 'requiresRiskAcceptance-no');
  if (values.requiresRiskAcceptance === true && input.acceptedRiskCount < 1) add(issues, 'acceptedRiskIds', 'reception', input.riskSelectionMessage ?? 'Selecciona al menos un riesgo aceptado.');

  if (isRequired(fieldStates, 'deviceAccessType') && !hasText(values.deviceAccessType)) add(issues, 'deviceAccessType', 'access', 'Selecciona el tipo de bloqueo.');
  if ((values.deviceAccessType === 'pin' || values.deviceAccessType === 'password') && !hasText(values.deviceAccessSecret)) {
    add(issues, 'deviceAccessSecret', 'access', values.deviceAccessType === 'pin' ? 'Ingresa el PIN temporal.' : 'Ingresa la contraseña temporal.');
  }
  if (values.deviceAccessType === 'pattern' && !input.patternValid) add(issues, 'devicePattern', 'access', 'Captura un patrón de 2 a 9 nodos distintos.', 'devicePatternTrigger');

  if (isRequired(fieldStates, 'estimatedDeliveryLocal') && !hasText(values.estimatedDeliveryLocal)) add(issues, 'estimatedDeliveryLocal', 'commitment', 'Ingresa la estimación de entrega.');
  if (isRequired(fieldStates, 'initialBudgetAmount') && !hasText(values.initialBudgetAmount)) add(issues, 'initialBudgetAmount', 'commitment', 'Ingresa el presupuesto inicial.');

  return Object.freeze(issues);
}
