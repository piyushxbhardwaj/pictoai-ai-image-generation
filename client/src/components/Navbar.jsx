import { useState } from 'react';
import { useApp } from '../context/useApp';
import { Sparkles, Menu, X, Volume2, VolumeX, LogOut, Database, User } from 'lucide-react';

const Navbar = ({ onOpenAuth }) => {
  const { 
    user, 
    credits, 
    soundEnabled, 
    setSoundEnabled, 
    activeTab, 
    setActiveTab, 
    logout,
    playSfx,
    isBackendOnline,
    toggleLiveMode
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) {
      // Small beep if sound just turned on
      setTimeout(() => playSfx('click'), 50);
    }
  };

  const navItems = [
    { label: 'Home', id: 'home', section: true },
    { label: 'Features', id: 'features', section: true },
    { label: 'Gallery', id: 'gallery', section: true },
    { label: 'Pricing', id: 'pricing', section: true }
  ];

  const handleNavClick = (item) => {
    playSfx('click');
    setMobileMenuOpen(false);
    if (item.section) {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.getElementById(item.id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setActiveTab(item.id);
    }
  };

  const triggerAuth = (mode) => {
    playSfx('click');
    onOpenAuth(mode);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-cyber-border bg-cyber-black/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo Section */}
          <div 
            onClick={() => handleNavClick({ id: 'home', section: true })}
            className="flex cursor-pointer items-center space-x-2 group"
            onMouseEnter={() => playSfx('hover')}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-cyber-black shadow-glow transition-all duration-300 group-hover:scale-105">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <div className="absolute -inset-0.5 rounded-lg bg-primary blur-sm opacity-30 group-hover:opacity-60 transition-opacity"></div>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              Picto<span className="text-primary">AI</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                onMouseEnter={() => playSfx('hover')}
                className="relative py-2 text-sm font-medium tracking-wide text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {item.label}
                {activeTab === 'home' && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-350 hover:w-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* Controls & Auth */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* SFX Toggle */}
            <button
              onClick={toggleSound}
              onMouseEnter={() => playSfx('hover')}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-primary transition-all"
              title={soundEnabled ? "Mute Cyber UI Sounds" : "Unmute Cyber UI Sounds"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-red-500" />}
            </button>

            {/* Sandbox Mode / Live Mode Indicator */}
            <div 
              onClick={toggleLiveMode}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer select-none transition-all duration-300 ${
                isBackendOnline 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-yellow-500/10 text-primary border border-primary/20 hover:bg-primary/25'
              }`}
              title={isBackendOnline ? 'Connected to local AI server. Click to toggle Sandbox Mode.' : 'Running in demo/sandbox offline mode. Click to toggle Live API.'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-400 animate-ping' : 'bg-primary'}`}></span>
              <span>{isBackendOnline ? 'Live API' : 'Demo Sandbox'}</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                {/* Credits Indicator */}
                <button 
                  onClick={() => { playSfx('click'); setActiveTab('pricing'); }}
                  onMouseEnter={() => playSfx('hover')}
                  className="flex items-center space-x-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-all duration-300 shadow-glow-yellow"
                >
                  <Database className="h-4 w-4" />
                  <span>
                    {user?.plan === 'pro' && '⭐ Pro Plan | '}
                    {user?.plan === 'premium' && '⭐ Premium Plan | '}
                    {credits} Credits
                  </span>
                </button>

                {/* Workspace CTA Button */}
                <button
                  onClick={() => { playSfx('click'); setActiveTab(activeTab === 'workspace' ? 'home' : 'workspace'); }}
                  onMouseEnter={() => playSfx('hover')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 ${
                    activeTab === 'workspace'
                      ? 'bg-transparent border border-primary text-primary hover:bg-primary/10'
                      : 'bg-primary text-cyber-black hover:bg-primary-hover shadow-glow'
                  }`}
                >
                  {activeTab === 'workspace' ? 'Back to Home' : 'AI Workbench'}
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { playSfx('click'); setUserDropdownOpen(!userDropdownOpen); }}
                    onMouseEnter={() => playSfx('hover')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                  >
                    <User className="h-5 w-5 text-white" />
                  </button>
                  
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-xl border border-zinc-800 bg-cyber-dark p-2 shadow-2xl backdrop-blur-xl">
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-xs text-zinc-500">Logged in as</p>
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      </div>
                      <button
                        onClick={() => { playSfx('click'); setActiveTab('workspace'); setUserDropdownOpen(false); }}
                        className="flex w-full items-center space-x-2 rounded-lg px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>AI Workbench</span>
                      </button>
                      <button
                        onClick={() => { playSfx('click'); setActiveTab('dashboard'); setUserDropdownOpen(false); }}
                        className="flex w-full items-center space-x-2 rounded-lg px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4 text-primary" />
                        <span>User Dashboard</span>
                      </button>
                      <button
                        onClick={() => { playSfx('click'); logout(); setUserDropdownOpen(false); }}
                        className="flex w-full items-center space-x-2 rounded-lg px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => triggerAuth('login')}
                  onMouseEnter={() => playSfx('hover')}
                  className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => triggerAuth('signup')}
                  onMouseEnter={() => playSfx('hover')}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-cyber-black hover:bg-primary-hover shadow-glow transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            {/* SFX Toggle */}
            <button
              onClick={toggleSound}
              className="rounded-full p-2 text-zinc-400 hover:text-primary transition-all"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-red-500" />}
            </button>

            <button
              onClick={() => { playSfx('click'); setMobileMenuOpen(!mobileMenuOpen); }}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-800 bg-cyber-black p-4 md:hidden animate-in slide-in-from-top-5 duration-300">
          <div className="space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="block w-full py-2.5 text-left text-base font-semibold text-zinc-300 hover:text-primary border-b border-zinc-900"
              >
                {item.label}
              </button>
            ))}
            
            <div className="pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
                    <span className="text-sm text-zinc-400">
                      {user?.plan === 'pro' && '⭐ Pro Plan'}
                      {user?.plan === 'premium' && '⭐ Premium Plan'}
                      {(!user?.plan || user?.plan === 'starter') && 'Starter Plan'}
                    </span>
                    <span className="text-sm font-bold text-primary">✨ {credits} Credits</span>
                  </div>
                  <button
                    onClick={() => { playSfx('click'); setActiveTab('workspace'); setMobileMenuOpen(false); }}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary py-3 text-base font-bold text-cyber-black"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Go to Workbench</span>
                  </button>
                  <button
                    onClick={() => { playSfx('click'); logout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-red-950/20 border border-red-500/20 py-2.5 text-sm font-semibold text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => triggerAuth('login')}
                    className="rounded-lg border border-zinc-700 py-3 text-center text-sm font-bold text-white"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => triggerAuth('signup')}
                    className="rounded-lg bg-primary py-3 text-center text-sm font-bold text-cyber-black shadow-glow"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
