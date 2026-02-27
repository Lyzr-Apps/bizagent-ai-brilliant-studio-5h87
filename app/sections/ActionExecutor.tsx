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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { FiUpload, FiMic, FiMicOff, FiZap, FiFile, FiX, FiCheck, FiLoader, FiDownload, FiAlertCircle, FiCheckCircle, FiMail, FiPlus } from 'react-icons/fi'

const ACTION_EXECUTOR_MANAGER_ID = '69a212aded4784a27a366c70'

interface ActionCompleted {
  action_type?: string
  status?: string
  count?: number
}

interface ActionResponse {
  action_understanding?: string
  execution_results?: string
  verification_results?: string
  overall_summary?: string
  actions_completed?: ActionCompleted[]
}

interface ActionExecutorProps {
  language: string
  user: any
  onHistoryAdd: (item: any) => void
}

const PIPELINE_STEPS = [
  { id: 'executor', label: 'Execution', desc: 'Executing Actions' },
  { id: 'critic', label: 'Critic', desc: 'Verifying Results' },
]

const SAMPLE_COMMAND = `Send a promotional email to our top 50 customers about our Valentine's Day sale with 20% discount on all accessories. Subject: "Exclusive Valentine's Offer Just for You". Include a warm greeting and mention the offer expires on Feb 28th.`

function safeParseResult(result: any): ActionResponse | null {
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

export default function ActionExecutorPage({ language, user, onHistoryAdd }: ActionExecutorProps) {
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(-1)
  const [result, setResult] = useState<ActionResponse | null>(null)
  const [artifactFiles, setArtifactFiles] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [recipientEmails, setRecipientEmails] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const pipelineTimerRef = useRef<any>(null)

  // Build structured message with business context + explicit email params
  const buildAgentMessage = (userText: string): string => {
    const businessCtx = user ? `
--- BUSINESS CONTEXT ---
Business Name: ${user.businessName || 'N/A'}
Business Type: ${user.businessType || 'N/A'}
Owner Name: ${user.ownerName || 'N/A'}
Business Email: ${user.email || 'N/A'}
Support Email: ${user.supportEmail || user.email || 'N/A'}
Business Phone: ${user.contactNumber || user.phone || 'N/A'}
Business Address: ${user.businessAddress || 'N/A'}
--- END BUSINESS CONTEXT ---` : ''

    const emailCtx = recipientEmails.trim() ? `
--- EMAIL EXECUTION PARAMETERS ---
Action Required: Send emails via Gmail using GMAIL_SEND_EMAIL tool
Recipient Email(s): ${recipientEmails.trim()}
Email Subject: ${emailSubject.trim() || 'Auto-generate appropriate subject from the action description'}
${emailBody.trim() ? `Email Body Content: ${emailBody.trim()}` : 'Email Body: Generate professional email content based on the action description and business context above.'}
Sender Business: ${user?.businessName || 'Business'}
Sender Name: ${user?.ownerName || 'Business Owner'}
CRITICAL INSTRUCTION: You MUST use the GMAIL_SEND_EMAIL tool to actually send an email to EACH recipient listed above. Do NOT simulate or skip sending. Execute the real Gmail send action for each recipient email address. The email should be professionally formatted with the business branding.
--- END EMAIL PARAMETERS ---` : ''

    return `${businessCtx}

USER ACTION REQUEST: ${userText}

${emailCtx}

Execute the requested action immediately. If email parameters are specified above, you MUST send real emails using the GMAIL_SEND_EMAIL tool. Report the exact status of each action performed.`
  }

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

  const handleExecute = async () => {
    const rawText = showSample && !description ? SAMPLE_COMMAND : description
    if (!rawText.trim()) { setError('Please describe the action to execute.'); return }
    if (recipientEmails.trim() && !recipientEmails.includes('@')) {
      setError('Please enter valid email address(es) for recipients.'); return
    }
    setError('')
    setResult(null)
    setArtifactFiles([])
    setLoading(true)
    setPipelineStep(0)

    let step = 0
    pipelineTimerRef.current = setInterval(() => {
      step++
      if (step < 2) setPipelineStep(step)
    }, 10000)

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

      const enrichedMessage = buildAgentMessage(rawText)
      const agentResult = await callAIAgent(enrichedMessage, ACTION_EXECUTOR_MANAGER_ID, assetIds.length > 0 ? { assets: assetIds } : undefined)
      clearInterval(pipelineTimerRef.current)
      setPipelineStep(2) // All complete

      if (agentResult.success) {
        const parsed = safeParseResult(agentResult)
        setResult(parsed)
        const artFiles = Array.isArray(agentResult?.module_outputs?.artifact_files) ? agentResult.module_outputs.artifact_files : []
        setArtifactFiles(artFiles)

        onHistoryAdd({
          id: Date.now().toString(),
          type: 'action',
          title: rawText.substring(0, 80),
          summary: parsed?.overall_summary || parsed?.action_understanding || 'Action executed',
          timestamp: new Date().toISOString(),
          details: parsed,
        })
      } else {
        // Show detailed error including tool_auth info
        const errorMsg = agentResult?.error || 'Failed to execute your action.'
        const rawResp = agentResult?.raw_response || ''
        const isToolAuth = errorMsg.includes('tool_auth') || errorMsg.includes('authentication') || rawResp.includes?.('tool_auth')
        setError(isToolAuth
          ? 'Gmail authentication required. The Gmail tool needs to be authenticated in Lyzr Studio before emails can be sent. Please contact your administrator.'
          : errorMsg
        )
        // Still show partial results if available
        const parsed = safeParseResult(agentResult)
        if (parsed) setResult(parsed)
      }
    } catch (err: any) {
      clearInterval(pipelineTimerRef.current)
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const effectiveDescription = showSample && !description ? SAMPLE_COMMAND : description

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Action Executor</h1>
          <p className="text-muted-foreground text-sm">Execute direct actions -- emails, reports, campaigns -- verified by AI</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle-action" className="text-xs text-muted-foreground">Sample Data</Label>
          <Switch id="sample-toggle-action" checked={showSample} onCheckedChange={setShowSample} />
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* File Upload */}
        <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiUpload className="w-4 h-4 text-amber-500" /> Upload Dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
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
                      <FiFile className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadStatus && <p className="text-xs text-amber-600 mt-2">{uploadStatus}</p>}
          </CardContent>
        </Card>

        {/* Action Description */}
        <Card className="lg:col-span-2 bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiZap className="w-4 h-4 text-amber-500" /> Action Command
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                placeholder={showSample ? SAMPLE_COMMAND : 'Describe the action you want to execute...'}
                className="min-h-[120px] resize-none pr-12 text-sm"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-600'}`}
              >
                {isListening ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
              </button>
            </div>
            {isListening && <p className="text-xs text-red-500 mt-1.5 animate-pulse">Listening... Speak now</p>}

            {/* Email Parameters Section */}
            <div className="mt-3 border border-amber-200/60 rounded-xl p-3 bg-amber-50/20">
              <div className="flex items-center gap-2 mb-2">
                <FiMail className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">Email Parameters</span>
                <span className="text-[10px] text-muted-foreground">(required for email actions)</span>
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Recipient Email(s) *</Label>
                  <Input
                    placeholder="e.g. client@company.com, team@org.com"
                    className="text-sm h-9"
                    value={recipientEmails}
                    onChange={e => setRecipientEmails(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Separate multiple emails with commas</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Email Subject</Label>
                  <Input
                    placeholder="Auto-generated if left blank"
                    className="text-sm h-9"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Email Body (optional)</Label>
                  <Textarea
                    placeholder="Leave blank for AI-generated professional content based on your action description..."
                    className="min-h-[60px] resize-none text-sm"
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleExecute}
              disabled={loading || (!effectiveDescription.trim())}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-11 text-sm font-semibold"
            >
              {loading ? (
                <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Executing...</>
              ) : (
                <><FiZap className="w-4 h-4 mr-2" /> Execute Now</>
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
            <CardTitle className="text-sm font-semibold">Execution Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-6">
              {PIPELINE_STEPS.map((step, idx) => {
                const isActive = pipelineStep === idx
                const isComplete = pipelineStep > idx
                return (
                  <React.Fragment key={step.id}>
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-all duration-500 ${isComplete ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : isActive ? 'bg-amber-100 text-amber-700 shadow-md animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                        {isComplete ? <FiCheck className="w-5 h-5" /> : isActive ? <FiLoader className="w-5 h-5 animate-spin" /> : <span className="text-sm font-semibold">{idx + 1}</span>}
                      </div>
                      <p className={`text-sm font-medium ${isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                    </div>
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`h-0.5 w-16 lg:w-24 mt-[-20px] transition-colors duration-500 ${isComplete ? 'bg-amber-500' : 'bg-border'}`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            {loading && (
              <div className="mt-4">
                <Progress value={Math.min((pipelineStep + 1) * 50, 95)} className="h-1.5" />
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
                <FiCheckCircle className="w-5 h-5 text-amber-500" /> Execution Results
              </CardTitle>
              {artifactFiles.length > 0 && (
                <div className="flex gap-2">
                  {artifactFiles.map((f: any, i: number) => (
                    <a key={i} href={f?.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
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
                <TabsTrigger value="actions" className="text-xs">Actions Completed</TabsTrigger>
                <TabsTrigger value="execution" className="text-xs">Execution Details</TabsTrigger>
                <TabsTrigger value="verification" className="text-xs">Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-4">
                    {result.action_understanding && (
                      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">Action Understanding</h4>
                        {renderMarkdown(result.action_understanding)}
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

              <TabsContent value="actions" className="mt-4">
                <ScrollArea className="max-h-[400px]">
                  {Array.isArray(result.actions_completed) && result.actions_completed.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Action Type</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.actions_completed.map((action, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">{action?.action_type || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant={action?.status === 'success' || action?.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {action?.status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{action?.count ?? 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No completed actions data available</p>
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
                    <p className="text-sm text-muted-foreground py-4 text-center">No execution details available</p>
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

      {/* Sample display */}
      {showSample && !result && !loading && (
        <Card className="bg-white/75 backdrop-blur-xl border border-white/20 shadow-sm border-dashed border-2">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Sample Preview</p>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">Action Understanding</h4>
                <p className="text-sm text-muted-foreground">Send promotional Valentine's Day email campaign to top 50 customers with 20% discount offer on accessories.</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-sm">Email Campaign</TableCell>
                    <TableCell><Badge className="text-xs">completed</Badge></TableCell>
                    <TableCell className="text-right text-sm">50</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm">Template Generation</TableCell>
                    <TableCell><Badge className="text-xs">completed</Badge></TableCell>
                    <TableCell className="text-right text-sm">1</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
