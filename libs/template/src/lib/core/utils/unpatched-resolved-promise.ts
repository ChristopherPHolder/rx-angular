/** A shared promise instance to cause a delay of one microtask */
import { getZoneUnPatchedApi } from '@rx-angular/cdk/internals/core';

let resolvedPromise: Promise<void> | null = null;

export function getUnpatchedResolvedPromise(): Promise<void> {
  return (
    resolvedPromise ||
    (resolvedPromise = getZoneUnPatchedApi('Promise').resolve())
  );
}
