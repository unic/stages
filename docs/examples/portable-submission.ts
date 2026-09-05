// source:start portable-submission
import {
  validatePortableSubmission,
  type PortableSubmissionDeployment,
  type PortableSubmissionOptions,
} from '@stages/authoring';

export async function acceptSubmission(
  approved: PortableSubmissionDeployment, // Resolved from the server's deployment registry.
  requestValue: unknown,
  trustedContext: unknown,
  signal?: PortableSubmissionOptions['signal'],
) {
  const result = await validatePortableSubmission(approved, requestValue, {
    context: trustedContext,
    timeoutMs: 5_000,
    ...(signal === undefined ? {} : { signal }),
  });
  if (result.status === 'accepted') {
    return { httpStatus: 200, revision: result.identity.revision, value: result.value };
  }
  return {
    httpStatus: result.status === 'rejected' ? 422 : 503,
    revision: result.identity.revision,
    issues: result.issues,
  };
}
// source:end portable-submission
