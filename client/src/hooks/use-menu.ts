import { useQuery } from "@tanstack/react-query";
import { RestaurantService } from "@/services/restaurant-service";
import { Restaurant } from "@shared/schema";

export function useMenu(restaurant: Restaurant | null) {
  return useQuery({
    queryKey: ['/api/menu', restaurant?.menuSheetUrl],
    queryFn: () => restaurant ? RestaurantService.fetchMenuItems(restaurant.menuSheetUrl) : Promise.resolve({}),
    enabled: !!restaurant?.menuSheetUrl,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });
}

export function useRefreshMenu() {
  const refreshMenu = async (menuSheetUrl: string) => {
    const cacheKey = `menu_${btoa(menuSheetUrl)}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_time`);
  };

  return { refreshMenu };
}
