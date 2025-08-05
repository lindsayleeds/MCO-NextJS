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
import { ChevronDown, ChevronUp, Filter, TrendingUp, TrendingDown } from 'lucide-react'
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
  ], [])

  const table = useReactTable({
    data: filteredPositions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
            <h1 className="text-3xl font-bold text-foreground">Positions</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track your investment positions
            </p>
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
      </Layout>
    </ProtectedRoute>
  )
}