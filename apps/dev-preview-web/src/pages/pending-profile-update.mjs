export function createPendingProfileUpdate(input) {
  return Object.freeze({
    userId: input.userId,
    expectedVersion: input.expectedVersion,
    displayName: input.displayName,
    operationalIdentifier: input.operationalIdentifier,
    clientRequestId: input.clientRequestId,
  });
}

export function isPendingProfileInput(command, userId, displayName, operationalIdentifier) {
  return command.userId === userId &&
    command.displayName === displayName &&
    command.operationalIdentifier === operationalIdentifier;
}

export function isProfileUpdateConfirmed(command, user) {
  return user.userId === command.userId &&
    user.version > command.expectedVersion &&
    user.displayName === command.displayName &&
    user.operationalIdentifier === command.operationalIdentifier;
}
