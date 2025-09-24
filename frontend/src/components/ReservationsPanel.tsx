import { useState } from 'react';
import OrganisationManagement from './OrganisationManagement';
import ResourceTypeManagement from './ResourceTypeManagement';
import ResourceManagement from './ResourceManagement';
import ReservationManagement from './ReservationManagement';

interface ReservationsPanelProps {
  themeColor?: string;
}

const ReservationsPanel: React.FC<ReservationsPanelProps> = ({ themeColor = '#3b82f6' }) => {
  const [activeTab, setActiveTab] = useState<'organisations' | 'types' | 'resources' | 'reservations'>('organisations');

  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', primary: 'bg-red-500 hover:bg-red-600', accent: 'text-red-600' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', primary: 'bg-orange-500 hover:bg-orange-600', accent: 'text-orange-600' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', primary: 'bg-yellow-500 hover:bg-yellow-600', accent: 'text-yellow-600' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', primary: 'bg-lime-500 hover:bg-lime-600', accent: 'text-lime-600' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', primary: 'bg-green-500 hover:bg-green-600', accent: 'text-green-600' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', primary: 'bg-emerald-500 hover:bg-emerald-600', accent: 'text-emerald-600' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', primary: 'bg-teal-500 hover:bg-teal-600', accent: 'text-teal-600' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', primary: 'bg-cyan-500 hover:bg-cyan-600', accent: 'text-cyan-600' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', primary: 'bg-sky-500 hover:bg-sky-600', accent: 'text-sky-600' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', primary: 'bg-blue-500 hover:bg-blue-600', accent: 'text-blue-600' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', primary: 'bg-indigo-500 hover:bg-indigo-600', accent: 'text-indigo-600' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', primary: 'bg-violet-500 hover:bg-violet-600', accent: 'text-violet-600' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', primary: 'bg-purple-500 hover:bg-purple-600', accent: 'text-purple-600' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', primary: 'bg-pink-500 hover:bg-pink-600', accent: 'text-pink-600' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', primary: 'bg-rose-500 hover:bg-rose-600', accent: 'text-rose-600' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', primary: 'bg-slate-500 hover:bg-slate-600', accent: 'text-slate-600' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} relative`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="mb-10">
          <h1 className="text-5xl font-thin mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">📅 Reservations & Bookings</h1>
          <p className="text-gray-700 text-xl font-light">Manage resources, schedules, and reservations</p>
        </div>

        <div className="mb-8">
          <nav className="flex flex-wrap gap-2 p-2 bg-white/70 border border-blue-200 rounded-3xl backdrop-blur-md">
            {[
              { key: 'organisations', label: 'Organisations', icon: '🏢' },
              { key: 'types', label: 'Resource Types', icon: '📋' },
              { key: 'resources', label: 'Resources', icon: '🪑' },
              { key: 'reservations', label: 'Reservations', icon: '📆' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? `${themeColors.primary} text-white shadow-lg scale-105`
                    : `${themeColors.accent} hover:bg-white/50 hover:scale-105`
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-96 bg-white/70 border border-blue-200 rounded-3xl p-8 backdrop-blur-md">
          {activeTab === 'organisations' && (
            <OrganisationManagement themeColor={themeColor} />
          )}

          {activeTab === 'types' && (
            <ResourceTypeManagement themeColor={themeColor} />
          )}

          {activeTab === 'resources' && (
            <ResourceManagement themeColor={themeColor} />
          )}

          {activeTab === 'reservations' && (
            <ReservationManagement themeColor={themeColor} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationsPanel;