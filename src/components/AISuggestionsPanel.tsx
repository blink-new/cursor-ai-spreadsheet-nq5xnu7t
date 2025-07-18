import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Calculator,
  Lightbulb,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { Cell, AIAnalysis, ChartRecommendation } from '../types/spreadsheet'
import { blink } from '../blink/client'

interface AISuggestionsPanelProps {
  cells: Record<string, Cell>
  selectedCell: { row: number; col: number } | null
  onApplySuggestion: (suggestion: string) => void
  className?: string
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  cells,
  selectedCell,
  onApplySuggestion,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastAnalyzedData, setLastAnalyzedData] = useState<string>('')

  const analyzeData = useCallback(async () => {
    const cellValues = Object.values(cells).filter(cell => cell.value).map(cell => cell.value)
    if (cellValues.length === 0) return

    const dataString = JSON.stringify(cellValues)
    if (dataString === lastAnalyzedData) return

    setIsLoading(true)
    try {
      const prompt = `Analyze this spreadsheet data and provide insights: ${JSON.stringify(cellValues.slice(0, 20))}
      
      Please provide:
      1. Key insights about the data
      2. Suggestions for formulas or calculations
      3. Chart recommendations
      
      Format as JSON:
      {
        "insights": ["insight1", "insight2"],
        "suggestions": ["suggestion1", "suggestion2"],
        "chartRecommendations": [
          {
            "type": "bar",
            "title": "Chart Title",
            "description": "Why this chart would be useful",
            "dataRange": "A1:B10"
          }
        ]
      }`

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 500
      })

      try {
        const result = JSON.parse(text) as AIAnalysis
        setAnalysis(result)
        setLastAnalyzedData(dataString)
      } catch {
        // Fallback analysis
        setAnalysis({
          insights: [
            'Data contains numeric values suitable for calculations',
            'Consider using SUM, AVERAGE, or COUNT functions'
          ],
          suggestions: [
            'Calculate totals with SUM function',
            'Find averages with AVERAGE function',
            'Count entries with COUNT function'
          ],
          chartRecommendations: [
            {
              type: 'bar',
              title: 'Data Overview',
              description: 'Visualize your data with a bar chart',
              dataRange: 'A1:B10'
            }
          ]
        })
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cells, lastAnalyzedData])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(cells).length > 0) {
        analyzeData()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [cells, analyzeData])

  const getChartIcon = (type: ChartRecommendation['type']) => {
    switch (type) {
      case 'bar': return <BarChart3 className="h-4 w-4" />
      case 'line': return <LineChart className="h-4 w-4" />
      case 'pie': return <PieChart className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const quickSuggestions = [
    { label: 'Sum Column', formula: '=SUM(A:A)', icon: <Calculator className="h-4 w-4" /> },
    { label: 'Average', formula: '=AVERAGE(A:A)', icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Count Values', formula: '=COUNT(A:A)', icon: <Calculator className="h-4 w-4" /> },
    { label: 'Today\'s Date', formula: '=TODAY()', icon: <Calculator className="h-4 w-4" /> }
  ]

  return (
    <div className={`w-80 bg-white border-l border-border overflow-y-auto ${className}`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-lg">AI Assistant</h2>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Quick Formulas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => onApplySuggestion(suggestion.formula)}
                className="w-full justify-start h-auto p-2 text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  {suggestion.icon}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{suggestion.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {suggestion.formula}
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* AI Analysis */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
              <p className="text-sm text-muted-foreground">Analyzing your data...</p>
            </CardContent>
          </Card>
        ) : analysis ? (
          <>
            {/* Insights */}
            {analysis.insights.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Data Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.insights.map((insight, index) => (
                    <div key={index} className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">
                      {insight}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => onApplySuggestion(suggestion)}
                      className="w-full justify-start h-auto p-2 text-left text-sm"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Sparkles className="h-3 w-3 text-accent flex-shrink-0" />
                        <span className="flex-1">{suggestion}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Chart Recommendations */}
            {analysis.chartRecommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Chart Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.chartRecommendations.map((chart, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="text-accent mt-0.5">
                          {getChartIcon(chart.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{chart.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {chart.description}
                          </div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {chart.dataRange}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add some data to get AI-powered insights and suggestions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}