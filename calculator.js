document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements and select elements
    const inputs = document.querySelectorAll('input, select');
    const resetButton = document.getElementById('resetDefaults');
    const cryptoPairSelect = document.getElementById('cryptoPair');
    const refreshPriceButton = document.getElementById('refreshPrice');
    
    // Add event listeners to all inputs
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateAll();
            updateWhatIfAnalysis();
        });
    });

    // Add event listener for reset button
    resetButton.addEventListener('click', resetToDefaults);

    // Add event listener for cryptocurrency pair selection
    cryptoPairSelect.addEventListener('change', () => {
        updatePairHighlight(cryptoPairSelect.value);
        fetchCurrentPrice();
    });

    // Add event listener for refresh price button
    refreshPriceButton.addEventListener('click', () => {
        fetchCurrentPrice();
    });

    // Initialize pairs table
    initializePairsTable();

    // Initial calculations
    calculateAll();
    updateWhatIfAnalysis();
});

const DEFAULT_VALUES = {
    accountBalance: 10000,
    riskPercentage: 5,
    gridLevels: 3,
    leverage: 5,
    entryFee: 0.05,
    exitFee: 0.05,
    takeProfitPercent: 15,
    maxDrawdown: 20,
    martingaleFactor: 1.5,
    positionSide: 'long'
};

// Top 50 Cryptocurrency Pairs
const TOP_PAIRS = [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD',
    'ADA-USD', 'DOGE-USD', 'TRX-USD', 'DOT-USD', 'MATIC-USD',
    'LTC-USD', 'SHIB-USD', 'AVAX-USD', 'UNI-USD', 'LINK-USD',
    'ATOM-USD', 'XLM-USD', 'ETC-USD', 'FIL-USD', 'NEAR-USD',
    'APE-USD', 'ALGO-USD', 'APT-USD', 'BCH-USD', 'MANA-USD',
    'SAND-USD', 'AAVE-USD', 'AXS-USD', 'EGLD-USD', 'EOS-USD',
    'FLOW-USD', 'FTM-USD', 'GALA-USD', 'GMT-USD', 'GRT-USD',
    'HBAR-USD', 'ICP-USD', 'KLAY-USD', 'LDO-USD', 'MASK-USD',
    'RNDR-USD', 'RUNE-USD', 'SNX-USD', 'STX-USD', 'THETA-USD',
    'VET-USD', 'WAVES-USD', 'XTZ-USD', 'ZEC-USD', 'ZIL-USD'
];

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
        positionSide: document.getElementById('positionSide').value
    };
}

function calculateLiquidationPrice(entryPrice, leverage, positionSide, maxDrawdown) {
    const liquidationPercent = 100 / leverage * maxDrawdown / 100;
    return positionSide === 'long' 
        ? entryPrice * (1 - liquidationPercent)
        : entryPrice * (1 + liquidationPercent);
}

function calculateAll() {
    const values = getInputValues();
    if (!validateInputs(values)) return;

    const results = performCalculations(values);
    updateResults(results);
}

function validateInputs(values) {
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
        maxDrawdown
    } = values;

    return accountBalance > 0 &&
           riskPercentage > 0 &&
           riskPercentage <= 100 &&
           entryPrice > 0 &&
           takeProfitPercent > 0 &&
           leverage >= 1 &&
           entryFee >= 0 &&
           exitFee >= 0 &&
           martingaleFactor >= 1 &&
           gridLevels >= 1 &&
           maxDrawdown > 0;
}

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
        positionSide
    } = values;

    // Calculate optimal grid spacing
    const dynamicGridSpacing = calculateGridSpacing(values);
    document.getElementById('gridSpacing').value = dynamicGridSpacing.toFixed(1);
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

function calculateGridSpacing(values) {
    const {
        takeProfitPercent,
        gridLevels,
        maxDrawdown,
        leverage,
        positionSide
    } = values;

    // Calculate optimal grid spacing based on take profit and max drawdown
    const totalRange = positionSide === 'long' 
        ? takeProfitPercent + (maxDrawdown * 100 / leverage)
        : takeProfitPercent + (maxDrawdown * 100 / leverage);
    
    // Distribute the range across grid levels
    const optimalSpacing = totalRange / (gridLevels + 1);
    
    // Ensure minimum spacing of 0.1%
    return Math.max(0.1, optimalSpacing);
}

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

    for (let i = 0; i < gridLevels; i++) {
        const gridDropPercent = i * gridSpacing;
        const levelEntryPrice = positionSide === 'long'
            ? entryPrice * (1 - gridDropPercent / 100)
            : entryPrice * (1 + gridDropPercent / 100);
        
        const levelPositionSize = basePositionSize * Math.pow(martingaleFactor, i);
        const levelMargin = levelPositionSize / leverage;
        
        const levelTakeProfit = positionSide === 'long'
            ? levelEntryPrice * (1 + takeProfitPercent / 100)
            : levelEntryPrice * (1 - takeProfitPercent / 100);

        const levelLiquidation = calculateLiquidationPrice(
            levelEntryPrice,
            leverage,
            positionSide,
            maxDrawdown
        );
        
        // Calculate ROI
        const leveragedReturn = positionSide === 'long'
            ? (levelTakeProfit - levelEntryPrice) / levelEntryPrice * 100
            : (levelEntryPrice - levelTakeProfit) / levelEntryPrice * 100;
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
            liquidation: levelLiquidation
        });
    }

    // Update totals in the table footer
    document.getElementById('totalPosition').textContent = formatUSD(totalPosition);
    document.getElementById('totalMargin').textContent = formatUSD(totalMargin);
    document.getElementById('averageRoi').textContent = (totalRoi / gridLevels).toFixed(2) + '%';

    return gridResults;
}

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

function updateResults(results) {
    document.getElementById('positionSize').textContent = results.positionSize;
    document.getElementById('riskRewardRatio').textContent = results.riskRewardRatio;
    document.getElementById('adjustedPositionSize').textContent = results.adjustedPositionSize;
    document.getElementById('requiredMargin').textContent = results.requiredMargin;
    document.getElementById('totalFees').textContent = results.totalFees;
    document.getElementById('potentialProfit').textContent = results.potentialProfit;
    document.getElementById('potentialLoss').textContent = results.potentialLoss;
}

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

function generateScenarios(baseValues) {
    return [
        {
            name: 'Current',
            values: { ...baseValues }
        },
        {
            name: 'Higher Leverage',
            values: { ...baseValues, leverage: baseValues.leverage * 2 }
        },
        {
            name: 'Lower Leverage',
            values: { ...baseValues, leverage: Math.max(1, Math.floor(baseValues.leverage / 2)) }
        },
        {
            name: 'Higher Risk',
            values: { ...baseValues, riskPercentage: Math.min(100, baseValues.riskPercentage * 2) }
        },
        {
            name: 'Lower Risk',
            values: { ...baseValues, riskPercentage: baseValues.riskPercentage / 2 }
        },
        {
            name: 'Wider Stop Loss',
            values: {
                ...baseValues,
                stopLossPrice: baseValues.entryPrice - (Math.abs(baseValues.entryPrice - baseValues.stopLossPrice) * 1.5)
            }
        }
    ];
}

// Volatility tracking
let priceHistory = {
    last24h: [],
    last48h: [],
    last72h: []
};

async function fetchHistoricalPrices() {
    const pair = document.getElementById('cryptoPair').value;
    const now = new Date();
    const threeDaysAgo = new Date(now - 72 * 60 * 60 * 1000);
    
    try {
        const response = await fetch(`https://api.pro.coinbase.com/products/${pair}/candles?start=${threeDaysAgo.toISOString()}&end=${now.toISOString()}&granularity=3600`);
        const data = await response.json();
        
        // Sort data by timestamp (newest first)
        data.sort((a, b) => b[0] - a[0]);
        
        // Split into 24h chunks
        priceHistory.last24h = data.slice(0, 24);
        priceHistory.last48h = data.slice(24, 48);
        priceHistory.last72h = data.slice(48, 72);
        
        updateVolatilityDisplay();
    } catch (error) {
        console.error('Error fetching historical prices:', error);
    }
}

function calculateVolatility(priceData) {
    if (!priceData || priceData.length < 2) return 0;
    
    // Calculate price changes as percentages
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
        const currentPrice = priceData[i][4]; // Close price
        const previousPrice = priceData[i-1][4];
        returns.push((currentPrice - previousPrice) / previousPrice * 100);
    }
    
    // Calculate standard deviation of returns
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    return volatility;
}

function updateVolatilityDisplay() {
    const vol24h = calculateVolatility(priceHistory.last24h);
    const vol48h = calculateVolatility(priceHistory.last48h);
    const vol72h = calculateVolatility(priceHistory.last72h);
    
    document.getElementById('vol24h').textContent = vol24h.toFixed(2) + '%';
    document.getElementById('vol48h').textContent = vol48h.toFixed(2) + '%';
    document.getElementById('vol72h').textContent = vol72h.toFixed(2) + '%';
    
    // Add color coding based on volatility changes
    const vol24hElement = document.getElementById('vol24h');
    const vol48hElement = document.getElementById('vol48h');
    const vol72hElement = document.getElementById('vol72h');
    
    vol24hElement.className = 'float-end ' + getVolatilityClass(vol24h, vol48h);
    vol48hElement.className = 'float-end ' + getVolatilityClass(vol48h, vol72h);
    vol72hElement.className = 'float-end';
}

function getVolatilityClass(current, previous) {
    if (current > previous * 1.1) return 'text-danger';
    if (current < previous * 0.9) return 'text-success';
    return '';
}

async function fetchCurrentPrice() {
    const pair = document.getElementById('cryptoPair').value;
    try {
        const response = await fetch(`https://api.pro.coinbase.com/products/${pair}/ticker`);
        const data = await response.json();
        
        document.getElementById('currentPrice').value = parseFloat(data.price).toFixed(2);
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
        // Fetch historical prices for volatility
        await fetchHistoricalPrices();
        
        calculateAll();
    } catch (error) {
        console.error('Error fetching price:', error);
    }
}

function formatUSD(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function initializePairsTable() {
    const pairsTableBody = document.querySelector('#pairsTable tbody');
    const currentPair = document.getElementById('cryptoPair').value;
    
    pairsTableBody.innerHTML = TOP_PAIRS.map(pair => `
        <tr class="${pair === currentPair ? 'table-info fw-bold' : ''}" data-pair="${pair}">
            <td class="py-1">${pair}</td>
        </tr>
    `).join('');

    // Add click handlers
    pairsTableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', () => {
            const pair = row.dataset.pair;
            document.getElementById('cryptoPair').value = pair;
            updatePairHighlight(pair);
            calculateAll(); // Recalculate with new pair
        });
    });
}

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
