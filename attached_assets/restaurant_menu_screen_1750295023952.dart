import 'package:flutter/material.dart';
import '../models/restaurant.dart';
import '../services/restaurant_service.dart';
import 'order_screen.dart';
import 'restaurant_profile_screen.dart';
import 'dart:async';

class RestaurantMenuScreen extends StatefulWidget {
  final Restaurant restaurant;
  final bool isDigicel;

  const RestaurantMenuScreen({
    super.key,
    required this.restaurant,
    required this.isDigicel,
  });

  @override
  State<RestaurantMenuScreen> createState() => _RestaurantMenuScreenState();
}

class _RestaurantMenuScreenState extends State<RestaurantMenuScreen> {
  Map<String, List<MenuItem>> _currentMenu = {};
  String _currentPeriod = '';
  bool _isRefreshing = false;
  Timer? _refreshTimer;
  Timer? _periodCheckTimer;
  String? _error;

  @override
  void initState() {
    super.initState();
    _determineCurrentPeriod();
    _initialize();
    _startPeriodicRefresh();
    _startPeriodCheck();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _preloadImages();
  }

  Future<void> _initialize() async {
    try {
      await _loadMenuItems();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
        });
      }
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _periodCheckTimer?.cancel();
    super.dispose();
  }

  void _startPeriodicRefresh() {
    // Refresh every 30 minutes
    _refreshTimer = Timer.periodic(const Duration(minutes: 30), (timer) {
      _refreshMenu();
    });
  }

  void _startPeriodCheck() {
    // Check period every minute
    _periodCheckTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
      _checkAndUpdatePeriod();
    });
  }

  void _checkAndUpdatePeriod() {
    final oldPeriod = _currentPeriod;
    _determineCurrentPeriod();
    if (oldPeriod != _currentPeriod) {
      _refreshMenu();
    }
  }

  Future<void> _preloadImages() async {
    if (!mounted) return;
    if (widget.restaurant.profilePictureUrl.isNotEmpty) {
      await precacheImage(
        NetworkImage(_getDirectImageUrl(widget.restaurant.profilePictureUrl)),
        context,
      );
    }
  }

  Future<void> _loadMenuItems() async {
    try {
      final menu = await RestaurantService.loadMenuItems(widget.restaurant.menuSheetUrl);
      if (mounted) {
        setState(() {
          _currentMenu = getMenuForPeriod(menu, _currentPeriod);
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _refreshMenu() async {
    if (_isRefreshing) return;

    setState(() {
      _isRefreshing = true;
    });

    try {
      final menu = await RestaurantService.fetchMenuItemsFromNetwork(widget.restaurant.menuSheetUrl);
      if (mounted) {
        setState(() {
          _currentMenu = getMenuForPeriod(menu, _currentPeriod);
          _error = null;
          _isRefreshing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isRefreshing = false;
        });
      }
    }
  }

  void _determineCurrentPeriod() {
    final now = DateTime.now();
    final currentTime = TimeOfDay(hour: now.hour, minute: now.minute);
    final breakfastStart = widget.restaurant.breakfastStartTime;
    final breakfastEnd = widget.restaurant.breakfastEndTime;
    final lunchStart = widget.restaurant.lunchStartTime;
    final lunchEnd = widget.restaurant.lunchEndTime;

    bool isBreakfastTime = _isTimeInRange(currentTime, breakfastStart, breakfastEnd);
    bool isLunchTime = _isTimeInRange(currentTime, lunchStart, lunchEnd);

    if (isLunchTime) {
      _currentPeriod = 'lunch';
    } else if (isBreakfastTime) {
      _currentPeriod = 'breakfast';
    } else {
      _currentPeriod = 'all';
    }
  }

  bool _isTimeInRange(TimeOfDay time, TimeOfDay start, TimeOfDay end) {
    final nowMinutes = time.hour * 60 + time.minute;
    final startMinutes = start.hour * 60 + start.minute;
    final endMinutes = end.hour * 60 + end.minute;
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  Map<String, List<MenuItem>> getMenuForPeriod(Map<String, List<MenuItem>> allMenu, String period) {
    Map<String, List<MenuItem>> filtered = {};
    if (period == 'all') {
      return allMenu;
    }
    allMenu.forEach((section, items) {
      var filteredItems = items.where((item) => 
        item.period.toLowerCase() == period.toLowerCase() || 
        item.period.toLowerCase() == 'both'
      ).toList();
      if (filteredItems.isNotEmpty) {
        filtered[section] = filteredItems;
      }
    });
    return filtered;
  }

  String _getDirectImageUrl(String url) {
    if (url.contains('drive.google.com')) {
      final RegExp regExp = RegExp(r'/d/([a-zA-Z0-9_-]+)|/file/d/([a-zA-Z0-9_-]+)/');
      final match = regExp.firstMatch(url);
      if (match != null) {
        final fileId = match.group(1) ?? match.group(2);
        if (fileId != null) {
          return 'https://drive.google.com/uc?export=view&id=$fileId';
        }
      }
    }
    return url;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.restaurant.name} - ${_currentPeriod.toUpperCase()}'),
        backgroundColor: widget.isDigicel ? Colors.red : Colors.blue,
        actions: [
          IconButton(
            icon: _isRefreshing
                ? SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.refresh),
            onPressed: _isRefreshing ? null : _refreshMenu,
          ),
          IconButton(
            icon: const Icon(Icons.info),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => RestaurantProfileScreen(
                    restaurant: widget.restaurant,
                    isDigicel: widget.isDigicel,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(
              widget.isDigicel ? 'assets/digicel3_bg.png' : 'assets/flow3_bg.png',
            ),
            fit: BoxFit.cover,
            opacity: 0.1,
          ),
        ),
        child: _error != null
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      'Error: $_error',
                      style: const TextStyle(color: Colors.red),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _refreshMenu,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              )
            : _currentMenu.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _refreshMenu,
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: _currentMenu.entries.map((entry) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  vertical: 8, horizontal: 16),
                              decoration: BoxDecoration(
                                color: widget.isDigicel ? Colors.red : Colors.blue,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                entry.key.toUpperCase(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...entry.value.map((item) => Card(
                                  margin:
                                      const EdgeInsets.symmetric(vertical: 4),
                                  child: ListTile(
                                    title: Text(
                                      item.name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (item.description.isNotEmpty)
                                          Text(item.description),
                                        if (item.prices.length > 1)
                                          Text(item.prices.entries
                                              .map((e) =>
                                                  '${e.key.isEmpty ? '' : '${e.key}: '}\$${e.value}')
                                              .join(', '))
                                        else
                                          Text(item.prices.isNotEmpty
                                              ? '\$${item.prices.values.first}'
                                              : 'Included'),
                                        if (item.sides.isNotEmpty)
                                          Text('Sides: ${item.sides.join(', ')}'),
                                        if (item.veg.isNotEmpty)
                                          Text('Veg: ${item.veg.join(', ')}'),
                                      ],
                                    ),
                                    trailing: widget.restaurant.whatsAppNumber.isNotEmpty
                                        ? IconButton(
                                            icon: const Icon(
                                                Icons.add_shopping_cart),
                                            color: widget.isDigicel
                                                ? Colors.red
                                                : Colors.blue,
                                            onPressed: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) =>
                                                      OrderScreen(
                                                    restaurant:
                                                        widget.restaurant,
                                                    menuItems: _currentMenu.values
                                                        .expand((items) => items)
                                                        .toList(),
                                                    selectedMain: item,
                                                    isDigicel: widget.isDigicel,
                                                  ),
                                                ),
                                              );
                                            },
                                          )
                                        : null,
                                  ),
                                )),
                            const SizedBox(height: 16),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
      ),
      floatingActionButton: widget.restaurant.whatsAppNumber.isNotEmpty
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => OrderScreen(
                      restaurant: widget.restaurant,
                      menuItems: _currentMenu.values.expand((items) => items).toList(),
                      isDigicel: widget.isDigicel,
                    ),
                  ),
                );
              },
              backgroundColor: widget.isDigicel ? Colors.red : Colors.blue,
              child: const Icon(Icons.shopping_cart),
            )
          : null,
    );
  }
}