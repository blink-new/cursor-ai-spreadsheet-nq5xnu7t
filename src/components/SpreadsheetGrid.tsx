import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Cell } from '../types/spreadsheet'
import { getCellId, columnToLetter, detectCellType, formatCellValue, evaluateFormula } from '../utils/spreadsheet'

interface SpreadsheetGridProps {
  cells: Record<string, Cell>
  selectedCell: { row: number; col: number } | null
  onCellSelect: (row: number, col: number) => void
  onCellValueChange: (row: number, col: number, value: string) => void
  rows?: number
  cols?: number
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  cells,
  selectedCell,
  onCellSelect,
  onCellValueChange,
  rows = 50,
  cols = 26,
  isEditing,
  onStartEdit,
  onStopEdit
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCellClick = (row: number, col: number) => {
    if (editingCell) {
      handleCellSubmit()
    }
    onCellSelect(row, col)
  }

  const handleCellDoubleClick = (row: number, col: number) => {
    const cellId = getCellId(row, col)
    const cell = cells[cellId]
    setEditingCell({ row, col })
    setEditValue(cell?.formula || cell?.value || '')
    onStartEdit()
  }

  const handleCellSubmit = () => {
    if (editingCell) {
      onCellValueChange(editingCell.row, editingCell.col, editValue)
      setEditingCell(null)
      setEditValue('')
      onStopEdit()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return

    switch (e.key) {
      case 'Enter':
        if (editingCell) {
          handleCellSubmit()
        } else {
          // Move down
          onCellSelect(Math.min(selectedCell.row + 1, rows - 1), selectedCell.col)
        }
        break
      case 'Tab':
        e.preventDefault()
        if (editingCell) {
          handleCellSubmit()
        }
        // Move right
        onCellSelect(selectedCell.row, Math.min(selectedCell.col + 1, cols - 1))
        break
      case 'Escape':
        if (editingCell) {
          setEditingCell(null)
          setEditValue('')
          onStopEdit()
        }
        break
      case 'ArrowUp':
        if (!editingCell) {
          e.preventDefault()
          onCellSelect(Math.max(selectedCell.row - 1, 0), selectedCell.col)
        }
        break
      case 'ArrowDown':
        if (!editingCell) {
          e.preventDefault()
          onCellSelect(Math.min(selectedCell.row + 1, rows - 1), selectedCell.col)
        }
        break
      case 'ArrowLeft':
        if (!editingCell) {
          e.preventDefault()
          onCellSelect(selectedCell.row, Math.max(selectedCell.col - 1, 0))
        }
        break
      case 'ArrowRight':
        if (!editingCell) {
          e.preventDefault()
          onCellSelect(selectedCell.row, Math.min(selectedCell.col + 1, cols - 1))
        }
        break
      case 'F2':
        e.preventDefault()
        handleCellDoubleClick(selectedCell.row, selectedCell.col)
        break
      default:
        if (!editingCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // Start editing with the typed character
          setEditingCell(selectedCell)
          setEditValue(e.key)
          onStartEdit()
        }
        break
    }
  }

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  const getCellStyle = (row: number, col: number) => {
    const cellId = getCellId(row, col)
    const cell = cells[cellId]
    const isSelected = selectedCell?.row === row && selectedCell?.col === col
    const isEditing = editingCell?.row === row && editingCell?.col === col

    let className = 'border border-gray-200 h-8 min-w-[80px] px-2 text-sm font-mono cursor-cell hover:bg-blue-50 transition-colors'
    
    if (isSelected) {
      className += ' ring-2 ring-primary ring-inset bg-blue-50'
    }
    
    if (isEditing) {
      className += ' ring-2 ring-accent ring-inset'
    }

    if (cell?.type === 'formula') {
      className += ' bg-accent/5'
    } else if (cell?.type === 'number') {
      className += ' text-right'
    }

    return className
  }

  const renderCell = (row: number, col: number) => {
    const cellId = getCellId(row, col)
    const cell = cells[cellId]
    const isEditingThis = editingCell?.row === row && editingCell?.col === col

    if (isEditingThis) {
      return (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellSubmit()
            } else if (e.key === 'Escape') {
              setEditingCell(null)
              setEditValue('')
              onStopEdit()
            }
          }}
          className="w-full h-full px-2 text-sm font-mono bg-white border-none outline-none"
        />
      )
    }

    const displayValue = cell ? formatCellValue(cell) : ''
    
    return (
      <div className="w-full h-full flex items-center px-2 truncate">
        {displayValue}
      </div>
    )
  }

  return (
    <div 
      ref={gridRef}
      className="spreadsheet-grid overflow-auto bg-white border border-gray-200"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div className="inline-block min-w-full">
        {/* Header Row */}
        <div className="flex sticky top-0 bg-gray-50 z-10">
          <div className="w-12 h-8 border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-medium">
            
          </div>
          {Array.from({ length: cols }, (_, col) => (
            <div
              key={col}
              className="min-w-[80px] h-8 border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-medium"
            >
              {columnToLetter(col)}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex">
            {/* Row Header */}
            <div className="w-12 h-8 border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-medium sticky left-0 z-10">
              {row + 1}
            </div>
            
            {/* Data Cells */}
            {Array.from({ length: cols }, (_, col) => (
              <div
                key={`${row}-${col}`}
                className={getCellStyle(row, col)}
                onClick={() => handleCellClick(row, col)}
                onDoubleClick={() => handleCellDoubleClick(row, col)}
              >
                {renderCell(row, col)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}