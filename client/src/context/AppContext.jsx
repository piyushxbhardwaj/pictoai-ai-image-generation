import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import AppContext from './appContext';

// Base backend URL
const BACKEND_URL = 'http://localhost:3000';

// Helper to dynamically load Razorpay Checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


function loadStoredJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function normalizeHistory(value) {
  return Array.isArray(value) ? value : [];
}

export const AppProvider = ({ children }) => {
  // Authentication states
  const [user, setUser] = useState(() => {
    return loadStoredJSON('pictoai_user', null);
  });
  const [token, setToken] = useState(() => localStorage.getItem('pictoai_token') || null);
  
  // Credit balance state
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem('pictoai_credits');
    return saved ? parseInt(saved, 10) : 50;
  });

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('pictoai_sound_enabled');
    return saved !== 'false'; // Default to true
  });

  // Tabs / Navigation
  const [activeTab, setActiveTab] = useState('home'); // 'home' or 'workspace'
  const [prefilledPrompt, setPrefilledPrompt] = useState('');

  // Generation History
  const [history, setHistory] = useState(() => {
    return normalizeHistory(loadStoredJSON('pictoai_history', []));
  });

  // Live vs Sandbox Mode Detection
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [loadingBackendCheck, setLoadingBackendCheck] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setCredits(50);
  }, []);

  // Check if backend is available
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/`, { timeout: 2000 });
        if (response.data && response.data.includes('API Working')) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch {
        setIsBackendOnline(false);
      } finally {
        setLoadingBackendCheck(false);
      }
    };
    checkBackend();
  }, []);

  // Force toggle Live/Sandbox mode
  const toggleLiveMode = () => {
    playSfx('click');
    setIsBackendOnline(prev => !prev);
  };

  // Update localStorage when states change
  useEffect(() => {
    if (user) localStorage.setItem('pictoai_user', JSON.stringify(user));
    else localStorage.removeItem('pictoai_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('pictoai_token', token);
    else localStorage.removeItem('pictoai_token');
  }, [token]);

  useEffect(() => {
    localStorage.setItem('pictoai_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('pictoai_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('pictoai_history', JSON.stringify(normalizeHistory(history)));
  }, [history]);

  // Sync credits with backend if live mode is active and user is logged in
  const syncCredits = useCallback(async (currentToken = token) => {
    if (isBackendOnline && currentToken && currentToken !== 'sandbox_token_jwt_123') {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/user/credits`, {
          headers: { token: currentToken }
        });
        if (res.data.success) {
          setCredits(res.data.credits);
          if (res.data.user) {
            setUser(prev => ({ 
              ...prev, 
              name: res.data.user.name,
              email: res.data.user.email,
              plan: res.data.user.plan || 'starter',
              subscriptionStatus: res.data.user.subscriptionStatus || 'inactive',
              monthlyCreditLimit: res.data.user.monthlyCreditLimit || 50,
              subscription: res.data.user.subscription || null
            }));
          }
        }
      } catch (error) {
        console.error('Failed to sync credits with server:', error);
        if (error.response && error.response.status === 401) {
          logout(); // Clear expired token
        }
      }
    }
  }, [isBackendOnline, token, logout]);

  useEffect(() => {
    if (isBackendOnline && token === 'sandbox_token_jwt_123') {
      // Clear sandbox token when connecting to live backend to prevent 422 errors!
      queueMicrotask(() => {
        logout();
      });
    } else if (isBackendOnline && token) {
      queueMicrotask(() => {
        void syncCredits();
      });
    }
  }, [isBackendOnline, token, logout, syncCredits]);

  // --- SCI-FI SYNTH SOUND EFFECTS ENGINE (Web Audio API) ---
  function playSfx(type) {
    if (!soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const masterVolume = ctx.createGain();
      masterVolume.gain.setValueAtTime(0.15, ctx.currentTime);
      masterVolume.connect(ctx.destination);

      if (type === 'hover') {
        // High frequency cyber click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(masterVolume);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'click') {
        // Futuristic UI click
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc1.frequency.setValueAtTime(1320, ctx.currentTime + 0.02);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(220, ctx.currentTime);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterVolume);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.09);
        osc2.stop(ctx.currentTime + 0.09);
      } else if (type === 'success') {
        // Melodic tech chime (3 rising notes)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);
          
          osc.connect(gain);
          gain.connect(masterVolume);
          
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      } else if (type === 'error') {
        // Cyber warning buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(masterVolume);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      }
    } catch (error) {
      console.warn('Web Audio API not supported or user interaction blocked sound.', error);
    }
  }

  // --- AUTHENTICATION FLOWS ---
  const register = async (name, email, password) => {
    playSfx('click');
    if (isBackendOnline) {
      try {
        const res = await axios.post(`${BACKEND_URL}/api/user/register`, { name, email, password });
        if (res.data.success) {
          setToken(res.data.token);
          setUser(res.data.user);
          playSfx('success');
          // Fetch backend initial credits
          await syncCredits(res.data.token);
          return { success: true };
        } else {
          playSfx('error');
          return { success: false, message: res.data.message };
        }
      } catch (error) {
        playSfx('error');
        return { success: false, message: error.response?.data?.message || 'Connection failed' };
      }
    } else {
      // Sandbox Mode registration
      setUser({ name, email, plan: 'starter', subscriptionStatus: 'inactive', monthlyCreditLimit: 50 });
      setToken('sandbox_token_jwt_123');
      setCredits(50); // Give 50 starting credits
      playSfx('success');
      return { success: true };
    }
  };

  const login = async (email, password) => {
    playSfx('click');
    if (isBackendOnline) {
      try {
        const res = await axios.post(`${BACKEND_URL}/api/user/login`, { email, password });
        if (res.data.success) {
          setToken(res.data.token);
          setUser(res.data.user);
          playSfx('success');
          await syncCredits(res.data.token);
          return { success: true };
        } else {
          playSfx('error');
          return { success: false, message: res.data.message };
        }
      } catch (error) {
        playSfx('error');
        return { success: false, message: error.response?.data?.message || 'Invalid Credentials' };
      }
    } else {
      // Sandbox Mode login
      if (email && password.length >= 4) {
        const name = email.split('@')[0];
        setUser({ 
          name: name.charAt(0).toUpperCase() + name.slice(1), 
          email, 
          plan: 'starter', 
          subscriptionStatus: 'inactive', 
          monthlyCreditLimit: 50 
        });
        setToken('sandbox_token_jwt_123');
        playSfx('success');
        return { success: true };
      } else {
        playSfx('error');
        return { success: false, message: 'Invalid credentials. Password must be 4+ characters.' };
      }
    }
  };

  // --- IMAGE GENERATION ---
  const generateImage = async (prompt, model, style, aspect) => {
    playSfx('click');
    
    // Check credits
    if (credits <= 0) {
      playSfx('error');
      return { success: false, message: 'Insufficient credits. Please upgrade your plan!' };
    }

    if (isBackendOnline && token && token !== 'sandbox_token_jwt_123') {
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/image/generate-image`,
          { prompt, model, style, aspect },
          { headers: { token } }
        );
        if (res.data.success) {
          const newImg = {
            id: Date.now().toString(),
            prompt,
            url: res.data.resultImageUrl || res.data.resultImage,
            model,
            style,
            aspect,
            timestamp: new Date().toLocaleTimeString(),
            isOffline: !!res.data.isOffline
          };
          setHistory(prev => [newImg, ...normalizeHistory(prev)]);
          setCredits(res.data.creditBalance);
          playSfx('success');
          return { success: true, image: res.data.resultImageUrl || res.data.resultImage };
        } else {
          playSfx('error');
          return { success: false, message: res.data.message || 'Image Generation Failed' };
        }
      } catch (error) {
        playSfx('error');
        if (error.response && error.response.status === 401) {
          logout(); // Clear expired token
          return { success: false, message: 'Session expired. Please log in again.' };
        }
        return { success: false, message: error.message || 'Server image generation error' };
      }
    } else {
      // Sandbox mode: Live AI generation using Pollinations AI (free, keyless API)
      try {
        const formattedPrompt = `${prompt}, ${style} style, aspect ratio ${aspect}, highly detailed, 8k resolution`;
        
        // Define width and height based on aspect ratio
        let width = 768;
        let height = 768;
        if (aspect === '16:9') {
          width = 1024;
          height = 576;
        } else if (aspect === '9:16') {
          width = 576;
          height = 1024;
        }

        const seed = Math.floor(Math.random() * 1000000);
        const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(formattedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        await axios.get(pollinationsUrl, { responseType: 'blob', timeout: 45000 });
        
        const newImg = {
          id: Date.now().toString(),
          prompt,
          url: pollinationsUrl, // Save permanent URL so it persists on reload!
          model,
          style,
          aspect,
          timestamp: new Date().toLocaleTimeString(),
          isOffline: false
        };

        setHistory(prev => [newImg, ...normalizeHistory(prev)]);
        setCredits(prev => prev - 1);
        playSfx('success');
        return { success: true, image: pollinationsUrl };
      } catch (error) {
        console.warn('Pollinations AI failed, falling back to static mock image', error);
        // Fallback to static mock images
        const galleryPicks = [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop'
        ];
        let index = Math.floor(Math.random() * galleryPicks.length);
        if (style === 'Cyberpunk') index = 3;
        if (style === 'Anime') index = 2;
        if (style === 'Oil Painting') index = 1;

        const fallbackImg = galleryPicks[index];
        const newImg = {
          id: Date.now().toString(),
          prompt,
          url: fallbackImg,
          model,
          style,
          aspect,
          timestamp: new Date().toLocaleTimeString(),
          isOffline: true
        };

        setHistory(prev => [newImg, ...normalizeHistory(prev)]);
        setCredits(prev => prev - 1);
        playSfx('success');
        return { success: true, image: fallbackImg };
      }
    }
  };

  // --- PAYMENTS & CREDITS ACQUISITION ---
  const buyCredits = async (packageId, amount) => {
    playSfx('click');
    if (isBackendOnline && token) {
      try {
        // Direct integration with backend payment success
        const res = await axios.post(`${BACKEND_URL}/api/user/payment-success`, {
          userId: user?.id, // Sent in body
          paymentAmount: amount
        }, {
          headers: { token }
        });
        if (res.data.success) {
          setCredits(res.data.creditBalance);
          playSfx('success');
          return true;
        }
      } catch (error) {
        console.error('Payment gateway error:', error);
      }
    }
    
    // Fallback: Sandbox payment simulation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCredits(prev => prev + amount);
    playSfx('success');
    return true;
  };

  // --- RAZORPAY SUBSCRIPTION CHECKOUT & STATE SYNCHRONISATION ---
  const getSubscriptionStatus = useCallback(async () => {
    if (isBackendOnline && token && token !== 'sandbox_token_jwt_123') {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/payment/subscription-status`, {
          headers: { token }
        });
        if (res.data.success) {
          setCredits(res.data.credits);
          setUser(prev => ({
            ...prev,
            plan: res.data.plan,
            subscriptionStatus: res.data.subscriptionStatus,
            monthlyCreditLimit: res.data.monthlyCreditLimit,
            subscription: res.data.subscription
          }));
          return res.data;
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      }
    }
    // Sandbox fallback
    const mockHist = loadStoredJSON('pictoai_payment_history', []);
    return {
      success: true,
      plan: user?.plan || 'starter',
      subscriptionStatus: user?.subscriptionStatus || 'inactive',
      credits: credits,
      monthlyCreditLimit: user?.monthlyCreditLimit || 50,
      renewalDate: user?.subscription?.endDate ? new Date(user.subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
      subscription: user?.subscription || null,
      paymentHistory: mockHist
    };
  }, [isBackendOnline, token, user, credits]);

  const purchaseSubscription = async (planName, amountINR) => {
    playSfx('click');
    if (isBackendOnline && token && token !== 'sandbox_token_jwt_123') {
      try {
        // Load Razorpay checkout script first
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          playSfx('error');
          return { success: false, message: 'Failed to load Razorpay Payment Gateway. Check your network.' };
        }

        // 1. Create payment order on backend
        const res = await axios.post(`${BACKEND_URL}/api/payment/create-order`, {
          plan: planName,
          amount: amountINR * 100, // in paise
          currency: 'INR'
        }, {
          headers: { token }
        });

        if (!res.data.success) {
          playSfx('error');
          return { success: false, message: res.data.message || 'Failed to create payment order.' };
        }

        const orderData = res.data; // orderId, amount, currency, plan, keyId

        // 2. Launch Razorpay interface
        return new Promise((resolve) => {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'PictoAI',
            description: `${planName.toUpperCase()} Plan Subscription`,
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
            order_id: orderData.orderId,
            handler: async function (response) {
              try {
                // 3. Verify signature on backend
                const verifyRes = await axios.post(`${BACKEND_URL}/api/payment/verify`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }, {
                  headers: { token }
                });

                if (verifyRes.data.success) {
                  playSfx('success');
                  // 4. Update local state
                  setCredits(verifyRes.data.credits || 150);
                  setUser(prev => ({
                    ...prev,
                    plan: verifyRes.data.plan,
                    subscriptionStatus: 'active',
                    subscription: verifyRes.data.subscription
                  }));
                  resolve({ success: true, message: 'Subscription successfully activated!' });
                } else {
                  playSfx('error');
                  resolve({ success: false, message: verifyRes.data.message || 'Signature verification failed.' });
                }
              } catch (err) {
                playSfx('error');
                resolve({ success: false, message: err.response?.data?.message || 'Verification request failed.' });
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
            },
            theme: {
              color: '#facc15'
            },
            modal: {
              ondismiss: function () {
                resolve({ success: false, message: 'Razorpay Checkout cancelled.' });
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        });

      } catch (error) {
        playSfx('error');
        console.error('Subscription purchase error:', error);
        return { success: false, message: error.response?.data?.message || 'Transaction initiation failed.' };
      }
    } else {
      // Offline Sandbox Mode: simulate payment delay and activate mock plan
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const newCredits = planName === 'pro' ? 150 : 500;
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);
      
      const mockSub = {
        plan: planName,
        paymentId: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
        orderId: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
        status: 'active',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      };

      setCredits(newCredits);
      setUser(prev => ({
        ...prev,
        plan: planName,
        subscriptionStatus: 'active',
        monthlyCreditLimit: newCredits,
        subscription: mockSub
      }));

      // Store in Sandbox Payment History list in localStorage
      const mockHistoryItem = {
        id: `mock_tx_${Date.now()}`,
        plan: planName,
        amount: amountINR,
        currency: 'INR',
        orderId: mockSub.orderId,
        paymentId: mockSub.paymentId,
        status: 'success',
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      
      const storedHistory = loadStoredJSON('pictoai_payment_history', []);
      localStorage.setItem('pictoai_payment_history', JSON.stringify([mockHistoryItem, ...storedHistory]));

      playSfx('success');
      return { success: true, message: 'Sandbox Subscription Activated!' };
    }
  };

  // --- HISTORY CONTROLS ---
  const clearHistory = () => {
    playSfx('click');
    setHistory([]);
  };

  const deleteHistoryItem = (id) => {
    playSfx('click');
    setHistory(prev => normalizeHistory(prev).filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        credits,
        soundEnabled,
        setSoundEnabled,
        activeTab,
        setActiveTab,
        prefilledPrompt,
        setPrefilledPrompt,
        history,
        isBackendOnline,
        loadingBackendCheck,
        playSfx,
        register,
        login,
        logout,
        generateImage,
        buyCredits,
        clearHistory,
        deleteHistoryItem,
        syncCredits,
        toggleLiveMode,
        purchaseSubscription,
        getSubscriptionStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
