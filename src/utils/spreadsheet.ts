import { Cell } from '../types/spreadsheet'

export const columnToLetter = (col: number): string => {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode(65 + (col % 26)) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}

export const letterToColumn = (letter: string): number => {
  let result = 0
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64)
  }
  return result - 1
}

export const getCellId = (row: number, col: number): string => {
  return `${columnToLetter(col)}${row + 1}`
}

export const parseCellId = (cellId: string): { row: number; col: number } => {
  const match = cellId.match(/^([A-Z]+)(\d+)$/)
  if (!match) throw new Error(`Invalid cell ID: ${cellId}`)
  
  const col = letterToColumn(match[1])
  const row = parseInt(match[2]) - 1
  
  return { row, col }
}

export const detectCellType = (value: string): Cell['type'] => {
  if (!value || value.trim() === '') return 'text'
  
  // Formula
  if (value.startsWith('=')) return 'formula'
  
  // Number
  if (!isNaN(Number(value)) && value.trim() !== '') return 'number'
  
  // Date
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/
  if (dateRegex.test(value)) return 'date'
  
  // Boolean
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean'
  
  return 'text'
}

export const formatCellValue = (cell: Cell): string => {
  if (!cell.value) return ''
  
  switch (cell.type) {
    case 'number': {
      const num = parseFloat(cell.value)
      return isNaN(num) ? cell.value : num.toLocaleString()
    }
    case 'date': {
      try {
        const date = new Date(cell.value)
        return date.toLocaleDateString()
      } catch {
        return cell.value
      }
    }
    case 'boolean':
      return cell.value.toLowerCase() === 'true' ? 'TRUE' : 'FALSE'
    case 'formula':
      return cell.value // Show the calculated result, not the formula
    default:
      return cell.value
  }
}

export const evaluateFormula = (formula: string, cells: Record<string, Cell>): string => {
  // Simple formula evaluation - in a real app, you'd use a proper formula engine
  if (!formula.startsWith('=')) return formula
  
  let expression = formula.substring(1)
  
  // Replace cell references with values
  const cellRefRegex = /[A-Z]+\d+/g
  expression = expression.replace(cellRefRegex, (match) => {
    const cell = cells[match]
    if (!cell || !cell.value) return '0'
    
    const numValue = parseFloat(cell.value)
    return isNaN(numValue) ? '0' : numValue.toString()
  })
  
  try {
    // Basic math evaluation (unsafe in production - use a proper parser)
    const result = Function(`"use strict"; return (${expression})`)()
    return result.toString()
  } catch {
    return '#ERROR'
  }
}