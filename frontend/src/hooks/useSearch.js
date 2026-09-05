import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/axios';

export function useSearch(query, sort = 'name', order = 'asc') {
  const fetchSearchResults = async ({ pageParam = 1 }) => {
    if (!query) return { items: [], total: 0, page: 1, limit: 20 };
    
    // The backend uses 'created_at' but our UI usually says 'date'. Let's map 'date' to 'created_at'.
    const backendSort = sort === 'date' ? 'created_at' : sort;
    
    const response = await apiClient.get('/search', {
      params: { 
        q: query, 
        page: pageParam, 
        limit: 20,
        sort: backendSort,
        order
      }
    });
    return response.data;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['search', query, sort, order],
    queryFn: fetchSearchResults,
    getNextPageParam: (lastPage) => {
      // If we haven't fetched all items, return the next page number
      if (lastPage.page * lastPage.limit < lastPage.total) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!query, // Only fetch if query is not empty
  });

  // Flatten the pages array into a single items array
  const searchResults = data?.pages.flatMap(page => page.items) || [];
  
  // Separate into files and folders for the UI
  const folders = searchResults.filter(item => item.type === 'folder');
  const files = searchResults.filter(item => item.type === 'file');
  const total = data?.pages[0]?.total || 0;

  return {
    folders,
    files,
    total,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  };
}
