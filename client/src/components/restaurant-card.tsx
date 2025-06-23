import { Restaurant } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Truck, Store, Info } from "lucide-react";
import { Link } from "wouter";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {

  return (
    <Card className="restaurant-card overflow-hidden fade-in">
      <div className="relative">
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-primary">
            {restaurant.hasDelivery ? (
              <>
                <Truck className="w-3 h-3 mr-1" />
                Delivery
              </>
            ) : (
              <>
                <Store className="w-3 h-3 mr-1" />
                Pickup
              </>
            )}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.name}</h3>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{restaurant.address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{restaurant.phoneNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{restaurant.openingHours}</span>
          </div>
          {restaurant.hasDelivery && (
            <div className="flex items-center space-x-2 text-green-600">
              <Truck className="w-4 h-4" />
              <span>Delivery: ${restaurant.deliveryPrice}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button asChild className="flex-1 bg-secondary hover:bg-secondary/90">
            <Link href={`/restaurant/${restaurant.id}/menu`}>
              View Menu
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon">
            <Link href={`/restaurant/${restaurant.id}/profile`}>
              <Info className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
