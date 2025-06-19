import 'package:flutter/material.dart';
import '../services/restaurant_service.dart';
import '../models/restaurant.dart';
import 'restaurant_menu_screen.dart';
import 'restaurant_profile_screen.dart';
import 'dart:async';

class RestaurantListScreen extends StatefulWidget {
  final bool isDigicel;

  const RestaurantListScreen({super.key, required this.isDigicel});

  @override
  State<RestaurantListScreen> createState() => _RestaurantListScreenState();
}

class _RestaurantListScreenState extends State<RestaurantListScreen> {
  List<Restaurant>? _restaurants;
  bool _isRefreshing = false;
  String? _error;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _initializeRestaurants();
    _startPeriodicRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startPeriodicRefresh() {
    // Refresh every 30 minutes
    _refreshTimer = Timer.periodic(const Duration(minutes: 30), (timer) {
      _refreshRestaurants();
    });
  }

  Future<void> _initializeRestaurants() async {
    try {
      final restaurants = await RestaurantService.loadRestaurants();
      if (mounted) {
        setState(() {
          _restaurants = restaurants;
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

  Future<void> _refreshRestaurants() async {
    if (_isRefreshing) return;

    setState(() {
      _isRefreshing = true;
    });

    try {
      final restaurants = await RestaurantService.fetchRestaurantsFromNetwork();
      if (mounted) {
        setState(() {
          _restaurants = restaurants;
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

  String _getDirectImageUrl(String url) {
    if (url.contains('drive.google.com')) {
      String fileId;
      if (url.contains('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.contains('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      } else {
        return url;
      }
      return 'https://drive.google.com/uc?export=view&id=$fileId';
    }
    return url;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Restaurants'),
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
            onPressed: _isRefreshing ? null : _refreshRestaurants,
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(
              widget.isDigicel ? 'assets/digicel2_bg.png' : 'assets/flow2_bg.png',
            ),
            fit: BoxFit.cover,
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
                      onPressed: _refreshRestaurants,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              )
            : _restaurants == null
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _refreshRestaurants,
                    child: ListView.builder(
                      itemCount: _restaurants!.length,
                      itemBuilder: (context, index) {
                        final restaurant = _restaurants![index];
                        return Card(
                          margin: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          elevation: 4,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                InkWell(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            RestaurantProfileScreen(
                                          restaurant: restaurant,
                                          isDigicel: widget.isDigicel,
                                        ),
                                      ),
                                    );
                                  },
                                  child: restaurant.profilePictureUrl.isNotEmpty
                                      ? ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          child: Image.network(
                                            _getDirectImageUrl(
                                                restaurant.profilePictureUrl),
                                            height: 150,
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                            cacheWidth: 800,
                                            cacheHeight: 600,
                                            errorBuilder:
                                                (context, error, stackTrace) {
                                              return Container(
                                                height: 150,
                                                width: double.infinity,
                                                decoration: BoxDecoration(
                                                  color: widget.isDigicel
                                                      ? Colors.red.shade100
                                                      : Colors.blue.shade100,
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                ),
                                                child: Icon(
                                                  Icons.restaurant,
                                                  color: widget.isDigicel
                                                      ? Colors.red
                                                      : Colors.blue,
                                                  size: 48,
                                                ),
                                              );
                                            },
                                          ),
                                        )
                                      : Container(
                                          height: 150,
                                          width: double.infinity,
                                          decoration: BoxDecoration(
                                            color: widget.isDigicel
                                                ? Colors.red.shade100
                                                : Colors.blue.shade100,
                                            borderRadius:
                                                BorderRadius.circular(8),
                                          ),
                                          child: Icon(
                                            Icons.restaurant,
                                            color: widget.isDigicel
                                                ? Colors.red
                                                : Colors.blue,
                                            size: 48,
                                          ),
                                        ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  restaurant.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18),
                                ),
                                const SizedBox(height: 12),
                                Text(restaurant.address),
                                const SizedBox(height: 4),
                                Text(restaurant.phoneNumber),
                                const SizedBox(height: 4),
                                Text(
                                  'Hours: ${restaurant.openingHours}',
                                  style:
                                      const TextStyle(fontStyle: FontStyle.italic),
                                ),
                                const SizedBox(height: 12),
                                Center(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              RestaurantMenuScreen(
                                            restaurant: restaurant,
                                            isDigicel: widget.isDigicel,
                                          ),
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: widget.isDigicel
                                          ? Colors.red
                                          : Colors.blue,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 24, vertical: 12),
                                    ),
                                    child: const Text('View Menu'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
      ),
    );
  }
}