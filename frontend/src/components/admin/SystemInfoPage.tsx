import React, { useState, useEffect } from 'react';
import type { SystemInfo } from '../../types/SystemInfo';
import { loadAdminData } from './adminApiService';
import { ErrorBox } from '../common/ErrorBox';
import type { ErrorDetails } from '../common/ErrorBox';
import { extractErrorDetails } from '../../utils/errorHandler';

const SystemInfoPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadAdminData<SystemInfo>('/admin/system-info');
        setSystemInfo(data);
      } catch (err) {
        setError(extractErrorDetails(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, [refreshKey]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (mb: number): string => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb} MB`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
        <div className="max-w-4xl mx-auto">
          <ErrorBox
            error={error}
            title="Failed to Load System Information"
            onClose={() => {
              setError(null);
              setRefreshKey(prev => prev + 1);
            }}
          />
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return <div>No system information available</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/60 border-b border-blue-200 text-gray-800 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-blue-900">
              ℹ️ System Information
            </h1>
          </div>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 mt-6 space-y-6">
        {/* Version & Timestamp */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl p-6 shadow-xl hover:bg-white/80 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Application Version</span>
            <p className="text-2xl font-bold text-blue-600">v{systemInfo.version}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Last Updated</span>
            <p className="text-sm font-medium text-gray-700">{formatTimestamp(systemInfo.timestamp)}</p>
          </div>
        </div>
      </div>

        {/* Server Information */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/80 transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Server Information
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Node.js Version</label>
            <p className="text-lg font-semibold text-gray-900">{systemInfo.server.nodeVersion}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Platform</label>
            <p className="text-lg font-semibold text-gray-900">{systemInfo.server.platform}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Architecture</label>
            <p className="text-lg font-semibold text-gray-900">{systemInfo.server.architecture}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Uptime</label>
            <p className="text-lg font-semibold text-gray-900">{formatUptime(systemInfo.server.uptime)}</p>
          </div>

          {/* Memory Usage */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600 block mb-2">Memory Usage</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-600">Heap Used</p>
                <p className="text-lg font-bold text-blue-600">{formatBytes(systemInfo.server.memoryUsage.heapUsed)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600">Heap Total</p>
                <p className="text-lg font-bold text-purple-600">{formatBytes(systemInfo.server.memoryUsage.heapTotal)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600">External</p>
                <p className="text-lg font-bold text-green-600">{formatBytes(systemInfo.server.memoryUsage.external)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-gray-600">RSS</p>
                <p className="text-lg font-bold text-orange-600">{formatBytes(systemInfo.server.memoryUsage.rss)}</p>
              </div>
            </div>
          </div>

          {/* CPU Usage */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600 block mb-2">CPU Usage (milliseconds)</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-gray-600">User</p>
                <p className="text-lg font-bold text-red-600">{systemInfo.server.cpuUsage.user}ms</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-gray-600">System</p>
                <p className="text-lg font-bold text-yellow-600">{systemInfo.server.cpuUsage.system}ms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Database Information */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/80 transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Database Configuration
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Database Type</label>
            <p className="text-lg font-semibold text-gray-900 uppercase">{systemInfo.database.type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Host</label>
            <p className="text-lg font-semibold text-gray-900 truncate" title={systemInfo.database.host}>{systemInfo.database.host || 'localhost'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Port</label>
            <p className="text-lg font-semibold text-gray-900">{systemInfo.database.port}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Database Name</label>
            <p className="text-lg font-semibold text-gray-900">{systemInfo.database.database}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">SSL Enabled</label>
            <p className="text-lg font-semibold">
              {systemInfo.database.ssl ? (
                <span className="text-green-600 flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Yes
                </span>
              ) : (
                <span className="text-red-600">No</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Synchronized</label>
            <p className="text-lg font-semibold">
              {systemInfo.database.synchronized ? (
                <span className="text-yellow-600">Yes (Dev Mode)</span>
              ) : (
                <span className="text-green-600">No (Production)</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Connection Pool</label>
            <p className="text-lg font-semibold text-gray-900">
              Min: {systemInfo.database.poolMin} / Max: {systemInfo.database.poolMax}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Connection Timeout</label>
            <p className="text-lg font-semibold text-gray-900">{(systemInfo.database.connectionTimeout || 0) / 1000}s</p>
          </div>
        </div>
      </div>

        {/* Environment Information */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/80 transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Environment Configuration
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Node Environment</label>
            <p className="text-lg font-semibold">
              <span className={`px-3 py-1 rounded-full text-sm ${
                systemInfo.environment.nodeEnv === 'production'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {systemInfo.environment.nodeEnv.toUpperCase()}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Backend Port</label>
            <p className="text-lg font-semibold text-gray-900">{systemInfo.environment.port}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Base URL</label>
            <p className="text-lg font-semibold text-blue-600 truncate">{systemInfo.environment.baseUrl}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Frontend URL</label>
            <p className="text-lg font-semibold text-blue-600 truncate">{systemInfo.environment.frontendUrl}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Backend URL</label>
            <p className="text-lg font-semibold text-blue-600 truncate">{systemInfo.environment.backendUrl}</p>
          </div>
        </div>
      </div>

        {/* Feature Flags */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/80 transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Feature Flags
          </h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(systemInfo.features).map(([feature, enabled]) => (
            <div key={feature} className={`p-4 rounded-lg border-2 ${
              enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {enabled ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Database Statistics */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/80 transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Database Statistics
          </h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
            <p className="text-sm text-gray-600">Users</p>
            <p className="text-3xl font-bold text-blue-600">{systemInfo.stats.users.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
            <p className="text-sm text-gray-600">Calendars</p>
            <p className="text-3xl font-bold text-purple-600">{systemInfo.stats.calendars.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
            <p className="text-sm text-gray-600">Events</p>
            <p className="text-3xl font-bold text-green-600">{systemInfo.stats.events.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 text-center">
            <p className="text-sm text-gray-600">Reservations</p>
            <p className="text-3xl font-bold text-orange-600">{systemInfo.stats.reservations.toLocaleString()}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 text-center">
            <p className="text-sm text-gray-600">Automation Rules</p>
            <p className="text-3xl font-bold text-indigo-600">{systemInfo.stats.automationRules.toLocaleString()}</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200 text-center">
            <p className="text-sm text-gray-600">Organisations</p>
            <p className="text-3xl font-bold text-teal-600">{systemInfo.stats.organisations.toLocaleString()}</p>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default SystemInfoPage;
