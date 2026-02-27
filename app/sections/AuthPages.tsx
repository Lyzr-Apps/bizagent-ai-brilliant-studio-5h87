'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiMail, FiLock, FiUser, FiPhone, FiBriefcase, FiMapPin, FiGlobe, FiArrowRight, FiShield } from 'react-icons/fi'

interface AuthPagesProps {
  currentPage: string
  onNavigate: (page: string) => void
  onLogin: (user: any) => void
}

const BUSINESS_TYPES = [
  'Retail', 'E-Commerce', 'Healthcare', 'Finance', 'Technology',
  'Education', 'Manufacturing', 'Real Estate', 'Food & Beverage', 'Other'
]

const LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'bn-IN', label: 'Bengali' },
]

export default function AuthPages({ currentPage, onNavigate, onLogin }: AuthPagesProps) {
  if (currentPage === 'register') {
    return <RegistrationPage onNavigate={onNavigate} onLogin={onLogin} />
  }
  return <LoginPage onNavigate={onNavigate} onLogin={onLogin} />
}

function RegistrationPage({ onNavigate, onLogin }: { onNavigate: (p: string) => void; onLogin: (u: any) => void }) {
  const [form, setForm] = useState({
    ownerName: '', email: '', phone: '', businessName: '',
    businessType: '', businessAddress: '', supportEmail: '',
    contactNumber: '', language: 'en-US', password: '', confirmPassword: ''
  })
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('')

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleRegister = () => {
    if (!form.ownerName || !form.email || !form.password || !form.businessName) {
      setStatus('Please fill in all required fields.')
      setStatusType('error')
      return
    }
    if (form.password !== form.confirmPassword) {
      setStatus('Passwords do not match.')
      setStatusType('error')
      return
    }
    const userData = { ...form, createdAt: new Date().toISOString() }
    localStorage.setItem('bizagent_user', JSON.stringify(userData))
    setStatus('Registration successful! Redirecting...')
    setStatusType('success')
    setTimeout(() => onLogin(userData), 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, hsl(160 40% 94%) 0%, hsl(180 35% 93%) 30%, hsl(160 35% 95%) 60%, hsl(140 40% 94%) 100%)' }}>
      <Card className="w-full max-w-2xl bg-white/75 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FiShield className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Register Your Business</CardTitle>
          <CardDescription>Create your BizAgent AI account to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ownerName" className="text-sm font-medium">Owner Name *</Label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="ownerName" placeholder="John Doe" className="pl-9" value={form.ownerName} onChange={e => updateField('ownerName', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="regEmail" className="text-sm font-medium">Email *</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="regEmail" type="email" placeholder="john@business.com" className="pl-9" value={form.email} onChange={e => updateField('email', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="phone" placeholder="+91 9876543210" className="pl-9" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-sm font-medium">Business Name *</Label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="businessName" placeholder="Acme Corp" className="pl-9" value={form.businessName} onChange={e => updateField('businessName', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Business Type</Label>
              <Select value={form.businessType} onValueChange={v => updateField('businessType', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bizAddr" className="text-sm font-medium">Business Address</Label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="bizAddr" placeholder="123 Main St" className="pl-9" value={form.businessAddress} onChange={e => updateField('businessAddress', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail" className="text-sm font-medium">Support Email</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="supportEmail" type="email" placeholder="support@business.com" className="pl-9" value={form.supportEmail} onChange={e => updateField('supportEmail', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactNum" className="text-sm font-medium">Contact Number</Label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="contactNum" placeholder="+91 9876543210" className="pl-9" value={form.contactNumber} onChange={e => updateField('contactNumber', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Default Language</Label>
              <Select value={form.language} onValueChange={v => updateField('language', v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <FiGlobe className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Select language" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="regPassword" className="text-sm font-medium">Password *</Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="regPassword" type="password" placeholder="Min 6 characters" className="pl-9" value={form.password} onChange={e => updateField('password', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="confirmPwd" className="text-sm font-medium">Confirm Password *</Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="confirmPwd" type="password" placeholder="Re-enter password" className="pl-9" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} />
              </div>
            </div>
          </div>

          {status && (
            <div className={`text-sm p-3 rounded-lg ${statusType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {status}
            </div>
          )}

          <Button onClick={handleRegister} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 text-sm font-semibold">
            Register Business <FiArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-4 hover:underline">
              Login here
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function LoginPage({ onNavigate, onLogin }: { onNavigate: (p: string) => void; onLogin: (u: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleLogin = () => {
    if (!email || !password) {
      setStatus('Please enter email and password.')
      return
    }
    const stored = localStorage.getItem('bizagent_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user.email === email && user.password === password) {
          setStatus('')
          onLogin(user)
          return
        }
      } catch { /* ignore */ }
    }
    // Allow any login for demo
    const demoUser = { ownerName: 'Demo User', email, businessName: 'Demo Business', language: 'en-US' }
    localStorage.setItem('bizagent_user', JSON.stringify(demoUser))
    onLogin(demoUser)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, hsl(160 40% 94%) 0%, hsl(180 35% 93%) 30%, hsl(160 35% 95%) 60%, hsl(140 40% 94%) 100%)' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 opacity-95" />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">BIZAGENT AI</h1>
          <p className="text-emerald-100 text-lg mb-2">Autonomous Business Assistant</p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="px-3 py-1 rounded-full bg-white/15 text-white text-sm font-medium backdrop-blur-sm">Analyze</span>
            <span className="text-white/60">-</span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-white text-sm font-medium backdrop-blur-sm">Decide</span>
            <span className="text-white/60">-</span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-white text-sm font-medium backdrop-blur-sm">Execute</span>
          </div>
          <div className="mt-10 space-y-3 text-left">
            <div className="flex items-start gap-3 text-white/90 text-sm">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold">1</span></div>
              <span>Upload your business data and describe your problem</span>
            </div>
            <div className="flex items-start gap-3 text-white/90 text-sm">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold">2</span></div>
              <span>AI agents analyze, plan, and execute solutions</span>
            </div>
            <div className="flex items-start gap-3 text-white/90 text-sm">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold">3</span></div>
              <span>Get verified results with actionable insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/75 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">BIZAGENT AI</span>
            </div>
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your business assistant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="loginEmail" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="loginEmail" type="email" placeholder="john@business.com" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loginPassword" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="loginPassword" type="password" placeholder="Enter password" className="pl-9" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
            </div>

            {status && (
              <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {status}
              </div>
            )}

            <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 text-sm font-semibold">
              Login <FiArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New to BizAgent?{' '}
              <button onClick={() => onNavigate('register')} className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-4 hover:underline">
                Register your Business
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
