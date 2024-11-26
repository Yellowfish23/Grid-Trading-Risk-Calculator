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
    current_grid_size = grid_size_percent
    
    print(f"\nGrid Trading Analysis")
    print(f"Entry Price: ${entry_price:,.2f}")
    print(f"Base Grid Size: {grid_size_percent}%")
    print(f"Grid Size Multiplier: {grid_size_multiplier}")
    print(f"\nLevel Analysis:")
    print("-" * 120)
    print(f"{'Level':^6} | {'Price':^12} | {'Grid Size %':^10} | {'$ Drop':^10} | {'% Drop':^10} | {'Cumulative %':^12} | {'Grid Size Calc':^25}")
    print("-" * 120)
    
    # Entry level
    levels.append({
        'level': 0,
        'price': entry_price,
        'grid_size': 0,
        'dollar_drop': 0,
        'percent_drop': 0,
        'cumulative_percent': 0,
        'grid_calc': 'Entry'
    })
    
    print(f"{0:^6} | ${entry_price:^10,.2f} | {0:^10.2f} | ${0:^8,.2f} | {0:^10.2f} | {0:^12.2f} | {'Entry':^25}")
    
    accumulated_drop = 0
    for i in range(num_levels):
        # Calculate grid size for this level
        if i > 0:
            current_grid_size = current_grid_size * grid_size_multiplier
        
        # Calculate new price
        previous_price = current_price
        current_price = previous_price * (1 - (current_grid_size / 100))
        
        # Calculate changes
        dollar_drop = previous_price - current_price
        percent_drop = (dollar_drop / previous_price) * 100
        accumulated_drop = ((entry_price - current_price) / entry_price) * 100
        grid_calc = f"{grid_size_percent}% × {grid_size_multiplier}^{i}"
        
        level_info = {
            'level': i + 1,
            'price': current_price,
            'grid_size': current_grid_size,
            'dollar_drop': dollar_drop,
            'percent_drop': percent_drop,
            'cumulative_percent': accumulated_drop,
            'grid_calc': grid_calc
        }
        levels.append(level_info)
        
        print(f"{i+1:^6} | ${current_price:^10,.2f} | {current_grid_size:^10.2f} | ${dollar_drop:^8,.2f} | {percent_drop:^10.2f} | {accumulated_drop:^12.2f} | {grid_calc:^25}")
    
    print("-" * 120)
    return levels

# Example calculation with real entry price
entry_price = 248.51  # SOL entry price
grid_size = 2       # 2% base grid size
grid_multiplier = 0.9  # Grid size multiplier
num_levels = 10     # Number of grid levels

# Run analysis
levels = analyze_grid_prices(entry_price, grid_size, grid_multiplier, num_levels)

# Additional summary
print("\nKey Observations:")
print(f"1. First grid level: ${levels[1]['price']:.2f} (drop: ${levels[1]['dollar_drop']:.2f}, {levels[1]['percent_drop']:.2f}%)")
print(f"2. Last grid level: ${levels[-1]['price']:.2f} (drop: ${levels[-1]['dollar_drop']:.2f}, {levels[-1]['percent_drop']:.2f}%)")
print(f"3. Total range: ${entry_price - levels[-1]['price']:.2f} ({levels[-1]['cumulative_percent']:.2f}%)")
