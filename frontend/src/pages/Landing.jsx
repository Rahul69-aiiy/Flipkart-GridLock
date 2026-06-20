import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Key, AlertCircle, Sparkles, MapPin, BarChart3, Shield } from 'lucide-react'
import useStore from '@/store/useStore'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate small latency for premium command center feeling
    setTimeout(() => {
      if (email === 'test@gmail.com' && password === '12345678') {
        login()
        navigate('/')
      } else {
        setError('Invalid security credentials. Check the helper palette.')
        setLoading(false)
      }
    }, 800)
  }

  const fillDemoCredentials = () => {
    setEmail('test@gmail.com')
    setPassword('12345678')
    setError('')
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background grids and glowing gradients to mimic the isometric network and traffic lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-64 h-64 bg-[#FFE500]/5 rounded-full filter blur-[80px] pointer-events-none" />

      <div className="w-full max-w-6xl z-10 flex flex-col gap-8 my-8">
        
        {/* Hackathon Banner Image Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative group bg-navy-900"
        >
          {/* Glowing border overlay */}
          <div className="absolute inset-0 border border-[#FFE500]/20 rounded-2xl pointer-events-none group-hover:border-[#FFE500]/40 transition-colors duration-500" />
          <img 
            src="/gridlock_banner.png" 
            alt="Flipkart GridLock Hackathon Banner" 
            className="w-full h-auto object-cover max-h-[220px] md:max-h-[300px]"
          />
        </motion.div>

        {/* Main Grid: Info Section + Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Panel: Platform info & features */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7 flex flex-col justify-between p-6 md:p-8 rounded-2xl bg-navy-900/60 backdrop-blur-glass border border-white/5 shadow-card"
          >
            <div>
              {/* Traffic Light Header Icon */}
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] animate-pulse" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] animate-pulse [animation-delay:0.3s]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] animate-pulse [animation-delay:0.6s]" />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider ml-2">Command Center System</span>
              </div>

              {/* Title & Badge */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-[#FFE500] text-black text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded border border-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.2)]">
                    SOLVE . TRAFFIC
                  </span>
                  <span className="bg-white/5 border border-white/10 text-white text-[10px] font-semibold tracking-wider px-3 py-1 rounded">
                    ParkSight AI Platform
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  AI-Driven Parking Intelligence & Congestion Control
                </h1>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
                  Built on <strong className="text-white">298,450 Bengaluru Traffic Police parking violation records</strong>, 
                  ParkSight AI leverages machine learning and optimization algorithms to automate spatial hotspotting, 
                  predict congestion index potentials (CIP), and coordinate target enforcement details.
                </p>
              </div>

              {/* Quick statistics/highlights */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
                <div className="space-y-1">
                  <div className="text-lg md:text-xl font-bold text-accent-cyan flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>DBSCAN</span>
                  </div>
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">Spatial Clustering</p>
                </div>
                <div className="space-y-1">
                  <div className="text-lg md:text-xl font-bold text-accent-purple flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>XGBoost</span>
                  </div>
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">CIP Forecasting</p>
                </div>
                <div className="space-y-1">
                  <div className="text-lg md:text-xl font-bold text-accent-teal flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>OR-Tools</span>
                  </div>
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">CP-SAT Optimizer</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
              <span>Flipkart GRIDLOCK Hackathon submission — Smarter Roads, Better Tomorrow.</span>
            </div>
          </motion.div>

          {/* Right Panel: Login card & Credentials helper */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            {/* Login Card */}
            <div className="flex-1 p-6 md:p-8 rounded-2xl bg-navy-900/60 backdrop-blur-glass border border-white/5 shadow-card flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Command Login
                </h2>
                <p className="text-xs text-slate-500 mt-1">Authenticate credentials to initiate access</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Security Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="test@gmail.com"
                      className="input-field pl-10 pr-4"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-10 pr-4"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFE500] hover:bg-[#FFE500]/90 text-black font-extrabold text-sm tracking-wide transition-all shadow-[0_4px_20px_rgba(255,229,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>INITIATE ACCESS</span>
                  )}
                </button>
              </form>
            </div>

            {/* Credentials Helper Palette - Glow themed */}
            <div 
              onClick={fillDemoCredentials}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 shadow-lg cursor-pointer group flex items-center gap-4 relative overflow-hidden"
            >
              
              <div className="w-10 h-10 rounded-lg bg-[#FFE500]/10 flex items-center justify-center border border-[#FFE500]/20 flex-shrink-0 group-hover:bg-[#FFE500]/20 group-hover:border-[#FFE500]/30 transition-colors">
                <Key className="w-5 h-5 text-[#FFE500]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-[#FFE500] uppercase tracking-wider">Demo Credentials Palette</span>

                </div>
                <div className="flex gap-4 mt-1 text-[11px] text-slate-400 font-mono truncate">
                  <span>email: <strong className="text-slate-200 font-semibold select-all">test@gmail.com</strong></span>
                  <span>pass: <strong className="text-slate-200 font-semibold select-all">12345678</strong></span>
                </div>
              </div>
              <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 group-hover:bg-[#FFE500]/20 group-hover:text-white transition-colors font-bold flex-shrink-0 whitespace-nowrap">CLICK TO AUTOFILL</span>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  )
}
