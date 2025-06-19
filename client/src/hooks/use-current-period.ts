import { useState, useEffect } from "react";
import { Restaurant } from "@shared/schema";

export function useCurrentPeriod(restaurant: Restaurant | null) {
  const [currentPeriod, setCurrentPeriod] = useState<string>('all');

  useEffect(() => {
    const updatePeriod = () => {
      if (!restaurant) {
        setCurrentPeriod('all');
        return;
      }

      const now = new Date();
      const currentTime = { hour: now.getHours(), minute: now.getMinutes() };
      const currentMinutes = currentTime.hour * 60 + currentTime.minute;

      const breakfastStart = restaurant.breakfastStartTime.hour * 60 + restaurant.breakfastStartTime.minute;
      const breakfastEnd = restaurant.breakfastEndTime.hour * 60 + restaurant.breakfastEndTime.minute;
      const lunchStart = restaurant.lunchStartTime.hour * 60 + restaurant.lunchStartTime.minute;
      const lunchEnd = restaurant.lunchEndTime.hour * 60 + restaurant.lunchEndTime.minute;

      const isBreakfastTime = currentMinutes >= breakfastStart && currentMinutes <= breakfastEnd;
      const isLunchTime = currentMinutes >= lunchStart && currentMinutes <= lunchEnd;

      if (isLunchTime) {
        setCurrentPeriod('lunch');
      } else if (isBreakfastTime) {
        setCurrentPeriod('breakfast');
      } else {
        setCurrentPeriod('all');
      }
    };

    updatePeriod();
    const interval = setInterval(updatePeriod, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [restaurant]);

  return currentPeriod;
}
