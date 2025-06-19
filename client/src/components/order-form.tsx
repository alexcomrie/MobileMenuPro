import { useState, useEffect } from "react";
import { MenuItem, Restaurant, OrderItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ShoppingCart } from "lucide-react";

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

const HARDCODED_CATEGORIES = [
  'main', 'drink', 'sandwish', 'seafood', 'pasta', 'soup', 'patty', 'cake',
  'salad', 'wrap', 'ice cream', 'slushey', 'smoothie', 'burger', 'chicken',
  'chicken combo', 'meal combo', 'combo', 'porridge', 'loaves', 'tacos',
  'boritos', 'pizzas', 'desserts', 'juice', 'punch', 'hotdogs', 'others'
];

export default function OrderForm({ restaurant, menuItems, selectedItem, onOrderComplete }: OrderFormProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState<OrderFormData>({
    selectedCategory: selectedItem?.section.toLowerCase() || '',
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
    pickupTime: ''
  });

  const mainItems = menuItems.filter(item => item.section.toLowerCase() === 'main');
  const availableCategories = HARDCODED_CATEGORIES.filter(cat =>
    menuItems.some(item => item.section.toLowerCase() === cat.toLowerCase())
  );

  useEffect(() => {
    // Load saved state from localStorage
    const savedOrders = localStorage.getItem('orders');
    const savedCustomerName = localStorage.getItem('customerName');
    const savedDeliveryOption = localStorage.getItem('deliveryOption');
    const savedDeliveryAddress = localStorage.getItem('deliveryAddress');
    const savedPickupTime = localStorage.getItem('pickupTime');

    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error('Error parsing saved orders:', e);
      }
    }

    setFormData(prev => ({
      ...prev,
      customerName: savedCustomerName || '',
      deliveryOption: (savedDeliveryOption as 'pickup' | 'delivery') || 'pickup',
      deliveryAddress: savedDeliveryAddress || '',
      pickupTime: savedPickupTime || ''
    }));
  }, []);

  const saveState = () => {
    localStorage.setItem('orders', JSON.stringify(orders));
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

  const resetSelection = () => {
    updateFormData({
      selectedMenuItem: null,
      selectedSize: '',
      selectedSpecials: new Set(),
      selectedSide: '',
      selectedVeg: '',
      selectedGravey: '',
      isMixFood: false,
      selectedSecondMain: null,
      selectedSecondMainSpecials: new Set()
    });
  };

  const addToOrder = () => {
    if (!formData.selectedMenuItem || !formData.selectedSize) {
      toast({
        title: "Missing Information",
        description: "Please select an item and size",
        variant: "destructive"
      });
      return;
    }

    // Mix-specific validations
    if (formData.selectedCategory === 'main' && formData.isMixFood && !formData.selectedSecondMain) {
      toast({
        title: "Missing Second Main",
        description: "Please select a second main dish for mix meal",
        variant: "destructive"
      });
      return;
    }

    if (formData.selectedCategory === 'main' && formData.isMixFood && 
        (formData.selectedSize !== 'Med' && formData.selectedSize !== 'Lrg')) {
      toast({
        title: "Invalid Size for Mix",
        description: "Mix meals are only available in Medium or Large size",
        variant: "destructive"
      });
      return;
    }

    const orderItem: OrderItem = {
      item: formData.selectedMenuItem,
      size: formData.selectedSize,
      specials: Array.from(formData.selectedSpecials),
      side: formData.selectedSide || null,
      veg: formData.selectedVeg || null,
      gravey: formData.selectedGravey || null,
      isMix: formData.selectedCategory === 'main' && formData.isMixFood,
      secondMain: formData.isMixFood ? formData.selectedSecondMain : undefined,
      secondMainSpecials: formData.isMixFood ? Array.from(formData.selectedSecondMainSpecials) : undefined
    };

    setOrders(prev => [...prev, orderItem]);
    resetSelection();
    
    toast({
      title: "Item Added",
      description: `${formData.selectedMenuItem.name} has been added to your order`,
    });
  };

  const removeFromOrder = (index: number) => {
    setOrders(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: "Item has been removed from your order",
    });
  };

  const calculateOrderTotal = () => {
    return orders.reduce((total, order) => {
      let price = 0;
      if (order.isMix && restaurant.mixPrices[order.size || '']) {
        price = restaurant.mixPrices[order.size || ''];
      } else {
        price = order.item.prices[order.size || ''] || Object.values(order.item.prices)[0] || 0;
      }
      return total + price;
    }, 0);
  };

  const buildOrderSummary = () => {
    let summary = '';
    let totalPrice = 0;

    orders.forEach((order, index) => {
      summary += `Order #${index + 1}${order.isMix ? ' (Mix)' : ''}:\n`;
      summary += `Item: ${order.item.name}\n`;
      
      if (order.isMix && order.secondMain) {
        summary += `Second Item: ${order.secondMain.name}\n`;
        if (order.secondMainSpecials && order.secondMainSpecials.length > 0) {
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

      let price = 0;
      if (order.isMix && restaurant.mixPrices[order.size || '']) {
        price = restaurant.mixPrices[order.size || ''];
      } else {
        price = order.item.prices[order.size || ''] || Object.values(order.item.prices)[0] || 0;
      }
      
      totalPrice += price;
      summary += `Price: $${price.toFixed(2)}\n\n`;
    });

    summary += `Total: $${totalPrice.toFixed(2)}`;
    return summary;
  };

  const sendOrder = () => {
    if (orders.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to your order",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customerName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    if (formData.deliveryOption === 'delivery' && !formData.deliveryAddress.trim()) {
      toast({
        title: "Missing Address",
        description: "Please enter your delivery address",
        variant: "destructive"
      });
      return;
    }

    if (formData.deliveryOption === 'pickup' && !formData.pickupTime.trim()) {
      toast({
        title: "Missing Pickup Time",
        description: "Please enter your pickup time",
        variant: "destructive"
      });
      return;
    }

    const orderSummary = buildOrderSummary();
    const deliveryInfo = formData.deliveryOption === 'delivery'
      ? `Delivery Address: ${formData.deliveryAddress}`
      : `Pickup Time: ${formData.pickupTime}`;

    const message = `Hello ${restaurant.name}, I would like to place an order:\n\n${orderSummary}\n\nName: ${formData.customerName}\n${deliveryInfo}`;
    const whatsappUrl = `https://wa.me/${restaurant.whatsAppNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    
    // Clear orders after successful send
    setOrders([]);
    localStorage.removeItem('orders');
    
    if (onOrderComplete) {
      onOrderComplete();
    }

    toast({
      title: "Order Sent!",
      description: "Your order has been sent via WhatsApp",
    });
  };

  const categoryItems = formData.selectedCategory
    ? menuItems.filter(item => item.section.toLowerCase() === formData.selectedCategory.toLowerCase())
    : [];

  return (
    <div className="space-y-6">
      {/* Add Items Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add Items</h3>
          
          {/* Category Selection */}
          <div className="space-y-4">
            <div>
              <Label>Select Category</Label>
              <Select
                value={formData.selectedCategory}
                onValueChange={(value) => {
                  updateFormData({ selectedCategory: value });
                  resetSelection();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu Item Selection */}
            {formData.selectedCategory && (
              <div>
                <Label>Select Menu Item</Label>
                <Select
                  value={formData.selectedMenuItem?.name || ''}
                  onValueChange={(value) => {
                    const item = categoryItems.find(item => item.name === value);
                    updateFormData({
                      selectedMenuItem: item || null,
                      selectedSize: '',
                      selectedSpecials: new Set(),
                      selectedSide: '',
                      selectedVeg: '',
                      selectedGravey: ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Menu Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map(item => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mix Food Toggle for Main Items */}
            {formData.selectedCategory === 'main' && Object.keys(restaurant.mixPrices).length > 0 && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="mix-food"
                  checked={formData.isMixFood}
                  onCheckedChange={(checked) => {
                    updateFormData({
                      isMixFood: checked,
                      selectedSecondMain: null,
                      selectedSecondMainSpecials: new Set()
                    });
                    if (checked && formData.selectedSize && 
                        formData.selectedSize !== 'Med' && formData.selectedSize !== 'Lrg') {
                      updateFormData({ selectedSize: '' });
                    }
                  }}
                />
                <Label htmlFor="mix-food">Mix Food</Label>
              </div>
            )}

            {/* Second Main Selection for Mix */}
            {formData.isMixFood && (
              <div>
                <Label>Select Second Main</Label>
                <Select
                  value={formData.selectedSecondMain?.name || ''}
                  onValueChange={(value) => {
                    const item = mainItems.find(item => item.name === value);
                    updateFormData({ selectedSecondMain: item || null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Second Main" />
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

            {/* Size Selection */}
            {formData.selectedMenuItem && (
              <div>
                <Label>Size</Label>
                <Select
                  value={formData.selectedSize}
                  onValueChange={(value) => updateFormData({ selectedSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(formData.selectedMenuItem.prices).map(size => (
                      <SelectItem key={size} value={size}>
                        {size} - ${formData.selectedMenuItem!.prices[size]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Specials Selection */}
            {formData.selectedMenuItem && formData.selectedMenuItem.specials.length > 0 && (
              <div>
                <Label>Specials</Label>
                <div className="space-y-2 mt-2">
                  {formData.selectedMenuItem.specials.map(special => (
                    <div key={special} className="flex items-center space-x-2">
                      <Checkbox
                        id={special}
                        checked={formData.selectedSpecials.has(special)}
                        onCheckedChange={(checked) => {
                          const newSpecials = new Set(formData.selectedSpecials);
                          if (checked) {
                            newSpecials.add(special);
                          } else {
                            newSpecials.delete(special);
                          }
                          updateFormData({ selectedSpecials: newSpecials });
                        }}
                      />
                      <Label htmlFor={special}>{special}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sides Selection */}
            {formData.selectedMenuItem && formData.selectedMenuItem.sides.length > 0 && (
              <div>
                <Label>Sides</Label>
                <Select
                  value={formData.selectedSide}
                  onValueChange={(value) => updateFormData({ selectedSide: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Side" />
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

            {/* Vegetables Selection */}
            {formData.selectedMenuItem && formData.selectedMenuItem.veg.length > 0 && (
              <div>
                <Label>Vegetables</Label>
                <Select
                  value={formData.selectedVeg}
                  onValueChange={(value) => updateFormData({ selectedVeg: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vegetable" />
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

            {/* Gravy Selection */}
            {formData.selectedMenuItem && formData.selectedMenuItem.gravey.length > 0 && (
              <div>
                <Label>Gravy</Label>
                <Select
                  value={formData.selectedGravey}
                  onValueChange={(value) => updateFormData({ selectedGravey: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gravy" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.selectedMenuItem.gravey.map(gravy => (
                      <SelectItem key={gravy} value={gravy}>
                        {gravy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={addToOrder}
              disabled={!formData.selectedMenuItem || !formData.selectedSize}
              className="w-full bg-secondary hover:bg-secondary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Orders */}
      {orders.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Current Orders ({orders.length})
            </h3>
            <div className="space-y-3">
              {orders.map((order, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">
                        {order.item.name}
                        {order.isMix && <Badge className="ml-2">Mix</Badge>}
                      </h4>
                      {order.isMix && order.secondMain && (
                        <p className="text-sm text-gray-600">
                          + {order.secondMain.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromOrder(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {order.size && <div>Size: {order.size}</div>}
                    {order.side && <div>Side: {order.side}</div>}
                    {order.veg && <div>Vegetable: {order.veg}</div>}
                    {order.gravey && <div>Gravy: {order.gravey}</div>}
                    {order.specials.length > 0 && (
                      <div>Specials: {order.specials.join(', ')}</div>
                    )}
                  </div>
                  
                  <div className="text-right mt-2">
                    <span className="font-medium text-secondary">
                      ${order.isMix && restaurant.mixPrices[order.size || '']
                        ? restaurant.mixPrices[order.size || '']
                        : order.item.prices[order.size || ''] || Object.values(order.item.prices)[0] || 0}
                    </span>
                  </div>
                </div>
              ))}
              
              <Separator />
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total:</span>
                <span className="text-secondary">${calculateOrderTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={formData.customerName}
                onChange={(e) => updateFormData({ customerName: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <Label>Order Type</Label>
              <RadioGroup
                value={formData.deliveryOption}
                onValueChange={(value) => updateFormData({ deliveryOption: value as 'pickup' | 'delivery' })}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Pickup</Label>
                </div>
                {restaurant.hasDelivery && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery">
                      Delivery (+${restaurant.deliveryPrice})
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {formData.deliveryOption === 'delivery' && (
              <div>
                <Label htmlFor="delivery-address">Delivery Address *</Label>
                <Textarea
                  id="delivery-address"
                  value={formData.deliveryAddress}
                  onChange={(e) => updateFormData({ deliveryAddress: e.target.value })}
                  placeholder="Enter your delivery address"
                  rows={3}
                />
              </div>
            )}

            {formData.deliveryOption === 'pickup' && (
              <div>
                <Label htmlFor="pickup-time">Pickup Time *</Label>
                <Input
                  id="pickup-time"
                  value={formData.pickupTime}
                  onChange={(e) => updateFormData({ pickupTime: e.target.value })}
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
          className="w-full bg-accent hover:bg-accent/90 text-white py-3 text-lg"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Send Order via WhatsApp
        </Button>
      )}
    </div>
  );
}
