import { z } from "zod";

export const TimeOfDaySchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59)
});

export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  whatsAppNumber: z.string(),
  hasDelivery: z.boolean(),
  deliveryPrice: z.number(),
  openingHours: z.string(),
  breakfastStartTime: TimeOfDaySchema,
  breakfastEndTime: TimeOfDaySchema,
  lunchStartTime: TimeOfDaySchema,
  lunchEndTime: TimeOfDaySchema,
  profilePictureUrl: z.string(),
  businessRegistrationUrl: z.string(),
  menuSheetUrl: z.string(),
  status: z.string(),
  mixPrices: z.record(z.string(), z.number())
});

export const MenuItemSchema = z.object({
  section: z.string(),
  name: z.string(),
  prices: z.record(z.string(), z.number()),
  period: z.string(),
  displayDate: z.string(),
  specials: z.array(z.string()),
  specialOption: z.string(),
  specialCap: z.number().nullable(),
  description: z.string(),
  sides: z.array(z.string()),
  veg: z.array(z.string()),
  gravey: z.array(z.string())
});

export const OrderItemSchema = z.object({
  item: MenuItemSchema,
  size: z.string().nullable(),
  specials: z.array(z.string()),
  side: z.string().nullable(),
  veg: z.string().nullable(),
  gravey: z.string().nullable(),
  isMix: z.boolean(),
  secondMain: MenuItemSchema.optional(),
  secondMainSpecials: z.array(z.string()).optional()
});

export const OrderSchema = z.object({
  customerName: z.string(),
  deliveryOption: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().optional(),
  pickupTime: z.string().optional(),
  items: z.array(OrderItemSchema),
  restaurant: RestaurantSchema
});

export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;
export type Restaurant = z.infer<typeof RestaurantSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
