# Grid Trading Calculator User Guide

## Overview
The Grid Trading Calculator is a powerful tool designed to help traders plan and analyze grid trading strategies for cryptocurrency perpetual trading. It provides real-time market data, grid level calculations, and risk management analysis.

## Market Data Interface

### Top Pairs Table
- Shows top cryptocurrency pairs by market capitalization
- Updates in real-time with latest market data
- Displays key metrics for each pair:
  * Symbol (e.g., BTC/USDT)
  * Current Price
  * 24h Price Change %
  * Daily Range % (D1R% - D5R%)
  * 5-day Average Range (AvgR%)
  * Market Cap in Billions

### Market Analysis Features
1. **Daily Range Calculation**
   ```
   For each day (D1-D5):
   Daily Range % = ((High - Low) / Low) × 100
   5-day Average = Mean of last 5 daily ranges
   ```
   - Helps determine optimal grid spacing
   - Provides volatility metrics for strategy adjustment

2. **Table Functionality**
   - Click headers to sort by any column
   - Default sort by Market Cap (descending)
   - Click rows to select trading pairs
   - Selected pair updates all calculations

3. **Data Sources**
   - Price data: Binance API (real-time)
   - Market caps: CoinGecko API (5-min cache)
   - Historical ranges: Calculated from market data

## Key Concepts and Calculations

### Basic Terms
- **Initial Capital**: Your starting USDT amount
- **Trade Size Percentage**: Percentage of capital for initial trade
- **Entry Price**: Current market price of the trading pair
- **Leverage**: Multiplier for position size (e.g., 3x)
- **Grid Levels**: Number of buy orders below entry
- **Grid Size**: Percentage distance between levels
- **Grid Multiplier**: Factor for increasing grid sizes
- **Trade Size Multiplier**: Factor for increasing trade sizes

### Core Calculations

1. **Initial Trade Calculations**
   ```
   Initial Trade Size = (Initial Capital × Trade Size %) / 100
   Initial Position Size = Initial Trade Size × Leverage
   Initial Trade Value = Initial Capital × Trade Size % / 100
   ```
   Example with $1000 capital, 10% trade size, 3x leverage at SOL price $247.53:
   - Initial Trade Size = $1000 × 10% = $100
   - Initial Position Size = $100 × 3 = $300
   - Initial Trade Value = $1000 × 10% = $100

2. **Grid Level Calculations**
   For each level (i), where i starts at 0:
   ```
   Grid Size[i] = Base Grid Size × Grid Multiplier^i
   Price Level[i] = Entry Price × (1 - Grid Size[i]/100)
   Trade Size[i] = Initial Trade Size × Trade Size Multiplier^i
   Position Size[i] = Trade Size[i] × Leverage
   ```
   Example with 2% base grid size, 1.5x multipliers:
   
   Level 1:
   - Grid Size = 2% × 1.5^0 = 2%
   - Price = $247.53 × (1 - 2/100) = $242.58
   - Trade Size = $100 × 1.5^0 = $100
   - Position Size = $100 × 3 = $300

   Level 2:
   - Grid Size = 2% × 1.5^1 = 3%
   - Price = $247.53 × (1 - 3/100) = $240.10
   - Trade Size = $100 × 1.5^1 = $150
   - Position Size = $150 × 3 = $450

   Level 3:
   - Grid Size = 2% × 1.5^2 = 4.5%
   - Price = $247.53 × (1 - 4.5/100) = $236.39
   - Trade Size = $100 × 1.5^2 = $225
   - Position Size = $225 × 3 = $675

3. **Take Profit Calculations**
   ```
   Take Profit Price = Entry Price × (1 + Base Grid Size/100)
   ```
   Example:
   - Take Profit = $247.53 × (1 + 2/100) = $252.48

4. **Total Position Analysis**
   ```
   Total Position Value = Sum of all Position Sizes
   Total Trade Size = Sum of all Trade Sizes
   Required Margin = Total Position Value / Leverage
   ```
   Example with 3 levels:
   - Total Position Value = $300 + $450 + $675 = $1,425
   - Total Trade Size = $100 + $150 + $225 = $475
   - Required Margin = $1,425 / 3 = $475

## How to Use

1. **Select Trading Pair**
   - Choose from the top pairs list sorted by market cap
   - Current price and market data auto-populate
   - Use 5-day Average Range for volatility assessment
   - Consider market cap for liquidity assessment

2. **Configure Grid Parameters**
   - Set your initial capital (e.g., $1000)
   - Choose trade size percentage (e.g., 10%)
   - Current market price is auto-filled
   - Select leverage (recommended: 1-3x)
   - Set grid levels (recommended: 3-5)
   - Adjust grid size (recommended: 1-3%)
   - Set multipliers (recommended: 1.2-1.5x)

3. **Analyze Results**
   The calculator displays for each grid level:
   - Entry price and grid prices
   - Individual position sizes
   - Required margin per level
   - Take profit targets
   - Cumulative position value
   - Total required margin
   - Maximum drawdown potential

4. **Risk Management**
   - Monitor required margin vs available capital
   - Keep total position size manageable
   - Consider reducing leverage if total exposure > 2x capital
   - Watch grid multiplier effect on lower levels
   - Use the 5-day Average Range to validate grid spacing

## Best Practices

1. **Position Sizing**
   - Start with 5-10% of capital for initial trade
   - Use lower trade size % with higher grid levels
   - Account for trade size multiplier effect
   - Consider total margin requirements

2. **Grid Spacing**
   - Use smaller grids (1-2%) for less volatile pairs
   - Larger grids (2-3%) for more volatile pairs
   - Compare grid size to daily ranges (D1R%-D5R%)
   - Adjust based on 5-day Average Range (AvgR%)

3. **Leverage Usage**
   - Keep leverage modest (1-3x recommended)
   - Calculate total exposure including all grid levels
   - Account for worst-case scenarios
   - Monitor liquidation prices carefully

4. **Market Conditions**
   - Check 5-day price range for volatility
   - Monitor funding rates for perpetual pairs
   - Consider market direction and trend
   - Use market cap for liquidity assessment

## Data Updates and Maintenance
- Real-time price updates via Binance API
- 5-minute market cap cache from CoinGecko
- Automatic data refresh system
- Persistent settings storage

## Troubleshooting
- If calculations seem off, verify input parameters
- Use the "Reset" button to clear all inputs
- Refresh page for latest market data
- Check connection for real-time updates
- Clear browser cache if table sorting issues occur

For technical support or feature requests, please refer to the project repository.

---
Last Updated: ${new Date().toISOString().split('T')[0]}
