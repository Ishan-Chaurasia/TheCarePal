import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function HeroSignIn() {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState('family'); // 'family' | 'nurse'
  const [email, setEmail] = useState('family@thecarepal.com');
  const [password, setPassword] = useState('FamilyPass123!');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSwitch = (selectedRole) => {
    setRoleTab(selectedRole);
    setError(null);
    if (selectedRole === 'family') {
      setEmail('family@thecarepal.com');
      setPassword('FamilyPass123!');
    } else {
      setEmail('nurse@thecarepal.com');
      setPassword('NursePass123!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#A89E91]">
      {/* Background Hero Photograph with Warm Stone Tone & Dark Stone Scrim (~55%) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1600&q=80')`
        }}
      >
        {/* Dark stone scrim (PRD: #3A342D at ~55%) */}
        <div className="absolute inset-0 bg-[#3A342D]/60 backdrop-brightness-95" />
      </div>

      {/* Transparent Top Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-[#D9D3CA]/25">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-[#F1F3F2]">
            Daily care
          </span>
          <span className="text-[11px] font-sans uppercase tracking-widest text-[#D3ECF0] bg-[#17707F]/40 px-2 py-0.5 rounded">
            TheCarePal
          </span>
        </div>

        {/* Center Role Toggle: "For families" | "For nurses" */}
        <div className="flex items-center bg-[#3A342D]/70 p-1 rounded-md border border-[#D9D3CA]/30 shadow-inner">
          <button
            type="button"
            onClick={() => handleRoleSwitch('family')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded transition-colors ${
              roleTab === 'family'
                ? 'bg-[#17707F] text-[#F1F3F2] shadow-sm'
                : 'text-[#D9D3CA] hover:text-[#F1F3F2]'
            }`}
          >
            For families
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('nurse')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded transition-colors ${
              roleTab === 'nurse'
                ? 'bg-[#17707F] text-[#F1F3F2] shadow-sm'
                : 'text-[#D9D3CA] hover:text-[#F1F3F2]'
            }`}
          >
            For nurses
          </button>
        </div>

        {/* Right Person Icon */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-[#F1F3F2]/90">
          <User className="w-4 h-4 text-[#46B3C6]" />
          <span>Sign in</span>
        </div>
      </header>

      {/* Main Content Hero + Narrow Sign-in Sheet */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto text-center">
        {/* Hero Headline in Libre Caslon Condensed */}
        <h1 className="font-serif text-4xl sm:text-6xl text-[#F1F3F2] font-normal leading-[0.98] tracking-[-0.015em] mb-4 drop-shadow-sm">
          Every day of care,<br />in one place
        </h1>

        {/* Subline in Atkinson Hyperlegible */}
        <p className="font-sans text-lg sm:text-xl text-[#F1F3F2]/95 max-w-xl mx-auto mb-8 leading-snug">
          See how your parent ate, rested and felt, wherever you are.
        </p>

        {/* Narrow Porcelain Sign-In Sheet (~360px wide) */}
        <div className="w-full max-w-[370px] bg-[#F1F3F2] text-[#3A342D] rounded-xl p-6 sm:p-7 shadow-2xl border border-[#D9D3CA] text-left">
          <div className="mb-4">
            <h2 className="text-xl font-bold font-serif text-[#3A342D]">
              {roleTab === 'family' ? 'Family sign in' : 'Nurse round login'}
            </h2>
            <p className="text-xs text-[#3A342D]/75 mt-0.5">
              {roleTab === 'family'
                ? 'Signed in as daughter Neha Sharma (Bhopal/Bengaluru link)'
                : 'Signed in as visiting caregiver Rekha Yadav'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border-l-4 border-[#B3261E] rounded text-xs text-[#B3261E] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 pl-10 bg-white border border-[#D9D3CA] rounded-md text-sm text-[#3A342D] focus:border-[#17707F] focus:ring-2 focus:ring-[#17707F]/20 outline-none"
                  placeholder="name@example.com"
                />
                <Mail className="w-4 h-4 text-[#A89E91] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 pl-10 bg-white border border-[#D9D3CA] rounded-md text-sm text-[#3A342D] focus:border-[#17707F] focus:ring-2 focus:ring-[#17707F]/20 outline-none"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-[#A89E91] absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Deep Aqua Primary Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] font-semibold text-sm rounded-md transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
            >
              {loading ? 'Verifying access…' : 'Sign in'}
            </button>
          </form>

          {/* Seed demo quick links */}
          <div className="mt-5 pt-4 border-t border-[#D9D3CA] flex flex-col gap-1.5 text-xs text-[#3A342D]/80">
            <div className="flex items-center gap-1.5 text-[#17707F] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Demo credentials ready</span>
            </div>
            <p className="text-[11px] leading-tight text-[#3A342D]/70">
              {roleTab === 'family' ? (
                <>Family: <code className="bg-white px-1 py-0.5 rounded border border-[#D9D3CA]">family@thecarepal.com</code> / <code className="bg-white px-1 py-0.5 rounded border border-[#D9D3CA]">FamilyPass123!</code></>
              ) : (
                <>Nurse: <code className="bg-white px-1 py-0.5 rounded border border-[#D9D3CA]">nurse@thecarepal.com</code> / <code className="bg-white px-1 py-0.5 rounded border border-[#D9D3CA]">NursePass123!</code></>
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Footer Scrim note */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-[#F1F3F2]/75 border-t border-[#D9D3CA]/20">
        TheCarePal Task FS-03 · Patient Kamla Sharma, 78 · Synthetic Clinical Demonstration Data · Not a diagnosis
      </footer>
    </div>
  );
}
