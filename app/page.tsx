'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FiHome, FiSearch, FiZap, FiClock, FiUser, FiLogOut, FiMenu, FiX, FiShield, FiGlobe } from 'react-icons/fi'

import AuthPages from './sections/AuthPages'
import { DashboardPage, HistoryPage, ProfilePage } from './sections/AppPages'
import IssueResolverPage from './sections/IssueResolver'
import ActionExecutorPage from './sections/ActionExecutor'

// ErrorBoundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'issue-resolver', label: 'Issue Resolver', icon: FiSearch },
  { id: 'action-executor', label: 'Action Executor', icon: FiZap },
  { id: 'history', label: 'History', icon: FiClock },
  { id: 'profile', label: 'Profile', icon: FiUser },
]

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'issue-resolver': 'Issue Resolver',
  'action-executor': 'Action Executor',
  history: 'History',
  profile: 'Profile',
}

const THEME_VARS = {
  '--background': '160 35% 96%',
  '--foreground': '160 35% 8%',
  '--card': '160 30% 99%',
  '--card-foreground': '160 35% 8%',
  '--primary': '160 85% 35%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '160 30% 93%',
  '--secondary-foreground': '160 35% 12%',
  '--accent': '45 95% 50%',
  '--accent-foreground': '160 35% 8%',
  '--muted': '160 25% 90%',
  '--muted-foreground': '160 25% 40%',
  '--border': '160 28% 88%',
  '--input': '160 25% 85%',
  '--ring': '160 85% 35%',
} as React.CSSProperties

export default function Page() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [language, setLanguage] = useState('en-US')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('bizagent_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.email) {
          setUser(parsed)
          setLanguage(parsed.language || 'en-US')
          setCurrentPage('dashboard')
        }
      } catch { /* ignore */ }
    }
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    setLanguage(userData?.language || 'en-US')
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('login')
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }

  const handleHistoryAdd = (item: any) => {
    try {
      const stored = localStorage.getItem('bizagent_history')
      const existing = stored ? JSON.parse(stored) : []
      const updated = Array.isArray(existing) ? [item, ...existing] : [item]
      localStorage.setItem('bizagent_history', JSON.stringify(updated.slice(0, 50)))
    } catch { /* ignore */ }
  }

  const handleUpdateUser = (updated: any) => {
    setUser(updated)
    setLanguage(updated?.language || 'en-US')
  }

  if (!mounted) {
    return (
      <div style={THEME_VARS} className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Auth pages (no sidebar)
  if (currentPage === 'login' || currentPage === 'register') {
    return (
      <ErrorBoundary>
        <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
          <AuthPages currentPage={currentPage} onNavigate={handleNavigate} onLogin={handleLogin} />
        </div>
      </ErrorBoundary>
    )
  }

  // Main app layout with sidebar
  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground flex" >
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-white/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-60' : 'w-[68px]',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 p-4 h-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200/50">
              <FiShield className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold tracking-tight leading-none">BIZAGENT AI</h1>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Business Assistant</p>
              </div>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* Nav Items */}
          <nav className="flex-1 p-2.5 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-emerald-100/80 text-emerald-800 shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive && 'text-emerald-600')} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>

          {/* Bottom */}
          <div className="p-2.5 space-y-1">
            <Separator className="opacity-50 mb-2" />
            {sidebarOpen && user && (
              <div className="px-3 py-2 mb-1">
                <p className="text-xs font-medium truncate">{user?.ownerName || 'User'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <FiLogOut className="w-[18px] h-[18px] flex-shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Top Header */}
          <header className="sticky top-0 z-30 h-14 bg-white/70 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setMobileMenuOpen(!mobileMenuOpen)
                  } else {
                    setSidebarOpen(!sidebarOpen)
                  }
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-sm font-semibold">{PAGE_TITLES[currentPage] || 'Dashboard'}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={v => setLanguage(v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <div className="flex items-center gap-1.5">
                    <FiGlobe className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {(user?.ownerName || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(135deg, hsl(160 40% 94%) 0%, hsl(180 35% 93%) 30%, hsl(160 35% 95%) 60%, hsl(140 40% 94%) 100%)' }}>
            {currentPage === 'dashboard' && (
              <DashboardPage onNavigate={handleNavigate} user={user} />
            )}
            {currentPage === 'issue-resolver' && (
              <IssueResolverPage language={language} user={user} onHistoryAdd={handleHistoryAdd} />
            )}
            {currentPage === 'action-executor' && (
              <ActionExecutorPage language={language} user={user} onHistoryAdd={handleHistoryAdd} />
            )}
            {currentPage === 'history' && (
              <HistoryPage onNavigate={handleNavigate} />
            )}
            {currentPage === 'profile' && (
              <ProfilePage user={user} onUpdateUser={handleUpdateUser} />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
