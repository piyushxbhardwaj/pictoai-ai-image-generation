import { useState } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import { useApp } from './context/useApp.jsx';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Workspace from './components/Workspace';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';

function AppContent() {
  const { activeTab } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-cyber-black text-zinc-100 relative">
      {/* Sticky glassmorphism header */}
      <Navbar onOpenAuth={openAuth} />
      
      {/* Tab routing switcher */}
      {activeTab === 'home' ? (
        <LandingPage onOpenAuth={openAuth} />
      ) : activeTab === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Workspace />
      )}

      {/* Shared Auth Modal (login/signup states) */}
      <AuthModal 
        key={authMode}
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        initialMode={authMode} 
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
