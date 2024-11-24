def analyze_grid_prices(entry_price, grid_size_percent, grid_size_multiplier, num_levels):
    """
    Analyze grid trading price levels with proper grid size multiplication.
    
    Parameters:
    - entry_price: Initial entry price
    - grid_size_percent: Base grid size percentage
    - grid_size_multiplier: Multiplier for subsequent grid sizes
    - num_levels: Number of grid levels to calculate
    
    Returns:
    - List of dictionaries containing level info
    """
    levels = []
    current_price = entry_price
    
    print(f"\nGrid Trading Analysis")
    print(f"Entry Price: ${entry_price:,.2f}")
    print(f"Base Grid Size: {grid_size_percent}%")
    print(f"Grid Size Multiplier: {grid_size_multiplier}")
    print(f"\nLevel Analysis:")
    print("-" * 100)
    print(f"{'Level':^6} | {'Price':^15} | {'Grid Size %':^12} | {'$ From Previous':^15} | {'% From Previous':^15} | {'% From Entry':^15}")
    print("-" * 100)
    
    # Entry level
    levels.append({
        'level': 0,
        'price': entry_price,
        'grid_size': 0,
        'dollar_change': 0,
        'percent_from_prev': 0,
        'percent_from_entry': 0
    })
    
    print(f"{0:^6} | ${entry_price:^14,.2f} | {0:^12.2f} | ${0:^14,.2f} | {0:^15.2f} | {0:^15.2f}")
    
    accumulated_size = 0
    for i in range(num_levels):
        # Calculate grid size for this level
        current_grid_size = grid_size_percent * (grid_size_multiplier ** i)
        
        # Calculate new price
        previous_price = current_price
        current_price = previous_price * (1 - (current_grid_size / 100))
        
        # Calculate changes
        dollar_change = previous_price - current_price
        percent_from_prev = ((previous_price - current_price) / previous_price) * 100
        percent_from_entry = ((entry_price - current_price) / entry_price) * 100
        accumulated_size += current_grid_size
        
        level_info = {
            'level': i + 1,
            'price': current_price,
            'grid_size': current_grid_size,
            'dollar_change': dollar_change,
            'percent_from_prev': percent_from_prev,
            'percent_from_entry': percent_from_entry
        }
        levels.append(level_info)
        
        print(f"{i+1:^6} | ${current_price:^14,.2f} | {current_grid_size:^12.2f} | ${dollar_change:^14,.2f} | {percent_from_prev:^15.2f} | {percent_from_entry:^15.2f}")
    
    print("-" * 100)
    print(f"Total accumulated grid size: {accumulated_size:.2f}%")
    return levels

# Example calculation with 10 levels
entry_price = 1000  # Example entry price
grid_size = 2       # 2% base grid size
grid_multiplier = 0.9  # Grid size multiplier
num_levels = 10     # Number of grid levels

# Run analysis
levels = analyze_grid_prices(entry_price, grid_size, grid_multiplier, num_levels)

# Additional summary
print("\nKey Observations:")
print(f"1. First grid level drop: ${levels[1]['dollar_change']:.2f} ({levels[1]['percent_from_prev']:.2f}%)")
print(f"2. Last grid level drop: ${levels[-1]['dollar_change']:.2f} ({levels[-1]['percent_from_prev']:.2f}%)")
print(f"3. Total price range: ${entry_price - levels[-1]['price']:.2f} ({levels[-1]['percent_from_entry']:.2f}%)")
