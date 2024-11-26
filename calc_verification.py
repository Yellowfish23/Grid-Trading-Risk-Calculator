def calculate_initial_trade_value(margin, trade_size_percent):
    return (margin * trade_size_percent) / 100

def calculate_token_amount(initial_trade_value, entry_price):
    return initial_trade_value / entry_price

def calculate_tp_values(entry_price, tp_percent, leverage, initial_trade_value):
    tp_price = entry_price * (1 + ((tp_percent / 100) / leverage))
    price_move_to_tp = tp_price - entry_price
    price_move_to_tp_percent = ((tp_price - entry_price) / entry_price) * 100
    tp_value = initial_trade_value * (tp_percent / 100) * leverage
    return {
        'tp_price': tp_price,
        'price_move_to_tp': price_move_to_tp,
        'price_move_to_tp_percent': price_move_to_tp_percent,
        'tp_value': tp_value
    }

def calculate_grid_levels(entry_price, initial_trade_value, grid_levels, grid_size, 
                         grid_multiplier, trade_size_multiplier, leverage, tp_percent):
    grid_data = []
    current_price = entry_price
    current_grid_size = grid_size
    total_trade_size = initial_trade_value
    total_weighted_price = entry_price * initial_trade_value
    
    # Add initial level (0)
    grid_data.append({
        'level': 0,
        'price': entry_price,
        'grid_size': 0,
        'trade_size': initial_trade_value,
        'position_size': initial_trade_value * leverage,
        'required_margin': initial_trade_value,
        'percent_from_entry': 0,
        'pnl_at_tp': (initial_trade_value * leverage * tp_percent) / 100
    })
    
    # Calculate grid levels
    for i in range(grid_levels):
        if i > 0:
            current_grid_size *= grid_multiplier
            
        price_level = current_price * (1 - (current_grid_size / 100))
        trade_size = initial_trade_value * (trade_size_multiplier ** i)
        position_size = trade_size * leverage
        required_margin = trade_size
        percent_from_entry = ((price_level - entry_price) / entry_price) * 100
        pnl_at_tp = (trade_size * leverage * tp_percent) / 100
        
        grid_data.append({
            'level': -(i + 1),
            'price': price_level,
            'grid_size': current_grid_size,
            'trade_size': trade_size,
            'position_size': position_size,
            'required_margin': required_margin,
            'percent_from_entry': percent_from_entry,
            'pnl_at_tp': pnl_at_tp
        })
        
        current_price = price_level
        total_trade_size += trade_size
        total_weighted_price += price_level * trade_size
    
    average_entry = total_weighted_price / total_trade_size
    total_margin_required = total_trade_size
    
    return {
        'grid_levels': grid_data,
        'average_entry': average_entry,
        'total_margin_required': total_margin_required
    }

# Test with example values
margin = 1000  # Initial capital
trade_size_percent = 10  # Trade size percentage
entry_price = 50  # Example entry price
tp_percent = 10
leverage = 3
grid_levels = 3
grid_size = 2
grid_multiplier = 0.9
trade_size_multiplier = 1.15

# Calculate initial values
initial_trade_value = calculate_initial_trade_value(margin, trade_size_percent)
print(f"\nInitial Calculations:")
print(f"Initial Trade Value: ${initial_trade_value}")

tokens = calculate_token_amount(initial_trade_value, entry_price)
print(f"Number of Tokens: {tokens}")

# Calculate TP values
tp_values = calculate_tp_values(entry_price, tp_percent, leverage, initial_trade_value)
print("\nTP Calculations:")
print(f"TP Price: ${tp_values['tp_price']:.2f}")
print(f"Price Move to TP: ${tp_values['price_move_to_tp']:.2f}")
print(f"Price Move to TP %: {tp_values['price_move_to_tp_percent']:.2f}%")
print(f"TP Value: ${tp_values['tp_value']:.2f}")

# Calculate grid levels
grid_results = calculate_grid_levels(
    entry_price, initial_trade_value, grid_levels, 
    grid_size, grid_multiplier, trade_size_multiplier,
    leverage, tp_percent
)

print("\nGrid Level Calculations:")
for level in grid_results['grid_levels']:
    print(f"\nLevel {level['level']}:")
    print(f"Price: ${level['price']:.2f}")
    print(f"Grid Size: {level['grid_size']:.2f}%")
    print(f"Trade Size: ${level['trade_size']:.2f}")
    print(f"Position Size: ${level['position_size']:.2f}")
    print(f"Required Margin: ${level['required_margin']:.2f}")
    print(f"% From Entry: {level['percent_from_entry']:.2f}%")
    print(f"PnL at TP: ${level['pnl_at_tp']:.2f}")

print(f"\nFinal Results:")
print(f"Average Entry: ${grid_results['average_entry']:.2f}")
print(f"Total Margin Required: ${grid_results['total_margin_required']:.2f}")
