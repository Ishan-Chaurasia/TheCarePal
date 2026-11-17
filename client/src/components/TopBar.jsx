import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, LogOut, FileText, Activity, Calendar, ClipboardList, PenTool } from 'lucide-react';

export default function TopBar({ activeTab, setActiveTab, onOpenReportModal }) {
  const { user, patient, logout, isNurse } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'charts', label: 'Charts', icon: Activity },
    { id: 'weekly', label: 'Weekly summary', icon: ClipboardList },
    { id: 'report', label: 'Report', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F1F3F2] border-b border-[#D9D3CA] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Product Wordmark */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className="flex items-center gap-2 text-left focus:outline-none"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3A342D]">
              Daily care
            </span>
            <span className="hidden sm:inline-block text-[11px] font-sans font-medium text-[#17707F] bg-[#D3ECF0] px-2 py-0.5 rounded">
              TheCarePal
            </span>
          </button>
        </div>

        {/* Center: The Product's Four Places */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'report' && onOpenReportModal) {
                    onOpenReportModal();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#17707F] text-[#F1F3F2]'
                    : 'text-[#3A342D] hover:bg-[#D9D3CA]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F1F3F2]' : 'text-[#7A7268]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Nurse Log Round Button if Nurse Role */}
          {isNurse && (
            <button
              type="button"
              onClick={() => setActiveTab('nurse-log')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'nurse-log'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-[#17707F]/10 text-[#17707F] hover:bg-[#17707F]/20'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Log round</span>
            </button>
          )}
        </nav>

        {/* Right: User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#3A342D] hover:text-[#17707F] p-1.5 rounded-md transition-colors"
            aria-expanded={menuOpen}
          >
            <div className="w-7 h-7 rounded-full bg-[#D9D3CA] flex items-center justify-center text-[#3A342D] font-bold text-xs">
              {user?.name?.[0] || 'U'}
            </div>
            <span className="hidden md:inline">(o) {user?.name?.split(' ')[0] || user?.role}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-[#D9D3CA] py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#D9D3CA]/50">
                <p className="text-xs font-bold text-[#3A342D]">{user?.name}</p>
                <p className="text-[11px] text-[#7A7268] capitalize">{user?.role} account</p>
                {patient && (
                  <p className="text-[11px] text-[#17707F] font-medium mt-1">
                    Patient: {patient.name} (78)
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#B3261E] hover:bg-[#FEE2E2]/50 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
