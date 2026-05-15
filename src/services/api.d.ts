export function setAuthToken(token: string | null): void;
export function preloadDashboardBootstrap(): Promise<unknown | null>;
export function sendLuxMessage(
  message: string,
  context?: Record<string, unknown>
): Promise<{ success: boolean; reply: string; raw?: unknown; error?: unknown }>;
