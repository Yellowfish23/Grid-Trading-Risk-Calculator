import math

def audit_grid_calculations():
    print("Auditing Grid Trading Calculator Calculations\n")
    
    # Sample test values (using realistic values)
    test_cases = [
        {
            "entry_price": 100.0,
            "margin": 1000.0,
            "trade_size_percent": 10.0,
            "leverage": 3.0,
            "grid_levels": 3,
            "grid_size": 2.0,
            "grid_multiplier": 0.9,
            "trade_size_multiplier": 1.15,
            "tp_percent": 10.0
        },
        {
            "entry_price": 24.56,
            "margin": 500.0,
            "trade_size_percent": 5.0,
            "leverage": 2.0,
            "grid_levels": 4,
            "grid_size": 1.5,
            "grid_multiplier": 0.95,
            "trade_size_multiplier": 1.2,
            "tp_percent": 5.0
        }
    ]
    
    for case_num, test in enumerate(test_cases, 1):
        print(f"\nTest Case {case_num}:")
        print("=" * 50)
        
        try:
            # 1. Initial Trade Value Calculation
            initial_trade_value = (test["margin"] * test["trade_size_percent"]) / 100
            print(f"Initial Trade Value: {initial_trade_value:.2f} USDT")
            
            # 2. Take Profit Calculations
            tp_price = test["entry_price"] * (1 + (test["tp_percent"] / 100))
            price_move_to_tp = tp_price - test["entry_price"]
            price_move_to_tp_percent = ((tp_price - test["entry_price"]) / test["entry_price"]) * 100
            print(f"TP Price: {tp_price:.8f}")
            print(f"Price Move to TP: {price_move_to_tp:.8f}")
            print(f"Price Move to TP %: {price_move_to_tp_percent:.2f}%")
            
            # 3. Grid Level Calculations
            grid_levels_data = []
            total_trade_size = initial_trade_value
            total_weighted_price = test["entry_price"] * initial_trade_value
            current_price = test["entry_price"]
            current_grid_size = test["grid_size"]
            
            # Level 0 (Initial Trade)
            level_0 = {
                "level": 0,
                "price": test["entry_price"],
                "grid_size": 0,
                "trade_size": initial_trade_value,
                "position_size": initial_trade_value * test["leverage"],
                "required_margin": initial_trade_value,
                "percent_from_entry": 0.00,
                "pnl_at_tp": (initial_trade_value * test["leverage"] * test["tp_percent"]) / 100
            }
            grid_levels_data.append(level_0)
            print(f"\nLevel 0:")
            for k, v in level_0.items():
                if isinstance(v, float):
                    print(f"{k}: {v:.8f}")
                else:
                    print(f"{k}: {v}")
            
            # Calculate grid levels
            for i in range(test["grid_levels"]):
                if i > 0:
                    current_grid_size = current_grid_size * test["grid_multiplier"]
                
                price_level = current_price * (1 - (current_grid_size / 100))
                trade_size = initial_trade_value * math.pow(test["trade_size_multiplier"], i)
                position_size = trade_size * test["leverage"]
                required_margin = trade_size
                percent_from_entry = ((price_level - test["entry_price"]) / test["entry_price"]) * 100
                pnl_at_tp = (trade_size * test["leverage"] * test["tp_percent"]) / 100
                
                level_data = {
                    "level": -(i + 1),
                    "price": price_level,
                    "grid_size": current_grid_size,
                    "trade_size": trade_size,
                    "position_size": position_size,
                    "required_margin": required_margin,
                    "percent_from_entry": percent_from_entry,
                    "pnl_at_tp": pnl_at_tp
                }
                grid_levels_data.append(level_data)
                
                print(f"\nLevel {-(i + 1)}:")
                for k, v in level_data.items():
                    if isinstance(v, float):
                        print(f"{k}: {v:.8f}")
                    else:
                        print(f"{k}: {v}")
                
                current_price = price_level
                total_trade_size += trade_size
                total_weighted_price += price_level * trade_size
            
            # Calculate final values
            required_margin = total_trade_size
            average_entry_price = total_weighted_price / total_trade_size
            
            print(f"\nFinal Calculations:")
            print(f"Required Margin: {required_margin:.8f}")
            print(f"Average Entry Price: {average_entry_price:.8f}")
            print(f"Total Trade Size: {total_trade_size:.8f}")
            
        except Exception as e:
            print(f"Error in calculations: {str(e)}")
            continue

if __name__ == "__main__":
    audit_grid_calculations()
