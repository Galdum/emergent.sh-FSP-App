import React, { useState, useEffect } from 'react';
import { Check, X, Shield, FileText, AlertCircle } from 'lucide-react';

const GDPRConsentModal = ({ isOpen, onAccept, onDecline }) => {
    const [privacyPolicy, setPrivacyPolicy] = useState(null);
    const [termsOfService, setTermsOfService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('terms');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [analyticsConsent, setAnalyticsConsent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadLegalDocuments();
        }
    }, [isOpen]);

    const loadLegalDocuments = async () => {
        try {
            setLoading(true);
            
            try {
                const [privacyResponse, termsResponse] = await Promise.all([
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/gdpr/privacy-policy?lang=ro`),
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/gdpr/terms-of-service?lang=ro`)
                ]);

                if (privacyResponse.ok) {
                    const privacyData = await privacyResponse.json();
                    setPrivacyPolicy(privacyData);
                } else {
                    console.error('Failed to load privacy policy:', privacyResponse.status);
                    // Set fallback data
                    setPrivacyPolicy({
                        version: "1.0",
                        effective_date: "2025-01-01",
                        content: "Politica de confidențialitate nu este disponibilă momentan. Vă rugăm încercați mai târziu."
                    });
                }

                if (termsResponse.ok) {
                    const termsData = await termsResponse.json();
                    setTermsOfService(termsData);
                } else {
                    console.error('Failed to load terms of service:', termsResponse.status);
                    // Set fallback data
                    setTermsOfService({
                        version: "1.0",
                        effective_date: "2025-01-01",
                        content: "Termenii și condițiile nu sunt disponibile momentan. Vă rugăm încercați mai târziu."
                    });
                }
            } catch (error) {
                console.error('Network error loading legal documents:', error);
                // Set fallback data for both
                setPrivacyPolicy({
                    version: "1.0",
                    effective_date: "2025-01-01",
                    content: "Politica de confidențialitate nu este disponibilă momentan. Vă rugăm încercați mai târziu."
                });
                setTermsOfService({
                    version: "1.0",
                    effective_date: "2025-01-01",
                    content: "Termenii și condițiile nu sunt disponibile momentan. Vă rugăm încercați mai târziu."
                });
            }
        } catch (error) {
            console.error('Failed to load legal documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!acceptedTerms || !acceptedPrivacy) {
            alert('Trebuie să acceptați atât Termenii și Condițiile cât și Politica de Confidențialitate pentru a continua.');
            return;
        }

        try {
            // Record consent in backend
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/gdpr/consent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        privacy_version: privacyPolicy?.version || '1.0',
                        terms_version: termsOfService?.version || '1.0',
                        marketing_consent: marketingConsent,
                        analytics_consent: analyticsConsent
                    })
                });
            }

            // Store consent in localStorage as backup
            localStorage.setItem('gdpr_consent', JSON.stringify({
                accepted: true,
                date: new Date().toISOString(),
                privacy_version: privacyPolicy?.version || '1.0',
                terms_version: termsOfService?.version || '1.0',
                marketing_consent: marketingConsent,
                analytics_consent: analyticsConsent
            }));

            onAccept({
                termsAccepted: acceptedTerms,
                privacyAccepted: acceptedPrivacy,
                marketingConsent,
                analyticsConsent
            });
        } catch (error) {
            console.error('Failed to record consent:', error);
            // Still proceed with local consent
            onAccept({
                termsAccepted: acceptedTerms,
                privacyAccepted: acceptedPrivacy,
                marketingConsent,
                analyticsConsent
            });
        }
    };

    const renderDocument = (document, title) => {
        if (!document) return <div className="text-center text-gray-500">Se încarcă...</div>;

        return (
            <div className="prose prose-sm max-w-none">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">{title}</h3>
                    <p className="text-sm text-blue-700">
                        Versiunea {document.version} • Intră în vigoare: {document.effective_date}
                    </p>
                </div>
                <div 
                    className="text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                        __html: document.content && document.content.replace ? 
                            document.content.replace(/\n/g, '<br>').replace(/## /g, '<h4 class="font-semibold text-gray-800 mt-4 mb-2">').replace(/# /g, '<h3 class="font-bold text-gray-900 text-lg mt-6 mb-3">') 
                            : 'Conținut indisponibil. Vă rugăm încercați mai târziu.'
                    }}
                />
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <Shield size={32} />
                        <div>
                            <h2 className="text-2xl font-bold">Protecția Datelor și Termenii de Utilizare</h2>
                            <p className="text-blue-200">FSP Navigator - Conformitate GDPR</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab('terms')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeTab === 'terms' 
                                    ? 'bg-white text-blue-600 font-semibold' 
                                    : 'text-blue-200 hover:text-white'
                            }`}
                        >
                            📋 Termeni și Condiții
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeTab === 'privacy' 
                                    ? 'bg-white text-blue-600 font-semibold' 
                                    : 'text-blue-200 hover:text-white'
                            }`}
                        >
                            🔒 Politica de Confidențialitate
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Se încarcă documentele legale...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'terms' && renderDocument(termsOfService, 'Termeni și Condiții de Utilizare')}
                            {activeTab === 'privacy' && renderDocument(privacyPolicy, 'Politica de Confidențialitate')}
                        </>
                    )}
                </div>

                {/* Footer with checkboxes and buttons */}
                <div className="border-t bg-gray-50 p-6 rounded-b-2xl">
                    <div className="space-y-4 mb-6">
                        {/* Required consents */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <AlertCircle size={18} />
                                Consimțăminte Obligatorii
                            </h4>
                            
                            <label className="flex items-start gap-3 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                    <strong>Accept Termenii și Condițiile</strong> - Sunt de acord cu toate prevederile și înțeleg că această aplicație este doar un instrument educativ.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptedPrivacy}
                                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                    <strong>Accept Politica de Confidențialitate</strong> - Sunt de acord cu modul în care sunt procesate datele mele personale.
                                </span>
                            </label>
                        </div>

                        {/* Optional consents */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-3">Consimțăminte Opționale</h4>
                            
                            <label className="flex items-start gap-3 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={analyticsConsent}
                                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                    <strong>Analize de utilizare</strong> - Permit colectarea de date anonime pentru îmbunătățirea aplicației.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={marketingConsent}
                                    onChange={(e) => setMarketingConsent(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                    <strong>Comunicări marketing</strong> - Doresc să primesc updates și oferte despre aplicație.
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onDecline}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            Refuz și Ies
                        </button>
                        
                        {/* Demo/Testing Mode Button */}
                        <button
                            onClick={() => {
                                localStorage.setItem('gdpr_consent', JSON.stringify({
                                    accepted: true,
                                    date: new Date().toISOString(),
                                    privacy_version: '1.0',
                                    terms_version: '1.0',
                                    marketing_consent: false,
                                    analytics_consent: false,
                                    demo_mode: true
                                }));
                                onAccept({
                                    termsAccepted: true,
                                    privacyAccepted: true,
                                    marketingConsent: false,
                                    analyticsConsent: false
                                });
                            }}
                            className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                        >
                            Demo Mode
                        </button>
                        
                        <button
                            onClick={handleAccept}
                            disabled={!acceptedTerms || !acceptedPrivacy || loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Accept și Continuu
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        Prin acceptare, confirmați că aveți cel puțin 16 ani și că înțelegeți implicațiile acestor termeni conform GDPR.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GDPRConsentModal;