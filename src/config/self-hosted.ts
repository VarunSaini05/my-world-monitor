/**
 * Owner mode for private/self-hosted deployments.
 *
 * This is intentionally opt-in. The public hosted product keeps its normal
 * entitlement behavior unless the deployment explicitly enables the flag.
 */
export const SELF_HOSTED_FULL_ACCESS =
  import.meta.env.VITE_SELF_HOSTED_FULL_ACCESS === 'true';
