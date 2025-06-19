import 'package:flutter/material.dart';

class Restaurant {
  final String name;
  final String address;
  final String phoneNumber;
  final String whatsAppNumber;
  final bool hasDelivery;
  final double deliveryPrice;
  final String openingHours;
  final TimeOfDay breakfastStartTime;
  final TimeOfDay breakfastEndTime;
  final TimeOfDay lunchStartTime;
  final TimeOfDay lunchEndTime;
  final String profilePictureUrl;
  final String businessRegistrationUrl;
  final String menuSheetUrl;
  final String status;
  final Map<String, double> mixPrices;

  Restaurant({
    required this.name,
    required this.address,
    required this.phoneNumber,
    required this.whatsAppNumber,
    required this.hasDelivery,
    required this.deliveryPrice,
    required this.openingHours,
    required this.breakfastStartTime,
    required this.breakfastEndTime,
    required this.lunchStartTime,
    required this.lunchEndTime,
    required this.profilePictureUrl,
    required this.businessRegistrationUrl,
    required this.menuSheetUrl,
    required this.status,
    required this.mixPrices,
  });

  factory Restaurant.fromCsv(List<dynamic> row) {
    return Restaurant(
      name: row[0].toString(),
      address: row[1].toString(),
      phoneNumber: row[2].toString(),
      whatsAppNumber: row[3].toString(),
      hasDelivery: row[4].toString().toLowerCase() == 'yes',
      deliveryPrice: double.tryParse(row[5].toString()) ?? 0,
      openingHours: row[6].toString(),
      breakfastStartTime: _parseTime(row[7].toString()),
      breakfastEndTime: _parseTime(row[8].toString()),
      lunchStartTime: _parseTime(row[9].toString()),
      lunchEndTime: _parseTime(row[10].toString()),
      profilePictureUrl: row[11].toString(),
      businessRegistrationUrl: row[12].toString(),
      menuSheetUrl: row[13].toString(),
      status: row[14].toString(),
      mixPrices: _parseMixPrices(row[15].toString()),
    );
  }

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      name: json['name'] as String,
      address: json['address'] as String,
      phoneNumber: json['phoneNumber'] as String,
      whatsAppNumber: json['whatsAppNumber'] as String,
      hasDelivery: json['hasDelivery'] as bool,
      deliveryPrice: json['deliveryPrice'] as double,
      openingHours: json['openingHours'] as String,
      breakfastStartTime: _timeFromJson(json['breakfastStartTime'] as Map<String, dynamic>),
      breakfastEndTime: _timeFromJson(json['breakfastEndTime'] as Map<String, dynamic>),
      lunchStartTime: _timeFromJson(json['lunchStartTime'] as Map<String, dynamic>),
      lunchEndTime: _timeFromJson(json['lunchEndTime'] as Map<String, dynamic>),
      profilePictureUrl: json['profilePictureUrl'] as String,
      businessRegistrationUrl: json['businessRegistrationUrl'] as String,
      menuSheetUrl: json['menuSheetUrl'] as String,
      status: json['status'] as String,
      mixPrices: Map<String, double>.from(json['mixPrices'] as Map),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'address': address,
        'phoneNumber': phoneNumber,
        'whatsAppNumber': whatsAppNumber,
        'hasDelivery': hasDelivery,
        'deliveryPrice': deliveryPrice,
        'openingHours': openingHours,
        'breakfastStartTime': _timeToJson(breakfastStartTime),
        'breakfastEndTime': _timeToJson(breakfastEndTime),
        'lunchStartTime': _timeToJson(lunchStartTime),
        'lunchEndTime': _timeToJson(lunchEndTime),
        'profilePictureUrl': profilePictureUrl,
        'businessRegistrationUrl': businessRegistrationUrl,
        'menuSheetUrl': menuSheetUrl,
        'status': status,
        'mixPrices': mixPrices,
      };

  static Map<String, dynamic> _timeToJson(TimeOfDay time) => {
        'hour': time.hour,
        'minute': time.minute,
      };

  static TimeOfDay _timeFromJson(Map<String, dynamic> json) => TimeOfDay(
        hour: json['hour'] as int,
        minute: json['minute'] as int,
      );

  static Map<String, double> _parseMixPrices(String priceStr) {
    Map<String, double> prices = {};
    if (priceStr.isNotEmpty) {
      var parts = priceStr.split(',');
      for (var part in parts) {
        var subParts = part.split(':');
        if (subParts.length == 2) {
          String size = subParts[0].trim();
          double? price = double.tryParse(subParts[1].trim().replaceAll(r'$', ''));
          if (price != null) {
            prices[size] = price;
          }
        }
      }
    }
    return prices;
  }

  static TimeOfDay _parseTime(String timeStr) {
    if (timeStr.isEmpty) {
      return const TimeOfDay(hour: 0, minute: 0);
    }
    try {
      final parts = timeStr.split(' ');
      if (parts.isNotEmpty) {
        final timePart = parts[0];
        final amPm = parts.length > 1 ? parts[1].toLowerCase() : '';
        final timeSplit = timePart.split(':');
        if (timeSplit.length == 2) {
          int hour = int.tryParse(timeSplit[0]) ?? 0;
          int minute = int.tryParse(timeSplit[1]) ?? 0;
          if (amPm == 'pm' && hour < 12) {
            hour += 12;
          } else if (amPm == 'am' && hour == 12) {
            hour = 0;
          }
          return TimeOfDay(hour: hour.clamp(0, 23), minute: minute.clamp(0, 59));
        }
      }
      return const TimeOfDay(hour: 0, minute: 0);
    } catch (e) {
      return const TimeOfDay(hour: 0, minute: 0);
    }
  }
}

class MenuItem {
  final String name;
  final Map<String, double> prices;
  final String period;
  final String section;
  final String displayDate;
  final List<String> specials;
  final String specialOption;
  final int? specialCap;
  final String description;
  final List<String> sides;
  final List<String> veg;
  final List<String> gravey;

  MenuItem({
    required this.name,
    required this.prices,
    required this.period,
    required this.section,
    required this.displayDate,
    this.specials = const [],
    this.specialOption = '',
    this.specialCap,
    this.description = '',
    this.sides = const [],
    this.veg = const [],
    this.gravey = const []
  });

  factory MenuItem.fromCsv(List<dynamic> row) {
    String category = row[0].toString().trim();
    String name = row[1].toString().trim();
    String priceSize = row[2].toString().trim();
    String period = row[3].toString().trim();
    String displayDate = row[4].toString().trim();
    String specialsStr = row.length > 5 ? row[5].toString().trim() : '';
    String specialOption = row.length > 6 ? row[6].toString().trim().toLowerCase() : '';
    String specialCapStr = row.length > 7 ? row[7].toString().trim().toLowerCase() : '';
    String description = row.length > 8 ? row[8].toString().trim() : '';
    List<String> sides = row.length > 9 && row[9].toString().trim().isNotEmpty
        ? row[9].toString().trim().split(',').map((s) => s.trim()).toList()
        : [];
    List<String> veg = row.length > 10 && row[10].toString().trim().isNotEmpty
        ? row[10].toString().trim().split(',').map((s) => s.trim()).toList()
        : [];
    List<String> gravey = row.length > 11 && row[11].toString().trim().isNotEmpty
        ? row[11].toString().trim().split(',').map((s) => s.trim()).toList()
        : [];

    Map<String, double> prices = {};
    if (priceSize.isNotEmpty) {
      var parts = priceSize.split(',');
      for (var part in parts) {
        var subParts = part.split(':');
        if (subParts.length == 2) {
          String size = subParts[0].trim();
          double? price = double.tryParse(subParts[1].trim().replaceAll(r'$', ''));
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
    }

    List<String> specials = specialsStr.isNotEmpty ? specialsStr.split(',').map((s) => s.trim()).toList() : [];

    int? specialCap;
    if (specialCapStr == 'max') {
      specialCap = null;
    } else {
      specialCap = int.tryParse(specialCapStr);
    }

    return MenuItem(
      name: name,
      prices: prices,
      period: period,
      section: category,
      displayDate: displayDate,
      specials: specials,
      specialOption: specialOption,
      specialCap: specialCap,
      description: description,
      sides: sides,
      veg: veg,
      gravey: gravey,
    );
  }

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      name: json['name'] as String,
      prices: Map<String, double>.from(json['prices'] as Map),
      period: json['period'] as String,
      section: json['section'] as String,
      displayDate: json['displayDate'] as String,
      specials: List<String>.from(json['specials'] ?? []),
      specialOption: json['specialOption'] as String? ?? '',
      specialCap: json['specialCap'] as int?,
      description: json['description'] as String? ?? '',
      sides: List<String>.from(json['sides'] ?? []),
      veg: List<String>.from(json['veg'] ?? []),
      gravey: List<String>.from(json['gravey'] ?? []),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'prices': prices,
        'period': period,
        'section': section,
        'displayDate': displayDate,
        'specials': specials,
        'specialOption': specialOption,
        'specialCap': specialCap,
        'description': description,
        'sides': sides,
        'veg': veg,
        'gravey': gravey,
      };
}
