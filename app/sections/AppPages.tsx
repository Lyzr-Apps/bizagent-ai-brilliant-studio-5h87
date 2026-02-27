'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiZap, FiArrowRight, FiClock, FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin, FiGlobe, FiSave, FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi'

// ============== DASHBOARD PAGE ==============
interface DashboardProps {
  onNavigate: (page: string) => void
  user: any
}

export function DashboardPage({ onNavigate, user }: DashboardProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Welcome back, {user?.ownerName || 'User'}
        </h1>
        <p className="text-muted-foreground text-sm">Choose a workflow to get started with your autonomous business assistant.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => onNavigate('issue-resolver')} className="text-left group">
          <Card className="h-full bg-white/75 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-emerald-200">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-emerald-200 transition-shadow">
                <FiSearch className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl mb-2">Issue Resolver</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Upload your data, describe your business problem, and let our AI pipeline analyze, plan, execute, and verify the solution end-to-end.
              </CardDescription>
              <div className="mt-5 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <span>Get Started</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">Planner</Badge>
                <Badge variant="secondary" className="text-xs">Data Analyst</Badge>
                <Badge variant="secondary" className="text-xs">Executor</Badge>
                <Badge variant="secondary" className="text-xs">Critic</Badge>
              </div>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => onNavigate('action-executor')} className="text-left group">
          <Card className="h-full bg-white/75 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-amber-200">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-amber-200 transition-shadow">
                <FiZap className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl mb-2">Action Executor</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Give a direct action command -- send emails, generate reports, create campaigns -- and let AI execute and verify it instantly.
              </CardDescription>
              <div className="mt-5 flex items-center gap-2 text-amber-600 text-sm font-medium">
                <span>Execute Now</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">Executor</Badge>
                <Badge variant="secondary" className="text-xs">Critic</Badge>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Agent Info Card */}
      <Card className="mt-8 bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Powering Your Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: 'Planner Manager', desc: 'Understands problems & creates action plans', flow: 'Issue Resolver' },
              { name: 'Data Analyst', desc: 'Analyzes data, trends & anomalies', flow: 'Issue Resolver' },
              { name: 'Execution Agent', desc: 'Sends emails, generates reports', flow: 'Both' },
              { name: 'Critic Agent', desc: 'Verifies & validates all outputs', flow: 'Both' },
            ].map((a, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/50 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold">{a.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
                <Badge variant="outline" className="mt-1.5 text-[10px]">{a.flow}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============== HISTORY PAGE ==============
interface HistoryProps {
  onNavigate: (page: string) => void
}

export function HistoryPage({ onNavigate }: HistoryProps) {
  const [history, setHistory] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('bizagent_history')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setHistory(parsed)
      } catch { /* ignore */ }
    }
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('bizagent_history')
    setHistory([])
  }

  const deleteItem = (id: string) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem('bizagent_history', JSON.stringify(updated))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">History</h1>
          <p className="text-muted-foreground text-sm">View your past problems and actions</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="text-destructive hover:text-destructive">
            <FiTrash2 className="w-4 h-4 mr-1.5" /> Clear All
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FiClock className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-1">No History Yet</h3>
            <p className="text-sm text-muted-foreground/70 mb-4">Your solved problems and executed actions will appear here</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate('issue-resolver')}>
                <FiSearch className="w-4 h-4 mr-1.5" /> Issue Resolver
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate('action-executor')}>
                <FiZap className="w-4 h-4 mr-1.5" /> Action Executor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3 pr-4">
            {history.map((item: any) => {
              const isExpanded = expandedId === item?.id
              return (
                <Card key={item?.id || Math.random()} className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={item?.type === 'issue' ? 'default' : 'secondary'} className="text-xs">
                            {item?.type === 'issue' ? 'Issue Resolver' : 'Action Executor'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item?.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown time'}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium truncate">{item?.title || 'Untitled'}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item?.summary || 'No summary available'}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => deleteItem(item?.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : item?.id)} className="h-8 w-8 p-0">
                          {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && item?.details && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg max-h-64 overflow-y-auto">
                          {typeof item.details === 'string' ? item.details : JSON.stringify(item.details, null, 2)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

// ============== PROFILE PAGE ==============
interface ProfileProps {
  user: any
  onUpdateUser: (user: any) => void
}

const LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'bn-IN', label: 'Bengali' },
]

const BUSINESS_TYPES = [
  'Retail', 'E-Commerce', 'Healthcare', 'Finance', 'Technology',
  'Education', 'Manufacturing', 'Real Estate', 'Food & Beverage', 'Other'
]

export function ProfilePage({ user, onUpdateUser }: ProfileProps) {
  const [form, setForm] = useState({
    ownerName: user?.ownerName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    businessAddress: user?.businessAddress || '',
    supportEmail: user?.supportEmail || '',
    contactNumber: user?.contactNumber || '',
    language: user?.language || 'en-US',
  })
  const [status, setStatus] = useState('')

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const updatedUser = { ...user, ...form }
    localStorage.setItem('bizagent_user', JSON.stringify(updatedUser))
    onUpdateUser(updatedUser)
    setStatus('Profile updated successfully!')
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Profile Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your business information</p>
      </div>

      <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
              {(form.ownerName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{form.ownerName || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{form.businessName || 'Business'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Owner Name</Label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={form.ownerName} onChange={e => updateField('ownerName', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="email" className="pl-9" value={form.email} onChange={e => updateField('email', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Phone</Label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Business Name</Label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={form.businessName} onChange={e => updateField('businessName', e.target.value)} />
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
              <Label className="text-sm font-medium">Business Address</Label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={form.businessAddress} onChange={e => updateField('businessAddress', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Support Email</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="email" className="pl-9" value={form.supportEmail} onChange={e => updateField('supportEmail', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Contact Number</Label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={form.contactNumber} onChange={e => updateField('contactNumber', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium">Default Language</Label>
              <Select value={form.language} onValueChange={v => updateField('language', v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <FiGlobe className="w-4 h-4 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {status && (
            <div className="text-sm p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {status}
            </div>
          )}

          <Button onClick={handleSave} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 text-sm font-semibold">
            <FiSave className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
