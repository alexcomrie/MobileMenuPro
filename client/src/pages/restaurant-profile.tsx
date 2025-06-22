import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useRestaurants } from "@/hooks/use-restaurants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Phone, MessageSquare, Truck, Clock } from "lucide-react";
import { RestaurantService } from "@/services/restaurant-service";

export default function RestaurantProfile() {
  const { id } = useParams();
  const { data: restaurants, isLoading } = useRestaurants();
  
  const restaurant = restaurants?.find(r => r.id === id);

  useEffect(() => {
    if (restaurant) {
      document.title = `${restaurant.name} Profile - Restaurant Link, Food connection`;
    }
  }, [restaurant]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full" />
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
            <h1 className="text-xl font-bold">{restaurant.name} Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Restaurant Image */}
          {restaurant.profilePictureUrl && (
            <div className="fade-in">
              <img 
                src={restaurant.profilePictureUrl} 
                alt={`${restaurant.name} restaurant interior view`}
                className="w-full h-64 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Restaurant Information */}
          <Card className="fade-in">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Name:</span>
                  </div>
                  <span className="font-medium">{restaurant.name}</span>
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Address:</span>
                  </div>
                  <span className="font-medium text-right max-w-xs">{restaurant.address}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Phone:</span>
                  </div>
                  <span className="font-medium">{restaurant.phoneNumber}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">WhatsApp:</span>
                  </div>
                  <span className="font-medium">{restaurant.whatsAppNumber}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Delivery:</span>
                  </div>
                  <span className={`font-medium ${restaurant.hasDelivery ? 'text-green-600' : 'text-gray-500'}`}>
                    {restaurant.hasDelivery ? `Yes, $${restaurant.deliveryPrice}` : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="fade-in">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Operating Hours</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">General Hours:</span>
                  </div>
                  <span className="font-medium">{restaurant.openingHours}</span>
                </div>
                
                {(restaurant.breakfastStartTime.hour || restaurant.breakfastEndTime.hour) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Breakfast:</span>
                    <span className="font-medium">
                      {RestaurantService.formatTime(restaurant.breakfastStartTime)} - {RestaurantService.formatTime(restaurant.breakfastEndTime)}
                    </span>
                  </div>
                )}
                
                {(restaurant.lunchStartTime.hour || restaurant.lunchEndTime.hour) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lunch:</span>
                    <span className="font-medium">
                      {RestaurantService.formatTime(restaurant.lunchStartTime)} - {RestaurantService.formatTime(restaurant.lunchEndTime)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Bio */}
          {restaurant.businessBio && (
            <Card className="fade-in">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Bio</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{restaurant.businessBio}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 fade-in">
            <Button asChild className="flex-1 bg-secondary hover:bg-secondary/90">
              <Link href={`/restaurant/${restaurant.id}/menu`}>
                View Menu
              </Link>
            </Button>
            {restaurant.whatsAppNumber && (
              <Button asChild className="flex-1 bg-accent hover:bg-accent/90">
                <Link href={`/restaurant/${restaurant.id}/order`}>
                  Place Order
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
