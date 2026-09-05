import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/axios';

export function useFileActions() {
  const queryClient = useQueryClient();

  // Rename a file or folder
  const renameItem = useMutation({
    mutationFn: async ({ id, type, newName }) => {
      const endpoint = type === 'folder' ? `/folders/${id}` : `/files/${id}`;
      const payload = type === 'folder' ? { name: newName } : { original_filename: newName };
      const response = await apiClient.patch(endpoint, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });

  // Soft delete a file or folder
  const softDeleteItem = useMutation({
    mutationFn: async ({ id, type }) => {
      const endpoint = type === 'folder' ? `/folders/${id}` : `/files/${id}`;
      const response = await apiClient.delete(endpoint);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });

  // Star a file or folder (Placeholder since backend doesn't fully support it yet in the contract, 
  // but we can prepare the hook for when it does)
  const toggleStarItem = useMutation({
    mutationFn: async ({ id, type, currentStarState }) => {
      // In a real implementation this would hit /stars/${type}/${id}
      // For now, we'll just simulate a success response since it's a frontend-only mockup
      return { id, type, starred: !currentStarState };
    },
    onSuccess: () => {
      // Opt-in for when backend is ready
      // queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  return {
    renameItem: renameItem.mutateAsync,
    isRenaming: renameItem.isPending,
    softDeleteItem: softDeleteItem.mutateAsync,
    isSoftDeleting: softDeleteItem.isPending,
    toggleStarItem: toggleStarItem.mutateAsync,
  };
}
