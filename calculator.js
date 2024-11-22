document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements
    const inputs = document.querySelectorAll('input');
    const cryptoPairSelect = document.getElementById('cryptoPair');
    const refreshPriceButton = document.getElementById('refreshPrice');
    
    // Add event listeners to all inputs
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateAll();
            updateWhatIfAnalysis();
        });
    });

    // Add event listener for cryptocurrency pair selection
    cryptoPairSelect.addEventListener('change', () => {
        fetchCurrentPrice();
    });

    // Add event listener for refresh price button
    refreshPriceButton.addEventListener('click', () => {
        fetchCurrentPrice();
    });

    // Initial calculations and price fetch
    calculateAll();
    updateWhatIfAnalysis();
    fetchCurrentPrice();

    // Set up automatic price refresh every 30 seconds
    setInterval(fetchCurrentPrice, 30000);
});

function calculateAll() {
    const values = getInputValues();
    if (!validateInputs(values)) return;

    const results = performCalculations(values);
    updateResults(results);
}

function getInputValues() {
    return {
        accountBalance: parseFloat(document.getElementById('accountBalance').value) || 0,
        riskPercentage: parseFloat(document.getElementById('riskPercentage').value) || 0,
        entryPrice: parseFloat(document.getElementById('entryPrice').value) || 0,
        stopLossPrice: parseFloat(document.getElementById('stopLossPrice').value) || 0,
        takeProfitPrice: parseFloat(document.getElementById('takeProfitPrice').value) || 0,
        leverage: parseFloat(document.getElementById('leverage').value) || 1,
        entryFee: parseFloat(document.getElementById('entryFee').value) || 0,
        exitFee: parseFloat(document.getElementById('exitFee').value) || 0
    };
}

function validateInputs(values) {
    const {
        accountBalance,
        riskPercentage,
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        leverage,
        entryFee,
        exitFee
    } = values;

    return accountBalance > 0 &&
           riskPercentage > 0 &&
           riskPercentage <= 100 &&
           entryPrice > 0 &&
           stopLossPrice > 0 &&
           takeProfitPrice > 0 &&
           leverage >= 1 &&
           entryFee >= 0 &&
           exitFee >= 0;
}

function performCalculations(values) {
    const {
        accountBalance,
        riskPercentage,
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        leverage,
        entryFee,
        exitFee
    } = values;

    // Calculate risk amount in USD
    const riskAmount = accountBalance * (riskPercentage / 100);

    // Calculate position size
    const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
    const positionSize = (riskAmount / stopLossDistance) * entryPrice;

    // Calculate risk-reward ratio
    const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);
    const riskRewardRatio = (takeProfitDistance / stopLossDistance).toFixed(2);

    // Calculate adjusted position size with leverage
    const adjustedPositionSize = positionSize * leverage;

    // Calculate required margin
    const requiredMargin = adjustedPositionSize / leverage;

    // Calculate fees
    const entryFeeAmount = (adjustedPositionSize * (entryFee / 100));
    const exitFeeAmount = (adjustedPositionSize * (exitFee / 100));
    const totalFees = entryFeeAmount + exitFeeAmount;

    // Calculate potential profit/loss
    const potentialProfit = (takeProfitDistance / entryPrice) * adjustedPositionSize - totalFees;
    const potentialLoss = (stopLossDistance / entryPrice) * adjustedPositionSize + totalFees;

    return {
        positionSize: formatUSD(positionSize),
        riskRewardRatio: `${riskRewardRatio}:1`,
        adjustedPositionSize: formatUSD(adjustedPositionSize),
        requiredMargin: formatUSD(requiredMargin),
        totalFees: formatUSD(totalFees),
        potentialProfit: formatUSD(potentialProfit),
        potentialLoss: formatUSD(potentialLoss)
    };
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

async function fetchCurrentPrice() {
    const cryptoPair = document.getElementById('cryptoPair').value;
    const currentPriceInput = document.getElementById('currentPrice');
    const lastUpdateSpan = document.getElementById('lastUpdate');
    const entryPriceInput = document.getElementById('entryPrice');

    try {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${cryptoPair}/spot`);
        const data = await response.json();
        const price = parseFloat(data.data.amount);

        // Update current price display
        currentPriceInput.value = price;
        entryPriceInput.value = price;
        lastUpdateSpan.textContent = new Date().toLocaleTimeString();

        // Recalculate values
        calculateAll();
        updateWhatIfAnalysis();
    } catch (error) {
        console.error('Error fetching price:', error);
        lastUpdateSpan.textContent = 'Error fetching price';
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
