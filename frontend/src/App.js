import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [updates, setUpdates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, manual-entry
  const [filterSource, setFilterSource] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg" data-testid="app-header">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold" data-testid="app-title">Regulatory Monitoring System</h1>
          <p className="text-blue-100 mt-1" data-testid="layer-subtitle">Layer 1: Data Ingestion Dashboard</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b" data-testid="navigation-tabs">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="dashboard-tab"
            >
              Dashboard
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div data-testid="dashboard-content">
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
                  <div key={update.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow" data-testid="update-card">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="update-title">{update.title}</h3>
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
                        onClick={() => handleDelete(update.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                        data-testid="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                    
                    {update.summary && (
                      <p className="text-gray-700 mb-3" data-testid="update-summary">{update.summary}</p>
                    )}
                    
                    <a
                      href={update.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                      data-testid="update-url"
                    >
                      View Source →
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Manual Entry Tab */}
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
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-800 hover:text-blue-900">
                  View Request Format
                </summary>
                <pre className="mt-3 bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
{`// Single Update
{
  "title": "RBI Circular on FEMA Updates",
  "url": "https://rbi.org.in/circular/123",
  "source": "RBI",
  "published_at": "2024-01-15",
  "summary": "Updates to FEMA regulations...",
  "raw_content": "Full text content..."
}

// Batch Updates
{
  "updates": [
    { 
      "title": "Update 1",
      "url": "https://...",
      "source": "RBI",
      ...
    },
    { 
      "title": "Update 2",
      "url": "https://...",
      "source": "SEBI",
      ...
    }
  ]
}`}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
