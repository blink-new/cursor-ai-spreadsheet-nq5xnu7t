import React, { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { blink } from '../blink/client'
import { FormulaResult } from '../types/spreadsheet'

interface AICommandBarProps {
  onFormulaGenerated: (result: FormulaResult) => void
  selectedCell?: string
  className?: string
}

export const AICommandBar: React.FC<AICommandBarProps> = ({
  onFormulaGenerated,
  selectedCell,
  className = ''
}) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const commonSuggestions = React.useMemo(() => [
    'Calculate the sum of column A',
    'Find the average of selected cells',
    'Count non-empty cells in range',
    'Create a formula to calculate percentage',
    'Generate a date formula for today',
    'Calculate compound interest',
    'Find the maximum value in range',
    'Create a conditional formula'
  ], [])

  useEffect(() => {
    if (query.length > 2) {
      const filtered = commonSuggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 4))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [query, commonSuggestions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const prompt = `Convert this natural language request into an Excel formula: "${query}"
      
      Context: ${selectedCell ? `Currently selected cell: ${selectedCell}` : 'No cell selected'}
      
      Please respond with:
      1. The Excel formula (starting with =)
      2. A brief explanation of what it does
      3. A confidence score (0-100)
      
      Format your response as JSON:
      {
        "formula": "=SUM(A1:A10)",
        "explanation": "This formula calculates the sum of values in cells A1 through A10",
        "confidence": 95
      }`

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 300
      })

      // Try to parse JSON response
      try {
        const result = JSON.parse(text) as FormulaResult
        onFormulaGenerated(result)
        setQuery('')
      } catch {
        // Fallback if JSON parsing fails
        const lines = text.split('\n').filter(line => line.trim())
        const formula = lines.find(line => line.includes('='))?.trim() || '=SUM(A1:A10)'
        
        onFormulaGenerated({
          formula,
          explanation: 'AI-generated formula based on your request',
          confidence: 80
        })
        setQuery('')
      }
    } catch (error) {
      console.error('AI formula generation failed:', error)
      // Provide a fallback response
      onFormulaGenerated({
        formula: '=SUM(A1:A10)',
        explanation: 'Default sum formula (AI service unavailable)',
        confidence: 50
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Sparkles className="absolute left-8 top-1/2 transform -translate-y-1/2 text-accent h-3 w-3" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI to create formulas... (e.g., 'calculate the average of column B')"
            className="pl-14 pr-12 h-11 bg-white border-2 border-muted focus:border-accent transition-colors"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isLoading}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 px-3 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border shadow-lg z-50 animate-fade-in">
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors flex items-center gap-2"
              >
                <Sparkles className="h-3 w-3 text-accent flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}