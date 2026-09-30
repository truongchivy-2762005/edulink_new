export interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}
export function createWorkspaceClient(
  baseUrl: string,
  getToken: () => string | null,
): <T>(path: string, options?: RequestOptions) => Promise<T>;
export function tokenUnits(value: string | number): bigint;
export function safeExternalUrl(value: string): string | null;

export function fundEscrow(
  request: ReturnType<typeof createWorkspaceClient>,
  job: { id: number; escrow?: { id: number; deposit_tx?: string } | null },
  signature: string,
  mock: boolean,
): Promise<unknown>;
