import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useMenu } from "@/hooks/use-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderScreen() {
  const { id, itemName } = useParams();
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.find(r => r.id === id);
  const { data: menu } = useMenu(restaurant);
  const { toast } = useToast();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  useEffect(() => {
    if (restaurant) {
      document.title = `Order from ${restaurant.name} - Restaurant Hub`;
    }
  }, [restaurant]);

  useEffect(() => {
    // Load saved orders from localStorage
    const savedOrders = localStorage.getItem('currentOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }

    // Load saved customer info
    setCustomerName(localStorage.getItem('customerName') || '');
    setDeliveryOption(localStorage.getItem('deliveryOption') as 'pickup' | 'delivery' || 'pickup');
    setDeliveryAddress(localStorage.getItem('deliveryAddress') || '');
    setPickupTime(localStorage.getItem('pickupTime') || '');
  }, []);

  useEffect(() => {
    // Find the selected item if itemName is provided
    if (itemName && menu) {
      const decodedItemName = decodeURIComponent(itemName);
      for (const [section, items] of Object.entries(menu)) {
        const found = (items as any[]).find(item => item.name === decodedItemName);
        if (found) {
          setSelectedItem(found);
          break;
        }
      }
    }
  }, [itemName, menu]);

  const saveState = () => {
    localStorage.setItem('currentOrders', JSON.stringify(orders));
    localStorage.setItem('customerName', customerName);
    localStorage.setItem('deliveryOption', deliveryOption);
    localStorage.setItem('deliveryAddress', deliveryAddress);
    localStorage.setItem('pickupTime', pickupTime);
  };

  const addToOrder = () => {
    if (!selectedItem) return;

    const orderItem = {
      item: selectedItem,
      size: Object.keys(selectedItem.prices)[0] || '',
      specials: [],
      side: null,
      veg: null,
      gravey: null,
      isMix: false
    };

    const newOrders = [...orders, orderItem];
    setOrders(newOrders);
    saveState();
    
    toast({
      title: "Item added to order",
      description: `${selectedItem.name} has been added to your order.`,
    });
  };

  const removeFromOrder = (index: number) => {
    const newOrders = orders.filter((_, i) => i !== index);
    setOrders(newOrders);
    saveState();
  };

  const calculateTotal = () => {
    return orders.reduce((total, order) => {
      const price = order.item.prices[order.size] || Object.values(order.item.prices)[0] || 0;
      return total + price;
    }, 0);
  };

  const buildOrderSummary = () => {
    let summary = '';
    let total = 0;
    
    orders.forEach((order, index) => {
      summary += `Order #${index + 1}:\n`;
      summary += `Item: ${order.item.name}\n`;
      if (order.size) summary += `Size: ${order.size}\n`;
      
      const price = order.item.prices[order.size] || Object.values(order.item.prices)[0] || 0;
      total += price;
      summary += `Price: $${price.toFixed(2)}\n\n`;
    });
    
    summary += `Total: $${total.toFixed(2)}`;
    return summary;
  };

  const sendOrder = () => {
    if (!restaurant || !restaurant.whatsAppNumber || orders.length === 0) {
      toast({
        title: "Cannot send order",
        description: "Please add items to your order and ensure all details are filled.",
        variant: "destructive"
      });
      return;
    }

    if (!customerName) {
      toast({
        title: "Missing information",
        description: "Please enter your name.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryOption === 'delivery' && !deliveryAddress) {
      toast({
        title: "Missing information",
        description: "Please enter your delivery address.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryOption === 'pickup' && !pickupTime) {
      toast({
        title: "Missing information",
        description: "Please enter your pickup time.",
        variant: "destructive"
      });
      return;
    }

    const orderSummary = buildOrderSummary();
    const deliveryInfo = deliveryOption === 'delivery' 
      ? `Delivery Address: ${deliveryAddress}`
      : `Pickup Time: ${pickupTime}`;
    
    const message = `Hello ${restaurant.name}, I would like to place an order:\n\n${orderSummary}\n\nName: ${customerName}\n${deliveryInfo}`;
    const whatsappUrl = `https://wa.me/${restaurant.whatsAppNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Clear the order after sending
    setOrders([]);
    localStorage.removeItem('currentOrders');
    
    toast({
      title: "Order sent!",
      description: "Your order has been sent via WhatsApp.",
    });
  };

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
              <Link href={`/restaurant/${restaurant.id}/menu`}>
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Order from {restaurant.name}</h1>
          </div>
          {orders.length > 0 && (
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{orders.length}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Selected Item */}
          {selectedItem && (
            <Card className="fade-in">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Selected Item</h3>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">{selectedItem.name}</h4>
                    {selectedItem.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-secondary">
                      ${Object.values(selectedItem.prices)[0]}
                    </span>
                  </div>
                </div>
                <Button onClick={addToOrder} className="w-full bg-secondary hover:bg-secondary/90">
                  Add to Order
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current Orders */}
          {orders.length > 0 && (
            <Card className="fade-in">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Orders ({orders.length})</h3>
                <div className="space-y-3">
                  {orders.map((order, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{order.item.name}</h4>
                        {order.size && <p className="text-sm text-gray-600">Size: {order.size}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          ${order.item.prices[order.size] || Object.values(order.item.prices)[0]}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeFromOrder(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total:</span>
                      <span className="text-secondary">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card className="fade-in">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Order Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="pickup"
                        checked={deliveryOption === 'pickup'}
                        onChange={(e) => setDeliveryOption(e.target.value as 'pickup')}
                        className="mr-2"
                      />
                      Pickup
                    </label>
                    {restaurant.hasDelivery && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="delivery"
                          checked={deliveryOption === 'delivery'}
                          onChange={(e) => setDeliveryOption(e.target.value as 'delivery')}
                          className="mr-2"
                        />
                        Delivery (+${restaurant.deliveryPrice})
                      </label>
                    )}
                  </div>
                </div>

                {deliveryOption === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Address *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Enter your delivery address"
                      rows={3}
                    />
                  </div>
                )}

                {deliveryOption === 'pickup' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Pickup Time *</label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="e.g., 12:30 PM"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Order Button */}
          {orders.length > 0 && (
            <Button 
              onClick={sendOrder}
              className="w-full bg-accent hover:bg-accent/90 text-white py-3 text-lg fade-in"
            >
              Send Order via WhatsApp
            </Button>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-4 fade-in">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/restaurant/${restaurant.id}/menu`}>
                Back to Menu
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/restaurant/${restaurant.id}/profile`}>
                Restaurant Info
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
