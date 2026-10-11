import { useApiQuery } from './use-api-query';
import type { DashboardSummary } from '@veypost/shared';

export function useDashboardSummary(workspaceId: string | undefined) {
  return useApiQuery<DashboardSummary>(
    ['dashboard', 'summary', workspaceId],
    `/api/v1/dashboard/summary?workspaceId=${workspaceId}`,
    { enabled: !!workspaceId, refetchInterval: 60_000 },
  );
}
