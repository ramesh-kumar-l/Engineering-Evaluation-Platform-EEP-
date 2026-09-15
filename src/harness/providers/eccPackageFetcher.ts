import { EccInvocationError, type EccCliInvoker } from './eccCliInvoker.js';
import { eccContextPackageSchema, type EccContextPackage } from './eccPackageSchema.js';

/**
 * Shared by EccContextProvider (Phase 6) and AblatedEccContextProvider (Phase 8): invoke ECC's
 * CLI via the given invoker, parse its stdout as JSON, and validate it against EEP's own
 * independent schema mirror before any of it is trusted — see ADR-010 in
 * project-memory-bank/14-decisions.md. Extracted so both providers share one validation path
 * instead of duplicating it.
 */
export async function fetchValidatedEccPackage(
  invoker: EccCliInvoker,
  repositoryPath: string,
  taskDescription: string,
): Promise<EccContextPackage> {
  const stdout = await invoker.invoke(repositoryPath, taskDescription);

  let raw: unknown;
  try {
    raw = JSON.parse(stdout);
  } catch (error) {
    throw new EccInvocationError('ECC CLI did not return valid JSON on stdout', error);
  }

  const parsed = eccContextPackageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new EccInvocationError(`ECC CLI output failed schema validation: ${parsed.error.message}`);
  }

  return parsed.data;
}
