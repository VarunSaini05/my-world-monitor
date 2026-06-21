/**
 * Server-side counterpart to VITE_SELF_HOSTED_FULL_ACCESS.
 *
 * Keep this explicit rather than inferring from localhost headers: reverse
 * proxies and container networks make origin-based inference unsafe.
 */
export function isSelfHostedFullAccess(): boolean {
  return process.env.SELF_HOSTED_FULL_ACCESS === 'true';
}
