import React, { useState } from 'react';
import { MessageSquare, X, Send, Bug, Lightbulb, Heart } from 'lucide-react';
import { api } from '../services/api';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'general', name: 'General Feedback', icon: Heart },
    { id: 'bug', name: 'Bug Report', icon: Bug },
    { id: 'feature_request', name: 'Feature Request', icon: Lightbulb }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    setLoading(true);
    try {
      await api.submitFeedback({
        message: message.trim(),
        category,
        priority: 'medium',
        additional_data: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setCategory('general');
      }, 2000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage('');
    setCategory('general');
    setSubmitted(false);
  };

  // Auto-report JavaScript errors
  React.useEffect(() => {
    const handleError = async (event) => {
      try {
        await api.reportError({
          error_type: 'JavaScript Error',
          error_message: event.message,
          stack_trace: event.error?.stack,
          url: window.location.href,
          additional_data: {
            filename: event.filename,
            line: event.lineno,
            column: event.colno
          }
        });
      } catch (error) {
        console.error('Failed to report error:', error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (submitted) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
          <Heart size={20} />
          <span>Thank you for your feedback!</span>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Send Feedback"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-80 p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare size={18} />
            Send Feedback
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex-1 p-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${
                      category === cat.id
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think or report an issue..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="4"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-3">
          Your feedback helps us improve the Medical Licensing Guide.
        </p>
      </div>
    </div>
  );
};

export default FeedbackWidget;