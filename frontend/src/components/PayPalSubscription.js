import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const PayPalSubscription = ({ planType, planDetails, onSuccess, onError, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const initialOptions = {
        "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "test_paypal_client_id",
        currency: "EUR",
        intent: "subscription",
        vault: true,
        "disable-funding": "paylater,card" // Only show PayPal option
    };

    const createSubscription = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/paypal/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan_type: planType,
                    return_url: `${window.location.origin}/subscription/success`,
                    cancel_url: `${window.location.origin}/subscription/cancel`
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.approval_url) {
                // Redirect to PayPal for approval
                window.location.href = data.approval_url;
            } else {
                throw new Error(data.detail || 'Failed to create subscription');
            }
        } catch (error) {
            console.error('PayPal subscription error:', error);
            setError(error.message);
            onError && onError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (data) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/paypal/approve-subscription/${data.subscriptionID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                onSuccess && onSuccess(result);
            } else {
                throw new Error(result.detail || 'Failed to approve subscription');
            }
        } catch (error) {
            console.error('PayPal approval error:', error);
            setError(error.message);
            onError && onError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="paypal-subscription-container">
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-blue-800">PayPal Subscription</h3>
                </div>
                <p className="text-sm text-blue-700">
                    <strong>{planDetails.name}</strong> - €{planDetails.price}/lună
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    Plătește securizat cu PayPal. Poți anula oricând din contul tău.
                </p>
            </div>

            <PayPalScriptProvider options={initialOptions}>
                <div className="paypal-buttons-container">
                    <PayPalButtons
                        style={{
                            layout: 'vertical',
                            color: 'blue',
                            shape: 'rect',
                            label: 'subscribe',
                            height: 40
                        }}
                        createSubscription={createSubscription}
                        onApprove={handleApprove}
                        onError={(err) => {
                            console.error('PayPal error:', err);
                            setError('A apărut o eroare cu PayPal. Te rugăm să încerci din nou.');
                            onError && onError(err);
                        }}
                        onCancel={() => {
                            console.log('PayPal cancelled');
                            onCancel && onCancel();
                        }}
                        disabled={loading}
                    />
                </div>
            </PayPalScriptProvider>

            {loading && (
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Se procesează...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayPalSubscription;