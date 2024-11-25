# Grid Trading Risk Calculator - Comprehensive User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [Advanced Features](#advanced-features)
5. [Trading Strategy Guide](#trading-strategy-guide)
6. [Use Cases](#use-cases)
7. [Risk Management](#risk-management)
8. [Technical Details](#technical-details)
9. [Troubleshooting](#troubleshooting)
10. [Glossary](#glossary)
11. [Disclaimer](#disclaimer)

## Overview
The Grid Trading Risk Calculator is a sophisticated tool designed for cryptocurrency perpetual futures trading. It enables traders to create, analyze, and optimize grid trading strategies using real-time market data. The calculator emphasizes risk management and position sizing while providing detailed insights into potential profit scenarios.

## Getting Started

### First Time Setup
1. Access the calculator at: https://yellowfish23.github.io/Grid-Trading-Risk-Calculator/
2. No installation or account required
3. Works instantly in your browser

### Quick Start Guide
1. Select a trading pair from the top pairs table
2. Enter your initial capital
3. Adjust the default parameters if needed
4. Review the generated grid levels
5. Monitor real-time updates

### Default Parameters
- Initial Trade Size: 10%
- Leverage: 3x
- Grid Levels: 5
- Grid Size: 5%
- Grid Multiplier: 0.9x
- Trade Size Multiplier: 1.15x
- Take Profit: 10%

## Core Features

### Real-Time Market Data Integration
- **Market Data Updates**
  - Manual update via Update button
  - Optional auto-update every 5 minutes (disabled by default)
  - Real-time market data from Binance API

- **Market Overview**
  - Top trading pairs by market cap
  - 24-hour price changes
  - Volume metrics
  - Historical volatility data

### Grid Configuration

#### Basic Grid Parameters
- **Grid Levels**
  - Determines the number of buy orders below entry
  - More levels = wider coverage, higher capital requirement
  - Default: 5 levels for balanced coverage

- **Grid Size**
  - Percentage gap between each level
  - Adapts to market volatility
  - Default: 5% for moderate volatility

#### Advanced Grid Controls
- **Grid Size Multiplier**
  - Controls grid spacing progression
  - < 1: Tighter grids at lower levels
  - > 1: Wider grids at lower levels
  - Default: 0.9 for risk management

- **Trade Size Multiplier**
  - Manages position size scaling
  - > 1: Larger positions at lower levels
  - < 1: Smaller positions at lower levels
  - Default: 1.15 for controlled risk increase

### Position Management
- **Leverage Control**
  - Adjustable from 1x to 125x
  - Affects margin requirements
  - Impacts potential profit/loss
  - Default: 3x for moderate risk

- **Take Profit Settings**
  - Percentage-based profit targets
  - Individual TP levels per grid
  - Automatic TP calculation
  - Default: 10% for realistic targets

## Advanced Features

### Market Analysis Tools
- **Volatility Metrics**
  - 24h price range
  - 5-day historical ranges
  - Average daily volatility

- **Risk Metrics**
  - Required margin per level
  - Total position exposure
  - Leverage impact analysis
  - Maximum drawdown estimates

### Calculation Engine
- **Real-time Updates**
  - Instant recalculation on parameter changes
  - Dynamic position sizing
  - Automatic decimal handling
  - Price precision matching

- **Risk Analysis**
  - Margin requirements
  - Position sizes
  - Profit scenarios
  - Risk exposure levels

## Trading Strategy Guide

### Grid Strategy Types

#### Conservative Grid
- Grid Size: 2-3%
- Grid Multiplier: 0.95
- Trade Multiplier: 1.1
- Leverage: 2x
- Best for: Low volatility markets

#### Moderate Grid
- Grid Size: 5%
- Grid Multiplier: 0.9
- Trade Multiplier: 1.15
- Leverage: 3x
- Best for: Medium volatility markets

#### Aggressive Grid
- Grid Size: 7-10%
- Grid Multiplier: 0.85
- Trade Multiplier: 1.2
- Leverage: 5x
- Best for: High volatility markets

### Strategy Optimization
1. **Market Analysis**
   - Check historical volatility
   - Review price ranges
   - Assess market trends

2. **Grid Adjustment**
   - Match grid size to volatility
   - Adjust multipliers for market conditions
   - Set appropriate leverage

3. **Position Sizing**
   - Calculate total capital requirement
   - Set sustainable position sizes
   - Plan for worst-case scenarios

## Use Cases

### Case Study 1: Low Volatility BTC Grid
- Market: BTCUSDT
- Volatility: 2% daily range
- Strategy:
  - Grid Size: 2%
  - Levels: 4
  - Grid Multiplier: 0.95
  - Initial Capital: $10,000
  - Results Analysis

### Case Study 2: Medium Volatility ETH Grid
- Market: ETHUSDT
- Volatility: 5% daily range
- Strategy:
  - Grid Size: 5%
  - Levels: 5
  - Grid Multiplier: 0.9
  - Initial Capital: $5,000
  - Results Analysis

### Case Study 3: High Volatility SOL Grid
- Market: SOLUSDT
- Volatility: 8% daily range
- Strategy:
  - Grid Size: 7%
  - Levels: 6
  - Grid Multiplier: 0.85
  - Initial Capital: $2,000
  - Results Analysis

## Risk Management

### Capital Allocation
- Never exceed 5% account risk per grid
- Maintain reserve capital
- Account for maximum drawdown

### Position Sizing Rules
1. Start small (1-2% of capital)
2. Scale gradually
3. Monitor total exposure
4. Adjust for volatility

### Leverage Guidelines
- Beginner: 1-2x
- Intermediate: 3-5x
- Advanced: 5-10x
- Expert: 10x+

## Technical Details

### API Integration
- Primary: Binance API v3
- Secondary: CoinGecko API
- Update Frequency: Manual update via Update button or optional auto-update every 5 minutes (disabled by default)
- Failover Protection

### Calculation Precision
- Price: Matches exchange decimals
- Position Sizes: 8 decimals
- Percentages: 2 decimals
- Margin: 8 decimals

### Browser Support
- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Mobile Browsers

## Troubleshooting

### Common Issues
1. **Price Not Updating**
   - Check internet connection
   - Refresh browser
   - Clear cache

2. **Calculation Errors**
   - Verify input values
   - Check leverage limits
   - Confirm grid parameters

3. **Display Issues**
   - Update browser
   - Check zoom level
   - Clear browser cache

## Glossary

### Basic Terms
- **Grid Trading**: A strategy placing multiple orders at different price levels
- **Entry Price**: The initial price point for the grid
- **Grid Level**: Individual price points where orders are placed
- **Take Profit**: Price target for closing positions in profit

### Advanced Terms
- **Grid Multiplier**: Factor controlling grid spacing progression
- **Trade Multiplier**: Factor controlling position size scaling
- **Liquidation Price**: Price at which position is forcefully closed
- **Margin Requirement**: Capital needed to maintain positions

### Market Terms
- **Perpetual Futures**: Cryptocurrency derivatives without expiry
- **Funding Rate**: Periodic payment between longs and shorts
- **Mark Price**: Price used for liquidation calculations
- **Index Price**: Reference price from spot markets

## Disclaimer
This calculator is for informational purposes only. Always verify calculations and conduct proper risk management before trading. Past performance does not guarantee future results. Cryptocurrency trading involves substantial risk and may not be suitable for all investors.
