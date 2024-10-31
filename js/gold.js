// Gold prices and conversion rates
const goldPrices = {
    CAD: 2485.75  // Price per oz in CAD
};

const goldPurityRates = {
    '24K': 1.0,      // 99.99% pure
    '22K': 0.9167,   // 91.67% pure
    '18K': 0.75      // 75.00% pure
};

// Conversion factors
const weightConversions = {
    'oz': 1,
    'g': 1/31.1035,  // 1 oz = 31.1035g
    'kg': 1/0.0311035 // 1 oz = 0.0311035kg
};

let currentGoldOrder = {
    payAmount: 0,
    currency: 'CAD',
    receiveAmount: 0,
    unit: 'oz',
    purity: '24K',
    type: 'gold'
};

let lastUpdatedField = null;

// Initialize gold component
function initializeGold() {
    // Add event listeners for the pay amount
    const goldPayInput = document.getElementById('goldPayAmount');
    if (goldPayInput) {
        goldPayInput.addEventListener('input', (e) => {
            lastUpdatedField = 'pay';
            formatAmount(e);
            calculateGold();
        });
        goldPayInput.addEventListener('paste', handlePaste);
    }

    // Add event listeners for the receive amount
    const goldReceiveInput = document.getElementById('goldReceiveAmount');
    if (goldReceiveInput) {
        goldReceiveInput.addEventListener('input', (e) => {
            lastUpdatedField = 'receive';
            formatAmount(e);
            calculateGoldReverse();
        });
        goldReceiveInput.addEventListener('paste', handlePaste);
    }

    // Add event listeners for selects
    document.getElementById('goldType')?.addEventListener('change', () => {
        if (lastUpdatedField === 'pay') {
            calculateGold();
        } else {
            calculateGoldReverse();
        }
    });
    
    document.getElementById('goldPurity')?.addEventListener('change', () => {
        if (lastUpdatedField === 'pay') {
            calculateGold();
        } else {
            calculateGoldReverse();
        }
    });

    // Initial calculation
    calculateGold();
}

// Calculate gold amount from CAD
function calculateGold() {
    const amountStr = document.getElementById('goldPayAmount')?.value.replace(/[^\d.]/g, '') || '0';
    const amount = parseFloat(amountStr) || 0;
    const goldType = document.getElementById('goldType')?.value || 'oz';
    const purity = document.getElementById('goldPurity')?.value || '24K';

    const purityFactor = goldPurityRates[purity];
    const conversionFactor = weightConversions[goldType];

    // Calculate gold amount in the selected unit
    const goldAmount = (amount / goldPrices.CAD) * purityFactor / conversionFactor;

    // Store current order details
    currentGoldOrder = {
        payAmount: amount,
        currency: 'CAD',
        receiveAmount: goldAmount,
        unit: goldType,
        purity: purity,
        price: goldPrices.CAD,
        type: 'gold'
    };

    // Update receive amount display
    if (document.getElementById('goldReceiveAmount')) {
        document.getElementById('goldReceiveAmount').value = goldAmount.toFixed(3);
    }
    
    updateRateDisplay();
}

// Calculate CAD amount from gold
function calculateGoldReverse() {
    const goldAmountStr = document.getElementById('goldReceiveAmount')?.value.replace(/[^\d.]/g, '') || '0';
    const goldAmount = parseFloat(goldAmountStr) || 0;
    const goldType = document.getElementById('goldType')?.value || 'oz';
    const purity = document.getElementById('goldPurity')?.value || '24K';

    const purityFactor = goldPurityRates[purity];
    const conversionFactor = weightConversions[goldType];

    // Calculate CAD amount
    const cadAmount = goldAmount * goldPrices.CAD * conversionFactor / purityFactor;

    // Store current order details
    currentGoldOrder = {
        payAmount: cadAmount,
        currency: 'CAD',
        receiveAmount: goldAmount,
        unit: goldType,
        purity: purity,
        price: goldPrices.CAD,
        type: 'gold'
    };

    // Update pay amount display
    if (document.getElementById('goldPayAmount')) {
        document.getElementById('goldPayAmount').value = cadAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    updateRateDisplay();
}

// Update rate display
function updateRateDisplay() {
    const rateDisplay = document.querySelector('#goldForm .rate-display');
    if (rateDisplay) {
        rateDisplay.textContent = `Current gold price: ${goldPrices.CAD.toLocaleString('en-US', {
            style: 'currency',
            currency: 'CAD'
        })}/oz`;
    }
}

// Format amount for gold
function formatAmount(e) {
    // Store cursor position
    const input = e.target;
    const cursorPos = input.selectionStart;
    const prevLength = input.value.length;

    // Remove any non-digit characters except decimal point
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
        const firstDecimalIndex = value.indexOf('.');
        value = value.slice(0, firstDecimalIndex + 1) + value.slice(firstDecimalIndex + 1).replace(/\./g, '');
    }

    // Split number into whole and decimal parts
    let [whole, decimal] = value.split('.');
    
    // Add commas to whole number part
    if (whole) {
        whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Combine whole and decimal parts
    value = whole + (decimal !== undefined ? '.' + decimal : '');

    // Update input value
    input.value = value;

    // Calculate new cursor position
    const addedChars = input.value.length - prevLength;
    const newPosition = cursorPos + addedChars;
    
    // Restore cursor position
    input.setSelectionRange(cursorPos, cursorPos);
}

// Handle paste events
function handlePaste(e) {
    e.preventDefault();
    
    // Get pasted content
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    
    // Clean the pasted content to only allow numbers and decimal
    const cleanedText = pastedText.replace(/[^\d.]/g, '');
    
    // Get the input element
    const input = e.target;
    
    // Get current value and selection
    const currentValue = input.value;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    
    // Create new value
    const newValue = currentValue.slice(0, selectionStart) + cleanedText + currentValue.slice(selectionEnd);
    
    // Update the input value
    input.value = newValue;
    
    // Trigger the format amount function
    formatAmount({ target: input });
}

// Show gold order form
function showGoldOrderForm() {
    const orderFormContainer = document.getElementById('orderFormContainer');
    if (orderFormContainer) {
        document.body.style.overflow = 'hidden';
        orderFormContainer.style.display = 'block';
        updateGoldOrderSummary();
    }
}

// Update gold order summary
function updateGoldOrderSummary() {
    document.getElementById('summaryAmount').textContent = 
        `${currentGoldOrder.payAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: currentGoldOrder.currency
        })}`;
    
    document.getElementById('summaryReceive').textContent = 
        `${currentGoldOrder.receiveAmount.toFixed(3)} ${currentGoldOrder.unit} of ${currentGoldOrder.purity} Gold`;
    
    document.getElementById('summaryRate').textContent = 
        `Current Price: ${currentGoldOrder.price.toLocaleString('en-US', {
            style: 'currency',
            currency: currentGoldOrder.currency
        })}/oz`;

    document.getElementById('exchangeAmount').textContent = 
        `${currentGoldOrder.payAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: currentGoldOrder.currency
        })}`;
    
    updateTotalAmount();
}

// Add to both exchange.js and gold.js

async function submitOrder(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        // Get the current order details (either from currentOrderDetails or currentGoldOrder)
        const orderDetails = window.currentGoldOrder || window.currentOrderDetails;

        // Gather form data
        const formData = {
            // Order Details
            orderType: orderDetails.type,
            orderSummary: {
                sendAmount: orderDetails.type === 'currency' ? orderDetails.sendAmount : orderDetails.payAmount,
                sendCurrency: orderDetails.type === 'currency' ? orderDetails.sendCurrency : 'CAD',
                receiveAmount: orderDetails.receiveAmount,
                receiveCurrency: orderDetails.type === 'currency' ? orderDetails.receiveCurrency : `${orderDetails.unit} of ${orderDetails.purity} Gold`,
                rate: orderDetails.rate
            },
            
            // Personal Details
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            
            // Address
            streetAddress: document.getElementById('streetAddress').value,
            city: document.getElementById('city').value,
            province: document.getElementById('province').value,
            postalCode: document.getElementById('postalCode').value,
            
            // Delivery Method
            deliveryMethod: document.querySelector('input[name="delivery-method"]:checked').value,
            pickupLocation: document.getElementById('pickupLocation')?.value,
            preferredDate: document.getElementById('preferredDate').value,
            
            // Totals
            deliveryFee: document.querySelector('input[name="delivery-method"][value="delivery"]')?.checked ? 30 : 0,
            totalAmount: document.getElementById('totalAmount').textContent
        };

        // Send to server
        const response = await fetch('/api/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit order');
        }

        // Show success message
        alert('Order submitted successfully! Check your email for confirmation.');
        goBackToExchange();
        event.target.reset();
    } catch (error) {
        alert('Error submitting order. Please try again or contact support.');
        console.error('Order submission error:', error);
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm Order';
    }
}

function updateDeliveryMethod() {
    const isDelivery = document.querySelector('input[name="delivery-method"][value="delivery"]')?.checked;
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeGold);