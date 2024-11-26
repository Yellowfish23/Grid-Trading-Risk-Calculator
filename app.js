class GridTradingCalculator {
    constructor() {
        // API endpoints
        this.binanceEndpoint = 'https://api1.binance.com/api/v3';
        this.coingeckoEndpoint = 'https://api.coingecko.com/api/v3/coins/markets';
        
        // Configuration
        this.pairCount = 3;  // Changed default to 3
        this.isUpdating = false;
        this.sortColumn = 'marketCap';
        this.sortDirection = 'desc';
        this.autoUpdateEnabled = false;
        this.updateInterval = null;
        
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
        this.marginRequiredInput = null;
        this.initialTradeValueInput = null;
        this.tpPercentInput = null;
        this.tpValueInput = null;
        this.gridLevelsInput = null;
        this.gridSizeInput = null;
        this.gridMultiplierInput = null;
        this.tradeSizeMultiplierInput = null;
        this.tpPriceInput = null;
        this.averageEntryInput = null;
        this.gridLevelsTableBody = null;
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
        
        // Trading settings elements
        this.entryPriceInput = document.getElementById('entryPrice');
        this.marginInput = document.getElementById('margin');
        this.tradeSizePercentInput = document.getElementById('tradeSizePercent');
        this.leverageInput = document.getElementById('leverage');
        this.priceMoveToTPInput = document.getElementById('priceMoveToTP');
        this.priceMoveToTPPercentInput = document.getElementById('priceMoveToTPPercent');
        this.marginRequiredInput = document.getElementById('marginRequired');
        this.initialTradeValueInput = document.getElementById('initialTradeValue');
        this.tpPercentInput = document.getElementById('tpPercent');
        this.tpValueInput = document.getElementById('tpValue');
        this.gridLevelsInput = document.getElementById('gridLevels');
        this.gridSizeInput = document.getElementById('gridSize');
        this.gridMultiplierInput = document.getElementById('gridMultiplier');
        this.tradeSizeMultiplierInput = document.getElementById('tradeSizeMultiplier');
        this.tpPriceInput = document.getElementById('tpPrice');
        this.averageEntryInput = document.getElementById('averageEntry');
        this.gridLevelsTableBody = document.getElementById('gridLevelsTableBody');
        this.tokenAmountInput = document.getElementById('tokenAmount');

        // Removed totalPnlAtTpInput

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
            'marginRequired': this.marginRequiredInput,
            'initialTradeValue': this.initialTradeValueInput,
            'tpPercent': this.tpPercentInput,
            'tpValue': this.tpValueInput,
            'gridLevels': this.gridLevelsInput,
            'gridSize': this.gridSizeInput,
            'gridMultiplier': this.gridMultiplierInput,
            'tradeSizeMultiplier': this.tradeSizeMultiplierInput,
            'tpPrice': this.tpPriceInput,
            'averageEntry': this.averageEntryInput,
            'gridLevelsTableBody': this.gridLevelsTableBody,
            'tokenAmount': this.tokenAmountInput
        };

        // Removed totalPnlAtTpInput

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
            this.marketCaps = {};
            marketCapData.forEach(coin => {
                this.marketCaps[coin.symbol.toUpperCase()] = coin.market_cap;
            });
            
            console.log('Fetched market caps for', Object.keys(this.marketCaps).length, 'coins');

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
                        marketCap: this.marketCaps[baseSymbol] || 0,
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
            
            this.lastUpdate = new Date();
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
            let currentPrice = entryPrice;
            let currentGridSize = gridSize; // Track the current grid size

            // Add level 0 (initial trade)
            gridLevelsData.push({
                level: 0,
                price: formatMatchingDecimals(entryPrice),
                gridSize: 0, // No grid size for initial trade
                tradeSize: formatMatchingDecimals(initialTradeValue),
                positionSize: formatMatchingDecimals(initialTradeValue * leverage),
                requiredMargin: formatMatchingDecimals(initialTradeValue),
                percentFromEntry: "0.00",
                pnlAtTp: formatMatchingDecimals((initialTradeValue * leverage * tpPercent) / 100)
            });
            
            for (let i = 0; i < gridLevels; i++) {
                // Calculate grid size for this level
                if (i > 0) {
                    currentGridSize = currentGridSize * gridMultiplier;
                }
                
                // Calculate price based on previous level's price
                const priceLevel = currentPrice * (1 - (currentGridSize / 100));
                const tradeSize = initialTradeValue * Math.pow(tradeSizeMultiplier, i);
                const positionSize = tradeSize * leverage;
                const requiredMargin = tradeSize;
                const percentFromEntry = ((priceLevel - entryPrice) / entryPrice) * 100;
                const pnlAtTp = (tradeSize * leverage * tpPercent) / 100;
                
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
                    level: -(i + 1),  // Make levels negative
                    price: formatMatchingDecimals(priceLevel),
                    gridSize: currentGridSize,
                    tradeSize: formatMatchingDecimals(tradeSize),
                    positionSize: formatMatchingDecimals(positionSize),
                    requiredMargin: formatMatchingDecimals(requiredMargin),
                    percentFromEntry: percentFromEntry.toFixed(2),
                    pnlAtTp: formatMatchingDecimals(pnlAtTp)
                });
                
                // Update current price for next iteration
                currentPrice = priceLevel;
                totalTradeSize += tradeSize;
                totalWeightedPrice += priceLevel * tradeSize;
            }

            // Calculate required margin and average entry
            const requiredMargin = totalTradeSize;
            const averageEntryPrice = totalWeightedPrice / totalTradeSize;

            console.log('Final calculations:', {
                requiredMargin,
                averageEntryPrice,
                totalTradeSize,
                totalWeightedPrice
            });

            // Update the UI with calculated values
            if (this.marginRequiredInput) {
                this.marginRequiredInput.value = formatMatchingDecimals(requiredMargin);
            }
            if (this.averageEntryInput) {
                this.averageEntryInput.value = formatMatchingDecimals(averageEntryPrice);
            }

            // Calculate number of tokens for initial trade (without leverage)
            const tokenAmount = initialTradeValue / entryPrice;
            if (this.tokenAmountInput) {
                this.tokenAmountInput.value = formatMatchingDecimals(tokenAmount);
            }

            // Update grid levels table
            this.updateGridLevelsTable(gridLevelsData);

            // Calculate risk metrics
            const liquidationPrice = entryPrice * (1 - (1 / leverage));
            const maxDrawdown = ((currentPrice - entryPrice) / entryPrice) * 100;
            const maxProfit = ((tpPrice - averageEntryPrice) / averageEntryPrice) * 100;
            const riskRewardRatio = Math.abs(maxProfit / maxDrawdown);
            const marginUtilization = (requiredMargin / margin) * 100;
            const liquidationDistance = ((entryPrice - liquidationPrice) / entryPrice) * 100;

            // Update risk metrics UI
            document.getElementById('totalInvestment').textContent = formatMatchingDecimals(totalTradeSize);
            document.getElementById('marginRequired').textContent = formatMatchingDecimals(requiredMargin);
            document.getElementById('averageEntry').textContent = formatMatchingDecimals(averageEntryPrice);
            document.getElementById('liquidationPrice').textContent = formatMatchingDecimals(liquidationPrice);
            document.getElementById('maxDrawdown').textContent = maxDrawdown.toFixed(2) + '%';
            document.getElementById('maxProfit').textContent = maxProfit.toFixed(2) + '%';
            document.getElementById('riskRewardRatio').textContent = riskRewardRatio.toFixed(2);
            document.getElementById('marginUtilization').textContent = marginUtilization.toFixed(2) + '%';
            document.getElementById('liquidationDistance').textContent = liquidationDistance.toFixed(2) + '%';

            // Apply warning classes
            const marginUtilSpan = document.getElementById('marginUtilization');
            marginUtilSpan.className = 'fw-bold ' + 
                (marginUtilization > 80 ? 'text-danger' : 
                 marginUtilization > 50 ? 'text-warning' : 'text-success');

            const riskRewardSpan = document.getElementById('riskRewardRatio');
            riskRewardSpan.className = 'fw-bold ' + 
                (riskRewardRatio < 1.0 ? 'text-danger' : 
                 riskRewardRatio < 1.5 ? 'text-warning' : 'text-success');

            const liquidationDistSpan = document.getElementById('liquidationDistance');
            liquidationDistSpan.className = 'fw-bold ' + 
                (liquidationDistance < 10 ? 'text-danger' : 
                 liquidationDistance < 20 ? 'text-warning' : 'text-success');

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
        const ranges = [];
        const now = Date.now();
        
        for (let i = 1; i <= 5; i++) {
            const startTime = now - (i * 24 * 60 * 60 * 1000);
            const endTime = now - ((i-1) * 24 * 60 * 60 * 1000);
            
            try {
                const response = await fetch(
                    `${this.binanceEndpoint}/klines?symbol=${symbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (data && data.length > 0) {
                    const high = parseFloat(data[0][2]);
                    const low = parseFloat(data[0][3]);
                    const range = this.calculateDailyRange(high, low);
                    ranges.push(range);
                } else {
                    ranges.push(0);
                }
                
                // Add a small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error fetching historical data for ${symbol}, day ${i}:`, error);
                ranges.push(0);
            }
        }
        
        return ranges;
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing calculator...');
    window.calculator = new GridTradingCalculator();
    window.calculator.init();
});
