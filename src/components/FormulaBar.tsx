import React, { useState, useEffect } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Check, X, Calculator, Sparkles } from 'lucide-react'
import { Cell } from '../types/spreadsheet'
import { getCellId } from '../utils/spreadsheet'

interface FormulaBarProps {
  selectedCell: { row: number; col: number } | null
  cellValue: string
  cellFormula?: string
  cellType: Cell['type']
  onValueChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
  isEditing: boolean
  onStartEdit: () => void
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  selectedCell,
  cellValue,
  cellFormula,
  cellType,
  onValueChange,
  onConfirm,
  onCancel,
  isEditing,
  onStartEdit
}) => {
  const [localValue, setLocalValue] = useState('')

  useEffect(() => {
    if (isEditing) {
      setLocalValue(cellFormula || cellValue)
    } else {
      setLocalValue('')
    }
  }, [isEditing, cellValue, cellFormula])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onValueChange(localValue)
      onConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const getTypeColor = (type: Cell['type']) => {
    switch (type) {
      case 'formula': return 'bg-accent text-accent-foreground'
      case 'number': return 'bg-blue-100 text-blue-800'
      case 'date': return 'bg-purple-100 text-purple-800'
      case 'boolean': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Cell['type']) => {
    switch (type) {
      case 'formula': return <Calculator className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b border-border">
      {/* Cell Reference */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="font-mono text-sm font-medium text-muted-foreground min-w-[60px]">
          {selectedCell ? getCellId(selectedCell.row, selectedCell.col) : ''}
        </div>
        
        {selectedCell && (
          <Badge variant="outline" className={`text-xs ${getTypeColor(cellType)}`}>
            {getTypeIcon(cellType)}
            <span className="ml-1 capitalize">{cellType}</span>
          </Badge>
        )}
      </div>

      {/* Formula Input */}
      <div className="flex-1 flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono text-sm formula-bar flex-1"
              placeholder="Enter value or formula (start with = for formulas)"
              autoFocus
            />
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onValueChange(localValue)
                  onConfirm()
                }}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div
            onClick={onStartEdit}
            className="flex-1 px-3 py-2 text-sm font-mono bg-muted/30 rounded-md cursor-text hover:bg-muted/50 transition-colors min-h-[36px] flex items-center"
          >
            {cellFormula || cellValue || (
              <span className="text-muted-foreground">Click to edit or use AI command above</span>
            )}
          </div>
        )}
      </div>

      {/* AI Indicator */}
      {cellType === 'formula' && (
        <div className="flex items-center gap-1 text-accent">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium">AI</span>
        </div>
      )}
    </div>
  )
}