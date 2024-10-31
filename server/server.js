// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'gmail'
    auth: {
        user: 'info@moneytrust.ca',
        pass: 'Money1234$'
        // For Gmail, you'll need to use an App Password if 2FA is enabled
    }
});

function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function generateEmailContent(orderData) {
    const isGoldOrder = orderData.orderType === 'gold';
    
    // Generate customer email content
    const customerEmailContent = `
        <h2>Order Confirmation - Money Trust</h2>
        <p>Dear ${orderData.fullName},</p>
        <p>Thank you for your order. Here are your transaction details:</p>
        
        <h3>Order Summary</h3>
        ${isGoldOrder ? `
            <p>Order Type: Gold Purchase</p>
            <p>Amount Paid: ${formatCurrency(orderData.orderSummary.sendAmount, 'CAD')}</p>
            <p>Gold Amount: ${orderData.orderSummary.receiveAmount.toFixed(3)} ${orderData.orderSummary.receiveCurrency}</p>
            <p>Gold Type: ${orderData.orderSummary.purity}</p>
        ` : `
            <p>Order Type: Currency Exchange</p>
            <p>You Send: ${formatCurrency(orderData.orderSummary.sendAmount, orderData.orderSummary.sendCurrency)}</p>
            <p>You Receive: ${formatCurrency(orderData.orderSummary.receiveAmount, orderData.orderSummary.receiveCurrency)}</p>
            <p>Exchange Rate: ${orderData.orderSummary.rate.toFixed(4)}</p>
        `}
        
        <h3>Delivery Details</h3>
        <p>Method: ${orderData.deliveryMethod === 'pickup' ? 'Office Pickup' : 'Home Delivery'}</p>
        ${orderData.deliveryMethod === 'pickup' ? 
            `<p>Pickup Location: ${orderData.pickupLocation}</p>` :
            `<p>Delivery Address: ${orderData.streetAddress}, ${orderData.city}, ${orderData.province} ${orderData.postalCode}</p>`
        }
        <p>Preferred Date: ${new Date(orderData.preferredDate).toLocaleDateString()}</p>
        
        <h3>Total</h3>
        <p>Delivery Fee: ${formatCurrency(orderData.deliveryFee, 'CAD')}</p>
        <p>Total Amount: ${formatCurrency(orderData.totalAmount, isGoldOrder ? 'CAD' : orderData.orderSummary.sendCurrency)}</p>
        
        <p>If you have any questions, please contact us at info@moneytrust.ca or call 1-888-555-0123.</p>
        
        <p>Best regards,<br>Money Trust Team</p>
    `;

    // Generate admin email content
    const adminEmailContent = `
        <h2>New Order Received</h2>
        
        <h3>Customer Information</h3>
        <p>Name: ${orderData.fullName}</p>
        <p>Email: ${orderData.email}</p>
        <p>Phone: ${orderData.phone}</p>
        
        <h3>Order Details</h3>
        ${isGoldOrder ? `
            <p>Order Type: Gold Purchase</p>
            <p>Amount Paid: ${formatCurrency(orderData.orderSummary.sendAmount, 'CAD')}</p>
            <p>Gold Amount: ${orderData.orderSummary.receiveAmount.toFixed(3)} ${orderData.orderSummary.receiveCurrency}</p>
            <p>Gold Type: ${orderData.orderSummary.purity}</p>
        ` : `
            <p>Order Type: Currency Exchange</p>
            <p>Send Amount: ${formatCurrency(orderData.orderSummary.sendAmount, orderData.orderSummary.sendCurrency)}</p>
            <p>Receive Amount: ${formatCurrency(orderData.orderSummary.receiveAmount, orderData.orderSummary.receiveCurrency)}</p>
            <p>Exchange Rate: ${orderData.orderSummary.rate.toFixed(4)}</p>
        `}
        
        <h3>Delivery Information</h3>
        <p>Method: ${orderData.deliveryMethod === 'pickup' ? 'Office Pickup' : 'Home Delivery'}</p>
        <p>Address: ${orderData.streetAddress}, ${orderData.city}, ${orderData.province} ${orderData.postalCode}</p>
        <p>Preferred Date: ${new Date(orderData.preferredDate).toLocaleDateString()}</p>
        
        <h3>Total</h3>
        <p>Delivery Fee: ${formatCurrency(orderData.deliveryFee, 'CAD')}</p>
        <p>Total Amount: ${formatCurrency(orderData.totalAmount, isGoldOrder ? 'CAD' : orderData.orderSummary.sendCurrency)}</p>
    `;

    return {
        customerEmail: customerEmailContent,
        adminEmail: adminEmailContent
    };
}

app.post('/api/submit-order', async (req, res) => {
    try {
        const orderData = req.body;
        const emailContent = generateEmailContent(orderData);

        // Send email to customer
        await transporter.sendMail({
            from: '"Money Trust" <info@moneytrust.ca>',
            to: orderData.email,
            subject: 'Money Trust - Order Confirmation',
            html: emailContent.customerEmail
        });

        // Send email to admin
        await transporter.sendMail({
            from: '"Money Trust System" <info@moneytrust.ca>',
            to: 'info@moneytrust.ca',
            subject: `New Order - ${orderData.orderType.toUpperCase()}`,
            html: emailContent.adminEmail
        });

        res.json({ success: true, message: 'Order processed successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process order. Please try again.' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});