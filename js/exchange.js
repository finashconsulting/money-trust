let exchangeRates = {};
const API_KEY = 'cur_live_J7nMmu9sTuSG8QLkh7fY1PEL8UnE8331PtS3qcpx';
const API_BASE_URL = 'https://api.currencyapi.com/v3';

// Define supported currencies with their full names and flags
const SUPPORTED_CURRENCIES = {
    'AUD': {
        name: 'Australian Dollar',
        flag: 'au',
        symbol: 'A$'
    },
    'CAD': {
        name: 'Canadian Dollar',
        flag: 'ca',
        symbol: 'C$'
    },
    'CHF': {
        name: 'Swiss Franc',
        flag: 'ch',
        symbol: 'Fr'
    },
    'EUR': {
        name: 'Euro',
        flag: 'eu',
        symbol: '€'
    },
    'GBP': {
        name: 'British Pound',
        flag: 'gb',
        symbol: '£'
    },
    'HKD': {
        name: 'Hong Kong Dollar',
        flag: 'hk',
        symbol: 'HK$'
    },
    'ILS': {
        name: 'Israeli Shekel',
        flag: 'il',
        symbol: '₪'
    },
    'INR': {
        name: 'Indian Rupee',
        flag: 'in',
        symbol: '₹'
    },
    'JPY': {
        name: 'Japanese Yen',
        flag: 'jp',
        symbol: '¥'
    },
    'MXN': {
        name: 'Mexican Peso',
        flag: 'mx',
        symbol: 'Mex$'
    },
    'NZD': {
        name: 'New Zealand Dollar',
        flag: 'nz',
        symbol: 'NZ$'
    },
    'SEK': {
        name: 'Swedish Krona',
        flag: 'se',
        symbol: 'kr'
    },
    'USD': {
        name: 'US Dollar',
        flag: 'us',
        symbol: '$'
    },
    'AED': {
        name: 'UAE Dirham',
        flag: 'ae',
        symbol: 'د.إ'
    },
    'CNY': {
        name: 'Chinese Yuan',
        flag: 'cn',
        symbol: '¥'
    }
};

let currentOrderDetails = {
    sendAmount: 0,
    sendCurrency: '',
    receiveAmount: 0,
    receiveCurrency: '',
    rate: 0,
    type: 'currency'
};

// Function to fetch live exchange rates
async function fetchExchangeRates() {
    try {
        console.log('Fetching live exchange rates...');
        const currencies = Object.keys(SUPPORTED_CURRENCIES).join(',');
        const response = await fetch(`${API_BASE_URL}/latest?apikey=${API_KEY}&base_currency=CAD&currencies=${currencies}`);
        const data = await response.json();

        // Update the rates object
        exchangeRates = {};
        const currencies_list = Object.keys(SUPPORTED_CURRENCIES);
        
        // Generate all currency pair combinations
        currencies_list.forEach(fromCurrency => {
            currencies_list.forEach(toCurrency => {
                if (fromCurrency !== toCurrency) {
                    if (fromCurrency === 'CAD') {
                        exchangeRates[`${fromCurrency}-${toCurrency}`] = data.data[toCurrency].value;
                    } else if (toCurrency === 'CAD') {
                        exchangeRates[`${fromCurrency}-${toCurrency}`] = 1 / data.data[fromCurrency].value;
                    } else {
                        // Cross rate calculation
                        const rateFromCAD = data.data[toCurrency].value;
                        const rateToCAD = 1 / data.data[fromCurrency].value;
                        exchangeRates[`${fromCurrency}-${toCurrency}`] = rateFromCAD * rateToCAD;
                    }
                }
            });
        });

        console.log('Exchange rates updated:', exchangeRates);
        
        // Update rate refresh indicator
        const rateDisplay = document.querySelector('#currencyForm .rate-display');
        if (rateDisplay) {
            const currentTime = new Date().toLocaleTimeString();
            if (!rateDisplay.querySelector('.rate-refresh')) {
                const refreshSpan = document.createElement('span');
                refreshSpan.className = 'rate-refresh';
                rateDisplay.appendChild(refreshSpan);
            }
            rateDisplay.querySelector('.rate-refresh').textContent = `(Updated ${currentTime})`;
        }

        // Recalculate if there's an active conversion
        if (document.getElementById('currencyForm').classList.contains('active')) {
            calculateExchange();
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to static rates if API fails
        exchangeRates = {
            'CAD-USD': 0.74,
            'USD-CAD': 1.35,
            // Add other static rates as needed
        };
    }
}

// Function to create currency selector with flags
function updateCurrencySelectors() {
    const selectors = ['sendCurrency', 'receiveCurrency'];
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            // Create container for select if it doesn't exist
            let container = select.closest('.currency-select-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'currency-select-container';
                select.parentNode.replaceChild(container, select);
                container.appendChild(select);
            }

            // Create and add flag element if it doesn't exist
            let flagElement = container.querySelector('.selected-flag');
            if (!flagElement) {
                flagElement = document.createElement('img');
                flagElement.className = 'selected-flag';
                container.appendChild(flagElement);
            }

            // Clear existing options
            select.innerHTML = '';

            // Add options with flags
// In your updateCurrencySelectors function
Object.entries(SUPPORTED_CURRENCIES).forEach(([code, details]) => {
    const option = document.createElement('option');
    option.value = code;
    option.setAttribute('data-flag', details.flag);
    // For dropdown full name
    option.textContent = `${code} ${details.name}`;
    // For selected display (just code)
    option.setAttribute('data-display', code);
    select.appendChild(option);
});

// Add this style directly to the select element
select.style.textAlign = 'left';
select.style.paddingRight = '30px'; // Space for the dropdown arrow

            // Set default values
            if (selectorId === 'sendCurrency') {
                select.value = 'CAD';
            } else {
                select.value = 'USD';
            }
            updateFlag(select, flagElement);

            // Add change event listener for flag updates
            select.addEventListener('change', () => {
                updateFlag(select, flagElement);
                calculateExchange();
            });
        }
    });
}

// Function to update flag when currency is changed
function updateFlag(select, flagElement) {
    const selectedOption = select.options[select.selectedIndex];
    const countryCode = selectedOption.getAttribute('data-flag');
    flagElement.src = `https://flagcdn.com/w40/${countryCode}.png`;
    flagElement.alt = `${selectedOption.value} flag`;
    
    // Update the visible text to show only the currency code
    select.setAttribute('data-display', selectedOption.value);
}

// Initialize exchange component
async function initializeExchange() {
    // Update currency selectors
    updateCurrencySelectors();

    // Fetch initial rates
    await fetchExchangeRates();

    // Set up rate refresh interval (every 5 minutes)
    setInterval(fetchExchangeRates, 300000);

    // Add event listeners
    document.getElementById('sendAmount')?.addEventListener('input', formatAmount);
    document.getElementById('sendAmount')?.addEventListener('input', calculateExchange);

    // Set minimum date for preferred date to today
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('preferredDate')) {
        document.getElementById('preferredDate').min = today;
    }

    // Initial calculation
    calculateExchange();
}

// Format amount with commas
function formatAmount(e) {
    let value = e.target.value.replace(/[^\d.]/g, '');
    if (value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            value = numValue.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
            });
            e.target.value = value;
        }
    }
}

// Switch between currency and gold tabs
function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => {
        if (t.textContent.toLowerCase().includes(tab)) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    const currencyForm = document.getElementById('currencyForm');
    const goldForm = document.getElementById('goldForm');

    if (tab === 'currency') {
        currencyForm.classList.add('active');
        goldForm.classList.remove('active');
        calculateExchange();
    } else {
        goldForm.classList.add('active');
        currencyForm.classList.remove('active');
        calculateGold();
    }
}

// Swap currencies function
function swapCurrencies() {
    const sendCurrency = document.getElementById('sendCurrency');
    const receiveCurrency = document.getElementById('receiveCurrency');
    const sendAmount = document.getElementById('sendAmount');
    const receiveAmount = document.getElementById('receiveAmount');

    // Store current values
    const tempCurrency = sendCurrency.value;
    const tempAmount = sendAmount.value;

    // Swap currencies
    sendCurrency.value = receiveCurrency.value;
    receiveCurrency.value = tempCurrency;

    // Update flags
    const sendFlag = sendCurrency.parentNode.querySelector('.selected-flag');
    const receiveFlag = receiveCurrency.parentNode.querySelector('.selected-flag');
    updateFlag(sendCurrency, sendFlag);
    updateFlag(receiveCurrency, receiveFlag);

    // Update amounts and recalculate
    sendAmount.value = receiveAmount.value;
    calculateExchange();
}

// Calculate exchange rates
function calculateExchange() {
    const sendAmountStr = document.getElementById('sendAmount').value.replace(/,/g, '');
    const sendAmount = parseFloat(sendAmountStr) || 0;
    const sendCurrency = document.getElementById('sendCurrency').value;
    const receiveCurrency = document.getElementById('receiveCurrency').value;
    const rateKey = `${sendCurrency}-${receiveCurrency}`;
    
    if (exchangeRates[rateKey]) {
        const result = (sendAmount * exchangeRates[rateKey]).toFixed(2);
        
        // Format result with commas
        document.getElementById('receiveAmount').value = parseFloat(result).toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
        
        // Store current order details
        currentOrderDetails = {
            sendAmount: sendAmount,
            sendCurrency: sendCurrency,
            receiveAmount: parseFloat(result),
            receiveCurrency: receiveCurrency,
            rate: exchangeRates[rateKey],
            type: 'currency'
        };
        
        // Update rate display
        const rateDisplay = document.querySelector('#currencyForm .rate-display');
        const rateText = rateDisplay.querySelector('.rate-text') || rateDisplay;
        rateText.textContent = `1 ${sendCurrency} → ${exchangeRates[rateKey].toFixed(4)} ${receiveCurrency}`;
    }
}

// Show order form
function showOrderForm() {
    const orderFormContainer = document.getElementById('orderFormContainer');
    if (orderFormContainer) {
        document.body.style.overflow = 'hidden';
        orderFormContainer.style.display = 'block';
        updateOrderSummary();
    }
}

// Go back to exchange
function goBackToExchange() {
    const orderFormContainer = document.getElementById('orderFormContainer');
    if (orderFormContainer) {
        document.body.style.overflow = '';
        orderFormContainer.style.display = 'none';
    }
}

// Update order summary
function updateOrderSummary() {
    document.getElementById('summaryAmount').textContent = 
        `${currentOrderDetails.sendAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: currentOrderDetails.sendCurrency
        })}`;
    
    document.getElementById('summaryReceive').textContent = 
        `${currentOrderDetails.receiveAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: currentOrderDetails.receiveCurrency
        })}`;
    
    document.getElementById('summaryRate').textContent = 
        `1 ${currentOrderDetails.sendCurrency} = ${currentOrderDetails.rate.toFixed(4)} ${currentOrderDetails.receiveCurrency}`;

    document.getElementById('exchangeAmount').textContent = 
        `${currentOrderDetails.sendAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: currentOrderDetails.sendCurrency
        })}`;
    
    updateTotalAmount();
}

// Update delivery method and total
function updateDeliveryMethod() {
    const isDelivery = document.getElementById('delivery').checked;
    const pickupLocationSection = document.getElementById('pickupLocationSection');
    const deliveryFeeRow = document.getElementById('deliveryFeeRow');
    
    if (isDelivery) {
        pickupLocationSection.style.display = 'none';
        document.getElementById('pickupLocation').required = false;
        deliveryFeeRow.querySelector('span:last-child').textContent = '$30.00';
    } else {
        pickupLocationSection.style.display = 'block';
        document.getElementById('pickupLocation').required = true;
        deliveryFeeRow.querySelector('span:last-child').textContent = '$0.00';
    }
    
    updateTotalAmount();
}

// Update total amount
function updateTotalAmount() {
    const isDelivery = document.getElementById('delivery').checked;
    const deliveryFee = isDelivery ? 30 : 0;
    const total = currentOrderDetails.sendAmount + deliveryFee;
    
    document.getElementById('totalAmount').textContent = 
        `${total.toLocaleString('en-US', {
            style: 'currency',
            currency: currentOrderDetails.sendCurrency
        })}`;
}

// Submit order
async function submitOrder(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        alert('Order submitted successfully! Check your email for confirmation.');
        goBackToExchange();
        event.target.reset();
    } catch (error) {
        alert('Error submitting order. Please try again.');
        console.error('Order submission error:', error);
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm Order';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeExchange();

    // Set up modal close on outside click
    const orderFormContainer = document.getElementById('orderFormContainer');
    if (orderFormContainer) {
        orderFormContainer.addEventListener('click', function(e) {
            if (e.target === orderFormContainer) {
                goBackToExchange();
            }
        });
    }

    // Set minimum date for preferred date to today
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('preferredDate')) {
        document.getElementById('preferredDate').min = today;
    }
});