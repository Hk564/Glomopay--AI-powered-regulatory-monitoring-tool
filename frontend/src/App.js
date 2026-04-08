import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Quality Feedback Form Component
function QualityFeedbackForm({ onSubmit, onCancel }) {
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [comment, setComment] = useState('');

  const issueOptions = [
    { value: 'summary_unclear', label: 'Summary unclear' },
    { value: 'impact_incorrect', label: 'Impact assessment incorrect' },
    { value: 'action_items_missing', label: 'Action items missing or incomplete' },
    { value: 'too_generic', label: 'Too generic / not specific enough' },
    { value: 'missed_key_point', label: 'Missed a key point' }
  ];

  const toggleIssue = (issue) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter(i => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const handleSubmit = () => {
    onSubmit(false, selectedIssues.length > 0 ? selectedIssues : null, comment || null);
  };

  return (
    <div className="space-y-4 mt-4">
      <p className="text-sm text-gray-700 font-medium">What could be improved? (Select all that apply)</p>
      
      <div className="space-y-2">
        {issueOptions.map(option => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={selectedIssues.includes(option.value)}
              onChange={() => toggleIssue(option.value)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional comments (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us more about what could be improved..."
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Submit Feedback
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function App() {
  const [updates, setUpdates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('data-ingestion'); // data-ingestion, compliance-dashboard, manual-entry, analysis-detail
  const [filterSource, setFilterSource] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Feedback state
  const [showRelevanceFeedback, setShowRelevanceFeedback] = useState(false);
  const [showQualityFeedback, setShowQualityFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  // Form state for manual entry
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    source: 'RBI',
    published_at: '',
    summary: '',
    raw_content: ''
  });

  // Fetch updates
  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterSource !== 'all' ? { source: filterSource } : {};
      const response = await axios.get(`${API_URL}/api/regulatory-updates`, { params });
      setUpdates(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch updates: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch AI analysis for a regulatory update
  const fetchAiAnalysis = async (updateId) => {
    setLoading(true);
    setFeedbackSubmitted(false);
    setExistingFeedback(null);
    try {
      const response = await axios.get(`${API_URL}/api/ai-analysis/by-update/${updateId}`);
      setAiAnalysis(response.data.data);
      setActiveTab('analysis-detail');
      
      // Fetch existing feedback
      await fetchExistingFeedback(response.data.data.id);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('AI analysis not available for this update yet. Please wait for processing.');
      } else {
        setError('Failed to fetch AI analysis: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing feedback
  const fetchExistingFeedback = async (analysisId) => {
    try {
      const response = await axios.get(`${API_URL}/api/ai-feedback/${analysisId}`);
      if (response.data.has_feedback) {
        setExistingFeedback(response.data.data);
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to fetch existing feedback:', err);
    }
  };

  // Submit relevance feedback
  const submitRelevanceFeedback = async (approved, correctScore = null, reason = null) => {
    try {
      await axios.post(`${API_URL}/api/ai-feedback/relevance`, {
        ai_analysis_id: aiAnalysis.id,
        approved,
        correct_score: correctScore,
        reason
      });
      setSuccessMessage('Thank you for your feedback!');
      setShowRelevanceFeedback(false);
      setFeedbackSubmitted(true);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchExistingFeedback(aiAnalysis.id);
    } catch (err) {
      setError('Failed to submit feedback: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Submit analysis quality feedback
  const submitQualityFeedback = async (useful, issueTypes = null, comment = null) => {
    try {
      await axios.post(`${API_URL}/api/ai-feedback/analysis-quality`, {
        ai_analysis_id: aiAnalysis.id,
        useful,
        issue_types: issueTypes,
        comment
      });
      setSuccessMessage('Thank you for your feedback!');
      setShowQualityFeedback(false);
      setFeedbackSubmitted(true);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchExistingFeedback(aiAnalysis.id);
    } catch (err) {
      setError('Failed to submit feedback: ' + (err.response?.data?.detail || err.message));
    }
  };


  // Handle update click
  const handleUpdateClick = async (update) => {
    setSelectedUpdate(update);
    await fetchAiAnalysis(update.id);
  };

  // Go back to dashboard
  const goBackToDashboard = () => {
    setActiveTab('compliance-dashboard');
    setSelectedUpdate(null);
    setAiAnalysis(null);
  };

  // Initial load
  useEffect(() => {
    fetchUpdates();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSource]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle manual entry submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      await axios.post(`${API_URL}/api/regulatory-updates`, formData);
      setSuccessMessage('Regulatory update added successfully!');
      
      // Reset form
      setFormData({
        title: '',
        url: '',
        source: 'RBI',
        published_at: '',
        summary: '',
        raw_content: ''
      });

      // Refresh data
      fetchUpdates();
      fetchStats();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add update');
    } finally {
      setLoading(false);
    }
  };

  // Delete update
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;

    try {
      await axios.delete(`${API_URL}/api/regulatory-updates/${id}`);
      fetchUpdates();
      fetchStats();
    } catch (err) {
      setError('Failed to delete update: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get relevance color
  const getRelevanceColor = (score) => {
    switch(score) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      case 'NOT_RELEVANT': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-600 text-white';
      case 'Medium': return 'bg-yellow-600 text-white';
      case 'Low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg" data-testid="app-header">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="app-title">Regulatory Monitoring System</h1>
              <p className="text-blue-100 mt-1" data-testid="layer-subtitle">
                {activeTab === 'analysis-detail' ? 'AI Analysis Details' : 'Layer 1: Data Ingestion Dashboard'}
              </p>
            </div>
            {activeTab === 'analysis-detail' && (
              <button
                onClick={goBackToDashboard}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                data-testid="back-button"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Only show when not in detail view */}
      {activeTab !== 'analysis-detail' && (
        <div className="bg-white shadow-sm border-b" data-testid="navigation-tabs">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('data-ingestion')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'data-ingestion'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="data-ingestion-tab"
              >
                Data Ingestion
              </button>
              <button
                onClick={() => setActiveTab('compliance-dashboard')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'compliance-dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="compliance-dashboard-tab"
              >
                Compliance Dashboard
              </button>
              <button
                onClick={() => setActiveTab('manual-entry')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manual-entry'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="manual-entry-tab"
              >
                Manual Entry
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" data-testid="error-message">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" data-testid="success-message">
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* AI Analysis Detail View */}
        {activeTab === 'analysis-detail' && aiAnalysis && selectedUpdate && (
          <div className="max-w-5xl mx-auto" data-testid="analysis-detail-view">
            {/* Update Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedUpdate.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRelevanceColor(aiAnalysis.relevance_score)} border`}>
                      {aiAnalysis.relevance_score} PRIORITY
                    </span>
                    <span>📅 {formatDate(selectedUpdate.published_at)}</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedUpdate.source}
                    </span>
                  </div>
                </div>
              </div>
              <a
                href={selectedUpdate.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
              >
                View Original Source →
              </a>
            </div>

            {/* Summary Section */}
            <div className="bg-gray-100 rounded-lg p-8 mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Summary</h3>
              <p className="text-gray-700 text-lg leading-relaxed">{aiAnalysis.summary}</p>
            </div>

            {/* Why it Matters to Glomopay */}
            <div className="bg-gray-100 rounded-lg p-8 mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Why it matters to Glomopay</h3>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">{aiAnalysis.relevance_reason}</p>
              
              {/* Implications */}
              {aiAnalysis.implications && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-lg mb-3">Impact on Workflows:</h4>
                  {Object.entries(aiAnalysis.implications).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start">
                        <span className="font-medium text-blue-700 mr-2 min-w-[180px]">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Changes */}
              {aiAnalysis.key_changes && aiAnalysis.key_changes.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 text-lg mb-3">Key Regulatory Changes:</h4>
                  <ul className="space-y-2">
                    {aiAnalysis.key_changes.map((change, index) => (
                      <li key={index} className="flex items-start bg-white rounded-lg p-3 border border-gray-200">
                        <span className="text-blue-600 mr-3 text-lg">•</span>
                        <span className="text-gray-700">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="bg-gray-100 rounded-lg p-8 mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Action Items</h3>
              {aiAnalysis.action_items && aiAnalysis.action_items.length > 0 ? (
                <div className="space-y-4">
                  {aiAnalysis.action_items.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 border-l-4 border-blue-500 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {item.owner}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                            ⏱ {item.timeline}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-800 text-base">{item.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No specific action items identified.</p>
              )}
            </div>

            {/* Risk if Ignored */}
            {aiAnalysis.risk_if_ignored && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-8 mb-6">
                <h3 className="text-2xl font-semibold text-red-800 mb-4">⚠️ Risk if Ignored</h3>
                <p className="text-red-900 text-lg leading-relaxed">{aiAnalysis.risk_if_ignored}</p>
              </div>
            )}

            {/* Feedback Section */}
            <div className="bg-gray-100 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Feedback</h3>
              
              {feedbackSubmitted && existingFeedback ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">✓ Thank you for your feedback!</p>
                  <p className="text-green-700 text-sm mt-1">Your input helps us improve AI analysis quality.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">Help us improve AI analysis by providing quick feedback</p>
                  
                  {/* Relevance Score Feedback */}
                  <div className="mb-6 bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Is the relevance score accurate?</h4>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getRelevanceColor(aiAnalysis.relevance_score)} border`}>
                        Current: {aiAnalysis.relevance_score}
                      </span>
                    </div>
                    
                    {!showRelevanceFeedback ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => submitRelevanceFeedback(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                        >
                          ✓ Yes, correct
                        </button>
                        <button
                          onClick={() => setShowRelevanceFeedback(true)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
                        >
                          ✗ No, incorrect
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        <p className="text-sm text-gray-700 font-medium">What should the correct score be?</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['HIGH', 'MEDIUM', 'LOW', 'NOT_RELEVANT'].map(score => (
                            <button
                              key={score}
                              onClick={() => submitRelevanceFeedback(false, score, null)}
                              className={`px-4 py-2 rounded-lg border-2 ${getRelevanceColor(score)} hover:opacity-80 transition-opacity font-medium text-sm`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowRelevanceFeedback(false)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Analysis Quality Feedback */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Was this analysis useful?</h4>
                    
                    {!showQualityFeedback ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => submitQualityFeedback(true)}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          👍 Helpful
                        </button>
                        <button
                          onClick={() => setShowQualityFeedback(true)}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          👎 Needs Improvement
                        </button>
                      </div>
                    ) : (
                      <QualityFeedbackForm 
                        onSubmit={submitQualityFeedback}
                        onCancel={() => setShowQualityFeedback(false)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Data Ingestion Tab */}
        {activeTab === 'data-ingestion' && (
          <div data-testid="data-ingestion-content">
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
                <div className="bg-white rounded-lg shadow p-6" data-testid="total-updates-card">
                  <p className="text-gray-500 text-sm font-medium">Total Updates</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_updates}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6" data-testid="recent-updates-card">
                  <p className="text-gray-500 text-sm font-medium">Recent (24h)</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.recent_updates}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6" data-testid="processed-card">
                  <p className="text-gray-500 text-sm font-medium">Processed</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.processed_count}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6" data-testid="unprocessed-card">
                  <p className="text-gray-500 text-sm font-medium">Unprocessed</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.unprocessed_count}</p>
                </div>
              </div>
            )}

            {/* Sources Breakdown */}
            {stats && stats.by_source && (
              <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="sources-breakdown">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Updates by Source</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.by_source).map(([source, count]) => (
                    <div key={source} className="text-center p-4 bg-gray-50 rounded-lg" data-testid={`source-${source.toLowerCase()}`}>
                      <p className="text-2xl font-bold text-blue-600">{count}</p>
                      <p className="text-sm text-gray-600 mt-1">{source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance Dashboard Tab */}
        {activeTab === 'compliance-dashboard' && (
          <div data-testid="compliance-dashboard-content">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6" data-testid="filters-section">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Regulatory Updates</h2>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filter by Source:</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="source-filter"
                  >
                    <option value="all">All Sources</option>
                    <option value="RBI">RBI</option>
                    <option value="SEBI">SEBI</option>
                    <option value="RBI_RSS">RBI_RSS</option>
                  </select>
                  <button
                    onClick={fetchUpdates}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    data-testid="refresh-button"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Updates List */}
            <div className="space-y-4" data-testid="updates-list">
              {loading ? (
                <div className="text-center py-12" data-testid="loading-indicator">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading updates...</p>
                </div>
              ) : updates.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center" data-testid="no-updates">
                  <p className="text-gray-500">No regulatory updates found.</p>
                  <p className="text-sm text-gray-400 mt-2">Add updates manually or via the webhook endpoint.</p>
                </div>
              ) : (
                updates.map((update) => (
                  <div
                    key={update.id}
                    onClick={() => handleUpdateClick(update)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500 hover:border-blue-700"
                    data-testid="update-card"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600" data-testid="update-title">
                          {update.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" data-testid="update-source">
                            {update.source}
                          </span>
                          <span data-testid="update-published-date">📅 {formatDate(update.published_at)}</span>
                          <span data-testid="update-created-date">🕒 Added: {formatDate(update.created_at)}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            update.is_processed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`} data-testid="update-status">
                            {update.is_processed ? '✓ Processed' : '⏳ Unprocessed'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(update.id);
                        }}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                        data-testid="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                    
                    {update.summary && (
                      <p className="text-gray-700 mb-3" data-testid="update-summary">{update.summary}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <a
                        href={update.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                        data-testid="update-url"
                      >
                        View Source →
                      </a>
                      <span className="text-blue-600 font-medium text-sm">
                        Click to view AI analysis →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Manual Entry Tab - Keep existing code */}
        {activeTab === 'manual-entry' && (
          <div className="max-w-3xl mx-auto" data-testid="manual-entry-content">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="manual-entry-title">Add Regulatory Update</h2>
              
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="title-label">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter regulatory update title"
                    data-testid="title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="url-label">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/regulatory-update"
                    data-testid="url-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="source-label">
                      Source *
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="source-select"
                    >
                      <option value="RBI">RBI</option>
                      <option value="SEBI">SEBI</option>
                      <option value="RBI_RSS">RBI_RSS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="published-date-label">
                      Published Date
                    </label>
                    <input
                      type="date"
                      name="published_at"
                      value={formData.published_at}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="published-date-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="summary-label">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief summary of the regulatory update"
                    data-testid="summary-input"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="raw-content-label">
                    Raw Content (for AI processing)
                  </label>
                  <textarea
                    name="raw_content"
                    value={formData.raw_content}
                    onChange={handleInputChange}
                    rows="5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full content of the regulatory update for AI processing"
                    data-testid="raw-content-input"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">* Required fields</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    data-testid="submit-button"
                  >
                    {loading ? 'Adding...' : 'Add Update'}
                  </button>
                </div>
              </form>
            </div>

            {/* API Documentation for n8n */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="api-documentation">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Webhook Endpoint for n8n</h3>
              <div className="bg-white rounded p-4 mb-4">
                <p className="text-sm font-mono text-gray-800">{API_URL}/api/ingest</p>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Configure your n8n workflow to send POST requests to this endpoint.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
