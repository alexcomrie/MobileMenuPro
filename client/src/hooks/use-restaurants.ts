import { useQuery } from "@tanstack/react-query";
import { RestaurantService } from "@/services/restaurant-service";

export function useRestaurants() {
  return useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: () => RestaurantService.fetchRestaurants(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });
}

export function useRefreshRestaurants() {
  const { refetch } = useRestaurants();
  
  const refreshRestaurants = async () => {
    // Clear cache to force fresh data
    localStorage.removeItem('restaurants');
    localStorage.removeItem('restaurants_cache_time');
    return refetch();
  };

  return { refreshRestaurants };
}
