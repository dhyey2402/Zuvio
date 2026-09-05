import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/axios';

export function useTrash() {
  const queryClient = useQueryClient();

  // Fetch trash items
  const { data, isLoading, error } = useQuery({
    queryKey: ['trash'],
    queryFn: async () => {
      const response = await apiClient.get('/trash');
      return response.data;
    },
  });

  // Restore item
  const restoreItem = useMutation({
    mutationFn: async ({ id }) => {
      const response = await apiClient.post(`/trash/${id}/restore`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      // We invalidate all files to ensure the restored item shows up in any folder it belongs to
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });

  // Permanently delete item
  const permanentDeleteItem = useMutation({
    mutationFn: async ({ id }) => {
      const response = await apiClient.delete(`/trash/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });

  // Split into files and folders for FileBrowser
  const items = data?.items || [];
  const folders = items.filter(item => item.type === 'folder');
  const files = items.filter(item => item.type === 'file');

  return {
    folders,
    files,
    isLoading,
    error,
    restoreItem: restoreItem.mutateAsync,
    isRestoring: restoreItem.isPending,
    permanentDeleteItem: permanentDeleteItem.mutateAsync,
    isDeletingPermanently: permanentDeleteItem.isPending,
  };
}
