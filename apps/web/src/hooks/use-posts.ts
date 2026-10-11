import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from './use-api-mutation';
import type { Post, CreatePostInput } from '@veypost/shared';

export function useCreatePost(workspaceId: string) {
  const qc = useQueryClient();
  return useApiMutation<Post, CreatePostInput>('POST', '/api/v1/posts', {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts', workspaceId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', 'summary', workspaceId] });
    },
  });
}
