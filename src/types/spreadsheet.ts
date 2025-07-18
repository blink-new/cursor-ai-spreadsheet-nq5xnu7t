export interface Cell {
  id: string
  row: number
  col: number
  value: string
  formula?: string
  type: 'text' | 'number' | 'formula' | 'date' | 'boolean'
  style?: CellStyle
}

export interface CellStyle {
  backgroundColor?: string
  textColor?: string
  fontWeight?: 'normal' | 'bold'
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: number
}

export interface SpreadsheetData {
  id: string
  name: string
  cells: Record<string, Cell>
  rows: number
  cols: number
  createdAt: Date
  updatedAt: Date
}

export interface AIAnalysis {
  insights: string[]
  suggestions: string[]
  chartRecommendations: ChartRecommendation[]
}

export interface ChartRecommendation {
  type: 'bar' | 'line' | 'pie' | 'scatter'
  title: string
  description: string
  dataRange: string
}

export interface FormulaResult {
  formula: string
  explanation: string
  confidence: number
}