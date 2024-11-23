/**
 * @typedef {Object} TradeParameters
 * @property {number} accountBalance - Total account balance in USD
 * @property {number} riskPercentage - Risk per trade as percentage
 * @property {number} entryPrice - Entry price for the position
 * @property {number} takeProfitPercent - Take profit target as percentage
 * @property {number} leverage - Position leverage
 * @property {number} entryFee - Entry fee as percentage
 * @property {number} exitFee - Exit fee as percentage
 * @property {number} martingaleFactor - Grid size multiplier
 * @property {number} gridLevels - Number of grid levels
 * @property {number} maxDrawdown - Maximum allowed drawdown
 * @property {number} gridSpacing - Grid spacing percentage
 * @property {'long'|'short'} positionSide - Position direction
 */

// Initialize price history storage
const priceHistory = {
    last24h: [],
    last48h: [],
    last72h: [],
    last96h: [],
    last120h: []
};

// DOM Elements
let elements = {
    cryptoPair: null,
    currentPrice: null,
    lastUpdate: null,
    refreshPrice: null,
    apiStatus: null,
    accountBalance: null,
    riskPercentage: null,
    entryPrice: null,
    takeProfitPercent: null,
    leverage: null,
    entryFee: null,
    exitFee: null,
    martingaleFactor: null,
    gridLevels: null,
    maxDrawdown: null,
    gridSpacing: null,
    positionSide: null,
    errorContainer: null
};

function initializeElements() {
    elements = {
        cryptoPair: document.getElementById('cryptoPair'),
        currentPrice: document.getElementById('currentPrice'),
        lastUpdate: document.getElementById('lastUpdate'),
        refreshPrice: document.getElementById('refreshPrice'),
        apiStatus: document.getElementById('apiStatus'),
        accountBalance: document.getElementById('accountBalance'),
        riskPercentage: document.getElementById('riskPercentage'),
        entryPrice: document.getElementById('entryPrice'),
        takeProfitPercent: document.getElementById('takeProfitPercent'),
        leverage: document.getElementById('leverage'),
        entryFee: document.getElementById('entryFee'),
        exitFee: document.getElementById('exitFee'),
        martingaleFactor: document.getElementById('martingaleFactor'),
        gridLevels: document.getElementById('gridLevels'),
        maxDrawdown: document.getElementById('maxDrawdown'),
        gridSpacing: document.getElementById('gridSpacing'),
        positionSide: document.getElementById('positionSide'),
        errorContainer: document.getElementById('errorContainer')
    };

    const requiredElements = Object.keys(elements);
    const missingElements = requiredElements.filter(id => !elements[id]);
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return false;
    }
    
    return true;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize elements first
    if (!initializeElements()) {
        console.error('Failed to initialize elements');
        return;
    }
    
    // Initialize components
    initializePairsTable();
    setupEventListeners();
    
    // Set default values
    elements.cryptoPair.value = 'BTC-USD';
    elements.currentPrice.value = '0.00';
    
    // Initial price fetch
    fetchCurrentPrice().catch(error => {
        console.error('Initial price fetch failed:', error);
        showError('Failed to fetch initial price');
    });
});

function setupEventListeners() {
    // Price refresh button
    elements.refreshPrice.addEventListener('click', async () => {
        try {
            elements.refreshPrice.disabled = true;
            await fetchCurrentPrice();
        } catch (error) {
            console.error('Price refresh failed:', error);
            showError(error.message);
        } finally {
            elements.refreshPrice.disabled = false;
        }
    });
    
    // Manual price input
    elements.currentPrice.addEventListener('input', () => {
        const price = parseFloat(elements.currentPrice.value);
        if (price > 0) {
            calculateAll();
            updateWhatIfAnalysis();
        }
    });
    
    // Add input listeners for calculations
    const calculationInputs = [
        'accountBalance', 'riskPercentage', 'entryPrice', 'takeProfitPercent',
        'leverage', 'entryFee', 'exitFee', 'martingaleFactor', 'gridLevels',
        'maxDrawdown', 'gridSpacing', 'positionSide'
    ];
    
    calculationInputs.forEach(inputId => {
        if (elements[inputId]) {
            elements[inputId].addEventListener('input', () => {
                calculateAll();
                updateWhatIfAnalysis();
            });
        }
    });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
}

/**
 * Fetches current price for selected cryptocurrency pair
 * @returns {Promise<void>}
 */
async function fetchCurrentPrice() {
    if (!elements.cryptoPair || !elements.currentPrice || !elements.lastUpdate) {
        console.error('Required elements not found');
        return;
    }

    const pair = elements.cryptoPair.value;
    if (!pair) {
        updateApiStatus('No trading pair selected', 'error');
        return;
    }

    try {
        elements.currentPrice.classList.add('loading');
        elements.refreshPrice.disabled = true;
        updateApiStatus('Fetching price...', 'warning');
        
        let price;
        // Try Coinbase first
        try {
            console.log('Attempting Coinbase API fetch for', pair);
            const now = Date.now();
            if (now - apiState.lastCall.coinbase < API_CONFIG.COINBASE.rateLimit) {
                throw new Error('Rate limit - switching to backup API');
            }
            apiState.lastCall.coinbase = now;

            const response = await fetch(`${API_CONFIG.COINBASE.baseUrl}/${pair}/spot`);
            console.log('Coinbase response status:', response.status);
            
            if (response.status === 429) {
                apiState.status = 'rate_limited';
                throw new Error('Rate limit exceeded - switching to backup API');
            }
            
            if (!response.ok) {
                throw new Error(`Coinbase API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Coinbase data received:', data);
            
            if (!data || !data.data || !data.data.amount) {
                throw new Error('Invalid data structure from Coinbase');
            }
            
            price = parseFloat(data.data.amount);
            apiState.errors.coinbase = 0;
            updateApiStatus('Using Coinbase API', 'success');
            
        } catch (coinbaseError) {
            console.warn('Coinbase API error:', coinbaseError);
            apiState.errors.coinbase++;
            
            // Try Coinlore as backup
            try {
                console.log('Attempting Coinlore API fetch for', pair);
                price = await fetchCoinlorePrice(pair);
                console.log('Coinlore price received:', price);
                updateApiStatus('Using Coinlore API (backup)', 'warning');
            } catch (coinloreError) {
                console.error('Backup API error:', coinloreError);
                throw new Error('All APIs failed - please try again later');
            }
        }
        
        if (!price || isNaN(price) || price <= 0) {
            throw new Error('Invalid price data received');
        }
        
        console.log('Final price:', price);
        
        // Update UI
        elements.currentPrice.value = price.toFixed(2);
        elements.lastUpdate.textContent = new Date().toLocaleTimeString();
        
        // Store price history
        const timestamp = Date.now();
        const priceData = { price, timestamp };
        
        Object.keys(priceHistory).forEach(period => {
            priceHistory[period].push(priceData);
            if (priceHistory[period].length > 100) { // Keep last 100 points
                priceHistory[period].shift();
            }
        });
        
        updateVolatilityDisplay();
        calculateAll();
        
    } catch (error) {
        console.error('Price fetch failed:', error);
        updateApiStatus(error.message, 'error');
        elements.currentPrice.value = '0.00';
        showError(error.message || 'Failed to fetch price. Please try again.');
        
    } finally {
        elements.currentPrice.classList.remove('loading');
        elements.refreshPrice.disabled = false;
    }
}

function getInputValues() {
    if (!elements.accountBalance || !elements.riskPercentage || !elements.entryPrice ||
        !elements.takeProfitPercent || !elements.leverage || !elements.entryFee ||
        !elements.exitFee || !elements.martingaleFactor || !elements.gridLevels ||
        !elements.maxDrawdown || !elements.gridSpacing || !elements.positionSide) {
        console.error('Required form elements not found');
        return null;
    }

    return {
        accountBalance: parseFloat(elements.accountBalance.value) || 0,
        riskPercentage: parseFloat(elements.riskPercentage.value) || 0,
        entryPrice: parseFloat(elements.entryPrice.value) || 0,
        takeProfitPercent: parseFloat(elements.takeProfitPercent.value) || 0,
        leverage: parseFloat(elements.leverage.value) || 1,
        entryFee: parseFloat(elements.entryFee.value) || 0,
        exitFee: parseFloat(elements.exitFee.value) || 0,
        martingaleFactor: parseFloat(elements.martingaleFactor.value) || 1,
        gridLevels: parseInt(elements.gridLevels.value) || 1,
        maxDrawdown: parseFloat(elements.maxDrawdown.value) || 0,
        gridSpacing: parseFloat(elements.gridSpacing.value) || 0,
        positionSide: elements.positionSide.value || 'long'
    };
}

function showError(message) {
    if (!elements.errorContainer) {
        console.error('Error container not found. Error message:', message);
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    elements.errorContainer.prepend(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

function calculateAll() {
    const values = getInputValues();
    if (!values) {
        console.error('Failed to get input values');
        return;
    }

    try {
        const results = performCalculations(values);
        updateResults(results);
    } catch (error) {
        console.error('Calculation error:', error);
        showError('Failed to perform calculations: ' + error.message);
    }
}

/**
 * Updates the API status display
 * @param {string} message - Status message
 * @param {string} type - Status type ('success', 'warning', 'error')
 */
function updateApiStatus(message, type = 'success') {
    if (!elements.apiStatus) {
        console.warn('API status element not found');
        return;
    }

    elements.apiStatus.textContent = message;
    elements.apiStatus.classList.remove('api-status-success', 'api-status-warning', 'api-status-error');
    elements.apiStatus.classList.add(`api-status-${type}`);
}

// Top 100 Cryptocurrency Pairs with symbols for autocomplete
const TOP_PAIRS = [
    // Major Pairs
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD',
    'ADA-USD', 'DOGE-USD', 'TRX-USD', 'DOT-USD', 'MATIC-USD',
    'LTC-USD', 'SHIB-USD', 'AVAX-USD', 'UNI-USD', 'LINK-USD',
    'ATOM-USD', 'XLM-USD', 'ETC-USD', 'FIL-USD', 'NEAR-USD',
    'APE-USD', 'ALGO-USD', 'APT-USD', 'BCH-USD', 'MANA-USD',
    'SAND-USD', 'AAVE-USD', 'AXS-USD', 'EGLD-USD', 'EOS-USD',
    'FLOW-USD', 'FTM-USD', 'GALA-USD', 'GMT-USD', 'GRT-USD',
    'HBAR-USD', 'ICP-USD', 'KLAY-USD', 'LDO-USD', 'MASK-USD',
    'RNDR-USD', 'RUNE-USD', 'SNX-USD', 'STX-USD', 'THETA-USD',
    'VET-USD', 'WAVES-USD', 'XTZ-USD', 'ZEC-USD', 'ZIL-USD',
    // Additional Pairs
    'INJ-USD', 'OP-USD', 'ARB-USD', 'SUI-USD', 'SEI-USD',
    'BLUR-USD', 'IMX-USD', 'CFX-USD', 'ROSE-USD', 'ONE-USD',
    'GALA-USD', 'CHZ-USD', 'HOT-USD', 'KAVA-USD', 'QTUM-USD',
    'CRV-USD', 'BAT-USD', 'ENJ-USD', 'ZRX-USD', 'COMP-USD',
    'DASH-USD', 'NEO-USD', 'IOTA-USD', 'XEM-USD', 'ONT-USD',
    'DGB-USD', 'ICX-USD', 'SC-USD', 'ZEN-USD', 'FET-USD',
    'STORJ-USD', 'ANKR-USD', 'RVN-USD', 'BAND-USD', 'IOST-USD',
    'WOO-USD', 'PERP-USD', 'DYDX-USD', 'GMX-USD', 'JOE-USD',
    'MAGIC-USD', 'AGIX-USD', 'FXS-USD', 'SSV-USD', 'RPL-USD',
    'HFT-USD', 'HOOK-USD', 'APT-USD', 'OSMO-USD', 'KAS-USD'
];

// Volatility periods in milliseconds
const VOLATILITY_PERIODS = {
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '72h': 72 * 60 * 60 * 1000,
    '96h': 96 * 60 * 60 * 1000,
    '120h': 120 * 60 * 60 * 1000
};

// API configuration
const API_CONFIG = {
    COINBASE: {
        baseUrl: 'https://api.coinbase.com/v2/prices',
        rateLimit: 5000, // 5 seconds between calls
        maxRetries: 3
    },
    COINLORE: {
        baseUrl: 'https://api.coinlore.net/api/ticker',
        rateLimit: 2000 // 2 seconds between calls
    }
};

// API state tracking
const apiState = {
    lastCall: {
        coinbase: 0,
        coinlore: 0
    },
    errors: {
        coinbase: 0,
        coinlore: 0
    },
    status: 'ready' // 'ready', 'error', 'rate_limited'
};

/**
 * Attempts to fetch price from Coinlore API
 * @param {string} symbol - Trading pair symbol
 * @returns {Promise<number>} Current price
 */
async function fetchCoinlorePrice(symbol) {
    const now = Date.now();
    if (now - apiState.lastCall.coinlore < API_CONFIG.COINLORE.rateLimit) {
        throw new Error('Coinlore rate limit - please wait');
    }
    apiState.lastCall.coinlore = now;

    // Convert pair format (e.g., 'BTC-USD' to 'BTC')
    const coin = symbol.split('-')[0].toLowerCase();
    
    try {
        const response = await fetch(`${API_CONFIG.COINLORE.baseUrl}?id=${getCoinloreId(coin)}`);
        if (!response.ok) throw new Error('Coinlore API error');
        
        const data = await response.json();
        if (!data || !data[0] || !data[0].price_usd) {
            throw new Error('Invalid price data from Coinlore');
        }

        apiState.errors.coinlore = 0;
        return parseFloat(data[0].price_usd);
    } catch (error) {
        apiState.errors.coinlore++;
        throw error;
    }
}

/**
 * Gets Coinlore ID for common cryptocurrencies
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {string} Coinlore ID
 */
function getCoinloreId(symbol) {
    const coinMap = {
        'btc': '90',
        'eth': '80',
        'bnb': '2710',
        'sol': '48543',
        'xrp': '58',
        'ada': '257',
        'doge': '2',
        'dot': '42159',
        'matic': '3890',
        'ltc': '1',
        // Add more mappings as needed
    };
    return coinMap[symbol.toLowerCase()] || '';
}

// Initialize pairs table
function initializePairsTable() {
    const tbody = document.querySelector('#pairsTable tbody');
    tbody.innerHTML = '';
    
    TOP_PAIRS.forEach(pair => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="py-1 px-2">${pair}</td>`;
        tr.addEventListener('click', () => selectPair(pair));
        tbody.appendChild(tr);
    });
}

// Initialize pair search and autocomplete
function initializePairSearch() {
    const pairInput = document.getElementById('pairSearch');
    const pairsList = document.getElementById('pairsList');
    const pairsDropdown = document.getElementById('pairsDropdown');
    let currentPairValid = false;

    // Create datalist for autocomplete
    const datalist = document.createElement('datalist');
    datalist.id = 'pairsAutocomplete';
    TOP_PAIRS.forEach(pair => {
        const option = document.createElement('option');
        option.value = pair;
        datalist.appendChild(option);
    });
    document.body.appendChild(datalist);
    pairInput.setAttribute('list', 'pairsAutocomplete');

    // Handle input changes
    pairInput.addEventListener('input', async function(e) {
        const value = e.target.value.toUpperCase();
        
        // Filter top pairs for dropdown
        const matchingPairs = TOP_PAIRS.filter(pair => 
            pair.toUpperCase().includes(value)
        );

        // Update dropdown
        updatePairsDropdown(matchingPairs);

        // Validate custom pair
        if (value.includes('-')) {
            try {
                const isValid = await validatePair(value);
                currentPairValid = isValid;
                pairInput.style.borderColor = isValid ? '#28a745' : '#dc3545';
                if (isValid) {
                    selectPair(value);
                }
            } catch (error) {
                console.error('Error validating pair:', error);
                pairInput.style.borderColor = '#dc3545';
                currentPairValid = false;
            }
        }
    });

    // Handle pair selection
    pairInput.addEventListener('change', async function(e) {
        const value = e.target.value.toUpperCase();
        if (TOP_PAIRS.includes(value)) {
            selectPair(value);
            currentPairValid = true;
            pairInput.style.borderColor = '#28a745';
        } else if (value.includes('-')) {
            try {
                const isValid = await validatePair(value);
                if (isValid) {
                    selectPair(value);
                    currentPairValid = true;
                    pairInput.style.borderColor = '#28a745';
                } else {
                    pairInput.style.borderColor = '#dc3545';
                    currentPairValid = false;
                }
            } catch (error) {
                console.error('Error validating pair:', error);
                pairInput.style.borderColor = '#dc3545';
                currentPairValid = false;
            }
        }
    });

    // Handle enter key
    pairInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && currentPairValid) {
            selectPair(pairInput.value.toUpperCase());
        }
    });
}

// Update pairs dropdown with filtered results
function updatePairsDropdown(pairs) {
    const dropdown = document.getElementById('pairsDropdown');
    dropdown.innerHTML = '';

    pairs.slice(0, 10).forEach(pair => {
        const div = document.createElement('div');
        div.className = 'pair-option';
        div.textContent = pair;
        div.addEventListener('click', () => {
            document.getElementById('pairSearch').value = pair;
            selectPair(pair);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
    });

    dropdown.style.display = pairs.length > 0 ? 'block' : 'none';
}

// Validate custom trading pair
async function validatePair(pair) {
    try {
        // Try to fetch the current price to validate the pair
        const response = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
        if (response.ok) {
            const data = await response.json();
            return !!data.data.amount;
        }
        return false;
    } catch (error) {
        console.error('Error validating pair:', error);
        return false;
    }
}

// Select trading pair and update UI
function selectPair(pair) {
    // Update table selection
    const rows = document.querySelectorAll('#pairsTable tr');
    rows.forEach(row => row.classList.remove('selected'));
    
    const selectedRow = Array.from(rows).find(row => row.textContent === pair);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
    
    // Update search input and state
    currentPair = pair;
    const pairInput = document.getElementById('pairSearch');
    pairInput.value = pair;
    pairInput.style.borderColor = '#28a745';
    document.getElementById('pairsDropdown').style.display = 'none';
    
    // Update price and calculations
    updatePriceAndVolatility();
}

// Select trading pair
function selectPair(pair) {
    const rows = document.querySelectorAll('#pairsTable tr');
    rows.forEach(row => row.classList.remove('selected'));
    
    const selectedRow = Array.from(rows).find(row => row.textContent === pair);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
    
    currentPair = pair;
    updatePriceAndVolatility();
}

// Update price and volatility data
async function updatePriceAndVolatility() {
    try {
        // Fetch current price
        const priceResponse = await fetch(`https://api.coinbase.com/v2/prices/${currentPair}/spot`);
        const priceData = await priceResponse.json();
        currentPrice = parseFloat(priceData.data.amount);
        
        // Update volatility for all periods
        for (const [period, ms] of Object.entries(VOLATILITY_PERIODS)) {
            const startTime = new Date(Date.now() - ms).toISOString();
            const endTime = new Date().toISOString();
            
            const historyResponse = await fetch(
                `https://api.coinbase.com/v2/prices/${currentPair}/historic?start=${startTime}&end=${endTime}&granularity=3600`
            );
            const historyData = await historyResponse.json();
            
            const prices = historyData.data.map(candle => parseFloat(candle[4]));
            const volatility = calculateVolatility(prices);
            
            updateVolatilityDisplay(period.replace('h', ''), volatility);
        }
        
        // Trigger recalculation
        calculateAll();
        
    } catch (error) {
        console.error('Error updating price and volatility:', error);
    }
}

// Calculate volatility from price array
function calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push(Math.log(prices[i] / prices[i-1]));
    }
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const annualizedVol = Math.sqrt(variance * 365 * 24) * 100;
    
    return annualizedVol;
}

// Update volatility display with color coding
function updateVolatilityDisplay(hours, volatility) {
    const element = document.getElementById(`vol${hours}h`);
    if (!element) return;
    
    element.textContent = volatility.toFixed(2) + '%';
    element.className = '';
    
    if (volatility > 100) {
        element.classList.add('text-danger');
    } else if (volatility > 50) {
        element.classList.add('text-warning');
    } else {
        element.classList.add('text-success');
    }
}

// Resets input fields to default values
function resetToDefaults() {
    Object.entries(DEFAULT_VALUES).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    });
    calculateAll();
    updateWhatIfAnalysis();
}

/**
 * Retrieves input values from the form
 * @returns {TradeParameters} Input values
 */
function getInputValues() {
    return {
        accountBalance: parseFloat(document.getElementById('accountBalance').value) || DEFAULT_VALUES.accountBalance,
        riskPercentage: parseFloat(document.getElementById('riskPercentage').value) || DEFAULT_VALUES.riskPercentage,
        entryPrice: parseFloat(document.getElementById('entryPrice').value) || 0,
        takeProfitPercent: parseFloat(document.getElementById('takeProfitPercent').value) || DEFAULT_VALUES.takeProfitPercent,
        leverage: parseFloat(document.getElementById('leverage').value) || DEFAULT_VALUES.leverage,
        entryFee: parseFloat(document.getElementById('entryFee').value) || DEFAULT_VALUES.entryFee,
        exitFee: parseFloat(document.getElementById('exitFee').value) || DEFAULT_VALUES.exitFee,
        martingaleFactor: parseFloat(document.getElementById('martingaleFactor').value) || DEFAULT_VALUES.martingaleFactor,
        gridLevels: parseInt(document.getElementById('gridLevels').value) || DEFAULT_VALUES.gridLevels,
        maxDrawdown: parseFloat(document.getElementById('maxDrawdown').value) || DEFAULT_VALUES.maxDrawdown,
        gridSpacing: parseFloat(document.getElementById('gridSpacing').value) || DEFAULT_VALUES.gridSpacing,
        positionSide: document.getElementById('positionSide').value
    };
}

/**
 * Calculates liquidation price based on entry price, leverage, and position side
 * @param {number} entryPrice - Entry price
 * @param {number} leverage - Position leverage
 * @param {'long'|'short'} positionSide - Position direction
 * @param {number} maxDrawdown - Maximum allowed drawdown
 * @returns {number} Liquidation price
 */
function calculateLiquidationPrice(entryPrice, leverage, positionSide, maxDrawdown) {
    const liquidationPercent = 100 / leverage * maxDrawdown / 100;
    return positionSide === 'long' 
        ? entryPrice * (1 - liquidationPercent)
        : entryPrice * (1 + liquidationPercent);
}

/**
 * Calculates all trade parameters and updates the UI
 */
function calculateAll() {
    const values = getInputValues();
    if (!validateInputs(values)) return;

    const results = performCalculations(values);
    updateResults(results);
}

/**
 * Validates input values and displays appropriate errors
 * @param {TradeParameters} values - Values to validate
 * @returns {boolean} Whether values are valid
 */
function validateInputs(values) {
    const validations = [
        { check: values.accountBalance > 0, message: 'Account balance must be positive' },
        { check: values.riskPercentage > 0 && values.riskPercentage <= 100, message: 'Risk must be between 0-100%' },
        { check: values.entryPrice > 0, message: 'Entry price must be positive' },
        { check: values.takeProfitPercent > 0, message: 'Take profit must be positive' },
        { check: values.leverage >= 1, message: 'Leverage must be at least 1x' },
        { check: values.entryFee >= 0, message: 'Entry fee cannot be negative' },
        { check: values.exitFee >= 0, message: 'Exit fee cannot be negative' },
        { check: values.martingaleFactor >= 1, message: 'Martingale factor must be at least 1' },
        { check: values.gridLevels >= 1, message: 'Must have at least 1 grid level' },
        { check: values.maxDrawdown > 0, message: 'Max drawdown must be positive' },
        { check: values.gridSpacing > 0, message: 'Grid spacing must be positive' }
    ];

    const failures = validations.filter(v => !v.check);
    
    if (failures.length > 0) {
        showError(failures.map(f => f.message).join(', '));
        return false;
    }

    return true;
}

/**
 * Calculates optimal grid spacing based on trading parameters
 * @param {TradeParameters} values - Trading parameters
 * @returns {number} Optimal grid spacing percentage
 */
function calculateGridSpacing(values) {
    const {
        takeProfitPercent,
        gridLevels,
        maxDrawdown,
        leverage,
        positionSide
    } = values;

    // Calculate total price range considering risk parameters
    const riskAdjustedDrawdown = maxDrawdown / leverage;
    const totalRange = takeProfitPercent + riskAdjustedDrawdown;
    
    // Distribute range across grid levels, ensuring minimum spacing
    const spacing = Math.max(0.1, totalRange / (gridLevels + 1));
    
    return parseFloat(spacing.toFixed(1));
}

/**
 * Calculates all trade parameters and returns the results
 * @param {TradeParameters} values - Trading parameters
 * @returns {Object} Trade results
 */
function performCalculations(values) {
    const {
        accountBalance,
        riskPercentage,
        entryPrice,
        takeProfitPercent,
        leverage,
        entryFee,
        exitFee,
        martingaleFactor,
        gridLevels,
        maxDrawdown,
        gridSpacing,
        positionSide
    } = values;

    // Calculate optimal grid spacing
    const dynamicGridSpacing = calculateGridSpacing(values);
    const gridSpacingInput = document.getElementById('gridSpacing');
    if (gridSpacingInput) {
        gridSpacingInput.value = dynamicGridSpacing.toFixed(1);
        // Trigger input event to ensure UI updates
        gridSpacingInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    values.gridSpacing = dynamicGridSpacing;

    // Calculate risk amount in USD
    const riskAmount = accountBalance * (riskPercentage / 100);

    // Calculate base position size
    const positionSize = (riskAmount * leverage);

    // Calculate grid levels
    const gridResults = calculateGridLevels(values, positionSize);
    updateGridTable(gridResults);

    // Calculate fees for base position
    const entryFeeAmount = (positionSize * (entryFee / 100));
    const exitFeeAmount = (positionSize * (exitFee / 100));
    const totalFees = entryFeeAmount + exitFeeAmount;

    // Calculate potential profit/loss for base position
    const profitDistance = positionSide === 'long'
        ? takeProfitPercent
        : -takeProfitPercent;
    const potentialProfit = (profitDistance / 100) * positionSize - totalFees;

    return {
        positionSize: formatUSD(positionSize),
        riskRewardRatio: 'N/A (Grid Trading)',
        adjustedPositionSize: formatUSD(positionSize * leverage),
        requiredMargin: formatUSD(positionSize),
        totalFees: formatUSD(totalFees),
        potentialProfit: formatUSD(potentialProfit),
        potentialLoss: 'Variable (Grid Trading)'
    };
}

/**
 * Calculates grid levels based on trading parameters
 * @param {TradeParameters} values - Trading parameters
 * @param {number} basePositionSize - Base position size
 * @returns {Array<Object>} Grid level results
 */
function calculateGridLevels(values, basePositionSize) {
    const {
        entryPrice,
        takeProfitPercent,
        martingaleFactor,
        gridLevels,
        leverage,
        entryFee,
        exitFee,
        gridSpacing,
        positionSide,
        maxDrawdown
    } = values;

    const gridResults = [];
    let totalPosition = 0;
    let totalMargin = 0;
    let totalRoi = 0;
    let accumulatedFees = 0;

    for (let i = 0; i < gridLevels; i++) {
        const gridDropPercent = i * gridSpacing;
        const levelEntryPrice = positionSide === 'long'
            ? entryPrice * (1 - gridDropPercent / 100)
            : entryPrice * (1 + gridDropPercent / 100);
        
        const levelPositionSize = basePositionSize * Math.pow(martingaleFactor, i);
        const levelMargin = levelPositionSize / leverage;
        
        // Calculate fees for this level
        const levelEntryFee = levelPositionSize * (entryFee / 100);
        const levelExitFee = levelPositionSize * (exitFee / 100);
        const levelTotalFees = levelEntryFee + levelExitFee;
        accumulatedFees += levelTotalFees;
        
        const levelTakeProfit = positionSide === 'long'
            ? levelEntryPrice * (1 + takeProfitPercent / 100)
            : levelEntryPrice * (1 - takeProfitPercent / 100);

        // More precise liquidation calculation for high leverage
        const maintenanceMargin = 0.005; // 0.5% maintenance margin
        const liquidationPrice = positionSide === 'long'
            ? levelEntryPrice * (1 - (1 / leverage) + maintenanceMargin)
            : levelEntryPrice * (1 + (1 / leverage) - maintenanceMargin);
        
        // Calculate ROI including grid impact
        const gridImpact = gridDropPercent * (positionSide === 'long' ? -1 : 1);
        const leveragedReturn = positionSide === 'long'
            ? ((levelTakeProfit - levelEntryPrice) / levelEntryPrice * 100) + gridImpact
            : ((levelEntryPrice - levelTakeProfit) / levelEntryPrice * 100) - gridImpact;
            
        const roi = (leveragedReturn * leverage) - ((entryFee + exitFee) * leverage);

        totalPosition += levelPositionSize;
        totalMargin += levelMargin;
        totalRoi += roi;

        gridResults.push({
            level: i + 1,
            entryPrice: levelEntryPrice,
            positionSize: levelPositionSize,
            margin: levelMargin,
            takeProfit: levelTakeProfit,
            roi: roi,
            liquidation: liquidationPrice,
            fees: levelTotalFees
        });
    }

    // Update totals
    document.getElementById('totalPosition').textContent = formatUSD(totalPosition);
    document.getElementById('totalMargin').textContent = formatUSD(totalMargin);
    document.getElementById('totalFees').textContent = formatUSD(accumulatedFees);
    document.getElementById('avgRoi').textContent = (totalRoi / gridLevels).toFixed(2) + '%';

    return gridResults;
}

/**
 * Updates grid table with new results
 * @param {Array<Object>} gridResults - Grid level results
 */
function updateGridTable(gridResults) {
    const tableBody = document.getElementById('gridTableBody');
    tableBody.innerHTML = '';

    gridResults.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.level}</td>
            <td>${formatUSD(result.entryPrice)}</td>
            <td>${formatUSD(result.positionSize)}</td>
            <td>${formatUSD(result.margin)}</td>
            <td>${formatUSD(result.takeProfit)}</td>
            <td>${result.roi.toFixed(2)}%</td>
            <td>${formatUSD(result.liquidation)}</td>
        `;
        
        // Add warning class if close to liquidation
        const currentPrice = parseFloat(document.getElementById('currentPrice').value) || result.entryPrice;
        const liquidationDistance = Math.abs(currentPrice - result.liquidation) / currentPrice * 100;
        if (liquidationDistance < 5) {
            row.classList.add('table-danger');
        }
        
        tableBody.appendChild(row);
    });
}

/**
 * Updates results display with new values
 * @param {Object} results - Trade results
 */
function updateResults(results) {
    if (!results) {
        console.error('No results to display');
        return;
    }

    try {
        // Update result values
        document.getElementById('positionSize').textContent = results.positionSize;
        document.getElementById('riskRewardRatio').textContent = results.riskRewardRatio;
        document.getElementById('adjustedPositionSize').textContent = results.adjustedPositionSize;
        document.getElementById('requiredMargin').textContent = results.requiredMargin;
        document.getElementById('totalFees').textContent = results.totalFees;
        document.getElementById('potentialProfit').textContent = results.potentialProfit;

    } catch (error) {
        console.error('Error updating results:', error);
        showError('Failed to update results display');
    }
}

/**
 * Updates the grid levels table with calculated grid data
 * @param {Array} gridLevels - Array of grid level data
 */
function updateGridTable(gridLevels) {
    if (!Array.isArray(gridLevels)) {
        console.error('Invalid grid levels data');
        return;
    }

    const tbody = document.querySelector('#gridTable tbody');
    if (!tbody) {
        console.error('Grid table body not found');
        return;
    }

    try {
        tbody.innerHTML = '';
        
        gridLevels.forEach((level, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatUSD(level.price)}</td>
                <td>${formatUSD(level.size)}</td>
                <td>${level.profitLoss > 0 ? '+' : ''}${formatUSD(level.profitLoss)}</td>
            `;
            
            // Add color coding for profit/loss
            if (level.profitLoss > 0) {
                row.classList.add('table-success');
            } else if (level.profitLoss < 0) {
                row.classList.add('table-danger');
            }
            
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error updating grid table:', error);
        showError('Failed to update grid levels display');
    }
}

/**
 * Formats a number as USD currency string
 * @param {number} value - Number to format
 * @returns {string} Formatted currency string
 */
function formatUSD(value) {
    if (typeof value !== 'number') {
        return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

/**
 * Updates what-if analysis table with new scenarios
 */
function updateWhatIfAnalysis() {
    const baseValues = getInputValues();
    const scenarios = generateScenarios(baseValues);
    const tableBody = document.getElementById('whatIfTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows for each scenario
    scenarios.forEach(scenario => {
        const results = performCalculations(scenario.values);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${scenario.name}</td>
            <td>${results.adjustedPositionSize}</td>
            <td>${results.riskRewardRatio}</td>
            <td>${results.potentialProfit}</td>
            <td>${results.potentialLoss}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Generates what-if analysis scenarios
 * @param {TradeParameters} baseValues - Base trading parameters
 * @returns {Array<Object>} What-if analysis scenarios
 */
function generateScenarios(baseValues) {
    return WHAT_IF_SCENARIOS.map(scenario => {
        const values = { ...baseValues };
        Object.assign(values, scenario);
        return { name: scenario.label, values };
    });
}

// What-if analysis scenarios
const WHAT_IF_SCENARIOS = [
    { label: 'Conservative', takeProfitPercent: 10, leverage: 3, gridLevels: 3 },
    { label: 'Balanced', takeProfitPercent: 15, leverage: 5, gridLevels: 4 },
    { label: 'Aggressive', takeProfitPercent: 20, leverage: 7, gridLevels: 5 },
    { label: 'High Frequency', takeProfitPercent: 8, leverage: 4, gridLevels: 6 },
    { label: 'Wide Range', takeProfitPercent: 25, leverage: 4, gridLevels: 3 }
];

// Rate limiting for API calls
let lastApiCall = 0;
const API_RATE_LIMIT = 1000; // 1 second between calls

/**
 * Displays error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    if (!elements.errorContainer) {
        console.error('Error container not found. Error message:', message);
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    elements.errorContainer.prepend(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

/**
 * Updates pair highlight in pairs table
 * @param {string} selectedPair - Selected cryptocurrency pair
 */
function updatePairHighlight(selectedPair) {
    const rows = document.querySelectorAll('#pairsTable tr');
    rows.forEach(row => {
        if (row.dataset.pair === selectedPair) {
            row.classList.add('table-info', 'fw-bold');
        } else {
            row.classList.remove('table-info', 'fw-bold');
        }
    });
}
