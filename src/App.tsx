import React, { useState, useEffect, useCallback } from 'react'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/use-toast'
import { AICommandBar } from './components/AICommandBar'
import { FormulaBar } from './components/FormulaBar'
import { SpreadsheetGrid } from './components/SpreadsheetGrid'
import { AISuggestionsPanel } from './components/AISuggestionsPanel'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { 
  Save, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Sparkles,
  User,
  Settings,
  Menu
} from 'lucide-react'
import { Cell, FormulaResult } from './types/spreadsheet'
import { getCellId, detectCellType, evaluateFormula } from './utils/spreadsheet'
import { blink } from './blink/client'

function App() {
  const [cells, setCells] = useState<Record<string, Cell>>({})
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Initialize auth
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Sample data for demonstration
  useEffect(() => {
    if (user && Object.keys(cells).length === 0) {
      const sampleCells: Record<string, Cell> = {
        'A1': {
          id: 'A1',
          row: 0,
          col: 0,
          value: 'Product',
          type: 'text'
        },
        'B1': {
          id: 'B1',
          row: 0,
          col: 1,
          value: 'Sales Q1',
          type: 'text'
        },
        'C1': {
          id: 'C1',
          row: 0,
          col: 2,
          value: 'Sales Q2',
          type: 'text'
        },
        'A2': {
          id: 'A2',
          row: 1,
          col: 0,
          value: 'Laptops',
          type: 'text'
        },
        'B2': {
          id: 'B2',
          row: 1,
          col: 1,
          value: '15000',
          type: 'number'
        },
        'C2': {
          id: 'C2',
          row: 1,
          col: 2,
          value: '18000',
          type: 'number'
        },
        'A3': {
          id: 'A3',
          row: 2,
          col: 0,
          value: 'Phones',
          type: 'text'
        },
        'B3': {
          id: 'B3',
          row: 2,
          col: 1,
          value: '25000',
          type: 'number'
        },
        'C3': {
          id: 'C3',
          row: 2,
          col: 2,
          value: '28000',
          type: 'number'
        },
        'A4': {
          id: 'A4',
          row: 3,
          col: 0,
          value: 'Tablets',
          type: 'text'
        },
        'B4': {
          id: 'B4',
          row: 3,
          col: 1,
          value: '8000',
          type: 'number'
        },
        'C4': {
          id: 'C4',
          row: 3,
          col: 2,
          value: '9500',
          type: 'number'
        }
      }
      setCells(sampleCells)
    }
  }, [user, cells])

  const handleCellValueChange = useCallback((row: number, col: number, value: string) => {
    const cellId = getCellId(row, col)
    const type = detectCellType(value)
    
    let processedValue = value
    if (type === 'formula') {
      processedValue = evaluateFormula(value, cells)
    }

    const newCell: Cell = {
      id: cellId,
      row,
      col,
      value: processedValue,
      formula: type === 'formula' ? value : undefined,
      type
    }

    setCells(prev => ({
      ...prev,
      [cellId]: newCell
    }))

    toast({
      title: "Cell Updated",
      description: `${cellId} = ${processedValue}`,
      duration: 2000
    })
  }, [cells, toast])

  const handleFormulaGenerated = useCallback((result: FormulaResult) => {
    if (!selectedCell) return

    handleCellValueChange(selectedCell.row, selectedCell.col, result.formula)
    
    toast({
      title: "AI Formula Applied",
      description: result.explanation,
      duration: 4000
    })
  }, [selectedCell, handleCellValueChange, toast])

  const handleSuggestionApply = useCallback((suggestion: string) => {
    if (!selectedCell) return

    if (suggestion.startsWith('=')) {
      handleCellValueChange(selectedCell.row, selectedCell.col, suggestion)
    } else {
      // If it's a text suggestion, show it in a toast
      toast({
        title: "AI Suggestion",
        description: suggestion,
        duration: 4000
      })
    }
  }, [selectedCell, handleCellValueChange, toast])

  const getCurrentCell = () => {
    if (!selectedCell) return null
    const cellId = getCellId(selectedCell.row, selectedCell.col)
    return cells[cellId] || null
  }

  const currentCell = getCurrentCell()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Cursor AI for Excel...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <FileSpreadsheet className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Cursor AI for Excel</h1>
            <p className="text-muted-foreground">
              Intelligent spreadsheet assistant with AI-powered formula generation and data analysis
            </p>
          </div>
          <Button onClick={() => blink.auth.login()} size="lg" className="w-full">
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Cursor AI for Excel</h1>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => blink.auth.logout()}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {user.email}
            </Button>
          </div>
        </div>
      </header>

      {/* AI Command Bar */}
      <div className="bg-white border-b border-border px-6 py-4">
        <AICommandBar
          onFormulaGenerated={handleFormulaGenerated}
          selectedCell={selectedCell ? getCellId(selectedCell.row, selectedCell.col) : undefined}
        />
      </div>

      {/* Formula Bar */}
      <FormulaBar
        selectedCell={selectedCell}
        cellValue={currentCell?.value || ''}
        cellFormula={currentCell?.formula}
        cellType={currentCell?.type || 'text'}
        onValueChange={(value) => {
          if (selectedCell) {
            handleCellValueChange(selectedCell.row, selectedCell.col, value)
          }
        }}
        onConfirm={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
        isEditing={isEditing}
        onStartEdit={() => setIsEditing(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Spreadsheet */}
        <div className="flex-1">
          <SpreadsheetGrid
            cells={cells}
            selectedCell={selectedCell}
            onCellSelect={setSelectedCell}
            onCellValueChange={handleCellValueChange}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onStopEdit={() => setIsEditing(false)}
          />
        </div>

        {/* AI Suggestions Panel */}
        <AISuggestionsPanel
          cells={cells}
          selectedCell={selectedCell}
          onApplySuggestion={handleSuggestionApply}
        />
      </div>

      <Toaster />
    </div>
  )
}

export default App