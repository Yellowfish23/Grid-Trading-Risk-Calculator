# Grid Trading Risk Calculator - User Guide

## Overview
The Grid Trading Risk Calculator is a specialized tool designed for cryptocurrency perpetual futures trading. It helps traders calculate and visualize grid trading strategies with real-time market data integration.

## Key Features

### Real-Time Market Data
- Live price updates from Binance API
- Top trading pairs display with volume metrics
- Automatic price population when selecting trading pairs

### Trading Settings

#### Basic Parameters
- Trading Pair Selection
- Entry Price (auto-populated or manual entry)
- Initial Capital (USDT)
- Initial Trade Size % (default: 10%)

#### Grid Configuration
- Grid Levels (default: 3)
- Grid Size % (default: 2%)
- Grid Size Multiplier (default: 0.9)
  - Controls the progression of grid spacing
  - Values < 1 create tighter grids at lower levels
  - Values > 1 create wider grids at lower levels
- Trade Size Multiplier (default: 1.15)
  - Controls position size progression
  - Values > 1 increase position sizes at lower levels
  - Values < 1 decrease position sizes at lower levels

#### Risk Management
- Leverage (default: 3x)
- Take Profit % (default: 10%)
- Automatic margin calculation
- Dynamic position sizing

### Grid Analysis Table
- Entry prices for each grid level
- Position sizes per level
- Required margin per level
- Cumulative position information
- Profit targets per level
- Distance from entry price
- PnL calculations at take profit

## How to Use

1. Market Selection
   - View top trading pairs sorted by volume
   - Click any pair to automatically populate trading settings
   - Prices update in real-time

2. Configure Trading Parameters
   - Set your initial capital
   - Adjust trade size percentage
   - Configure leverage
   - Set grid parameters
   - Adjust take profit target

3. Analyze Grid Levels
   - Review entry prices for each level
   - Verify position sizes
   - Check margin requirements
   - Evaluate potential profits

4. Monitor and Adjust
   - Watch real-time price updates
   - Adjust parameters as needed
   - View updated calculations instantly

## Understanding Grid Multipliers

### Grid Size Multiplier (0.9)
- Controls the spacing between grid levels
- Example with 2% base grid size:
  - Level 1: 2%
  - Level 2: 1.8% (2% × 0.9)
  - Level 3: 1.62% (1.8% × 0.9)

### Trade Size Multiplier (1.15)
- Controls position size progression
- Example with $100 base position:
  - Level 1: $100
  - Level 2: $115 ($100 × 1.15)
  - Level 3: $132.25 ($115 × 1.15)

## Calculation Methods

### Position Sizing
- Base position = Initial Capital × Trade Size %
- Subsequent positions = Previous Position × Trade Size Multiplier

### Grid Levels
- First level = Entry Price × (1 - Grid Size %)
- Subsequent levels = Previous Level × (1 - (Grid Size % × Grid Size Multiplier))

### Take Profit Calculations
- TP Price = Entry Price × (1 + TP %)
- TP Value = Position Size × TP % × Leverage

## Best Practices

1. Risk Management
   - Start with smaller position sizes
   - Use moderate leverage (3x recommended)
   - Monitor total margin requirements

2. Grid Setup
   - Use tighter grids (smaller Grid Size %) in less volatile markets
   - Use wider grids in more volatile markets
   - Adjust multipliers based on market conditions

3. Position Sizing
   - Ensure sufficient capital for all grid levels
   - Account for leverage in margin calculations
   - Consider market liquidity when sizing positions

## Access and Updates

### Online Access
- Calculator available at: https://yellowfish23.github.io/Grid-Trading-Risk-Calculator/
- No installation required
- Works on all modern browsers

### Updates and Maintenance
- Regular updates via GitHub repository
- Automatic market data updates
- Real-time calculation updates

## Technical Notes

### Market Data Sources
- Primary: Binance API
- Secondary: CoinGecko API
- Automatic failover between sources

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Performance
- Real-time calculations
- Responsive design
- Mobile-friendly interface

## Disclaimer
This calculator is for informational purposes only. Always verify calculations and conduct proper risk management before trading. Past performance does not guarantee future results.
