import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Bot, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import { FormulaResult } from '../types/spreadsheet'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  formula?: string
  isStreaming?: boolean
}

interface AIChatPanelProps {
  cells: Record<string, any>
  selectedCell: { row: number; col: number } | null
  onFormulaGenerated: (result: FormulaResult) => void
  className?: string
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  cells,
  selectedCell,
  onFormulaGenerated,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI spreadsheet assistant. I can help you create formulas, analyze data, and provide insights. What would you like to do?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getCellId = (row: number, col: number) => {
    return String.fromCharCode(65 + col) + (row + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create streaming message
    const streamingMessageId = (Date.now() + 1).toString()
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, streamingMessage])

    try {
      // Prepare context about the spreadsheet
      const cellData = Object.values(cells).slice(0, 20).map(cell => ({
        id: cell.id,
        value: cell.value,
        type: cell.type
      }))

      const context = `
Current spreadsheet context:
- Selected cell: ${selectedCell ? getCellId(selectedCell.row, selectedCell.col) : 'None'}
- Sample data: ${JSON.stringify(cellData)}

User request: ${input.trim()}

Please provide helpful assistance for this spreadsheet task. If the user is asking for a formula, provide the Excel formula and explain how it works. If they're asking for analysis, provide insights about their data.`

      let fullResponse = ''

      await blink.ai.streamText(
        {
          prompt: context,
          model: 'gpt-4o-mini',
          maxTokens: 800
        },
        (chunk) => {
          fullResponse += chunk
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ))
        }
      )

      // Check if response contains a formula
      const formulaMatch = fullResponse.match(/=[A-Za-z0-9():,\s+\-*/]+/g)
      if (formulaMatch && formulaMatch.length > 0) {
        const formula = formulaMatch[0]
        
        // Update message with formula
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, formula, isStreaming: false }
            : msg
        ))

        // Offer to apply the formula
        setTimeout(() => {
          const applyMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `Would you like me to apply this formula to ${selectedCell ? getCellId(selectedCell.row, selectedCell.col) : 'the selected cell'}?`,
            timestamp: new Date(),
            formula
          }
          setMessages(prev => [...prev, applyMessage])
        }, 500)
      } else {
        // Mark as complete
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        ))
      }

    } catch (error) {
      console.error('AI chat failed:', error)
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { 
              ...msg, 
              content: 'Sorry, I encountered an error. Please try again.',
              isStreaming: false
            }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyFormula = (formula: string) => {
    if (selectedCell) {
      onFormulaGenerated({
        formula,
        explanation: 'Applied from AI chat',
        confidence: 90
      })
      
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Formula applied to ${getCellId(selectedCell.row, selectedCell.col)}!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, confirmMessage])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className={`w-80 bg-gray-900 text-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-gray-400">Spreadsheet Helper</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {message.role === 'user' ? (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-300 mb-1">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3 text-sm">
                  <div className="whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-green-500 ml-1 animate-pulse" />
                    )}
                  </div>
                  
                  {message.formula && (
                    <div className="mt-3 p-2 bg-gray-700 rounded border-l-2 border-green-500">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs bg-green-600/20 text-green-400 border-green-600">
                          Formula
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(message.formula!, message.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <code className="text-green-400 font-mono text-xs">
                        {message.formula}
                      </code>
                      {selectedCell && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyFormula(message.formula!)}
                          className="mt-2 h-7 text-xs bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
                        >
                          Apply to {getCellId(selectedCell.row, selectedCell.col)}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.role === 'assistant' && !message.isStreaming && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your spreadsheet..."
              className="min-h-[60px] max-h-32 bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none pr-12"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {selectedCell && (
            <div className="text-xs text-gray-400">
              Selected: {getCellId(selectedCell.row, selectedCell.col)}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}