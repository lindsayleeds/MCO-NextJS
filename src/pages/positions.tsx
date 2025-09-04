import { useEffect, useState, useMemo } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Filter, TrendingUp, TrendingDown, Edit, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/utils/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Position {
  id: string
  ticker: string
  company_name: string | null
  start_date: string
  start_price: number | null
  end_date: string | null
  end_price: number | null
  start_price_override: number | null
  end_price_override: number | null
  status: 'Open' | 'Closed'
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<Position>()

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [editForm, setEditForm] = useState({
    ticker: '',
    company_name: '',
    start_date: '',
    end_date: '',
    start_price_override: '',
    end_price_override: '',
    status: 'Open' as 'Open' | 'Closed'
  })

  // Fetch positions from Supabase
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching positions:', error)
          return
        }

        setPositions(data || [])
      } catch (error) {
        console.error('Error fetching positions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
  }, [])

  const filteredPositions = useMemo(() => {
    if (statusFilter === 'all') return positions
    return positions.filter(position => 
      statusFilter === 'open' ? position.status === 'Open' : position.status === 'Closed'
    )
  }, [positions, statusFilter])

  const calculateReturn = (startPrice: number | null, endPrice?: number | null, overrideStart?: number | null, overrideEnd?: number | null) => {
    const actualStart = overrideStart || startPrice
    const actualEnd = overrideEnd || endPrice
    
    if (!actualStart || !actualEnd) return null
    return ((actualEnd - actualStart) / actualStart * 100)
  }

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position)
    setIsAddMode(false)
    setEditForm({
      ticker: position.ticker,
      company_name: position.company_name || '',
      start_date: position.start_date,
      end_date: position.end_date || '',
      start_price_override: position.start_price_override?.toString() || '',
      end_price_override: position.end_price_override?.toString() || '',
      status: position.status
    })
    setIsModalOpen(true)
  }

  const handleDeletePosition = async (position: Position) => {
    const displayName = `${position.ticker}${position.company_name ? ` (${position.company_name})` : ''}`
    if (!confirm(`Are you sure you want to delete ${displayName}? This will also remove all snapshot data related to this position.`)) {
      return
    }

    try {
      // First, delete related snapshot_positions
      const { error: snapshotPositionsError } = await supabase
        .from('snapshot_positions')
        .delete()
        .eq('ticker', position.ticker)

      if (snapshotPositionsError) {
        console.error('Error deleting snapshot positions:', snapshotPositionsError)
        alert('Error deleting position. Please try again.')
        return
      }

      // Then delete the position
      const { error: positionError } = await supabase
        .from('positions')
        .delete()
        .eq('id', position.id)

      if (positionError) {
        console.error('Error deleting position:', positionError)
        alert('Error deleting position. Please try again.')
        return
      }

      // Update local state
      setPositions(prev => prev.filter(p => p.id !== position.id))
    } catch (error) {
      console.error('Error deleting position:', error)
      alert('Error deleting position. Please try again.')
    }
  }

  const handleAddPosition = () => {
    setEditingPosition(null)
    setIsAddMode(true)
    setEditForm({
      ticker: '',
      company_name: '',
      start_date: '',
      end_date: '',
      start_price_override: '',
      end_price_override: '',
      status: 'Open'
    })
    setIsModalOpen(true)
  }

  const handleSavePosition = async () => {
    try {
      const positionData = {
        ticker: editForm.ticker,
        company_name: editForm.company_name || null,
        start_date: editForm.start_date,
        end_date: editForm.end_date || null,
        start_price_override: editForm.start_price_override ? parseFloat(editForm.start_price_override) : null,
        end_price_override: editForm.end_price_override ? parseFloat(editForm.end_price_override) : null,
        status: editForm.status,
      }

      if (isAddMode) {
        // Add new position
        const { data, error } = await supabase
          .from('positions')
          .insert([{
            ...positionData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (error) {
          console.error('Error adding position:', error)
          return
        }

        // Add to local state
        if (data && data[0]) {
          setPositions(prev => [data[0], ...prev])
        }
      } else {
        // Update existing position
        if (!editingPosition) return
        
        const updateData = {
          ...positionData,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('positions')
          .update(updateData)
          .eq('id', editingPosition.id)

        if (error) {
          console.error('Error updating position:', error)
          return
        }

        // Update the local state
        setPositions(prev => prev.map(pos => 
          pos.id === editingPosition.id 
            ? { ...pos, ...updateData }
            : pos
        ))
      }

      setIsModalOpen(false)
      setEditingPosition(null)
      setIsAddMode(false)
    } catch (error) {
      console.error('Error saving position:', error)
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor('ticker', {
      header: 'Ticker',
      cell: info => (
        <div className="font-medium text-foreground">
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('company_name', {
      header: 'Company',
      cell: info => (
        <div className="text-muted-foreground">
          {info.getValue() || '-'}
        </div>
      )
    }),
    columnHelper.accessor('start_date', {
      header: 'Start Date',
      cell: info => (
        <div className="text-sm text-foreground">
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      )
    }),
    columnHelper.accessor('start_price', {
      header: 'Start Price',
      cell: info => {
        const override = info.row.original.start_price_override
        const originalPrice = info.getValue()
        const price = override || originalPrice
        
        if (!price && !override) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        return (
          <div className="text-sm text-foreground">
            ${price?.toFixed(2)}
            {override && <span className="text-xs text-muted-foreground ml-1">(override)</span>}
          </div>
        )
      }
    }),
    columnHelper.accessor('end_price', {
      header: 'End Price',
      cell: info => {
        const endPrice = info.getValue()
        const override = info.row.original.end_price_override
        const price = override || endPrice
        
        if (!price) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        return (
          <div className="text-sm text-foreground">
            ${price.toFixed(2)}
            {override && <span className="text-xs text-muted-foreground ml-1">(override)</span>}
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'return',
      header: 'Return',
      cell: info => {
        const { start_price, end_price, start_price_override, end_price_override } = info.row.original
        const returnPct = calculateReturn(start_price, end_price, start_price_override, end_price_override)
        
        if (returnPct === null) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        const isPositive = returnPct >= 0
        return (
          <div className={`text-sm font-medium flex items-center ${isPositive ? 'text-profit-green-600 dark:text-profit-green-400' : 'text-loss-red-600 dark:text-loss-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
          </div>
        )
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
        return (
          <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
            status === 'Open' 
              ? 'bg-profit-green-100 text-profit-green-800 dark:bg-profit-green-900 dark:text-profit-green-200' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {status}
          </span>
        )
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-foreground hover:text-accent-foreground hover:bg-accent"
            onClick={() => handleEditPosition(info.row.original)}
          >
            <span className="sr-only">Edit position</span>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
            onClick={() => handleDeletePosition(info.row.original)}
          >
            <span className="sr-only">Delete position</span>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }),
  ], [])

  const table = useReactTable({
    data: filteredPositions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [
        {
          id: 'ticker',
          desc: false
        }
      ]
    }
  })

  if (loading) {
    return (
      <ProtectedRoute allowDemo={true}>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-blue-500"></div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowDemo={true}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Positions</h1>
                <p className="text-muted-foreground mt-2">
                  Manage and track your investment positions
                </p>
              </div>
              <Button onClick={handleAddPosition} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Position
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
              </div>
              <div className="flex space-x-2">
                {(['all', 'open', 'closed'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={statusFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead 
                        key={header.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          <span>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())
                            }
                          </span>
                          {header.column.getCanSort() && (
                            <span className="ml-1">
                              {{
                                asc: <ChevronUp className="w-4 h-4" />,
                                desc: <ChevronDown className="w-4 h-4" />,
                              }[header.column.getIsSorted() as string] ?? <ChevronDown className="w-4 h-4 opacity-50" />}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length} 
                      className="h-24 text-center text-muted-foreground"
                    >
                      No positions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add/Edit Position Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isAddMode ? 'Add Position' : 'Edit Position'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ticker" className="block text-sm font-medium text-foreground mb-1">
                    Ticker
                  </label>
                  <Input
                    id="ticker"
                    value={editForm.ticker}
                    onChange={(e) => setEditForm({...editForm, ticker: e.target.value})}
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">
                    Company
                  </label>
                  <Input
                    id="company"
                    value={editForm.company_name}
                    onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
                    placeholder="Apple Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-foreground mb-1">
                    Start Date
                  </label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-foreground mb-1">
                    End Date
                  </label>
                  <Input
                    id="end_date"
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_override" className="block text-sm font-medium text-foreground mb-1">
                    Start Price Override
                  </label>
                  <Input
                    id="start_override"
                    type="number"
                    step="0.01"
                    value={editForm.start_price_override}
                    onChange={(e) => setEditForm({...editForm, start_price_override: e.target.value})}
                    placeholder="155.00"
                  />
                </div>
                <div>
                  <label htmlFor="end_override" className="block text-sm font-medium text-foreground mb-1">
                    End Price Override
                  </label>
                  <Input
                    id="end_override"
                    type="number"
                    step="0.01"
                    value={editForm.end_price_override}
                    onChange={(e) => setEditForm({...editForm, end_price_override: e.target.value})}
                    placeholder="180.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as 'Open' | 'Closed'})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePosition}>
                {isAddMode ? 'Add Position' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}