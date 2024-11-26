class GridTradingCalculator {
    constructor() {
        // API endpoints
        this.binanceEndpoint = 'https://api1.binance.com/api/v3';
        this.coingeckoEndpoint = 'https://api.coingecko.com/api/v3/coins/markets';
        
        // Configuration
        this.pairCount = 0;  // Will be set from select element
        this.isUpdating = false;
        this.sortColumn = 'marketCap';
        this.sortDirection = 'desc';
        this.autoUpdateEnabled = false;
        this.updateInterval = null;
        
        // Cache configuration
        this.cache = {
            marketCaps: {},
            historicalData: {},
            lastUpdate: null,
            cacheExpiry: 5 * 60 * 1000  // 5 minutes
        };
        
        // Default trading pair
        this.defaultPair = 'SOLUSDT';  // Fixed from SOLUST to SOLUSDT
        this.selectedPairPrice = null;  // Store the selected pair's price format
        this.pairs = [];
        this.marketCaps = {};
        this.lastUpdate = null;

        // Initialize DOM elements
        this.tradingPairInput = null;
        this.pairCountSelect = null;
        this.pairsTableBody = null;
        this.statusDiv = null;
        this.updateButton = null;
        this.autoUpdateSwitch = null;
        this.entryPriceInput = null;
        this.marginInput = null;
        this.tradeSizePercentInput = null;
        this.leverageInput = null;
        this.priceMoveToTPInput = null;
        this.priceMoveToTPPercentInput = null;
        this.initialTradeValueInput = null;
        this.tpPercentInput = null;
        this.tpValueInput = null;
        this.gridLevelsInput = null;
        this.gridSizeInput = null;
        this.gridMultiplierInput = null;
        this.tradeSizeMultiplierInput = null;
        this.tpPriceInput = null;
        this.gridLevelsTableBody = null;  // Restore this
        this.tokenAmountInput = null;

        // Removed totalPnlAtTpInput
    }

    initializeElements() {
        // Initialize all DOM elements
        this.tradingPairInput = document.getElementById('tradingPair');
        this.pairCountSelect = document.getElementById('pairCount');
        this.pairsTableBody = document.getElementById('pairsTableBody');
        this.statusDiv = document.getElementById('status');
        this.updateButton = document.getElementById('updateButton');
        this.autoUpdateSwitch = document.getElementById('autoUpdate');
        
        // Set initial pair count from select element
        if (this.pairCountSelect) {
            this.pairCount = parseInt(this.pairCountSelect.value);
        }
        
        // Trading settings elements
        this.entryPriceInput = document.getElementById('entryPrice');
        this.marginInput = document.getElementById('margin');
        this.tradeSizePercentInput = document.getElementById('tradeSizePercent');
        this.leverageInput = document.getElementById('leverage');
        this.priceMoveToTPInput = document.getElementById('priceMoveToTP');
        this.priceMoveToTPPercentInput = document.getElementById('priceMoveToTPPercent');
        this.initialTradeValueInput = document.getElementById('initialTradeValue');
        this.tpPercentInput = document.getElementById('tpPercent');
        this.tpValueInput = document.getElementById('tpValue');
        this.gridLevelsInput = document.getElementById('gridLevels');
        this.gridSizeInput = document.getElementById('gridSize');
        this.gridMultiplierInput = document.getElementById('gridMultiplier');
        this.tradeSizeMultiplierInput = document.getElementById('tradeSizeMultiplier');
        this.tpPriceInput = document.getElementById('tpPrice');
        this.gridLevelsTableBody = document.getElementById('gridLevelsTableBody');  // Restore this
        this.tokenAmountInput = document.getElementById('tokenAmount');

        // Log any missing elements and prevent calculation if any are missing
        let missingElements = [];
        const requiredElements = {
            'tradingPair': this.tradingPairInput,
            'pairCount': this.pairCountSelect,
            'pairsTableBody': this.pairsTableBody,
            'status': this.statusDiv,
            'updateButton': this.updateButton,
            'autoUpdate': this.autoUpdateSwitch,
            'entryPrice': this.entryPriceInput,
            'margin': this.marginInput,
            'tradeSizePercent': this.tradeSizePercentInput,
            'leverage': this.leverageInput,
            'priceMoveToTP': this.priceMoveToTPInput,
            'priceMoveToTPPercent': this.priceMoveToTPPercentInput,
            'initialTradeValue': this.initialTradeValueInput,
            'tpPercent': this.tpPercentInput,
            'tpValue': this.tpValueInput,
            'gridLevels': this.gridLevelsInput,
            'gridSize': this.gridSizeInput,
            'gridMultiplier': this.gridMultiplierInput,
            'tradeSizeMultiplier': this.tradeSizeMultiplierInput,
            'tpPrice': this.tpPriceInput,
            'gridLevelsTableBody': this.gridLevelsTableBody,  // Restore this
            'tokenAmount': this.tokenAmountInput
        };

        // Check each required element
        for (const [id, element] of Object.entries(requiredElements)) {
            if (!element) {
                missingElements.push(id);
                console.warn(`Missing element: ${id}`);
            }
        }

        // Only proceed with initialization if all elements exist
        if (missingElements.length === 0) {
            this.setDefaultValues();
            this.setupEventListeners();
            this.fetchTopPairs();
        } else {
            console.error('Missing UI elements:', missingElements);
            if (this.statusDiv) {
                this.statusDiv.innerHTML = `<div class="alert alert-danger">Error: Missing UI elements: ${missingElements.join(', ')}</div>`;
            }
        }
    }

    init() {
        console.log('Initializing calculator...');
        this.initializeElements();
    }

    setupEventListeners() {
        // Update button and auto-update switch
        if (this.updateButton) {
            this.updateButton.addEventListener('click', () => {
                this.fetchTopPairs();
            });
        }

        // Add pair count change listener
        if (this.pairCountSelect) {
            this.pairCountSelect.addEventListener('change', (e) => {
                this.pairCount = parseInt(e.target.value);
                this.fetchTopPairs();
            });
        }

        // Add sorting event listeners
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => this.handleSort(e));
        });

        if (this.autoUpdateSwitch) {
            this.autoUpdateSwitch.checked = false; // Default to off
            this.autoUpdateSwitch.addEventListener('change', (e) => {
                this.autoUpdateEnabled = e.target.checked;
                if (this.autoUpdateEnabled) {
                    // Start auto-update interval (every 5 minutes)
                    this.updateInterval = setInterval(() => {
                        this.fetchTopPairs();
                    }, 5 * 60 * 1000);
                } else {
                    // Clear the update interval
                    if (this.updateInterval) {
                        clearInterval(this.updateInterval);
                        this.updateInterval = null;
                    }
                }
            });
        }

        // Add click handler to pairs table
        if (this.pairsTableBody) {
            this.pairsTableBody.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (row) {
                    const pair = this.pairs.find(p => p.symbol === row.cells[0].textContent);
                    if (pair) {
                        this.selectTradingPair(pair.symbol, pair.lastPrice);
                    }
                }
            });
        }

        // Add input event listeners for grid calculations
        const inputElements = [
            this.marginInput,
            this.tradeSizePercentInput,
            this.leverageInput,
            this.gridLevelsInput,
            this.gridSizeInput,
            this.gridMultiplierInput,
            this.tradeSizeMultiplierInput,
            this.tpPercentInput,
            this.initialTradeValueInput,
            this.tpValueInput
        ];

        inputElements.forEach(element => {
            if (element) {
                element.addEventListener('input', () => {
                    this.calculateGrid();
                });
            }
        });
    }

    setDefaultValues() {
        const defaultValues = {
            pairCount: '3',
            margin: '1000',
            tradeSizePercent: '10',
            leverage: '3',
            gridLevels: '5',
            gridSize: '5',
            gridMultiplier: '0.9',
            tradeSizeMultiplier: '1.15',
            tpPercent: '10'
        };

        // Set default values only if the field is empty
        if (this.pairCountSelect && !this.pairCountSelect.value) {
            this.pairCountSelect.value = defaultValues.pairCount;
        }
        if (this.marginInput && !this.marginInput.value) {
            this.marginInput.value = defaultValues.margin;
        }
        if (this.tradeSizePercentInput && !this.tradeSizePercentInput.value) {
            this.tradeSizePercentInput.value = defaultValues.tradeSizePercent;
        }
        if (this.leverageInput && !this.leverageInput.value) {
            this.leverageInput.value = defaultValues.leverage;
        }
        if (this.gridLevelsInput && !this.gridLevelsInput.value) {
            this.gridLevelsInput.value = defaultValues.gridLevels;
        }
        if (this.gridSizeInput && !this.gridSizeInput.value) {
            this.gridSizeInput.value = defaultValues.gridSize;
        }
        if (this.gridMultiplierInput && !this.gridMultiplierInput.value) {
            this.gridMultiplierInput.value = defaultValues.gridMultiplier;
        }
        if (this.tradeSizeMultiplierInput && !this.tradeSizeMultiplierInput.value) {
            this.tradeSizeMultiplierInput.value = defaultValues.tradeSizeMultiplier;
        }
        if (this.tpPercentInput && !this.tpPercentInput.value) {
            this.tpPercentInput.value = defaultValues.tpPercent;
        }

        // Initial grid calculation
        if (this.entryPriceInput && this.entryPriceInput.value) {
            this.calculateGrid();
        }
    }

    async fetchTopPairs() {
        if (this.isUpdating) {
            console.log('Already updating...');
            return;
        }

        this.isUpdating = true;
        console.log('Fetching market data...');
        this.showLoading('Fetching market data...');

        try {
            // First fetch market caps from CoinGecko
            console.log('Fetching market caps from CoinGecko...');
            const coingeckoResponse = await fetch(
                `${this.coingeckoEndpoint}?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
                {
                    headers: { 'accept': 'application/json' }
                }
            );
            
            if (!coingeckoResponse.ok) {
                throw new Error(`CoinGecko HTTP error! status: ${coingeckoResponse.status}`);
            }
            
            const marketCapData = await coingeckoResponse.json();
            this.cache.marketCaps = {};
            marketCapData.forEach(coin => {
                this.cache.marketCaps[coin.symbol.toUpperCase()] = coin.market_cap;
            });
            
            console.log('Fetched market caps for', Object.keys(this.cache.marketCaps).length, 'coins');

            // Then fetch Binance 24hr data
            console.log('Fetching Binance 24hr data...');
            const binanceResponse = await fetch(`${this.binanceEndpoint}/ticker/24hr`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!binanceResponse.ok) {
                throw new Error(`Binance HTTP error! status: ${binanceResponse.status}`);
            }
            
            const data = await binanceResponse.json();
            console.log('Received data from Binance:', data.length, 'pairs');
            
            // Process and filter pairs
            const processedPairs = data
                .filter(pair => pair.symbol.endsWith('USDT'))
                .map(pair => {
                    const baseSymbol = pair.symbol.replace('USDT', '');
                    return {
                        symbol: pair.symbol,
                        lastPrice: parseFloat(pair.lastPrice),
                        priceChange: parseFloat(pair.priceChangePercent),
                        volume: parseFloat(pair.volume),
                        high24h: parseFloat(pair.highPrice),
                        low24h: parseFloat(pair.lowPrice),
                        marketCap: this.cache.marketCaps[baseSymbol] || 0,
                        dailyRange: this.calculateDailyRange(pair.highPrice, pair.lowPrice)
                    };
                })
                .filter(pair => pair.marketCap > 0)  // Only include pairs with known market cap
                .sort((a, b) => b.marketCap - a.marketCap)  // Sort by market cap
                .slice(0, this.pairCount);

            // Fetch historical data for each pair
            console.log('Fetching historical ranges...');
            for (let pair of processedPairs) {
                this.showLoading(`Fetching historical data for ${pair.symbol}...`);
                const ranges = await this.fetchHistoricalData(pair.symbol);
                pair.ranges = ranges;
                pair.avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
            }

            this.pairs = processedPairs;
            console.log('Processed pairs:', this.pairs.length);

            // Update the trading pair select options
            if (this.tradingPairInput) {
                const currentValue = this.tradingPairInput.value;
                this.tradingPairInput.innerHTML = this.pairs
                    .map(pair => `<option value="${pair.symbol}">${pair.symbol}</option>`)
                    .join('');
                
                // Restore selected value or set default
                if (currentValue && this.pairs.some(p => p.symbol === currentValue)) {
                    this.tradingPairInput.value = currentValue;
                } else {
                    this.tradingPairInput.value = this.defaultPair;
                }
            }

            // Update the pairs table
            this.updatePairsTable();
            
            this.cache.lastUpdate = new Date();
            this.showSuccess('Market data updated successfully');

            // Automatically select SOLUSDT
            const solData = this.pairs.find(pair => pair.symbol === 'SOLUSDT');
            if (solData) {
                this.selectTradingPair(solData.symbol, solData.lastPrice);
            }
            
        } catch (error) {
            console.error('Error fetching pairs:', error);
            this.showError('Failed to fetch market data: ' + error.message);
        } finally {
            this.isUpdating = false;
        }
    }

    updatePairsTable() {
        if (!this.pairsTableBody || !this.pairs) {
            console.warn('Missing pairsTableBody or pairs data');
            return;
        }
        
        const formatMarketCap = (marketCap) => {
            if (marketCap >= 1e9) {
                return `${(marketCap / 1e9).toFixed(2)}`;
            } else if (marketCap >= 1e6) {
                return `${(marketCap / 1e6).toFixed(3)}`;
            } else {
                return `${marketCap.toFixed(4)}`;
            }
        };

        const tableContent = this.pairs.map(pair => {
            // Get the ranges array, ensuring we have exactly 5 values
            const ranges = pair.ranges || [0, 0, 0, 0, 0];
            const rangeData = ranges.slice(0, 5); // Take only first 5 values
            while (rangeData.length < 5) {
                rangeData.push(0); // Fill with zeros if we have less than 5 values
            }

            return `
                <tr class="${pair.priceChange >= 0 ? 'table-success' : 'table-danger'}" onclick="calculator.selectTradingPair('${pair.symbol}', ${pair.lastPrice})" style="cursor: pointer;">
                    <td>${pair.symbol}</td>
                    <td>${this.formatPrice(pair.lastPrice)}</td>
                    <td>${pair.priceChange.toFixed(2)}%</td>
                    ${rangeData.map(range => `<td>${range.toFixed(2)}%</td>`).join('')}
                    <td>${pair.avgRange ? pair.avgRange.toFixed(2) : '0.00'}%</td>
                    <td>${formatMarketCap(pair.marketCap)}</td>
                </tr>
            `;
        }).join('');

        this.pairsTableBody.innerHTML = tableContent;
        console.log('Updated pairs table');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(price);
    }

    getPairDecimals(symbol) {
        // Common price decimal places for different types of pairs
        if (symbol.endsWith('USDT') || symbol.endsWith('BUSD') || symbol.endsWith('USDC')) {
            if (symbol.startsWith('BTC')) return 8;
            if (symbol.startsWith('ETH')) return 6;
            if (symbol.startsWith('BNB')) return 4;
            // For most altcoins
            return 4;
        }
        // For BTC pairs
        if (symbol.endsWith('BTC')) return 8;
        // For ETH pairs
        if (symbol.endsWith('ETH')) return 6;
        // Default
        return 4;
    }

    formatPairPrice(price) {
        return price.toFixed(this.getPairDecimals(this.tradingPairInput.value));
    }

    calculateDailyRange(high, low) {
        return (((high - low) / low) * 100);
    }

    selectTradingPair(symbol, price) {
        console.log('Selecting trading pair:', symbol, 'at price:', price);
        
        // Store the selected pair's price for reference
        const selectedPair = this.pairs.find(p => p.symbol === symbol);
        this.selectedPairPrice = selectedPair ? selectedPair.lastPrice : price;
        
        // Update trading pair input
        if (this.tradingPairInput) {
            this.tradingPairInput.value = symbol;
        }

        // Update entry price with same format as selected pair
        if (this.entryPriceInput) {
            this.entryPriceInput.value = this.formatPairPrice(price);
        }

        // Set default values if not already set
        if (this.marginInput && !this.marginInput.value) {
            this.marginInput.value = '1000';
        }

        if (this.tradeSizePercentInput && !this.tradeSizePercentInput.value) {
            this.tradeSizePercentInput.value = '10';
        }

        if (this.leverageInput && !this.leverageInput.value) {
            this.leverageInput.value = '3';
        }

        if (this.gridLevelsInput && !this.gridLevelsInput.value) {
            this.gridLevelsInput.value = '5';
        }

        if (this.gridSizeInput && !this.gridSizeInput.value) {
            this.gridSizeInput.value = '5';
        }

        if (this.gridMultiplierInput && !this.gridMultiplierInput.value) {
            this.gridMultiplierInput.value = '0.9';
        }

        if (this.tradeSizeMultiplierInput && !this.tradeSizeMultiplierInput.value) {
            this.tradeSizeMultiplierInput.value = '1.15';
        }

        if (this.tpPercentInput && !this.tpPercentInput.value) {
            this.tpPercentInput.value = '10';
        }

        // Calculate everything based on new values
        this.calculateGrid();
    }

    calculateGrid() {
        try {
            // Get and log input values
            const entryPrice = parseFloat(this.entryPriceInput.value) || 0;
            const margin = parseFloat(this.marginInput.value) || 0;
            const tradeSizePercent = parseFloat(this.tradeSizePercentInput.value) || 0;
            const leverage = parseFloat(this.leverageInput.value) || 0;
            const gridLevels = parseInt(this.gridLevelsInput.value) || 0;
            const gridSize = parseFloat(this.gridSizeInput.value) || 0;
            const gridMultiplier = parseFloat(this.gridMultiplierInput.value) || 0;
            const tradeSizeMultiplier = parseFloat(this.tradeSizeMultiplierInput.value) || 0;
            const tpPercent = parseFloat(this.tpPercentInput.value) || 0;
            const manualInitialTradeValue = parseFloat(this.initialTradeValueInput.value) || 0;
            const manualTpValue = parseFloat(this.tpValueInput.value) || 0;

            // Get the decimals from entry price for consistent formatting
            const entryPriceStr = this.entryPriceInput.value;
            const decimalPlaces = entryPriceStr.includes('.') ? entryPriceStr.split('.')[1].length : 2;
            
            // Custom price formatter to match entry price decimals
            const formatMatchingDecimals = (value) => {
                return value.toFixed(decimalPlaces);
            };

            console.log('Input values:', {
                entryPrice,
                margin,
                tradeSizePercent,
                leverage,
                gridLevels,
                gridSize,
                gridMultiplier,
                tradeSizeMultiplier,
                tpPercent,
                manualInitialTradeValue,
                manualTpValue,
                decimalPlaces
            });

            // Validate inputs
            if (!entryPrice || !leverage || !gridLevels || !gridSize || !gridMultiplier || !tradeSizeMultiplier) {
                console.warn('Invalid input values');
                return;
            }

            // Calculate initial values based on whether initialTradeValue was manually set
            let initialTradeValue;
            if (document.activeElement === this.initialTradeValueInput) {
                initialTradeValue = manualInitialTradeValue;
            } else {
                initialTradeValue = (margin * tradeSizePercent) / 100;
                this.initialTradeValueInput.value = formatMatchingDecimals(initialTradeValue);
            }
            
            console.log('Initial calculations:', {
                initialTradeValue
            });
            
            // Calculate take profit values
            const tpPrice = entryPrice * (1 + ((tpPercent / 100) / leverage));
            if (this.tpPriceInput) {
                this.tpPriceInput.value = formatMatchingDecimals(tpPrice);
            }

            // Calculate price move to TP in dollars (with leverage properly accounted for)
            const priceMoveToTP = tpPrice - entryPrice;
            if (this.priceMoveToTPInput) {
                this.priceMoveToTPInput.value = formatMatchingDecimals(priceMoveToTP);
            }

            // Calculate price move to TP as percentage (with leverage properly accounted for)
            const priceMoveToTPPercent = ((tpPrice - entryPrice) / entryPrice) * 100;
            if (this.priceMoveToTPPercentInput) {
                this.priceMoveToTPPercentInput.value = priceMoveToTPPercent.toFixed(2);
            }

            // Calculate TP value based on whether it was manually set
            let tpValue;
            if (document.activeElement === this.tpValueInput) {
                tpValue = manualTpValue;
            } else {
                // TP Value is the profit (percentage of initial trade value with leverage)
                tpValue = initialTradeValue * (tpPercent / 100) * leverage;
                this.tpValueInput.value = formatMatchingDecimals(tpValue);
            }

            // Calculate grid levels
            const gridLevelsData = [];
            let totalTradeSize = initialTradeValue; // Include initial position
            let totalWeightedPrice = entryPrice * initialTradeValue;
            let totalPositionSize = initialTradeValue * leverage;
            
            // Add level 0 (initial trade)
            gridLevelsData.push({
                level: 0,
                price: formatMatchingDecimals(entryPrice),
                gridSize: 0, // No grid size for initial trade
                tradeSize: formatMatchingDecimals(initialTradeValue),
                positionSize: formatMatchingDecimals(initialTradeValue * leverage),
                requiredMargin: formatMatchingDecimals(initialTradeValue),
                percentFromEntry: "0.00",
                pnlAtTp: formatMatchingDecimals((tpPrice - entryPrice) * (initialTradeValue * leverage) / entryPrice)
            });
            
            let currentGridSize = gridSize;
            
            for (let i = 0; i < gridLevels; i++) {
                // Calculate grid size for this level (from entry price)
                if (i > 0) {
                    currentGridSize = gridSize * Math.pow(gridMultiplier, i);
                }
                
                // Calculate price based on entry price (not previous level)
                const priceLevel = entryPrice * (1 - ((currentGridSize * (i + 1)) / 100));
                
                // Calculate trade size with linear scaling
                // Add 1 to i so first grid level (-1) starts with the multiplier
                const tradeSize = initialTradeValue * (1 + ((i + 1) * (tradeSizeMultiplier - 1)));
                
                const positionSize = tradeSize * leverage;
                const requiredMargin = tradeSize;
                const percentFromEntry = ((priceLevel - entryPrice) / entryPrice) * 100;
                
                // Calculate PnL at TP considering actual price movement from this level
                const pnlAtTp = (tpPrice - priceLevel) * (positionSize / priceLevel);
                
                console.log(`Grid Level ${i + 1}:`, {
                    currentGridSize,
                    priceLevel,
                    tradeSize,
                    positionSize,
                    requiredMargin,
                    percentFromEntry,
                    pnlAtTp
                });
                
                gridLevelsData.push({
                    level: -(i + 1),
                    price: formatMatchingDecimals(priceLevel),
                    gridSize: currentGridSize,
                    tradeSize: formatMatchingDecimals(tradeSize),
                    positionSize: formatMatchingDecimals(positionSize),
                    requiredMargin: formatMatchingDecimals(requiredMargin),
                    percentFromEntry: percentFromEntry.toFixed(2),
                    pnlAtTp: formatMatchingDecimals(pnlAtTp)
                });
                
                totalTradeSize += tradeSize;
                totalWeightedPrice += priceLevel * tradeSize;
                totalPositionSize += positionSize;
            }

            // Calculate required margin and average entry
            const requiredMargin = totalTradeSize;
            const averageEntryPrice = totalWeightedPrice / totalTradeSize;

            // Calculate effective leverage
            const effectiveLeverage = totalPositionSize / totalTradeSize;

            console.log('Final calculations:', {
                requiredMargin,
                averageEntryPrice,
                totalTradeSize,
                totalWeightedPrice
            });

            // Calculate number of tokens for initial trade (without leverage)
            const tokenAmount = initialTradeValue / entryPrice;
            if (this.tokenAmountInput) {
                this.tokenAmountInput.value = formatMatchingDecimals(tokenAmount);
            }

            // Update grid levels table
            this.updateGridLevelsTable(gridLevelsData);

            // Calculate risk metrics
            const liquidationPrice = entryPrice * (1 - (1 / leverage));
            const maxDrawdown = ((entryPrice - liquidationPrice) / entryPrice) * 100;
            const maxProfit = ((tpPrice - averageEntryPrice) / averageEntryPrice) * 100 * leverage;
            const riskRewardRatio = Math.abs(maxProfit / maxDrawdown);
            const marginUtilization = (totalTradeSize / margin) * 100;
            const liquidationDistance = ((entryPrice - liquidationPrice) / entryPrice) * 100;

            // Update risk metrics UI with proper formatting
            const totalInvestmentElement = document.getElementById('totalInvestment');
            const marginRequiredElement = document.getElementById('marginRequired');
            const averageEntryElement = document.getElementById('averageEntry');
            const liquidationPriceElement = document.getElementById('liquidationPrice');
            const maxDrawdownElement = document.getElementById('maxDrawdown');
            const maxProfitElement = document.getElementById('maxProfit');
            const riskRewardRatioElement = document.getElementById('riskRewardRatio');
            const marginUtilizationElement = document.getElementById('marginUtilization');
            const liquidationDistanceElement = document.getElementById('liquidationDistance');

            if (totalInvestmentElement) totalInvestmentElement.textContent = this.formatUSDT(totalTradeSize);
            if (marginRequiredElement) marginRequiredElement.textContent = this.formatUSDT(totalTradeSize);
            if (averageEntryElement) averageEntryElement.textContent = formatMatchingDecimals(averageEntryPrice);
            if (liquidationPriceElement) liquidationPriceElement.textContent = formatMatchingDecimals(liquidationPrice);
            if (maxDrawdownElement) maxDrawdownElement.textContent = maxDrawdown.toFixed(2) + '%';
            if (maxProfitElement) maxProfitElement.textContent = maxProfit.toFixed(2) + '%';
            if (riskRewardRatioElement) riskRewardRatioElement.textContent = riskRewardRatio.toFixed(2);
            if (marginUtilizationElement) marginUtilizationElement.textContent = marginUtilization.toFixed(2) + '%';
            if (liquidationDistanceElement) liquidationDistanceElement.textContent = liquidationDistance.toFixed(2) + '%';

            // Apply warning classes with proper null checks
            if (marginUtilizationElement) {
                marginUtilizationElement.className = 'fw-bold ' + 
                    (marginUtilization > 80 ? 'text-danger' : 
                     marginUtilization > 50 ? 'text-warning' : 'text-success');
            }

            if (riskRewardRatioElement) {
                riskRewardRatioElement.className = 'fw-bold ' + 
                    (riskRewardRatio < 1.0 ? 'text-danger' : 
                     riskRewardRatio < 1.5 ? 'text-warning' : 'text-success');
            }

            if (liquidationDistanceElement) {
                liquidationDistanceElement.className = 'fw-bold ' + 
                    (liquidationDistance < 10 ? 'text-danger' : 
                     liquidationDistance < 20 ? 'text-warning' : 'text-success');
            }
        } catch (error) {
            console.error('Error calculating grid:', error);
        }
    }

    updateGridLevelsTable(gridLevelsData) {
        const tableContent = gridLevelsData.map(level => {
            const levelClass = level.level === 0 ? 'table-primary' : '';
            const gridSizeDisplay = level.level === 0 ? '-' : `${level.gridSize.toFixed(2)}%`;
            
            return `
                <tr class="${levelClass}">
                    <td>${level.level}</td>
                    <td>${level.price}</td>
                    <td>${gridSizeDisplay}</td>
                    <td>${level.tradeSize}</td>
                    <td>${level.positionSize}</td>
                    <td>${level.requiredMargin}</td>
                    <td>${level.percentFromEntry}%</td>
                    <td>${level.pnlAtTp}</td>
                </tr>
            `;
        }).join('');

        if (this.gridLevelsTableBody) {
            this.gridLevelsTableBody.innerHTML = tableContent;
        }
    }

    formatUSDT(value) {
        return value.toFixed(2);
    }

    handleSort(event) {
        const column = event.target.cellIndex;
        let sortKey;
        
        // Map column index to data key
        switch(column) {
            case 0: sortKey = 'symbol'; break;
            case 1: sortKey = 'lastPrice'; break;
            case 2: sortKey = 'priceChange'; break;
            case 3: sortKey = 'ranges[0]'; break;  // D1R%
            case 4: sortKey = 'ranges[1]'; break;  // D2R%
            case 5: sortKey = 'ranges[2]'; break;  // D3R%
            case 6: sortKey = 'ranges[3]'; break;  // D4R%
            case 7: sortKey = 'ranges[4]'; break;  // D5R%
            case 8: sortKey = 'avgRange'; break;   // AvgR%
            case 9: sortKey = 'marketCap'; break;  // MC(B)
            default: return;
        }

        // Toggle sort direction if clicking the same column
        if (this.sortColumn === sortKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = sortKey;
            this.sortDirection = 'desc';
        }

        // Update sort indicators
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
        });
        event.target.classList.add(this.sortDirection);

        // Sort the pairs array
        this.pairs.sort((a, b) => {
            let aValue = sortKey.includes('ranges') ? 
                (a.ranges ? a.ranges[parseInt(sortKey.slice(7))] : 0) : 
                a[sortKey];
            let bValue = sortKey.includes('ranges') ? 
                (b.ranges ? b.ranges[parseInt(sortKey.slice(7))] : 0) : 
                b[sortKey];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Update the table
        this.updatePairsTable();
    }

    showError(message) {
        console.error(message);
        if (this.statusDiv) {
            this.statusDiv.style.display = 'block';
            this.statusDiv.className = 'alert alert-danger mb-3';
            this.statusDiv.textContent = message;
        }
    }

    showSuccess(message) {
        console.log(message);
        if (this.statusDiv) {
            this.statusDiv.style.display = 'block';
            this.statusDiv.className = 'alert alert-success mb-3';
            this.statusDiv.textContent = message;
            setTimeout(() => {
                this.statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    showLoading(message = 'Loading...') {
        console.log(message);
        if (this.statusDiv) {
            this.statusDiv.style.display = 'block';
            this.statusDiv.className = 'alert alert-info mb-3';
            this.statusDiv.innerHTML = `<div class="spinner-border spinner-border-sm me-2" role="status"></div>${message}`;
        }
    }

    async fetchHistoricalData(symbol) {
        try {
            if (this.cache.historicalData[symbol] && this.cache.lastUpdate && (new Date() - this.cache.lastUpdate) < this.cache.cacheExpiry) {
                console.log(`Using cached historical data for ${symbol}`);
                return this.cache.historicalData[symbol];
            }

            const now = Date.now();
            const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000);
            
            // Fetch 5 days of data in a single call
            const response = await fetch(
                `${this.binanceEndpoint}/klines?symbol=${symbol}&interval=1d&startTime=${fiveDaysAgo}&endTime=${now}&limit=5`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const ranges = [];
            
            // Process each day's data
            for (let i = 0; i < 5; i++) {
                if (data && data[i]) {
                    const high = parseFloat(data[i][2]);
                    const low = parseFloat(data[i][3]);
                    const range = this.calculateDailyRange(high, low);
                    ranges.push(range);
                } else {
                    ranges.push(0);
                }
            }
            
            this.cache.historicalData[symbol] = ranges;
            this.cache.lastUpdate = new Date();
            
            return ranges;
            
        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error);
            return [0, 0, 0, 0, 0];
        }
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing calculator...');
    window.calculator = new GridTradingCalculator();
    window.calculator.init();
});
