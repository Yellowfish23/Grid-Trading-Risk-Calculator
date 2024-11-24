class GridTradingCalculator {
    constructor() {
        // API endpoints
        this.binanceEndpoint = 'https://api1.binance.com/api/v3';
        this.coingeckoEndpoint = 'https://api.coingecko.com/api/v3/coins/markets';
        
        // Configuration
        this.pairCount = 10;
        this.isUpdating = false;
        this.sortColumn = 'marketCap';
        this.sortDirection = 'desc';
        this.autoUpdateEnabled = false;
        this.updateInterval = null;
        
        // Default trading pair
        this.defaultPair = 'BTCUSDT';
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
        this.requiredMarginInput = null;
        this.initialTradeValueInput = null;
        this.tpPercentInput = null;
        this.tpValueInput = null;
        this.gridLevelsInput = null;
        this.gridSizeInput = null;
        this.gridMultiplierInput = null;
        this.tradeSizeMultiplierInput = null;
        this.tpPriceInput = null;
        this.averageEntryInput = null;
        this.marginRequiredInput = null; // Renamed from requiredMarginInput
    }

    initializeElements() {
        // Initialize all DOM elements
        this.tradingPairInput = document.getElementById('tradingPair');
        this.pairCountSelect = document.getElementById('pairCount');
        this.pairsTableBody = document.getElementById('pairsTableBody');
        this.statusDiv = document.getElementById('status');
        this.updateButton = document.getElementById('updateButton');
        this.autoUpdateSwitch = document.getElementById('autoUpdateSwitch');
        
        // Trading settings elements
        this.entryPriceInput = document.getElementById('entryPrice');
        this.marginInput = document.getElementById('margin');
        this.tradeSizePercentInput = document.getElementById('tradeSizePercent');
        this.leverageInput = document.getElementById('leverage');
        this.priceMoveToTPInput = document.getElementById('priceMoveToTP');
        this.marginRequiredInput = document.getElementById('marginRequired'); // Renamed from requiredMarginInput
        this.initialTradeValueInput = document.getElementById('initialTradeValue');
        this.tpPercentInput = document.getElementById('tpPercent');
        this.tpValueInput = document.getElementById('tpValue');
        this.gridLevelsInput = document.getElementById('gridLevels');
        this.gridSizeInput = document.getElementById('gridSize');
        this.gridMultiplierInput = document.getElementById('gridMultiplier');
        this.tradeSizeMultiplierInput = document.getElementById('tradeSizeMultiplier');
        this.tpPriceInput = document.getElementById('tpPrice');
        this.averageEntryInput = document.getElementById('averageEntry');
        
        // Log any missing elements
        Object.entries(this).forEach(([key, value]) => {
            if (key.endsWith('Input') || key.endsWith('Select') || key.endsWith('Body') || key.endsWith('Div')) {
                if (!value) {
                    console.warn(`Missing element: ${key}`);
                }
            }
        });
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

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => this.handleSort(e));
        });

        // Pair selection from table
        if (this.pairsTableBody) {
            this.pairsTableBody.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (row) {
                    const symbol = row.cells[0].textContent;
                    // Find the actual price from our pairs data instead of parsing from table
                    const pairData = this.pairs.find(p => p.symbol === symbol);
                    const price = pairData ? pairData.lastPrice : 0;
                    console.log('Selected pair:', symbol, 'with price:', price);
                    this.selectTradingPair(symbol, price);
                }
            });
        }

        // Trading settings changes
        const tradingInputs = [
            this.marginInput,
            this.tradeSizePercentInput,
            this.leverageInput,
            this.gridLevelsInput,
            this.gridSizeInput,
            this.gridMultiplierInput,
            this.tradeSizeMultiplierInput,
            this.entryPriceInput,
            this.tpPercentInput,
            this.initialTradeValueInput,
            this.tpValueInput
        ];

        tradingInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    console.log(`${input.id} changed to ${input.value}, recalculating...`);
                    
                    // If initialTradeValue was changed, update tradeSizePercent
                    if (input === this.initialTradeValueInput) {
                        const margin = parseFloat(this.marginInput.value) || 0;
                        if (margin > 0) {
                            const newTradeSize = (parseFloat(input.value) / margin) * 100;
                            this.tradeSizePercentInput.value = newTradeSize.toFixed(2);
                        }
                    }
                    
                    // If tradeSizePercent was changed, update initialTradeValue
                    if (input === this.tradeSizePercentInput) {
                        const margin = parseFloat(this.marginInput.value) || 0;
                        const tradeSize = (margin * parseFloat(input.value)) / 100;
                        if (!isNaN(tradeSize) && document.activeElement !== this.initialTradeValueInput) {
                            this.initialTradeValueInput.value = tradeSize.toFixed(2);
                        }
                    }
                    
                    // If tpValue was changed, update tpPercent
                    if (input === this.tpValueInput) {
                        const initialTradeValue = parseFloat(this.initialTradeValueInput.value) || 0;
                        const leverage = parseFloat(this.leverageInput.value) || 1;
                        if (initialTradeValue > 0) {
                            const newTpPercent = (parseFloat(input.value) * 100) / (initialTradeValue * leverage);
                            this.tpPercentInput.value = newTpPercent.toFixed(2);
                        }
                    }
                    
                    // If tpPercent was changed, update tpValue
                    if (input === this.tpPercentInput) {
                        const initialTradeValue = parseFloat(this.initialTradeValueInput.value) || 0;
                        const leverage = parseFloat(this.leverageInput.value) || 1;
                        const tpValue = (initialTradeValue * leverage * parseFloat(input.value)) / 100;
                        if (!isNaN(tpValue) && document.activeElement !== this.tpValueInput) {
                            this.tpValueInput.value = tpValue.toFixed(2);
                        }
                    }
                    
                    this.calculateGrid();
                });
            }
        });

        // Pair count selection
        if (this.pairCountSelect) {
            this.pairCountSelect.addEventListener('change', () => {
                this.pairCount = parseInt(this.pairCountSelect.value);
                this.fetchTopPairs();
            });
        }
    }

    async init() {
        try {
            console.log('Initializing calculator...');
            this.showLoading('Initializing calculator...');
            
            // Initialize elements
            this.initializeElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Fetch initial data
            await this.fetchTopPairs();
            
            console.log('Calculator initialized successfully');
            this.showSuccess('Calculator initialized successfully');
            
            // Automatically select SOLUSDT
            const solData = this.pairs.find(pair => pair.symbol === 'SOLUSDT');
            if (solData) {
                this.selectTradingPair(solData.symbol, solData.lastPrice);
            }

            // Clear any existing update interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize calculator: ' + error.message);
        }
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
                <tr class="${pair.priceChange >= 0 ? 'table-success' : 'table-danger'}">
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
            this.gridLevelsInput.value = '3';
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

    setDefaultValues() {
        if (this.pairCountSelect && !this.pairCountSelect.value) {
            this.pairCountSelect.value = '10';
        }

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
            this.gridLevelsInput.value = '3';
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
            const tpPrice = entryPrice * (1 + (tpPercent / 100));
            const priceMoveToTP = tpPrice - entryPrice;
            
            // Calculate TP value based on whether it was manually set
            let tpValue;
            if (document.activeElement === this.tpValueInput) {
                tpValue = manualTpValue;
            } else {
                tpValue = (initialTradeValue * leverage * tpPercent) / 100;
                this.tpValueInput.value = formatMatchingDecimals(tpValue);
            }

            // Calculate grid levels
            const gridLevelsData = [];
            let totalTradeSize = initialTradeValue; // Include initial position
            let totalWeightedPrice = entryPrice * initialTradeValue;
            let currentPrice = entryPrice;
            let currentGridSize = gridSize; // Track the current grid size
            
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

            // Update UI elements
            if (this.initialTradeValueInput) {
                this.initialTradeValueInput.value = formatMatchingDecimals(initialTradeValue);
            }

            if (this.priceMoveToTPInput) {
                this.priceMoveToTPInput.value = formatMatchingDecimals(priceMoveToTP);
            }

            if (this.marginRequiredInput) {
                this.marginRequiredInput.value = formatMatchingDecimals(requiredMargin);
            }

            if (this.tpValueInput) {
                this.tpValueInput.value = formatMatchingDecimals(tpValue);
            }

            if (this.tpPriceInput) {
                this.tpPriceInput.value = formatMatchingDecimals(tpPrice);
            }

            if (this.averageEntryInput) {
                this.averageEntryInput.value = formatMatchingDecimals(averageEntryPrice);
            }

            // Update grid levels table
            this.updateGridLevelsTable(gridLevelsData);

        } catch (error) {
            console.error('Error calculating grid:', error);
            this.showError('Failed to calculate grid: ' + error.message);
        }
    }

    updateGridLevelsTable(gridLevelsData) {
        const tableContent = gridLevelsData.map(level => {
            return `
                <tr>
                    <td>${level.level}</td>
                    <td>${level.price}</td>
                    <td>${level.gridSize.toFixed(2)}%</td>
                    <td>${level.tradeSize}</td>
                    <td>${level.positionSize}</td>
                    <td>${level.requiredMargin}</td>
                    <td>${level.percentFromEntry}%</td>
                    <td>${level.pnlAtTp}</td>
                </tr>
            `;
        }).join('');

        const gridLevelsTableBody = document.getElementById('gridLevelsTableBody');
        if (gridLevelsTableBody) {
            gridLevelsTableBody.innerHTML = tableContent;
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
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing calculator...');
    window.calculator = new GridTradingCalculator();
    window.calculator.init();
    window.calculator.setDefaultValues();
});
