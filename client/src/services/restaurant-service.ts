import { Restaurant, MenuItem } from "@shared/schema";

export class RestaurantService {
  private static readonly PROFILE_SHEET_URL = 
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9TxJ461YJY5UIpP9Tfv8O1R8Lac6lyCGRRBPIHzBiscc9wSlk68Ja6_ffQUMMCWkeEr6ts_jDrrDI/pub?output=csv';

  static async fetchRestaurants(): Promise<Restaurant[]> {
    try {
      // Try cache first
      const cached = localStorage.getItem('restaurants');
      const cacheTime = localStorage.getItem('restaurants_cache_time');
      const now = Date.now();
      
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 30 * 60 * 1000) {
        return JSON.parse(cached);
      }

      // Fetch fresh data
      const response = await fetch(this.PROFILE_SHEET_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.status}`);
      }
      
      const csvText = await response.text();
      const restaurants = this.parseRestaurantsCSV(csvText);
      
      // Cache the data
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
      localStorage.setItem('restaurants_cache_time', now.toString());
      
      return restaurants;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      // Return cached data if available
      const cached = localStorage.getItem('restaurants');
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  static async fetchMenuItems(menuSheetUrl: string): Promise<Record<string, MenuItem[]>> {
    try {
      const cacheKey = `menu_${btoa(menuSheetUrl)}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();
      
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 30 * 60 * 1000) {
        return JSON.parse(cached);
      }

      const response = await fetch(menuSheetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch menu: ${response.status}`);
      }
      
      const csvText = await response.text();
      const menu = this.parseMenuCSV(csvText);
      
      localStorage.setItem(cacheKey, JSON.stringify(menu));
      localStorage.setItem(`${cacheKey}_time`, now.toString());
      
      return menu;
    } catch (error) {
      console.error('Error fetching menu:', error);
      const cacheKey = `menu_${btoa(menuSheetUrl)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  private static parseRestaurantsCSV(csvText: string): Restaurant[] {
    const lines = csvText.split('\n');
    const restaurants: Restaurant[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i]);
      if (row.length >= 15 && row[14]?.toLowerCase() === 'active') {
        restaurants.push({
          id: `restaurant_${i}`,
          name: row[0] || '',
          address: row[1] || '',
          phoneNumber: row[2] || '',
          whatsAppNumber: row[3] || '',
          hasDelivery: row[4]?.toLowerCase() === 'yes',
          deliveryPrice: parseFloat(row[5]) || 0,
          openingHours: row[6] || '',
          breakfastStartTime: this.parseTime(row[7]),
          breakfastEndTime: this.parseTime(row[8]),
          lunchStartTime: this.parseTime(row[9]),
          lunchEndTime: this.parseTime(row[10]),
          profilePictureUrl: this.getDirectImageUrl(row[11] || ''),
          businessBio: row[12] || '',
          menuSheetUrl: row[13] || '',
          status: row[14] || '',
          mixPrices: this.parseMixPrices(row[15] || '')
        });
      }
    }
    return restaurants;
  }

  private static parseMenuCSV(csvText: string): Record<string, MenuItem[]> {
    const lines = csvText.split('\n');
    const menu: Record<string, MenuItem[]> = {};
    
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i]);
      if (row.length >= 5) {
        const item: MenuItem = {
          section: row[0] || 'Other',
          category: row[0] || 'Other',
          name: row[1] || '',
          prices: this.parseItemPrices(row[2] || ''),
          period: row[3] || 'both',
          displayDate: row[4] || '',
          specials: row[5] ? row[5].split(',').map(s => s.trim()) : [],
          specialOption: row[6] || '',
          specialCap: row[7] === 'max' ? null : parseInt(row[7]) || null,
          description: row[8] || '',
          sides: row[9] ? row[9].split(',').map(s => s.trim()) : [],
          veg: row[10] ? row[10].split(',').map(s => s.trim()) : [],
          gravey: row[11] ? row[11].split(',').map(s => s.trim()) : []
        };
        
        if (!menu[item.section]) {
          menu[item.section] = [];
        }
        menu[item.section].push(item);
      }
    }
    return menu;
  }

  private static parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private static parseTime(timeStr: string): { hour: number; minute: number } {
    if (!timeStr) return { hour: 0, minute: 0 };
    
    const parts = timeStr.split(' ');
    if (parts.length === 0) return { hour: 0, minute: 0 };
    
    const timePart = parts[0];
    const amPm = parts[1]?.toLowerCase() || '';
    const [hourStr, minuteStr] = timePart.split(':');
    
    let hour = parseInt(hourStr) || 0;
    const minute = parseInt(minuteStr) || 0;
    
    if (amPm === 'pm' && hour < 12) hour += 12;
    if (amPm === 'am' && hour === 12) hour = 0;
    
    return { 
      hour: Math.max(0, Math.min(23, hour)), 
      minute: Math.max(0, Math.min(59, minute)) 
    };
  }

  private static parseMixPrices(priceStr: string): Record<string, number> {
    const prices: Record<string, number> = {};
    if (!priceStr) return prices;
    
    const parts = priceStr.split(',');
    for (const part of parts) {
      const [size, price] = part.split(':');
      if (size && price) {
        prices[size.trim()] = parseFloat(price.trim().replace('$', '')) || 0;
      }
    }
    return prices;
  }

  private static getDirectImageUrl(url: string): string {
    // Return empty string for null/undefined URLs
    if (!url) return '';
    
    // Handle external URLs (non-Google Drive)
    if (!url.includes('drive.google.com')) {
      // Validate URL format
      try {
        new URL(url); // This will throw an error if URL is invalid
        return url;   // Return valid URL as is
      } catch (e) {
        console.error('Invalid URL format:', url);
        return ''; // Return empty string for invalid URLs
      }
    }
    
    // Handle /file/d/ format
    let fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1] || fileIdMatch[2];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // Handle id= format
    fileIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // Handle open?id= format
    fileIdMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return url;
  }

  private static parseItemPrices(priceStr: string): Record<string, number> {
    const prices: Record<string, number> = {};
    if (!priceStr) return prices;
    
    const parts = priceStr.split(',');
    for (const part of parts) {
      const colonIndex = part.indexOf(':');
      if (colonIndex !== -1) {
        const size = part.substring(0, colonIndex).trim();
        const price = parseFloat(part.substring(colonIndex + 1).trim().replace('$', '')) || 0;
        prices[size] = price;
      } else {
        const price = parseFloat(part.trim().replace('$', '')) || 0;
        prices[''] = price;
      }
    }
    return prices;
  }

  static filterMenuByPeriod(menu: Record<string, MenuItem[]>, period: string): Record<string, MenuItem[]> {
    if (period === 'all') return menu;
    
    const filtered: Record<string, MenuItem[]> = {};
    for (const [section, items] of Object.entries(menu)) {
      const filteredItems = items.filter(item => 
        item.period.toLowerCase() === period.toLowerCase() || 
        item.period.toLowerCase() === 'both'
      );
      if (filteredItems.length > 0) {
        filtered[section] = filteredItems;
      }
    }
    return filtered;
  }

  static formatTime(timeObj: { hour: number; minute: number }): string {
    if (!timeObj || (!timeObj.hour && !timeObj.minute)) return '--:--';
    const hour = timeObj.hour || 0;
    const minute = timeObj.minute || 0;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }
}
