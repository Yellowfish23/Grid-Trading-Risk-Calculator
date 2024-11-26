import requests
import time
from datetime import datetime, timedelta

def format_market_cap(market_cap):
    if market_cap >= 1e9:
        return f"${market_cap / 1e9:.2f}B"
    elif market_cap >= 1e6:
        return f"${market_cap / 1e6:.2f}M"
    else:
        return f"${market_cap:.2f}"

def calculate_daily_range(high, low):
    """Calculate daily range percentage"""
    try:
        return ((float(high) - float(low)) / float(low) * 100)
    except (ValueError, ZeroDivisionError):
        return 0

def fetch_with_retry(url, headers=None, max_retries=3, delay=1):
    """Fetch data with retry mechanism"""
    for attempt in range(max_retries):
        try:
            if headers:
                response = requests.get(url, headers=headers)
            else:
                response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                raise
            time.sleep(delay * (attempt + 1))  # Exponential backoff

def verify_grid_calculations(entry_price, margin, trade_size_percent, leverage, grid_levels, grid_size, grid_multiplier, trade_size_multiplier):
    """Verify grid trading calculations"""
    try:
        # Calculate initial values
        initial_trade_size = (margin * trade_size_percent) / 100  # Initial USDT amount to trade
        initial_position_size = initial_trade_size * leverage     # Leveraged position size in USDT
        initial_trade_value = trade_size_percent * margin / 100    # Initial trade value in USDT
        
        # Calculate grid levels
        grid_levels_data = []
        total_position_value = 0
        total_trade_size = 0
        
        for i in range(grid_levels):
            multiplier = pow(grid_multiplier, i)
            level_grid_size = grid_size * multiplier
            price_level = entry_price * (1 - (level_grid_size / 100))
            trade_size = initial_trade_size * pow(trade_size_multiplier, i)
            position_size = trade_size * leverage
            
            grid_levels_data.append({
                'level': i + 1,
                'price': price_level,
                'grid_size': level_grid_size,
                'trade_size': trade_size,
                'position_size': position_size
            })
            
            total_position_value += position_size
            total_trade_size += trade_size
        
        # Calculate take profit level (based on first grid level)
        tp_price = entry_price * (1 + (grid_size / 100))
        
        # Calculate required margin
        required_margin = total_position_value / leverage
        
        return {
            'entry_price': entry_price,
            'margin': margin,
            'trade_size_percent': trade_size_percent,
            'leverage': leverage,
            'initial_trade_size': round(initial_trade_size, 2),
            'initial_position_size': round(initial_position_size, 2),
            'initial_trade_value': round(initial_trade_value, 2),
            'required_margin': round(required_margin, 2),
            'tp_price': round(tp_price, 8),
            'total_position_value': round(total_position_value, 2),
            'total_trade_size': round(total_trade_size, 2),
            'grid_levels': grid_levels_data
        }
        
    except Exception as e:
        print(f"Error in grid calculations: {str(e)}")
        return None

def test_grid_calculations():
    """Test grid calculations with SOL example"""
    print("\nTesting Grid Calculations with SOL/USDT example...")
    
    # Test case with SOL price
    test_params = {
        'entry_price': 247.53,     # Current SOL price
        'margin': 1000,            # Initial capital
        'trade_size_percent': 10,  # Initial trade size %
        'leverage': 3,             # Leverage
        'grid_levels': 3,          # Number of grid levels
        'grid_size': 2,            # % to first grid
        'grid_multiplier': 1.5,    # Grid size multiplier
        'trade_size_multiplier': 1.5  # Trade size multiplier
    }
    
    results = verify_grid_calculations(**test_params)
    
    if results:
        print("\nInput Parameters:")
        print(f"Entry Price: ${results['entry_price']}")
        print(f"Initial Capital: ${results['margin']}")
        print(f"Trade Size %: {results['trade_size_percent']}%")
        print(f"Leverage: {results['leverage']}x")
        
        print("\nCalculated Values:")
        print(f"Initial Trade Size: ${results['initial_trade_size']}")
        print(f"Initial Position Size: ${results['initial_position_size']}")
        print(f"Initial Trade Value: ${results['initial_trade_value']}")
        print(f"Required Margin: ${results['required_margin']}")
        print(f"Take Profit Price: ${results['tp_price']}")
        print(f"Total Position Value: ${results['total_position_value']}")
        print(f"Total Trade Size: ${results['total_trade_size']}")
        
        print("\nGrid Levels:")
        for level in results['grid_levels']:
            print(f"\nLevel {level['level']}:")
            print(f"  Price: ${level['price']:.3f}")
            print(f"  Grid Size: {level['grid_size']:.2f}%")
            print(f"  Trade Size: ${level['trade_size']:.2f}")
            print(f"  Position Size: ${level['position_size']:.2f}")

def main():
    try:
        # Fetch top pairs by market cap from CoinGecko
        print("Fetching market caps from CoinGecko...")
        coingecko_url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false"
        headers = {"accept": "application/json"}
        
        market_caps = fetch_with_retry(coingecko_url, headers=headers)
        market_cap_map = {coin["symbol"].upper(): coin["market_cap"] for coin in market_caps}
        
        # Fetch 24hr data from Binance
        print("\nFetching 24hr data from Binance...")
        binance_24h_url = "https://api.binance.com/api/v3/ticker/24hr"
        ticker_data = fetch_with_retry(binance_24h_url)
        
        # Process USDT pairs
        print("\nProcessing pairs data...")
        pairs_data = []
        for ticker in ticker_data:
            if not ticker["symbol"].endswith("USDT"):
                continue
                
            symbol = ticker["symbol"].replace("USDT", "")
            market_cap = market_cap_map.get(symbol, 0)
            
            if market_cap == 0:
                continue
                
            daily_range = calculate_daily_range(ticker["highPrice"], ticker["lowPrice"])
            
            pair_info = {
                "symbol": ticker["symbol"],
                "price": float(ticker["lastPrice"]),
                "priceChange": float(ticker["priceChangePercent"]),
                "dailyRange": daily_range,
                "marketCap": market_cap
            }
            pairs_data.append(pair_info)
        
        # Sort by market cap and take top 20
        pairs_data.sort(key=lambda x: x["marketCap"], reverse=True)
        top_pairs = pairs_data[:20]
        
        # Fetch historical data for each pair
        print("\nFetching historical data...")
        now = int(time.time() * 1000)
        
        for idx, pair in enumerate(top_pairs, 1):
            print(f"Processing {idx}/20: {pair['symbol']}")
            ranges = []
            for i in range(2, 6):  # D2 to D5
                start_time = now - (i * 24 * 60 * 60 * 1000)
                end_time = now - ((i-1) * 24 * 60 * 60 * 1000)
                
                klines_url = f"https://api.binance.com/api/v3/klines?symbol={pair['symbol']}&interval=1d&startTime={start_time}&endTime={end_time}&limit=1"
                
                klines_data = fetch_with_retry(klines_url)
                if klines_data and len(klines_data) > 0:
                    high = float(klines_data[0][2])
                    low = float(klines_data[0][3])
                    daily_range = calculate_daily_range(high, low)
                    ranges.append(daily_range)
                else:
                    ranges.append(0)
                
                time.sleep(0.25)  # Rate limiting
            
            pair["historicalRanges"] = ranges
            pair["avgRange"] = sum(ranges) / len(ranges) if ranges else 0
        
        # Print results
        print("\nTop 20 Pairs by Market Cap:")
        print("{:<12} {:<12} {:<12} {:<12} {:<12} {:<12} {:<12} {:<12} {:<12} {:<15}".format(
            "Symbol", "Price", "24h%", "D1R%", "D2R%", "D3R%", "D4R%", "D5R%", "AvgR%", "Market Cap"
        ))
        print("-" * 120)
        
        for pair in top_pairs:
            symbol = pair["symbol"].replace("USDT", "/USDT")
            ranges = pair["historicalRanges"]
            print("{:<12} {:<12.4f} {:<12.2f} {:<12.2f} {:<12.2f} {:<12.2f} {:<12.2f} {:<12.2f} {:<12.2f} {:<15}".format(
                symbol,
                pair["price"],
                pair["priceChange"],
                pair["dailyRange"],
                ranges[0],
                ranges[1],
                ranges[2],
                ranges[3],
                pair["avgRange"],
                format_market_cap(pair["marketCap"])
            ))

    except Exception as e:
        print(f"\nError: {str(e)}")
        raise

if __name__ == "__main__":
    main()
    test_grid_calculations()
