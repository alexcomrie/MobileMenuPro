import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RestaurantList from "@/pages/restaurant-list";
import RestaurantProfile from "@/pages/restaurant-profile";
import RestaurantMenu from "@/pages/restaurant-menu";
import OrderScreen from "@/pages/order-screen";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={RestaurantList} />
      <Route path="/restaurant/:id/profile" component={RestaurantProfile} />
      <Route path="/restaurant/:id/menu" component={RestaurantMenu} />
      <Route path="/restaurant/:id/order" component={OrderScreen} />
      <Route path="/restaurant/:id/order/:itemName" component={OrderScreen} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-neutral">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
