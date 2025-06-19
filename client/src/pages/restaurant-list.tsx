import { useState, useEffect } from "react";
import { useRestaurants, useRefreshRestaurants } from "@/hooks/use-restaurants";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, UtensilsCrossed } from "lucide-react";
import RestaurantCard from "@/components/restaurant-card";

export default function RestaurantList() {
  const { data: restaurants, isLoading, error } = useRestaurants();
  const { refreshRestaurants } = useRefreshRestaurants();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRestaurants();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update page title
  useEffect(() => {
    document.title = "Restaurant Link, Food connection";
  }, []);

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Restaurant Link</h1>
              <p className="text-sm opacity-90">Food connection</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Available Restaurants</h2>
          <p className="text-gray-600">Choose from our partner restaurants</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="loading-shimmer bg-white rounded-xl shadow-lg p-6 h-64" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to load restaurants</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Please check your connection and try again'}
            </p>
            <Button onClick={handleRefresh} className="bg-secondary hover:bg-secondary/90">
              Try Again
            </Button>
          </div>
        )}

        {/* Restaurant Grid */}
        {restaurants && restaurants.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {restaurants && restaurants.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No restaurants available</h3>
            <p className="text-gray-600">Check back later for new restaurants.</p>
          </div>
        )}
      </main>
    </div>
  );
}
