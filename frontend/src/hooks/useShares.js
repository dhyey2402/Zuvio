import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareService } from '../services/shareService';

export function useShares(resourceId, resourceType) {
  const queryClient = useQueryClient();
  const queryKey = ['shares', resourceId, resourceType];

  // Fetch all internal shares for this resource
  const sharesQuery = useQuery({
    queryKey: queryKey,
    queryFn: () => shareService.listShares(resourceId, resourceType),
    enabled: !!resourceId && !!resourceType,
  });

  // Create internal share
  const createShare = useMutation({
    mutationFn: (data) => shareService.createShare(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update share role
  const updateShareRole = useMutation({
    mutationFn: ({ shareId, role }) => shareService.updateShare(shareId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Remove internal share
  const removeShare = useMutation({
    mutationFn: (shareId) => shareService.removeShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Create public link
  const createPublicLink = useMutation({
    mutationFn: (data) => shareService.createPublicLink(data),
    // Assuming backend will provide the public link on the resource GET or we might fetch it elsewhere
    // If the backend doesn't return public link in the share list, we might need a separate endpoint to fetch it
    // But based on API, it's just created. We might need a separate query if we need to list it.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicLink', resourceId] });
    },
  });

  // Revoke public link
  const revokePublicLink = useMutation({
    mutationFn: (token) => shareService.revokePublicLink(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicLink', resourceId] });
    },
  });

  return {
    shares: sharesQuery.data || [],
    isLoadingShares: sharesQuery.isLoading,
    sharesError: sharesQuery.error,
    createShare: createShare.mutateAsync,
    isCreatingShare: createShare.isPending,
    updateShareRole: updateShareRole.mutateAsync,
    isUpdatingShareRole: updateShareRole.isPending,
    removeShare: removeShare.mutateAsync,
    isRemovingShare: removeShare.isPending,
    createPublicLink: createPublicLink.mutateAsync,
    isCreatingPublicLink: createPublicLink.isPending,
    revokePublicLink: revokePublicLink.mutateAsync,
    isRevokingPublicLink: revokePublicLink.isPending,
  };
}
