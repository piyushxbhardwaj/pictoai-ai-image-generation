import { useState, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { 
  Sparkles, ShieldCheck, Database, Calendar, CreditCard, 
  RefreshCw, ChevronRight, Activity, LogIn, ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { 
    user, 
    credits, 
    token, 
    isBackendOnline, 
    getSubscriptionStatus, 
    playSfx, 
    setActiveTab 
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    const data = await getSubscriptionStatus();
    setDashboardData(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      void fetchStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = () => {
    playSfx('click');
    void fetchStatus();
  };

  // If user is not logged in, show elegant placeholder auth CTA
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-cyber-dark flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full rounded-2xl p-8 text-center space-y-6 relative border border-primary/20 shadow-glow-yellow">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-4 text-cyber-black shadow-glow-yellow">
            <LogIn className="h-6 w-6" />
          </div>
          <div className="space-y-2 pt-4">
            <h2 className="text-2xl font-display font-extrabold text-white">Access Restricted</h2>
            <p className="text-sm text-zinc-400">
              Please sign in to view your subscription details, credits remainder, and payment receipts history.
            </p>
          </div>
          <button
            onClick={() => { playSfx('click'); document.querySelector('[title*="Sign In"]')?.click() || alert('Use the Sign In button in the Navbar.'); }}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-primary hover:bg-primary-hover text-cyber-black font-extrabold rounded-xl transition-all duration-300 shadow-glow"
          >
            <span>Authenticate Secure Session</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-cyber-dark flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16 rounded-full border border-primary/20 bg-cyber-black flex items-center justify-center overflow-hidden shadow-glow-yellow">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        </div>
        <p className="text-xs text-primary font-bold tracking-widest uppercase animate-pulse">Syncing user data matrix...</p>
      </div>
    );
  }

  // Fallback defaults if getSubscriptionStatus has not populated completely
  const activePlan = dashboardData?.plan || user?.plan || 'starter';
  const subStatus = dashboardData?.subscriptionStatus || user?.subscriptionStatus || 'inactive';
  const renewalDate = dashboardData?.renewalDate || 'N/A';
  const limit = dashboardData?.monthlyCreditLimit || user?.monthlyCreditLimit || 50;
  const history = dashboardData?.paymentHistory || [];

  const planTitles = {
    starter: 'Starter Explorer',
    pro: 'Creative Pro',
    premium: 'Enterprise VIP'
  };

  const planCredits = {
    starter: 50, // default sign up credits
    pro: 150,
    premium: 500
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-cyber-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-primary/5 blur-[150px] pointer-events-none"></div>

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Control Terminal</span>
            <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
              User Dashboard
            </h1>
            <p className="text-xs text-zinc-500">
              Welcome back, <span className="text-zinc-300 font-bold">{user.name}</span>. Manage your billing system and limits here.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-cyber-black px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:border-primary/40 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Terminal</span>
            </button>
            <button
              onClick={() => { playSfx('click'); setActiveTab('workspace'); }}
              className="flex items-center space-x-1 px-4 py-2 bg-primary hover:bg-primary-hover text-cyber-black font-extrabold text-xs rounded-lg shadow-glow transition-all cursor-pointer"
            >
              <span>AI Workbench</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Subscription status & Plan details */}
          <div className="glass-panel rounded-2xl p-6 relative border border-zinc-850 hover:border-primary/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">Subscription Level</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-black tracking-wide uppercase ${
                  subStatus === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-750'
                }`}>
                  {subStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-black text-white capitalize">
                  {planTitles[activePlan] || activePlan}
                </h3>
                <p className="text-xs text-zinc-400 flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Secure Account Node verified</span>
                </p>
              </div>
            </div>
            
            <div className="border-t border-zinc-800/80 pt-4 mt-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Plan Code</span>
                <span className="text-zinc-300 font-mono font-bold uppercase">{activePlan}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Credit Meter */}
          <div className="glass-panel rounded-2xl p-6 relative border border-zinc-850 hover:border-primary/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">Resource Allocation</span>
                <Database className="h-4 w-4 text-primary" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-3xl font-display font-black text-white">
                  {credits} <span className="text-sm font-semibold text-zinc-500">/ {limit} credits</span>
                </h3>
                
                {/* Credit balance visual meter */}
                <div className="w-full bg-zinc-900 border border-zinc-800 h-2 rounded-full overflow-hidden p-0.5 mt-2">
                  <div 
                    className="bg-primary h-full rounded-full shadow-glow-yellow transition-all duration-300"
                    style={{ width: `${Math.min(100, (credits / limit) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-zinc-500 pt-1">
                  Remaining credit balances will roll over on next cycle.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 mt-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Limits Status</span>
                <span className="text-emerald-400 font-bold">Uncapped GPU Queue</span>
              </div>
            </div>
          </div>

          {/* Card 3: Renewal Schedule */}
          <div className="glass-panel rounded-2xl p-6 relative border border-zinc-850 hover:border-primary/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">Billing Cycle</span>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-black text-white">
                  {renewalDate}
                </h3>
                <p className="text-xs text-zinc-400 flex items-center space-x-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Renewal Cycle: Monthly</span>
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 mt-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Method</span>
                <span className="text-zinc-300 font-semibold">Razorpay Secure</span>
              </div>
            </div>
          </div>

        </div>

        {/* Payment History Section */}
        <div className="glass-panel rounded-2xl p-6 border border-zinc-850">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment History ({history.length})</h3>
            </div>
            {isBackendOnline && (
              <span className="inline-flex items-center text-[10px] text-zinc-500 font-semibold uppercase">
                <span className="h-1.5 w-1.5 mr-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Synched with Razorpay
              </span>
            )}
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-xxs font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Transaction Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-zinc-400 select-all" title={tx.orderId}>
                        {tx.orderId || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 font-bold capitalize">
                        {planTitles[tx.plan] || tx.plan}
                      </td>
                      <td className="py-3.5 px-4 text-white font-mono">
                        {tx.currency === 'INR' ? '₹' : '$'}{parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {tx.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.status === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.status === 'pending'
                              ? 'bg-yellow-500/10 text-primary border border-primary/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-600">
              No transactions logs found. Upgrade your plan on the Pricing page to register payment history.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
