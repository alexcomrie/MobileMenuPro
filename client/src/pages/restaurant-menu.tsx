import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useMenu } from "@/hooks/use-menu";
import { useCurrentPeriod } from "@/hooks/use-current-period";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, UtensilsCrossed } from "lucide-react";
import { RestaurantService } from "@/services/restaurant-service";
import MenuItemCard from "@/components/menu-item-card";

export default function RestaurantMenu() {
  const { id } = useParams();
  const { data: restaurants, isLoading: restaurantsLoading } = useRestaurants();
  const restaurant = restaurants?.find(r => r.id === id);
  const { data: menu, isLoading: menuLoading, refetch } = useMenu(restaurant ?? null);
  const currentPeriod = useCurrentPeriod(restaurant ?? null);

  useEffect(() => {
    if (restaurant) {
      document.title = `${restaurant.name} Menu - Restaurant Link, Food connection`;
    }
  }, [restaurant]);

  const handleRefresh = () => {
    refetch();
  };

  if (restaurantsLoading || menuLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Restaurant not found</h2>
          <Button asChild>
            <Link href="/">Back to Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  const filteredMenu = menu ? RestaurantService.filterMenuByPeriod(menu, currentPeriod) : {};
  const hasMenuItems = Object.keys(filteredMenu).length > 0;

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Link href="/">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{restaurant.name} Menu</h1>
              <p className="text-sm opacity-90">Current period: {currentPeriod.toUpperCase()}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!hasMenuItems ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No menu items available
            </h3>
            <p className="text-gray-600 mb-4">
              No items are available for the current time period ({currentPeriod}).
            </p>
            <Button onClick={handleRefresh} className="bg-secondary hover:bg-secondary/90">
              Refresh Menu
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredMenu).map(([section, items]) => (
              <div key={section} className="fade-in">
                <div className="flex items-center mb-4">
                  <Badge className="bg-primary text-primary-foreground px-4 py-2 text-lg font-bold">
                    {section.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, index) => (
                    <MenuItemCard
                      key={`${item.name}-${index}`}
                      item={item}
                      restaurant={restaurant}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
