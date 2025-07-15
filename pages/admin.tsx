import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import AdminLoading from '@/components/ui/admin-loading'
import {
  Shield, Key, Activity, AlertTriangle, CheckCircle, XCircle, 
  Users, FileText, Zap, TrendingUp, Eye, EyeOff, RefreshCw
} from 'lucide-react'

interface AdminStats {
  totalResumes: number;
  totalAnalyses: number;
  totalLatexGenerations: number;
  apiKeyHealth: { [key: string]: 'healthy' | 'unhealthy' | 'checking' };
  recentErrors: string[];
  lastUpdated: string;
  // New token tracking fields
  dailyTokenUsage: {
    date: string;
    analysisTokens: number;
    latexTokens: number;
    totalTokens: number;
  };
  modelInfo: {
    analysisModel: string;
    latexModel: string;
    dailyLimit: number;
    requestsToday: number;
  };
  sessionStats: {
    tokensUsed: number;
    requestsCount: number;
    lastSessionTime: string;
  };
}

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [dailyCapacity, setDailyCapacity] = useState<{
    remainingRequests: number;
    estimatedAnalyses: number;
    estimatedLatexGenerations: number;
    percentageUsed: number;
  } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const checkApiKeyHealth = useCallback(async (currentStats: AdminStats) => {
    try {
      const response = await fetch('/api/admin/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const healthData = await response.json()
        currentStats.apiKeyHealth = healthData.apiKeyHealth
      }
    } catch (error) {
      console.error('Health check failed:', error)
    }
    
    currentStats.lastUpdated = new Date().toISOString()
    localStorage.setItem('adminStats', JSON.stringify(currentStats))
  }, [])

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch stats from server
      const statsResponse = await fetch('/api/admin/stats')
      let currentStats: AdminStats
      
      if (statsResponse.ok) {
        currentStats = await statsResponse.json()
      } else {
        // Fallback to localStorage if server fails
        const storedStats = localStorage.getItem('adminStats')
        currentStats = storedStats ? JSON.parse(storedStats) : {
          totalResumes: 0,
          totalAnalyses: 0,
          totalLatexGenerations: 0,
          apiKeyHealth: {},
          recentErrors: [],
          lastUpdated: new Date().toISOString()
        }
      }

      // Check API key health
      await checkApiKeyHealth(currentStats)
      
      setStats(currentStats)

      // Calculate daily capacity
      try {
        const capacityResponse = await fetch('/api/admin/capacity')
        if (capacityResponse.ok) {
          const capacity = await capacityResponse.json()
          setDailyCapacity(capacity)
        }
      } catch (error) {
        console.error('Failed to load capacity data:', error)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, checkApiKeyHealth])

  const verifyAuthentication = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        setIsAuthenticated(true)
        loadStats()
      } else {
        localStorage.removeItem('adminAuth')
        setIsAuthenticated(false)
      }
    } catch (error) {
      localStorage.removeItem('adminAuth')
      setIsAuthenticated(false)
    }
  }, [loadStats])

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('adminAuth')
    if (authStatus === 'true') {
      // Verify with server
      verifyAuthentication()
    }
  }, [verifyAuthentication])

  const handleLogin = async () => {
    setIsAuthenticating(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
        localStorage.setItem('adminToken', data.token)
        loadStats()
        toast({
          title: "Access Granted",
          description: "Welcome to the admin dashboard",
        })
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate",
        variant: "destructive",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('adminAuth')
    localStorage.removeItem('adminToken')
    setPassword('')
    router.push('/')
  }

  const refreshStats = () => {
    loadStats()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl text-slate-50">Admin Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="bg-slate-800 border-slate-700 text-slate-100 pr-10"
                    placeholder="Enter admin password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handleLogin} className="w-full" disabled={isAuthenticating}>
                <Shield className="mr-2 h-4 w-4" />
                {isAuthenticating ? 'Authenticating...' : 'Access Dashboard'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 relative">
      {/* Loading overlay */}
      {isAuthenticated && isLoading && <AdminLoading />}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Admin Dashboard</h1>
            <p className="text-slate-400">Monitor your Resumify AI application</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={refreshStats} variant="outline" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total Resumes</CardTitle>
                <FileText className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-50">{stats.totalResumes}</div>
                <p className="text-xs text-slate-400">Processed documents</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Analyses</CardTitle>
                <Activity className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-50">{stats.totalAnalyses}</div>
                <p className="text-xs text-slate-400">AI analyses completed</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">LaTeX Generated</CardTitle>
                <Zap className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-50">{stats.totalLatexGenerations}</div>
                <p className="text-xs text-slate-400">Templates generated</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Daily Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-50">{stats.modelInfo.requestsToday}</div>
                <p className="text-xs text-slate-400">of {stats.modelInfo.dailyLimit} requests</p>
                {dailyCapacity && (
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(dailyCapacity.percentageUsed, 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Information Cards */}
        {stats && dailyCapacity && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Daily Capacity Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <TrendingUp className="h-5 w-5" />
                  Daily Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Remaining Requests</span>
                    <span className="text-slate-200 font-medium">{dailyCapacity.remainingRequests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Est. Analyses</span>
                    <span className="text-green-400 font-medium">{dailyCapacity.estimatedAnalyses}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Est. LaTeX Gen</span>
                    <span className="text-blue-400 font-medium">{dailyCapacity.estimatedLatexGenerations}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Usage Today</span>
                    <span>{dailyCapacity.percentageUsed.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        dailyCapacity.percentageUsed > 80 ? 'bg-red-400' :
                        dailyCapacity.percentageUsed > 60 ? 'bg-amber-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min(dailyCapacity.percentageUsed, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Usage Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <Zap className="h-5 w-5" />
                  Token Usage Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Analysis Tokens</span>
                    <span className="text-cyan-400 font-medium">{stats.dailyTokenUsage.analysisTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">LaTeX Tokens</span>
                    <span className="text-purple-400 font-medium">{stats.dailyTokenUsage.latexTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                    <span className="text-slate-300 font-medium">Total Tokens</span>
                    <span className="text-slate-100 font-bold">{stats.dailyTokenUsage.totalTokens.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Date: {stats.dailyTokenUsage.date}
                </div>
              </CardContent>
            </Card>

            {/* Model Information Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <Activity className="h-5 w-5" />
                  Model Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Analysis Model</div>
                    <div className="text-sm text-slate-200 font-medium">{stats.modelInfo.analysisModel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">LaTeX Model</div>
                    <div className="text-sm text-slate-200 font-medium">{stats.modelInfo.latexModel}</div>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="text-xs text-slate-400 mb-1">Session Stats</div>
                    <div className="text-sm text-slate-200">
                      {stats.sessionStats.requestsCount} requests, {stats.sessionStats.tokensUsed.toLocaleString()} tokens
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* API Key Health */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <Key className="h-5 w-5" />
                  API Key Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.apiKeyHealth).map(([keyId, status], index) => (
                    <div key={keyId} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <span className="text-slate-300">API Key #{index + 1}</span>
                      <div className="flex items-center gap-2">
                        {status === 'healthy' && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <Badge variant="secondary" className="bg-green-400/10 text-green-400">Healthy</Badge>
                          </>
                        )}
                        {status === 'unhealthy' && (
                          <>
                            <XCircle className="h-4 w-4 text-red-400" />
                            <Badge variant="secondary" className="bg-red-400/10 text-red-400">Unhealthy</Badge>
                          </>
                        )}
                        {status === 'checking' && (
                          <>
                            <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                            <Badge variant="secondary" className="bg-blue-400/10 text-blue-400">Checking</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.recentErrors.length > 0 ? (
                    stats.recentErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">No recent errors</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage 