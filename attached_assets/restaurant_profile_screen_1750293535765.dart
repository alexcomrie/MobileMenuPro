import 'package:flutter/material.dart';
import '../models/restaurant.dart';

class RestaurantProfileScreen extends StatelessWidget {
  final Restaurant restaurant;
  final bool isDigicel;

  const RestaurantProfileScreen({
    super.key,
    required this.restaurant,
    required this.isDigicel,
  });

  String _getDirectImageUrl(String url) {
    if (url.contains('drive.google.com')) {
      // Extract file ID from Google Drive URL
      final RegExp regExp =
          RegExp(r'/d/([a-zA-Z0-9_-]+)|/file/d/([a-zA-Z0-9_-]+)/');
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
        title: Text('${restaurant.name} Profile'),
        backgroundColor: isDigicel ? Colors.red : Colors.blue,
      ),
      body: Container(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(
              isDigicel ? 'assets/digicel2_bg.png' : 'assets/flow2_bg.png',
            ),
            fit: BoxFit.cover,
            opacity: 0.1,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (restaurant.profilePictureUrl.isNotEmpty)
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      _getDirectImageUrl(restaurant.profilePictureUrl),
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      cacheWidth: 1200,
                      cacheHeight: 800,
                      errorBuilder: (context, error, stackTrace) {
                        print('Error loading image: $error');
                        return Container(
                          height: 200,
                          width: double.infinity,
                          color: Colors.grey[300],
                          child: const Center(
                            child: Text(
                              'Failed to load image',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              _buildInfoCard(
                title: 'Restauran Information',
                children: [
                  _buildInfoRow('Name', restaurant.name),
                  _buildInfoRow('Address', restaurant.address),
                  _buildInfoRow('Phone', restaurant.phoneNumber),
                  _buildInfoRow('WhatsApp', restaurant.whatsAppNumber),
                  _buildInfoRow(
                    'Delivery',
                    restaurant.hasDelivery
                        ? 'Yes, \$${restaurant.deliveryPrice}'
                        : 'No',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildInfoCard(
                title: 'Operating Hours',
                children: [
                  _buildInfoRow('Opening Hours', restaurant.openingHours),
                  if (restaurant.breakfastStartTime.hour != 0 || restaurant.breakfastEndTime.hour != 0)
                    _buildInfoRow(
                      'Breakfast Time',
                      '${restaurant.breakfastStartTime.format(context)} - ${restaurant.breakfastEndTime.format(context)}',
                    ),
                  if (restaurant.lunchStartTime.hour != 0 || restaurant.lunchEndTime.hour != 0)
                    _buildInfoRow(
                      'Lunch Time',
                      '${restaurant.lunchStartTime.format(context)} - ${restaurant.lunchEndTime.format(context)}',
                    ),
                ],
              ),
              const SizedBox(height: 16),
              if (restaurant.businessRegistrationUrl.isNotEmpty) ...[
                _buildInfoCard(
                  title: 'Business Registration',
                  children: [
                    Center(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          _getDirectImageUrl(
                              restaurant.businessRegistrationUrl),
                          height: 200,
                          fit: BoxFit.contain,
                          cacheWidth: 1200,
                          cacheHeight: 800,
                          errorBuilder: (context, error, stackTrace) {
                            print('Error loading registration image: $error');
                            return Container(
                              height: 200,
                              width: double.infinity,
                              color: Colors.grey[300],
                              child: const Center(
                                child: Text(
                                  'Failed to load registration image',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(
      {required String title, required List<Widget> children}) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
