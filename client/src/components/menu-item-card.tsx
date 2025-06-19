import { MenuItem, Restaurant } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";

interface MenuItemCardProps {
  item: MenuItem;
  restaurant: Restaurant;
}

export default function MenuItemCard({ item, restaurant }: MenuItemCardProps) {
  const formatPrices = () => {
    const priceEntries = Object.entries(item.prices);
    if (priceEntries.length === 0) return "Included";
    if (priceEntries.length === 1) {
      return `$${priceEntries[0][1]}`;
    }
    return priceEntries.map(([size, price]) => `${size}: $${price}`).join(", ");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-gray-800">{item.name}</h4>
          <div className="text-right">
            <span className="font-medium text-secondary text-lg">
              {formatPrices()}
            </span>
          </div>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          {item.sides.length > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Sides: {item.sides.join(', ')}
            </Badge>
          )}
          {item.veg.length > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Veg: {item.veg.join(', ')}
            </Badge>
          )}
          {item.gravey.length > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              Gravy: {item.gravey.join(', ')}
            </Badge>
          )}
          {item.specials.length > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700">
              Specials: {item.specials.join(', ')}
            </Badge>
          )}
        </div>
        
        {restaurant.whatsAppNumber && (
          <Button 
            asChild 
            className="w-full bg-secondary hover:bg-secondary/90"
          >
            <Link href={`/restaurant/${restaurant.id}/order/${encodeURIComponent(item.name)}`}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Order
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
