import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useMenu } from "@/hooks/use-menu";
import { useCurrentPeriod } from "@/hooks/use-current-period";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RestaurantService } from "@/services/restaurant-service";
import OrderForm from "@/components/order-form";

export default function OrderScreen() {
  const { id, itemName } = useParams();
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.find(r => r.id === id);
  const { data: menu } = useMenu(restaurant ?? null);
  const currentPeriod = useCurrentPeriod(restaurant ?? null);

  useEffect(() => {
    if (restaurant) {
      document.title = `Order from ${restaurant.name} - Restaurant Link, Food connection`;
    }
  }, [restaurant]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Restaurant not found</h2>
          <Button asChild>
            <Link href="/">Back to Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center space-x-3">
            <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Link href={`/restaurant/${restaurant.id}/menu`}>
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Order from {restaurant.name}</h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Loading menu...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Filter menu by current period and flatten to array
  const filteredMenu = RestaurantService.filterMenuByPeriod(menu, currentPeriod);
  const menuItems = Object.values(filteredMenu).flat();

  // Find selected item if itemName is provided
  let selectedItem = undefined;
  if (itemName) {
    const decodedItemName = decodeURIComponent(itemName);
    selectedItem = menuItems.find(item => item.name === decodedItemName);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-3">
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Link href={`/restaurant/${restaurant.id}/menu`}>
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Order from {restaurant.name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <OrderForm
          restaurant={restaurant}
          menuItems={menuItems}
          selectedItem={selectedItem}
          onOrderComplete={() => {
            // Navigate back to menu after order completion
            window.location.href = `/restaurant/${restaurant.id}/menu`;
          }}
        />
      </main>
    </div>
  );
}