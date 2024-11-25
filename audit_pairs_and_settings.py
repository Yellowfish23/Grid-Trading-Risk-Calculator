def audit_pairs_calculations():
    print("Auditing Top Pairs Calculations\n")
    
    # Sample 24hr data (simulating Binance response)
    sample_pairs_data = [
        {
            "symbol": "BTCUSDT",
            "lastPrice": "43250.50",
            "priceChangePercent": "2.5",
            "volume": "1000000",
            "highPrice": "44000.00",
            "lowPrice": "42500.00",
            "ranges": [3.2, 2.8, 3.5, 2.9, 3.1]  # 5-day ranges
        },
        {
            "symbol": "ETHUSDT",
            "lastPrice": "2250.75",
            "priceChangePercent": "-1.2",
            "volume": "500000",
            "highPrice": "2300.00",
            "lowPrice": "2200.00",
            "ranges": [2.8, 2.5, 3.0, 2.7, 2.6]
        },
        {
            "symbol": "SOLUSDT",
            "lastPrice": "105.25",
            "priceChangePercent": "5.3",
            "volume": "200000",
            "highPrice": "108.00",
            "lowPrice": "100.00",
            "ranges": [4.5, 4.2, 4.8, 4.3, 4.6]
        }
    ]
    
    for pair in sample_pairs_data:
        print(f"\nAnalyzing {pair['symbol']}:")
        print("=" * 40)
        
        try:
            # 1. Basic Price Calculations
            last_price = float(pair["lastPrice"])
            price_change = float(pair["priceChangePercent"])
            high = float(pair["highPrice"])
            low = float(pair["lowPrice"])
            
            # 2. Daily Range Calculation
            daily_range = ((high - low) / low) * 100
            print(f"Daily Range: {daily_range:.2f}%")
            
            # 3. Average Range Calculation
            avg_range = sum(pair["ranges"]) / len(pair["ranges"])
            print(f"Average Range (5-day): {avg_range:.2f}%")
            
            # 4. Price Formatting
            # For BTC pairs: 8 decimals
            # For ETH pairs: 6 decimals
            # For most altcoins: 4 decimals
            if pair["symbol"].startswith("BTC"):
                decimals = 8
            elif pair["symbol"].startswith("ETH"):
                decimals = 6
            else:
                decimals = 4
                
            formatted_price = f"{last_price:.{decimals}f}"
            print(f"Formatted Price ({decimals} decimals): {formatted_price}")
            
        except Exception as e:
            print(f"Error in calculations for {pair['symbol']}: {str(e)}")
            continue

def audit_trading_settings():
    print("\nAuditing Trading Settings Calculations\n")
    
    test_cases = [
        {
            "entry_price": 100.0,
            "margin": 1000.0,
            "trade_size_percent": 10.0,
            "leverage": 3.0,
            "tp_percent": 10.0
        },
        {
            "entry_price": 24.56,
            "margin": 500.0,
            "trade_size_percent": 5.0,
            "leverage": 2.0,
            "tp_percent": 5.0
        }
    ]
    
    for case_num, test in enumerate(test_cases, 1):
        print(f"\nTest Case {case_num}:")
        print("=" * 40)
        
        try:
            # 1. Initial Trade Value
            initial_trade_value = (test["margin"] * test["trade_size_percent"]) / 100
            print(f"Initial Trade Value: {initial_trade_value:.2f} USDT")
            
            # 2. Position Size
            position_size = initial_trade_value * test["leverage"]
            print(f"Position Size: {position_size:.2f} USDT")
            
            # 3. Required Margin
            required_margin = initial_trade_value
            print(f"Required Margin: {required_margin:.2f} USDT")
            
            # 4. Take Profit Calculations
            tp_price = test["entry_price"] * (1 + (test["tp_percent"] / 100))
            price_move_to_tp = tp_price - test["entry_price"]
            price_move_to_tp_percent = ((tp_price - test["entry_price"]) / test["entry_price"]) * 100
            tp_value = (position_size * test["tp_percent"]) / 100
            
            print(f"TP Price: {tp_price:.8f}")
            print(f"Price Move to TP: {price_move_to_tp:.8f}")
            print(f"Price Move to TP %: {price_move_to_tp_percent:.2f}%")
            print(f"TP Value: {tp_value:.2f} USDT")
            
        except Exception as e:
            print(f"Error in calculations: {str(e)}")
            continue

if __name__ == "__main__":
    print("Starting Calculations Audit\n")
    print("=" * 50)
    
    # Audit top pairs calculations
    audit_pairs_calculations()
    
    # Audit trading settings calculations
    audit_trading_settings()
