import 'package:http/http.dart' as http;
import 'package:csv/csv.dart';
import 'dart:collection';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../models/restaurant.dart';

class RestaurantService {
  static const String profileSheetUrl =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9TxJ461YJY5UIpP9Tfv8O1R8Lac6lyCGRRBPIHzBiscc9wSlk68Ja6_ffQUMMCWkeEr6ts_jDrrDI/pub?output=csv';

  static final Map<String, List<Restaurant>> _restaurantCache = {};
  static final Map<String, Map<String, List<MenuItem>>> _menuCache = {};

  static Future<String> get _localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  static Future<File> get _restaurantLocalFile async {
    final path = await _localPath;
    return File('$path/restaurants.json');
  }

  static Future<File> _menuLocalFile(String menuSheetUrl) async {
    final path = await _localPath;
    final hash = menuSheetUrl.hashCode.toString();
    return File('$path/menu_$hash.json');
  }

  static Future<List<Restaurant>> loadRestaurants() async {
    if (_restaurantCache.containsKey(profileSheetUrl)) {
      return _restaurantCache[profileSheetUrl]!;
    }

    try {
      final restaurants = await _loadRestaurantsFromLocal();
      if (restaurants.isNotEmpty) {
        _restaurantCache[profileSheetUrl] = restaurants;
        return restaurants;
      }
    } catch (e) {
      // If local load fails, continue to fetch from network
    }

    return fetchRestaurantsFromNetwork();
  }

  static Future<List<Restaurant>> _loadRestaurantsFromLocal() async {
    try {
      final file = await _restaurantLocalFile;
      if (await file.exists()) {
        final contents = await file.readAsString();
        final List<dynamic> jsonList = json.decode(contents);
        return jsonList
            .map((json) => Restaurant.fromJson(json))
            .where((restaurant) => restaurant.status.toLowerCase() == 'active')
            .toList();
      }
    } catch (e) {
      // Handle file read error
    }
    return [];
  }

  static Future<void> _saveRestaurantsToLocal(
      List<Restaurant> restaurants) async {
    try {
      final file = await _restaurantLocalFile;
      final jsonList = restaurants.map((r) => r.toJson()).toList();
      await file.writeAsString(json.encode(jsonList));
    } catch (e) {
      // Handle file write error
    }
  }

  static Future<List<Restaurant>> fetchRestaurantsFromNetwork() async {
    final response = await http.get(Uri.parse(profileSheetUrl));
    if (response.statusCode == 200) {
      List<List<dynamic>> csvTable =
          const CsvToListConverter().convert(response.body);
      List<List<dynamic>> rows = csvTable.skip(1).toList();
      final restaurants = rows
          .map((row) => Restaurant.fromCsv(row))
          .where((restaurant) => restaurant.status.toLowerCase() == 'active')
          .toList();

      await _saveRestaurantsToLocal(restaurants);
      _restaurantCache[profileSheetUrl] = restaurants;
      return restaurants;
    } else {
      throw Exception('Failed to load restaurants');
    }
  }

  static Future<Map<String, List<MenuItem>>> loadMenuItems(
      String menuSheetUrl) async {
    if (_menuCache.containsKey(menuSheetUrl)) {
      return _menuCache[menuSheetUrl]!;
    }

    try {
      final menu = await _loadMenuItemsFromLocal(menuSheetUrl);
      if (menu.isNotEmpty) {
        _menuCache[menuSheetUrl] = menu;
        return menu;
      }
    } catch (e) {
      // If local load fails, continue to fetch from network
    }

    return fetchMenuItemsFromNetwork(menuSheetUrl);
  }

  static Future<Map<String, List<MenuItem>>> _loadMenuItemsFromLocal(
      String menuSheetUrl) async {
    try {
      final file = await _menuLocalFile(menuSheetUrl);
      if (await file.exists()) {
        final contents = await file.readAsString();
        final Map<String, dynamic> jsonMap = json.decode(contents);
        Map<String, List<MenuItem>> menu = {};
        jsonMap.forEach((key, value) {
          menu[key] =
              (value as List).map((item) => MenuItem.fromJson(item)).toList();
        });
        return menu;
      }
    } catch (e) {
      // Handle file read error
    }
    return {};
  }

  static Future<void> _saveMenuItemsToLocal(
      String menuSheetUrl, Map<String, List<MenuItem>> menu) async {
    try {
      final file = await _menuLocalFile(menuSheetUrl);
      final jsonMap = {};
      menu.forEach((key, value) {
        jsonMap[key] = value.map((item) => item.toJson()).toList();
      });
      await file.writeAsString(json.encode(jsonMap));
    } catch (e) {
      // Handle file write error
    }
  }

  static Future<Map<String, List<MenuItem>>> fetchMenuItemsFromNetwork(
      String menuSheetUrl) async {
    final response = await http.get(Uri.parse(menuSheetUrl));
    if (response.statusCode == 200) {
      List<List<dynamic>> csvTable =
          const CsvToListConverter().convert(response.body);
      List<List<dynamic>> rows = csvTable.skip(1).toList();

      LinkedHashMap<String, List<MenuItem>> menuByCategory = LinkedHashMap();

      final fixedCategories = ['Main', 'Sides', 'Veg', 'Gravey', 'Drink'];

      for (var category in fixedCategories) {
        menuByCategory[category] = [];
      }

      for (var row in rows) {
        if (row.length >= 5) {
          MenuItem item = MenuItem.fromCsv(row);
          String category = item.section;

          if (!menuByCategory.containsKey(category)) {
            menuByCategory[category] = [];
          }
          menuByCategory[category]!.add(item);
        }
      }

      menuByCategory.removeWhere((key, value) => value.isEmpty);

      await _saveMenuItemsToLocal(menuSheetUrl, menuByCategory);
      _menuCache[menuSheetUrl] = menuByCategory;
      return menuByCategory;
    } else {
      throw Exception('Failed to load menu items');
    }
  }

  static Map<String, double> parsePrices(String priceSize) {
    Map<String, double> prices = {};
    if (priceSize.isEmpty) return prices;
    var parts = priceSize.split(',');
    for (var part in parts) {
      var subParts = part.split(':');
      if (subParts.length == 2) {
        String size = subParts[0].trim();
        double? price =
            double.tryParse(subParts[1].trim().replaceAll(r'$', ''));
        if (price != null) {
          prices[size] = price;
        }
      } else {
        double? price = double.tryParse(part.trim().replaceAll(r'$', ''));
        if (price != null) {
          prices[''] = price;
        }
      }
    }
    return prices;
  }
}
