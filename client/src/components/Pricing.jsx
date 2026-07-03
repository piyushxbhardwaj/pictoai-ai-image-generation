import { useState } from 'react';
import { useApp } from '../context/useApp';
import { Check, Sparkles, CreditCard, Shield, Database, X, Loader } from 'lucide-react';
import confetti from 'canvas-confetti';

const Pricing = () => {
  const { playSfx, purchaseSubscription, user } = useApp();
  const [payingPlan, setPayingPlan] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Starter Explorer',
      price: '0',
      credits: 5,
      features: [
        '5 high-fidelity images',
        'Standard generation speed (10-15s)',
        'Standard model architecture',
        'PictoAI logo watermark',
        'Personal use license'
      ],
      recommended: false,
      cta: 'Current Starter Plan'
    },
    {
      id: 'pro',
      name: 'Creative Pro',
      price: '19',
      credits: 150,
      features: [
        '150 credits per month',
        'Ultra-fast generation speed (1.4s)',
        'HD & Creative model selection',
        'Watermark-free high-res downloads',
        'Commercial use license',
        'Prioritized GPU cluster queue'
      ],
      recommended: true,
      cta: 'Upgrade to Pro'
    },
    {
      id: 'premium',
      name: 'Enterprise VIP',
      price: '49',
      credits: 500,
      features: [
        '500 credits per month',
        'Ultra-fast generation speed (1.4s)',
        'All AI models (HD, Fast, Creative, Custom)',
        'Upscale up to 4K resolution',
        'Commercial use + Full IP ownership',
        'Dedicated API access gateway',
        '24/7 VIP artist priority support'
      ],
      recommended: false,
      cta: 'Go Premium'
    }
  ];

  const handleCtaClick = async (plan) => {
    if (plan.id === 'free') return;
    playSfx('click');
    
    if (!user) {
      playSfx('error');
      alert('Please sign in or sign up first to purchase a subscription.');
      return;
    }
    
    setPayingPlan(plan.id);
    try {
      const priceInINR = plan.id === 'pro' ? 199 : 499;
      const res = await purchaseSubscription(plan.id, priceInINR);
      
      if (res.success) {
        // Fire confetti celebration!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#facc15', '#fbbf24', '#ffffff', '#eab308']
        });
      } else {
        alert(res.message || 'Payment processing failed.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during payment execution.');
    } finally {
      setPayingPlan(null);
    }
  };

  return (
    <section id="pricing" className="relative py-20 bg-cyber-black overflow-hidden border-b border-cyber-border">
      
      {/* Background grids */}
      <div className="absolute top-1/2 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Flexible Monetization</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
            Upgrade Your Creative Flow
          </h2>
          <p className="text-zinc-400">
            Pick a credit package that matches your design rhythm. All paid plans trigger immediate high-priority GPU access.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => playSfx('hover')}
              className={`glass-panel rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                plan.recommended 
                  ? 'border-primary/40 shadow-glow-lg md:-translate-y-4 hover:border-primary/70' 
                  : 'hover:border-primary/30 hover:shadow-glow'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-black text-cyber-black uppercase tracking-wider flex items-center space-x-1 shadow-glow-yellow">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Most Popular</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline space-x-1 text-white">
                    <span className="text-3xl font-display font-medium">$</span>
                    <span className="text-5xl font-display font-black tracking-tight">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">/month</span>
                  </div>
                  <div className="mt-3 flex items-center space-x-2 text-primary font-bold text-xs">
                    <Database className="h-4 w-4" />
                    <span>Includes {plan.credits} GPU Credits</span>
                  </div>
                </div>

                <div className="border-t border-zinc-800/60 pt-6">
                  <ul className="space-y-4">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-sm text-zinc-300">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleCtaClick(plan)}
                  disabled={payingPlan !== null || (plan.id === 'free' && (!user?.plan || user?.plan === 'starter')) || (user?.plan === plan.id)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center space-x-2 ${
                    (plan.id === 'free' && (!user?.plan || user?.plan === 'starter')) || (user?.plan === plan.id)
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-default'
                      : plan.id === 'free'
                        ? 'bg-transparent border border-zinc-700 text-white hover:border-primary hover:bg-primary/5 cursor-pointer'
                        : plan.recommended
                          ? 'bg-primary hover:bg-primary-hover text-cyber-black shadow-glow cursor-pointer'
                          : 'bg-transparent border border-zinc-700 text-white hover:border-primary hover:bg-primary/5 cursor-pointer'
                  } disabled:opacity-50`}
                >
                  {payingPlan === plan.id ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Opening Secure Gateway...</span>
                    </>
                  ) : (
                    <>
                      {user?.plan === plan.id && 'Current Plan'}
                      {user?.plan !== plan.id && plan.id === 'free' && 'Current Plan'}
                      {user?.plan !== plan.id && plan.id === 'pro' && 'Pay ₹199 with Razorpay'}
                      {user?.plan !== plan.id && plan.id === 'premium' && 'Pay ₹499 with Razorpay'}
                    </>
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </section>
  );
};

export default Pricing;
