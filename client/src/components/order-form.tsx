import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Send, Store, Truck, Plus } from "lucide-react";
import { Restaurant, MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface OrderFormProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  selectedItem?: MenuItem;
  onOrderComplete?: () => void;
}

interface OrderFormData {
  selectedCategory: string;
  selectedMenuItem: MenuItem | null;
  selectedSize: string;
  selectedSpecials: Set<string>;
  selectedSide: string;
  selectedVeg: string;
  selectedGravey: string;
  isMixFood: boolean;
  selectedSecondMain: MenuItem | null;
  selectedSecondMainSpecials: Set<string>;
  customerName: string;
  deliveryOption: 'pickup' | 'delivery';
  deliveryAddress: string;
  pickupTime: string;
}

export default function OrderForm({ restaurant, menuItems, selectedItem, onOrderComplete }: OrderFormProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState<OrderFormData>({
    selectedCategory: '',
    selectedMenuItem: selectedItem || null,
    selectedSize: '',
    selectedSpecials: new Set(),
    selectedSide: '',
    selectedVeg: '',
    selectedGravey: '',
    isMixFood: false,
    selectedSecondMain: null,
    selectedSecondMainSpecials: new Set(),
    customerName: '',
    deliveryOption: 'pickup',
    deliveryAddress: '',
    pickupTime: '',
  });

  // Group menu items by category with case-insensitive handling
  const menuByCategory = menuItems.reduce((acc, item) => {
    const category = item.category.toLowerCase();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(menuByCategory);
  const mainItems = [...(menuByCategory['main'] || []), ...(menuByCategory['mains'] || [])];

  // Load saved state from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem(`orders_${restaurant.id}`);
    const savedCustomerName = localStorage.getItem('customerName');
    const savedDeliveryOption = localStorage.getItem('deliveryOption');
    const savedDeliveryAddress = localStorage.getItem('deliveryAddress');
    const savedPickupTime = localStorage.getItem('pickupTime');

    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error('Error loading saved orders:', e);
      }
    }

    setFormData(prev => ({
      ...prev,
      customerName: savedCustomerName || '',
      deliveryOption: (savedDeliveryOption as 'pickup' | 'delivery') || 'pickup',
      deliveryAddress: savedDeliveryAddress || '',
      pickupTime: savedPickupTime || '',
    }));
  }, [restaurant.id]);

  // Save state to localStorage
  const saveState = () => {
    localStorage.setItem(`orders_${restaurant.id}`, JSON.stringify(orders));
    localStorage.setItem('customerName', formData.customerName);
    localStorage.setItem('deliveryOption', formData.deliveryOption);
    localStorage.setItem('deliveryAddress', formData.deliveryAddress);
    localStorage.setItem('pickupTime', formData.pickupTime);
  };

  useEffect(() => {
    saveState();
  }, [orders, formData.customerName, formData.deliveryOption, formData.deliveryAddress, formData.pickupTime]);

  const updateFormData = (updates: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle special selection with choose one logic and caps
  const handleSpecialChange = (special: string, checked: boolean, isSecondMain: boolean = false) => {
    const menuItem = isSecondMain ? formData.selectedSecondMain : formData.selectedMenuItem;
    if (!menuItem) return;

    const currentSpecials = isSecondMain ? formData.selectedSecondMainSpecials : formData.selectedSpecials;
    const newSpecials = new Set(currentSpecials);

    if (checked) {
      // If "choose one" option, clear existing selections
      if (menuItem.specialOption === 'choose one') {
        newSpecials.clear();
      }
      
      // Check if we're at the cap
      if (menuItem.specialCap === null || newSpecials.size < menuItem.specialCap) {
        newSpecials.add(special);
      } else {
        toast({
          title: "Special Limit Reached",
          description: `You can only select ${menuItem.specialCap} special(s)`,
          variant: "destructive"
        });
        return;
      }
    } else {
      newSpecials.delete(special);
    }

    if (isSecondMain) {
      updateFormData({ selectedSecondMainSpecials: newSpecials });
    } else {
      updateFormData({ selectedSpecials: newSpecials });
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    updateFormData({
      selectedCategory: category,
      selectedMenuItem: null,
      selectedSize: '',
      selectedSpecials: new Set(),
      selectedSide: '',
      selectedVeg: '',
      selectedGravey: '',
      isMixFood: false,
      selectedSecondMain: null,
      selectedSecondMainSpecials: new Set(),
    });
  };

  // Handle menu item change
  const handleMenuItemChange = (itemName: string) => {
    const item = menuItems.find(m => m.name === itemName) || null;
    updateFormData({
      selectedMenuItem: item,
      selectedSize: '',
      selectedSpecials: new Set(),
      selectedSide: '',
      selectedVeg: '',
      selectedGravey: '',
      isMixFood: formData.isMixFood,
      selectedSecondMain: formData.selectedSecondMain,
      selectedSecondMainSpecials: formData.selectedSecondMainSpecials
    });
  };

  // Handle mix food toggle
  const handleMixFoodChange = (isMix: boolean) => {
    updateFormData({
      isMixFood: isMix,
      selectedSecondMain: null,
      selectedSecondMainSpecials: new Set(),
    });

    // If enabling mix food, ensure size is Med or Lrg
    if (isMix && formData.selectedSize && !['Med', 'Lrg'].includes(formData.selectedSize)) {
      updateFormData({ selectedSize: 'Med' });
    }
  };

  const addToOrder = () => {
    if (!formData.selectedMenuItem || !formData.selectedSize) {
      toast({
        title: "Missing Selection",
        description: "Please select an item and size",
        variant: "destructive"
      });
      return;
    }

    // Mix-specific validations
    const isMainCategory = formData.selectedCategory && formData.selectedCategory.toLowerCase().includes('main');
    if (isMainCategory && formData.isMixFood && !formData.selectedSecondMain) {
      toast({
        title: "Missing Second Main",
        description: "Please select a second main dish for mix meal",
        variant: "destructive"
      });
      return;
    }

    if (isMainCategory && 
        formData.isMixFood && 
        formData.selectedSize !== 'Med' && formData.selectedSize !== 'Lrg') {
      toast({
        title: "Invalid Size",
        description: "Mix meals are only available in Medium or Large size",
        variant: "destructive"
      });
      return;
    }

    const newOrder = {
      item: formData.selectedMenuItem,
      size: formData.selectedSize,
      specials: Array.from(formData.selectedSpecials),
      side: formData.selectedSide,
      veg: formData.selectedVeg,
      gravey: formData.selectedGravey,
      isMix: isMainCategory && formData.isMixFood,
      secondMain: isMainCategory && formData.isMixFood ? formData.selectedSecondMain : null,
      secondMainSpecials: isMainCategory && formData.isMixFood ? Array.from(formData.selectedSecondMainSpecials) : [],
    };

    setOrders(prev => [...prev, newOrder]);

    // Reset form after adding
    updateFormData({
      selectedMenuItem: null,
      selectedSize: '',
      selectedSpecials: new Set(),
      selectedSide: '',
      selectedVeg: '',
      selectedGravey: '',
      isMixFood: false,
      selectedSecondMain: null,
      selectedSecondMainSpecials: new Set(),
    });

    toast({
      title: "Added to Order",
      description: "Item has been added to your order",
    });
  };

  const removeFromOrder = (index: number) => {
    setOrders(prev => prev.filter((_, i) => i !== index));
  };

  const buildOrderSummary = () => {
    let summary = '';
    let totalPrice = 0;

    orders.forEach((order, index) => {
      const item = order.item;
      summary += `Order #${index + 1}${order.isMix ? ' (Mix)' : ''}:\n`;
      summary += `Item: ${item.name}\n`;
      
      if (order.isMix && order.secondMain) {
        summary += `Second Item: ${order.secondMain.name}\n`;
        if (order.secondMainSpecials.length > 0) {
          summary += `Second Item Specials: ${order.secondMainSpecials.join(', ')}\n`;
        }
      }
      
      if (order.size) summary += `Size: ${order.size}\n`;
      if (order.side) summary += `Side: ${order.side}\n`;
      if (order.veg) summary += `Vegetable: ${order.veg}\n`;
      if (order.gravey) summary += `Gravy: ${order.gravey}\n`;
      if (order.specials.length > 0) {
        summary += `Specials: ${order.specials.join(', ')}\n`;
      }

      const price = order.isMix ? 
        (restaurant.mixPrices?.[order.size] || 0) : 
        (item.prices[order.size] || 0);
      
      totalPrice += price;
      summary += `Price: $${price.toFixed(2)}\n\n`;
    });

    if (formData.deliveryOption === 'delivery' && restaurant.hasDelivery) {
      summary += `Delivery Fee: $${restaurant.deliveryPrice.toFixed(2)}\n`;
      totalPrice += restaurant.deliveryPrice;
    }

    summary += `Total: $${totalPrice.toFixed(2)}`;
    return summary;
  };

  const sendOrder = () => {
    if (orders.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to your order first",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customerName) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    if (formData.deliveryOption === 'delivery' && !formData.deliveryAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter your delivery address",
        variant: "destructive"
      });
      return;
    }

    if (formData.deliveryOption === 'pickup' && !formData.pickupTime) {
      toast({
        title: "Missing Time",
        description: "Please enter your pickup time",
        variant: "destructive"
      });
      return;
    }

    const orderSummary = buildOrderSummary();
    const phoneNumber = restaurant.whatsAppNumber;
    const message = encodeURIComponent(
      `Hello ${restaurant.name} i would like to place an order for:\n${orderSummary}\nName: ${formData.customerName}\n${
        formData.deliveryOption === 'delivery' 
          ? `Delivery Address: ${formData.deliveryAddress}` 
          : `Pickup Time: ${formData.pickupTime}`
      }`
    );
    
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');

    toast({
      title: "Order Sent",
      description: "Opening WhatsApp to send your order",
    });

    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle>Place Your Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div>
            <Label>Select Category</Label>
            <Select 
              value={formData.selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.selectedCategory && (
            <>
              {/* Mix Food Toggle for Main Category */}
              {formData.selectedCategory && formData.selectedCategory.toLowerCase().includes('main') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mixFood"
                    checked={formData.isMixFood}
                    onCheckedChange={handleMixFoodChange}
                  />
                  <Label htmlFor="mixFood">Mix Food (2 mains in 1 meal)</Label>
                </div>
              )}

              {/* Menu Item Selection */}
              <div>
                <Label>Select Item</Label>
                <Select 
                  value={formData.selectedMenuItem?.name || ''} 
                  onValueChange={handleMenuItemChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuByCategory[formData.selectedCategory]?.map(item => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Second Main for Mix Food */}
              {formData.isMixFood && formData.selectedCategory && formData.selectedCategory.toLowerCase().includes('main') && formData.selectedMenuItem && (
                <div>
                  <Label>Select Second Main Dish</Label>
                  <Select 
                    value={formData.selectedSecondMain?.name || ''} 
                    onValueChange={(itemName) => {
                      const item = mainItems.find(m => m.name === itemName) || null;
                      updateFormData({ 
                        selectedSecondMain: item,
                        selectedSecondMainSpecials: new Set()
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose second main" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainItems
                        .filter(item => item.name !== formData.selectedMenuItem?.name)
                        .map(item => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Second Main Specials */}
              {formData.selectedSecondMain && formData.selectedSecondMain.specials.length > 0 && (
                <div>
                  <Label>Second Item Specials</Label>
                  <div className="space-y-2">
                    {formData.selectedSecondMain.specials.map(special => (
                      <div key={special} className="flex items-center space-x-2">
                        <Checkbox
                          id={`second-special-${special}`}
                          checked={formData.selectedSecondMainSpecials.has(special)}
                          onCheckedChange={(checked) => handleSpecialChange(special, checked as boolean, true)}
                        />
                        <Label htmlFor={`second-special-${special}`}>{special}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.selectedMenuItem && (
                <>
                  {/* Size Selection */}
                  <div>
                    <Label>Select Size</Label>
                    <Select 
                      value={formData.selectedSize} 
                      onValueChange={(size) => updateFormData({ selectedSize: size })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose size" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.isMixFood && formData.selectedCategory === 'main' 
                          ? ['Med', 'Lrg']
                          : Object.keys(formData.selectedMenuItem.prices)
                        ).map(size => (
                          <SelectItem key={size} value={size}>
                            {size === '' ? 'Regular' : size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Specials */}
                  {formData.selectedMenuItem.specials.length > 0 && (
                    <div>
                      <Label>Select Specials</Label>
                      <div className="space-y-2">
                        {formData.selectedMenuItem.specials.map(special => (
                          <div key={special} className="flex items-center space-x-2">
                            <Checkbox
                              id={`special-${special}`}
                              checked={formData.selectedSpecials.has(special)}
                              onCheckedChange={(checked) => handleSpecialChange(special, checked as boolean)}
                            />
                            <Label htmlFor={`special-${special}`}>{special}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sides */}
                  {formData.selectedMenuItem.sides.length > 0 && (
                    <div>
                      <Label>Select Side</Label>
                      <Select 
                        value={formData.selectedSide} 
                        onValueChange={(side) => updateFormData({ selectedSide: side })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a side" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.selectedMenuItem.sides.map(side => (
                            <SelectItem key={side} value={side}>
                              {side}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Vegetables */}
                  {formData.selectedMenuItem.veg.length > 0 && (
                    <div>
                      <Label>Select Vegetable</Label>
                      <Select 
                        value={formData.selectedVeg} 
                        onValueChange={(veg) => updateFormData({ selectedVeg: veg })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a vegetable" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.selectedMenuItem.veg.map(veg => (
                            <SelectItem key={veg} value={veg}>
                              {veg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Gravy */}
                  {formData.selectedMenuItem.gravey.length > 0 && (
                    <div>
                      <Label>Select Gravy</Label>
                      <Select 
                        value={formData.selectedGravey} 
                        onValueChange={(gravey) => updateFormData({ selectedGravey: gravey })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose gravy" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.selectedMenuItem.gravey.map(gravey => (
                            <SelectItem key={gravey} value={gravey}>
                              {gravey}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button onClick={addToOrder} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Order
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order, index) => {
                const item = order.item;
                const price = order.isMix ? 
                  (restaurant.mixPrices?.[order.size] || 0) : 
                  (item.prices[order.size] || 0);

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">
                          {order.isMix ? 'Mix Meal' : item.name} - ${price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Size: {order.size}</div>
                          <div>Main 1: {item.name}</div>
                          {order.specials.length > 0 && (
                            <div>Specials: {order.specials.join(', ')}</div>
                          )}
                          {order.side && <div>Side: {order.side}</div>}
                          {order.veg && <div>Vegetable: {order.veg}</div>}
                          {order.gravey && <div>Gravy: {order.gravey}</div>}
                          {order.isMix && order.secondMain && (
                            <>
                              <div>Main 2: {order.secondMain.name}</div>
                              {order.secondMainSpecials.length > 0 && (
                                <div>Second Item Specials: {order.secondMainSpecials.join(', ')}</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromOrder(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => updateFormData({ customerName: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <Label>Delivery Option</Label>
              <RadioGroup
                value={formData.deliveryOption}
                onValueChange={(value) => updateFormData({ deliveryOption: value as 'pickup' | 'delivery' })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center">
                    <Store className="w-4 h-4 mr-1" />
                    Pickup
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center">
                    <Truck className="w-4 h-4 mr-1" />
                    Delivery
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.deliveryOption === 'delivery' ? (
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => updateFormData({ deliveryAddress: e.target.value })}
                  placeholder="Enter your delivery address"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="pickupTime">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  value={formData.pickupTime}
                  onChange={(e) => updateFormData({ pickupTime: e.target.value })}
                  placeholder="Enter pickup time (e.g., 12:30 PM)"
                />
              </div>
            )}

            <Button onClick={sendOrder} className="w-full" size="lg">
              <Send className="w-4 h-4 mr-2" />
              Send Order via WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}