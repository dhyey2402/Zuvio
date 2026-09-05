import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/axios';

export function useFiles(folderId = 'root', sort_by = 'name', order = 'asc') {
  const queryClient = useQueryClient();

  // Fetch folders & files for current directory
  const { data, isLoading, error } = useQuery({
    queryKey: ['files', folderId, sort_by, order],
    queryFn: async () => {
      const response = await apiClient.get(`/folders/${folderId}/contents`, {
        params: { sort_by, order }
      });
      return response.data;
    },
  });

  // Create Folder Mutation
  const createFolder = useMutation({
    mutationFn: async (name) => {
      const payload = { name };
      if (folderId !== 'root') {
        payload.parent_id = folderId;
      }
      const response = await apiClient.post('/folders', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the specific folder's queries so it refetches immediately
      queryClient.invalidateQueries({ queryKey: ['files', folderId] });
    }
  });

  return {
    folders: data?.folders || [],
    files: data?.files || [],
    isLoading,
    error,
    createFolder: createFolder.mutateAsync,
    isCreatingFolder: createFolder.isPending,
  };
}
