import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/restaurant.dart';

class OrderScreen extends StatefulWidget {
  final Restaurant restaurant;
  final List<MenuItem> menuItems;
  final MenuItem? selectedMain;
  final bool isDigicel;

  const OrderScreen({
    super.key,
    required this.restaurant,
    required this.menuItems,
    this.selectedMain,
    this.isDigicel = false,
  });

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  // State variables
  List<Map<String, dynamic>> orders = [];
  String? selectedCategory;
  MenuItem? selectedMenuItem;
  String? selectedSize;
  Set<String> selectedSpecials = {};
  String? selectedSide;
  String? selectedVeg;
  String? selectedGravey;
  String customerName = '';
  String deliveryOption = 'pickup';
  String deliveryAddress = '';
  String pickupTime = '';
  final _formKey = GlobalKey<FormState>();

  // Mix food feature state variables
  bool isMixFood = false;
  MenuItem? selectedSecondMain;
  Set<String> selectedSecondMainSpecials = {};
  late List<MenuItem> mainItems;

  final List<String> hardcodedCategories = [
    'main',
    'drink',
    'sandwish',
    'seafood',
    'pasta',
    'soup',
    'patty',
    'cake',
    'salad',
    'wrap',
    'ice cream',
    'slushey',
    'smoothie',
    'burger',
    'chicken',
    'chicken combo',
    'meal combo',
    'combo',
    'porridge',
    'loaves',
    'tacos',
    'boritos',
    'pizzas',
    'desserts',
    'juice',
    'punch',
    'hotdogs',
    'others',
  ];

  @override
  void initState() {
    super.initState();
    mainItems = widget.menuItems
        .where((item) => item.section.toLowerCase() == 'main')
        .toList();
    if (widget.selectedMain != null) {
      selectedCategory = widget.selectedMain!.section.toLowerCase();
      selectedMenuItem = widget.selectedMain;
    }
    _loadSavedState();
  }

  Future<void> _loadSavedState() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      final savedOrders = jsonDecode(prefs.getString('orders') ?? '[]') as List;
      orders = savedOrders.map((order) {
        final itemData = order['item'] as Map<String, dynamic>;
        final menuItem = widget.menuItems.firstWhere(
          (item) =>
              item.name == itemData['name'] &&
              mapEquals(item.prices,
                  Map<String, double>.from(itemData['prices'] as Map)),
          orElse: () => widget.menuItems.first,
        );
        return {
          'item': menuItem.toJson(),
          'size': order['size'],
          'specials': order['specials'] ?? [],
          'side': order['side'],
          'veg': order['veg'],
          'gravey': order['gravey'],
        };
      }).toList();
      customerName = prefs.getString('customerName') ?? '';
      deliveryOption = prefs.getString('deliveryOption') ?? 'pickup';
      deliveryAddress = prefs.getString('deliveryAddress') ?? '';
      pickupTime = prefs.getString('pickupTime') ?? '';
    });
  }

  Future<void> _saveState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('orders', jsonEncode(orders));
    await prefs.setString('customerName', customerName);
    await prefs.setString('deliveryOption', deliveryOption);
    await prefs.setString('deliveryAddress', deliveryAddress);
    await prefs.setString('pickupTime', pickupTime);
  }

  void addToOrder() {
    if (selectedMenuItem == null || selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an item and size')),
      );
      return;
    }

    // Mix-specific validations
    if (selectedCategory == 'main' && isMixFood && selectedSecondMain == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please select a second main dish for mix meal')),
      );
      return;
    }
    if (selectedCategory == 'main' &&
        isMixFood &&
        (selectedSize != 'Med' && selectedSize != 'Lrg')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text('Mix meals are only available in Medium or Large size')),
      );
      return;
    }

    final order = {
      'item': selectedMenuItem!.toJson(),
      'size': selectedSize,
      'specials': selectedSpecials.toList(),
      'side': selectedSide,
      'veg': selectedVeg,
      'gravey': selectedGravey,
      'isMix': selectedCategory == 'main' && isMixFood,
    };

    if (selectedCategory == 'main' && isMixFood && selectedSecondMain != null) {
      order['secondMain'] = selectedSecondMain!.toJson();
      order['secondMainSpecials'] = selectedSecondMainSpecials.toList();
    }

    setState(() {
      orders.add(order);
      selectedMenuItem = null;
      selectedSize = null;
      selectedSpecials.clear();
      selectedSide = null;
      selectedVeg = null;
      selectedGravey = null;
      isMixFood = false;
      selectedSecondMain = null;
      selectedSecondMainSpecials.clear();
    });
    _saveState();
  }

  Future<void> _sendOrder() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      String orderSummary = buildOrderSummary();
      final phoneNumber = widget.restaurant.whatsAppNumber;
      final message = Uri.encodeComponent(
          'Hello ${widget.restaurant.name} i would like to place an order for:\n$orderSummary\nName: $customerName\n${deliveryOption == 'delivery' ? 'Delivery Address: $deliveryAddress' : 'Pickup Time: $pickupTime'}');
      final url = 'https://wa.me/$phoneNumber?text=$message';
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch WhatsApp')),
        );
      }
    }
  }

  String buildOrderSummary() {
    StringBuffer summary = StringBuffer();
    double totalPrice = 0;
    for (int i = 0; i < orders.length; i++) {
      var order = orders[i];
      final item = order['item'] is MenuItem
          ? order['item'] as MenuItem
          : MenuItem.fromJson(order['item'] as Map<String, dynamic>);
      summary
          .writeln('Order #${i + 1}${order['isMix'] == true ? ' (Mix)' : ''}:');
      summary.writeln('Item: ${item.name}');
      if (order['isMix'] == true && order.containsKey('secondMain')) {
        final secondMain = order['secondMain'] is MenuItem
            ? order['secondMain'] as MenuItem
            : MenuItem.fromJson(order['secondMain'] as Map<String, dynamic>);
        summary.writeln('Second Item: ${secondMain.name}');
        if ((order['secondMainSpecials'] as List).isNotEmpty) {
          summary.writeln(
              'Second Item Specials: ${(order['secondMainSpecials'] as List).join(', ')}');
        }
      }
      if (order['size'] != null) summary.writeln('Size: ${order['size']}');
      if (order['side'] != null) summary.writeln('Side: ${order['side']}');
      if (order['veg'] != null) summary.writeln('Vegetable: ${order['veg']}');
      if (order['gravey'] != null) summary.writeln('Gravy: ${order['gravey']}');
      if ((order['specials'] as List).isNotEmpty) {
        summary.writeln('Specials: ${(order['specials'] as List).join(', ')}');
      }

      double price;
      if (order['isMix'] == true) {
        price = widget.restaurant.mixPrices[order['size']] ?? 0;
      } else {
        price = item.prices[order['size']] ?? 0;
      }
      totalPrice += price;
      summary.writeln('Price: \$${price.toStringAsFixed(2)}');
      summary.writeln();
    }
    summary.writeln('Total: \$${totalPrice.toStringAsFixed(2)}');
    return summary.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Order from ${widget.restaurant.name}'),
        backgroundColor: widget.isDigicel ? Colors.red : Colors.blue,
      ),
      body: Container(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(
              widget.isDigicel ? 'assets/digicel_bg.png' : 'assets/flow_bg.png',
            ),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              Colors.black.withAlpha(128),
              BlendMode.darken,
            ),
          ),
        ),
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Add Items',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: selectedCategory,
                        hint: const Text('Select Category'),
                        items: hardcodedCategories
                            .where((cat) => widget.menuItems.any((item) =>
                                item.section.toLowerCase() ==
                                cat.toLowerCase()))
                            .map((cat) => DropdownMenuItem(
                                  value: cat,
                                  child: Text(cat),
                                ))
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            selectedCategory = value;
                            selectedMenuItem = null;
                            selectedSize = null;
                            selectedSpecials.clear();
                            selectedSide = null;
                            selectedVeg = null;
                            selectedGravey = null;
                          });
                        },
                      ),
                      if (selectedCategory != null) ...[
                        const SizedBox(height: 16),
                        DropdownButtonFormField<MenuItem>(
                          value: selectedMenuItem,
                          hint: const Text('Select Menu Item'),
                          items: widget.menuItems
                              .where((item) =>
                                  item.section.toLowerCase() ==
                                  selectedCategory!.toLowerCase())
                              .map((item) => DropdownMenuItem(
                                    value: item,
                                    child: Text(item.name),
                                  ))
                              .toList(),
                          onChanged: (value) {
                            setState(() {
                              selectedMenuItem = value;
                              selectedSize = null;
                              selectedSpecials.clear();
                              selectedSide = null;
                              selectedVeg = null;
                              selectedGravey = null;
                            });
                          },
                        ),
                        if (selectedMenuItem != null) ...[
                          if (selectedCategory == 'main' &&
                              widget.restaurant.mixPrices.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                const Text('Mix'),
                                const SizedBox(width: 8),
                                Switch(
                                  value: isMixFood,
                                  onChanged: (value) {
                                    setState(() {
                                      isMixFood = value;
                                      if (!value) {
                                        selectedSecondMain = null;
                                        selectedSecondMainSpecials.clear();
                                      } else {
                                        if (selectedSize != null &&
                                            selectedSize != 'Med' &&
                                            selectedSize != 'Lrg') {
                                          selectedSize = 'Med';
                                        }
                                      }
                                    });
                                  },
                                ),
                              ],
                            ),
                          ],
                          if (isMixFood && selectedCategory == 'main') ...[
                            const SizedBox(height: 16),
                            DropdownButtonFormField<MenuItem>(
                              value: selectedSecondMain,
                              hint: const Text('Select Second Main Dish'),
                              items: mainItems
                                  .where((item) => item != selectedMenuItem)
                                  .map((item) => DropdownMenuItem(
                                        value: item,
                                        child: Text(item.name),
                                      ))
                                  .toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedSecondMain = value;
                                  selectedSecondMainSpecials.clear();
                                });
                              },
                            ),
                            if (selectedSecondMain != null &&
                                selectedSecondMain!.specials.isNotEmpty) ...[
                              const SizedBox(height: 16),
                              const Text('Second Item Specials:'),
                              ...selectedSecondMain!.specials.map((special) =>
                                  CheckboxListTile(
                                    title: Text(special),
                                    value: selectedSecondMainSpecials
                                        .contains(special),
                                    onChanged: (bool? value) {
                                      setState(() {
                                        if (value == true) {
                                          if (selectedSecondMain!
                                                  .specialOption ==
                                              'choose one') {
                                            selectedSecondMainSpecials.clear();
                                          }
                                          if (selectedSecondMain!.specialCap ==
                                                  null ||
                                              selectedSecondMainSpecials
                                                      .length <
                                                  selectedSecondMain!
                                                      .specialCap!) {
                                            selectedSecondMainSpecials
                                                .add(special);
                                          }
                                        } else {
                                          selectedSecondMainSpecials
                                              .remove(special);
                                        }
                                      });
                                    },
                                  )),
                            ],
                          ],
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            value: selectedSize,
                            hint: const Text('Select Size'),
                            items: (isMixFood && selectedCategory == 'main')
                                ? ['Med', 'Lrg']
                                    .map((size) => DropdownMenuItem(
                                          value: size,
                                          child: Text(size),
                                        ))
                                    .toList()
                                : selectedMenuItem!.prices.keys
                                    .map((size) => DropdownMenuItem(
                                          value: size,
                                          child: Text(
                                              size.isEmpty ? 'Regular' : size),
                                        ))
                                    .toList(),
                            onChanged: (value) {
                              setState(() {
                                selectedSize = value;
                              });
                            },
                          ),
                          if (selectedMenuItem!.specials.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            const Text('Select Specials:'),
                            ...selectedMenuItem!.specials.map((special) =>
                                CheckboxListTile(
                                  title: Text(special),
                                  value: selectedSpecials.contains(special),
                                  onChanged: (bool? value) {
                                    setState(() {
                                      if (value == true) {
                                        if (selectedMenuItem!.specialOption ==
                                            'choose one') {
                                          selectedSpecials.clear();
                                        }
                                        if (selectedMenuItem!.specialCap ==
                                                null ||
                                            selectedSpecials.length <
                                                selectedMenuItem!.specialCap!) {
                                          selectedSpecials.add(special);
                                        }
                                      } else {
                                        selectedSpecials.remove(special);
                                      }
                                    });
                                  },
                                )),
                          ],
                          if (selectedMenuItem!.sides.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            DropdownButtonFormField<String>(
                              value: selectedSide,
                              hint: const Text('Select Side'),
                              items: selectedMenuItem!.sides
                                  .map((side) => DropdownMenuItem(
                                        value: side,
                                        child: Text(side),
                                      ))
                                  .toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedSide = value;
                                });
                              },
                            ),
                          ],
                          if (selectedMenuItem!.veg.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            DropdownButtonFormField<String>(
                              value: selectedVeg,
                              hint: const Text('Select Vegetable'),
                              items: selectedMenuItem!.veg
                                  .map((veg) => DropdownMenuItem(
                                        value: veg,
                                        child: Text(veg),
                                      ))
                                  .toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedVeg = value;
                                });
                              },
                            ),
                          ],
                          if (selectedMenuItem!.gravey.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            DropdownButtonFormField<String>(
                              value: selectedGravey,
                              hint: const Text('Select Gravy'),
                              items: selectedMenuItem!.gravey
                                  .map((gravey) => DropdownMenuItem(
                                        value: gravey,
                                        child: Text(gravey),
                                      ))
                                  .toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedGravey = value;
                                });
                              },
                            ),
                          ],
                        ],
                      ],
                      const SizedBox(height: 16),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          if (selectedMenuItem != null &&
                              selectedSize != null) {
                            if (isMixFood && selectedSecondMain == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Please select a second main dish for mix meal')),
                              );
                              return;
                            }
                            if (isMixFood &&
                                !['Medium', 'Large'].contains(selectedSize)) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Mix meals are only available in Medium or Large size')),
                              );
                              return;
                            }
                            addToOrder();
                          }
                        },
                        child: const Text('Add to Order'),
                      ),
                    ],
                  ),
                ),
              ),
              if (orders.isNotEmpty) ...[
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Order Summary',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        ...orders.asMap().entries.map((entry) {
                          final index = entry.key;
                          final order = entry.value;
                          final itemData =
                              order['item'] as Map<String, dynamic>;
                          final item = widget.menuItems.firstWhere(
                            (menuItem) => menuItem.name == itemData['name'],
                            orElse: () => widget.menuItems.first,
                          );
                          final isMix = order['isMix'] as bool? ?? false;
                          final price = item.prices[order['size']] ?? 0.0;

                          Widget buildItemDetails(
                              String title, Map<String, dynamic> itemData) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(title),
                                if (itemData['specials']?.isNotEmpty ?? false)
                                  Text(
                                      '  Specials: ${(itemData['specials'] as List).join(', ')}'),
                                if (itemData['side'] != null)
                                  Text('  Side: ${itemData['side']}'),
                                if (itemData['veg'] != null)
                                  Text('  Vegetable: ${itemData['veg']}'),
                                if (itemData['gravey'] != null)
                                  Text('  Gravy: ${itemData['gravey']}'),
                              ],
                            );
                          }

                          return ListTile(
                            title: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(isMix ? 'Mix Meal' : item.name),
                                Text('\$${price.toStringAsFixed(2)}'),
                              ],
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Size: ${order['size']}'),
                                buildItemDetails('Main 1: ${item.name}', order),
                                if (isMix) ...[
                                  const SizedBox(height: 8),
                                  buildItemDetails(
                                    'Main 2: ${order['secondMain']['name']}',
                                    order['secondMain'] as Map<String, dynamic>,
                                  ),
                                ],
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete),
                              onPressed: () {
                                setState(() {
                                  orders.removeAt(index);
                                });
                                _saveState();
                              },
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Customer Information',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          decoration: const InputDecoration(
                            labelText: 'Name',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your name';
                            }
                            return null;
                          },
                          onSaved: (value) {
                            customerName = value ?? '';
                          },
                        ),
                        const SizedBox(height: 16),
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(
                              value: 'pickup',
                              label: Text('Pickup'),
                              icon: Icon(Icons.store),
                            ),
                            ButtonSegment(
                              value: 'delivery',
                              label: Text('Delivery'),
                              icon: Icon(Icons.delivery_dining),
                            ),
                          ],
                          selected: {deliveryOption},
                          onSelectionChanged: (Set<String> newSelection) {
                            setState(() {
                              deliveryOption = newSelection.first;
                            });
                          },
                        ),
                        const SizedBox(height: 16),
                        if (deliveryOption == 'delivery')
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Delivery Address',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter delivery address';
                              }
                              return null;
                            },
                            onSaved: (value) {
                              deliveryAddress = value ?? '';
                            },
                          )
                        else
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Pickup Time',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter pickup time';
                              }
                              return null;
                            },
                            onSaved: (value) {
                              pickupTime = value ?? '';
                            },
                          ),
                        const SizedBox(height: 24),
                        Center(
                          child: ElevatedButton.icon(
                            onPressed: _sendOrder,
                            style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  widget.isDigicel ? Colors.red : Colors.blue,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 32, vertical: 16),
                            ),
                            icon: const Icon(Icons.send),
                            label: const Text('Send Order via WhatsApp'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
