'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { FiUpload, FiMic, FiMicOff, FiSearch, FiFile, FiX, FiChevronDown, FiChevronUp, FiCheck, FiLoader, FiDownload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

const PLANNER_MANAGER_ID = '69a212acff9f5d1338ea17d8'

interface PlanStep {
  step_number?: number
  action?: string
  assigned_to?: string
  status?: string
}

interface PlannerResponse {
  problem_understanding?: string
  action_plan?: PlanStep[]
  analysis_results?: string
  execution_results?: string
  verification_results?: string
  overall_summary?: string
}

interface IssueResolverProps {
  language: string
  onHistoryAdd: (item: any) => void
}

const PIPELINE_STEPS = [
  { id: 'planner', label: 'Planner', desc: 'Understanding & Planning' },
  { id: 'analyst', label: 'Data Analyst', desc: 'Analyzing Data' },
  { id: 'executor', label: 'Execution', desc: 'Executing Actions' },
  { id: 'critic', label: 'Critic', desc: 'Verifying Results' },
]

const SAMPLE_DESCRIPTION = `Our e-commerce sales dropped 25% last quarter compared to the same period last year. We need to identify the root causes, understand which product categories were most affected, and develop an action plan to recover. The marketing team has been running the same campaigns, so we suspect customer behavior changes or competitive factors.`

function safeParseResult(result: any): PlannerResponse | null {
  if (!result?.response?.result) return null
  let data = result.response.result
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return { overall_summary: data } }
  }
  return data
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

export default function IssueResolverPage({ language, onHistoryAdd }: IssueResolverProps) {
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(-1)
  const [result, setResult] = useState<PlannerResponse | null>(null)
  const [artifactFiles, setArtifactFiles] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const pipelineTimerRef = useRef<any>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selected])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...dropped])
  }, [])

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Speech recognition not supported in this browser.'); return }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = language || 'en-US'
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || ''
      setDescription(prev => (prev ? prev + ' ' : '') + transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleSolve = async () => {
    const text = showSample && !description ? SAMPLE_DESCRIPTION : description
    if (!text.trim()) { setError('Please describe your problem.'); return }
    setError('')
    setResult(null)
    setArtifactFiles([])
    setLoading(true)
    setPipelineStep(0)

    // Start pipeline animation
    let step = 0
    pipelineTimerRef.current = setInterval(() => {
      step++
      if (step < 4) setPipelineStep(step)
    }, 8000)

    try {
      let assetIds: string[] = []
      if (files.length > 0) {
        setUploadStatus('Uploading files...')
        const uploadResult = await uploadFiles(files)
        if (uploadResult.success && Array.isArray(uploadResult.asset_ids)) {
          assetIds = uploadResult.asset_ids
        }
        setUploadStatus('')
      }

      const agentResult = await callAIAgent(text, PLANNER_MANAGER_ID, assetIds.length > 0 ? { assets: assetIds } : undefined)
      clearInterval(pipelineTimerRef.current)
      setPipelineStep(4) // All complete

      if (agentResult.success) {
        const parsed = safeParseResult(agentResult)
        setResult(parsed)
        const artFiles = Array.isArray(agentResult?.module_outputs?.artifact_files) ? agentResult.module_outputs.artifact_files : []
        setArtifactFiles(artFiles)

        // Save to history
        onHistoryAdd({
          id: Date.now().toString(),
          type: 'issue',
          title: text.substring(0, 80),
          summary: parsed?.overall_summary || parsed?.problem_understanding || 'Problem resolved',
          timestamp: new Date().toISOString(),
          details: parsed,
        })
      } else {
        setError(agentResult?.error || 'Failed to process your request. Please try again.')
      }
    } catch (err: any) {
      clearInterval(pipelineTimerRef.current)
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const effectiveDescription = showSample && !description ? SAMPLE_DESCRIPTION : description

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Issue Resolver</h1>
          <p className="text-muted-foreground text-sm">Upload data, describe your problem, and let AI solve it end-to-end</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
          <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* File Upload */}
        <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiUpload className="w-4 h-4 text-emerald-600" /> Upload Dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Drop files or click to browse</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">CSV, Excel, PDF, DOCX</p>
              <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.pdf,.docx,.doc" multiple onChange={handleFileSelect} />
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 truncate">
                      <FiFile className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadStatus && <p className="text-xs text-emerald-600 mt-2">{uploadStatus}</p>}
          </CardContent>
        </Card>

        {/* Problem Description */}
        <Card className="lg:col-span-2 bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiSearch className="w-4 h-4 text-emerald-600" /> Problem Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                placeholder={showSample ? SAMPLE_DESCRIPTION : 'Describe your business problem in detail...'}
                className="min-h-[120px] resize-none pr-12 text-sm"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-600'}`}
              >
                {isListening ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
              </button>
            </div>
            {isListening && <p className="text-xs text-red-500 mt-1.5 animate-pulse">Listening... Speak now</p>}

            <Button
              onClick={handleSolve}
              disabled={loading || (!effectiveDescription.trim())}
              className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 text-sm font-semibold"
            >
              {loading ? (
                <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><FiSearch className="w-4 h-4 mr-2" /> Solve My Problem</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Pipeline Visualization */}
      {(loading || pipelineStep >= 0) && (
        <Card className="mb-6 bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">AI Pipeline Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              {PIPELINE_STEPS.map((step, idx) => {
                const isActive = pipelineStep === idx
                const isComplete = pipelineStep > idx
                const isPending = pipelineStep < idx
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex-1 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-all duration-500 ${isComplete ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : isActive ? 'bg-emerald-100 text-emerald-700 shadow-md animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                        {isComplete ? <FiCheck className="w-5 h-5" /> : isActive ? <FiLoader className="w-5 h-5 animate-spin" /> : <span className="text-sm font-semibold">{idx + 1}</span>}
                      </div>
                      <p className={`text-xs font-medium ${isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                    </div>
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-shrink-0 w-8 lg:w-12 mt-[-20px] transition-colors duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-border'}`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            {loading && (
              <div className="mt-4">
                <Progress value={Math.min((pipelineStep + 1) * 25, 95)} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  {pipelineStep < 4 ? PIPELINE_STEPS[Math.min(pipelineStep, 3)]?.desc || 'Processing...' : 'Complete!'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-600" /> Results
              </CardTitle>
              {artifactFiles.length > 0 && (
                <div className="flex gap-2">
                  {artifactFiles.map((f: any, i: number) => (
                    <a key={i} href={f?.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <FiDownload className="w-3.5 h-3.5" /> {f?.name || `File ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 h-9">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="plan" className="text-xs">Action Plan</TabsTrigger>
                <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                <TabsTrigger value="execution" className="text-xs">Execution</TabsTrigger>
                <TabsTrigger value="verification" className="text-xs">Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-4">
                    {result.problem_understanding && (
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-2">Problem Understanding</h4>
                        {renderMarkdown(result.problem_understanding)}
                      </div>
                    )}
                    {result.overall_summary && (
                      <div className="p-4 bg-muted/30 rounded-xl">
                        <h4 className="text-sm font-semibold mb-2">Overall Summary</h4>
                        {renderMarkdown(result.overall_summary)}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="plan" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  {Array.isArray(result.action_plan) && result.action_plan.length > 0 ? (
                    <div className="space-y-2">
                      {result.action_plan.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border/30">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {step?.step_number ?? idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{step?.action || 'Action step'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {step?.assigned_to && <Badge variant="secondary" className="text-[10px]">{step.assigned_to}</Badge>}
                              {step?.status && (
                                <Badge variant={step.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">
                                  {step.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No action plan steps available</p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  {result.analysis_results ? (
                    <div className="p-4 bg-muted/20 rounded-xl">
                      {renderMarkdown(result.analysis_results)}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No analysis results available</p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="execution" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  {result.execution_results ? (
                    <div className="p-4 bg-muted/20 rounded-xl">
                      {renderMarkdown(result.execution_results)}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No execution results available</p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="verification" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  {result.verification_results ? (
                    <div className="p-4 bg-muted/20 rounded-xl">
                      {renderMarkdown(result.verification_results)}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No verification results available</p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Show sample results when sample toggle is on and no real result */}
      {showSample && !result && !loading && (
        <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm border-dashed border-2">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Sample Preview</p>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h4 className="text-sm font-semibold text-emerald-800 mb-1">Problem Understanding</h4>
                <p className="text-sm text-muted-foreground">The business is experiencing a 25% decline in e-commerce sales, requiring root cause analysis and recovery plan development.</p>
              </div>
              <div className="space-y-2">
                {[
                  { step: 1, action: 'Analyze sales data trends by category', assigned: 'Data Analyst', status: 'completed' },
                  { step: 2, action: 'Identify customer behavior changes', assigned: 'Data Analyst', status: 'completed' },
                  { step: 3, action: 'Generate recovery campaign emails', assigned: 'Execution Agent', status: 'completed' },
                  { step: 4, action: 'Verify all actions and deliverables', assigned: 'Critic Agent', status: 'completed' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                    <span className="text-xs flex-1">{s.action}</span>
                    <Badge variant="secondary" className="text-[10px]">{s.assigned}</Badge>
                    <Badge className="text-[10px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
