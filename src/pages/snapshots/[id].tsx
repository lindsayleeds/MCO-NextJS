import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
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
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Edit3,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react'
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

interface Snapshot {
  id: string
  name: string | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  status: string
  overall_portfolio_return_pct: number | null
  created_at: string
  updated_at: string
}

interface SnapshotPosition {
  id: string
  snapshot_id: string
  ticker: string
  company_name: string | null
  start_date: string
  end_date: string
  start_price: number | null
  end_price: number | null
  return_pct_at_snapshot: number | null
  status: string | null
  dividends_paid: number | null
  created_at: string
  updated_at: string
  // Position status from positions table
  position_status?: string | null
}

const columnHelper = createColumnHelper<SnapshotPosition>()

export default function SnapshotDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [positions, setPositions] = useState<SnapshotPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([
    {
      id: 'ticker',
      desc: false
    }
  ])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFetchingPrices, setIsFetchingPrices] = useState(false)
  const [isFetchingDividends, setIsFetchingDividends] = useState(false)
  const [portfolioStats, setPortfolioStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    notes: '',
  })

  // Fetch snapshot and positions data
  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const fetchData = async () => {
      setLoading(true)
      setPositionsLoading(true)

      try {
        // Fetch snapshot details
        const { data: snapshotData, error: snapshotError } = await supabase
          .from('snapshots')
          .select('*')
          .eq('id', id)
          .single()

        if (snapshotError) {
          console.error('Error fetching snapshot:', snapshotError)
          if (snapshotError.code === 'PGRST116') {
            router.push('/snapshots')
          }
          return
        }

        setSnapshot(snapshotData)
        setEditForm({
          name: snapshotData.name || '',
          start_date: snapshotData.start_date || '',
          end_date: snapshotData.end_date || '',
          notes: snapshotData.notes || '',
        })

        // Fetch snapshot positions with position status using view
        const { data: positionsData, error: positionsError } = await supabase
          .from('snapshot_positions_with_status')
          .select('*')
          .eq('snapshot_id', id)
          .order('ticker', { ascending: true })

        if (positionsError) {
          console.error('Error fetching snapshot positions:', positionsError)
          return
        }

        setPositions(positionsData || [])
        
        // Fetch portfolio statistics
        fetchPortfolioStats(id)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
        setPositionsLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  // Fetch portfolio statistics
  const fetchPortfolioStats = async (snapshotId: string) => {
    setStatsLoading(true)
    try {
      const response = await fetch(`http://localhost:4021/snapshots/${snapshotId}/stats`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const stats = await response.json()
      setPortfolioStats(stats)
    } catch (error) {
      console.error('Error fetching portfolio stats:', error)
      // Don't show error to user - stats are optional
    } finally {
      setStatsLoading(false)
    }
  }

  const handleEditSnapshot = () => {
    setIsEditModalOpen(true)
  }

  const handleSaveSnapshot = async () => {
    if (!snapshot) return

    try {
      const updateData = {
        name: editForm.name || null,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('snapshots')
        .update(updateData)
        .eq('id', snapshot.id)

      if (error) {
        console.error('Error updating snapshot:', error)
        return
      }

      setSnapshot(prev => prev ? { ...prev, ...updateData } : null)
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error saving snapshot:', error)
    }
  }

  const handleDeleteSnapshot = async () => {
    if (!snapshot) return

    const displayName = snapshot.name || (snapshot.end_date ? `snapshot ending ${new Date(snapshot.end_date).toLocaleDateString()}` : 'this snapshot')
    if (!confirm(`Are you sure you want to delete ${displayName}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('snapshots')
        .delete()
        .eq('id', snapshot.id)

      if (error) {
        console.error('Error deleting snapshot:', error)
        return
      }

      router.push('/snapshots')
    } catch (error) {
      console.error('Error deleting snapshot:', error)
    }
  }

  const handleFetchPrices = async () => {
    if (!snapshot) return

    setIsFetchingPrices(true)
    
    try {
      const response = await fetch(`http://localhost:4021/snapshots/${snapshot.id}/fetch-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Fetch prices result:', result)

      // Refresh positions data after fetching prices
      const { data, error } = await supabase
        .from('snapshot_positions_with_status')
        .select('*')
        .eq('snapshot_id', snapshot.id)
        .order('ticker', { ascending: true })

      if (error) {
        console.error('Error refreshing positions:', error)
      } else {
        setPositions(data || [])
      }

      alert('Prices fetched successfully!')
    } catch (error) {
      console.error('Error fetching prices:', error)
      alert('Error fetching prices. Please check if the FastAPI server is running on port 4021.')
    } finally {
      setIsFetchingPrices(false)
    }
  }

  const handleFetchDividends = async () => {
    if (!snapshot) return

    setIsFetchingDividends(true)
    
    try {
      const response = await fetch(`http://localhost:4021/snapshots/${snapshot.id}/populate-dividends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Fetch dividends result:', result)

      // Refresh positions data after fetching dividends
      const { data, error } = await supabase
        .from('snapshot_positions_with_status')
        .select('*')
        .eq('snapshot_id', snapshot.id)
        .order('ticker', { ascending: true })

      if (error) {
        console.error('Error refreshing positions:', error)
      } else {
        setPositions(data || [])
      }

      alert('Dividends fetched successfully!')
    } catch (error) {
      console.error('Error fetching dividends:', error)
      alert('Error fetching dividends. Please check if the FastAPI server is running on port 4021.')
    } finally {
      setIsFetchingDividends(false)
    }
  }

  const handleExportToHTML = () => {
    if (!snapshot || !positions.length) return

    // Separate open and closed positions based on position_status from positions table
    const openPositions = positions.filter(p => p.position_status !== 'Closed')
    const closedPositions = positions.filter(p => p.position_status === 'Closed')

    const getReturnClass = (returnPct: number) => {
      if (returnPct < 0) return 'negative'
      if (returnPct < 15) return 'low-positive'
      if (returnPct < 30) return 'positive'
      if (returnPct < 50) return 'more-positive'
      return 'very-positive'
    }

    const formatReturn = (startPrice: number | null, endPrice: number | null, dividends: number) => {
      if (!startPrice || !endPrice || startPrice === 0) return { return: 0, formatted: '-' }
      const totalReturn = ((endPrice + dividends) - startPrice) / startPrice * 100
      return { return: totalReturn, formatted: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%` }
    }

    const calculateHoldingDays = (startDate: string, endDate: string) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microcap Opportunities Portfolio - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        h1 {
            background: #fff;
            margin: 0;
            padding: 20px 25px 10px 25px;
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .period-info {
            padding: 0 25px 20px 25px;
            font-size: 18px;
            font-weight: 500;
            color: #495057;
            border-bottom: 1px solid #e9ecef;
        }
        
        .section-title {
            padding: 20px 25px 0 25px;
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0;
            background-color: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
        }
        
        .section-header {
            background-color: #f8f9fa;
            padding: 12px 15px 12px 25px;
            text-align: left;
            font-weight: 600;
            font-size: 16px;
            color: #2c3e50;
            border-bottom: 2px solid #dee2e6;
            white-space: nowrap;
        }
        
        .table-container {
            margin-bottom: 30px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }
        
        th {
            background-color: #f8f9fa;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            white-space: nowrap;
        }
        
        th.numeric-header {
            text-align: right;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #f1f3f4;
            font-size: 14px;
            vertical-align: middle;
        }
        
        td:first-child {
            padding-left: 25px;
        }
        
        td:last-child, th:last-child {
            padding-right: 25px;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #e9ecef;
        }
        
        .ticker {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
            white-space: nowrap;
        }
        
        .status.open {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status.closed {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .number {
            text-align: right;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .percentage {
            font-weight: 600;
            text-align: center;
        }
        
        .low-positive {
            background-color: rgb(102, 187, 199);
            color: white;
            padding: 3px 10px;
            border-radius: 4px;
            width: 50px;
            text-align: center;
            display: inline-block;
        }
        
        .positive {
            background-color: rgb(83, 173, 200);
            color: white;
            padding: 3px 10px;
            border-radius: 4px;
            width: 50px;
            text-align: center;
            display: inline-block;
        }
        
        .more-positive {
            background-color: rgb(25, 117, 179);
            color: white;
            padding: 3px 10px;
            border-radius: 4px;
            width: 50px;
            text-align: center;
            display: inline-block;
        }
        
        .very-positive {
            background-color: rgb(37, 75, 140);
            color: white;
            padding: 3px 10px;
            border-radius: 4px;
            width: 50px;
            text-align: center;
            display: inline-block;
        }
        
        .negative {
            background-color: #D9D9D9;
            color: #333333;
            padding: 3px 10px;
            border-radius: 4px;
            width: 50px;
            text-align: center;
            display: inline-block;
        }
        
        .date {
            white-space: nowrap;
        }
        
        .footer {
            padding: 15px 25px;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            
            table {
                font-size: 12px;
            }
            
            th, td {
                padding: 8px 6px;
            }
            
            h1 {
                font-size: 20px;
                padding: 15px 20px 10px 20px;
            }
            
            .period-info {
                padding: 0 20px 15px 20px;
                font-size: 16px;
            }
            
            .section-title {
                padding: 15px 20px 0 20px;
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Microcap Opportunities Portfolio</h1>
        <div class="period-info">Period: ${snapshot.start_date || 'N/A'} to ${snapshot.end_date || 'N/A'}</div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th class="section-header">Open Positions (${openPositions.length})</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th class="numeric-header">Start Price</th>
                        <th class="numeric-header">End Price</th>
                        <th class="numeric-header">Dividends</th>
                        <th>Return Pct</th>
                        <th class="numeric-header">Holding Days</th>
                    </tr>
                </thead>
                <tbody>
                    ${openPositions.map(pos => {
                      const dividends = Number(pos.dividends_paid) || 0
                      const returnCalc = formatReturn(pos.start_price, pos.end_price, dividends)
                      const holdingDays = calculateHoldingDays(pos.start_date, pos.end_date)
                      const returnClass = getReturnClass(returnCalc.return)
                      
                      return `
                    <tr>
                        <td class="ticker">${pos.ticker}</td>
                        <td class="date">${new Date(pos.start_date).toLocaleDateString()}</td>
                        <td class="date">${new Date(pos.end_date).toLocaleDateString()}</td>
                        <td class="number">$${pos.start_price?.toFixed(2) || '0.00'}</td>
                        <td class="number">$${pos.end_price?.toFixed(2) || '0.00'}</td>
                        <td class="number">$${dividends.toFixed(2)}</td>
                        <td class="percentage"><span class="${returnClass}">${returnCalc.formatted}</span></td>
                        <td class="number">${holdingDays}</td>
                    </tr>`
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        ${closedPositions.length > 0 ? `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th class="section-header">Closed Positions (${closedPositions.length})</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th class="numeric-header">Start Price</th>
                        <th class="numeric-header">End Price</th>
                        <th class="numeric-header">Dividends</th>
                        <th>Return Pct</th>
                        <th class="numeric-header">Holding Days</th>
                    </tr>
                </thead>
                <tbody>
                    ${closedPositions.map(pos => {
                      const dividends = Number(pos.dividends_paid) || 0
                      const returnCalc = formatReturn(pos.start_price, pos.end_price, dividends)
                      const holdingDays = calculateHoldingDays(pos.start_date, pos.end_date)
                      const returnClass = getReturnClass(returnCalc.return)
                      
                      return `
                    <tr>
                        <td class="ticker">${pos.ticker}</td>
                        <td class="date">${new Date(pos.start_date).toLocaleDateString()}</td>
                        <td class="date">${new Date(pos.end_date).toLocaleDateString()}</td>
                        <td class="number">$${pos.start_price?.toFixed(2) || '0.00'}</td>
                        <td class="number">$${pos.end_price?.toFixed(2) || '0.00'}</td>
                        <td class="number">$${dividends.toFixed(2)}</td>
                        <td class="percentage"><span class="${returnClass}">${returnCalc.formatted}</span></td>
                        <td class="number">${holdingDays}</td>
                    </tr>`
                    }).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })} • Data from Portfolio Snapshot ${snapshot.id}
        </div>
    </div>
</body>
</html>`

    // Create and download the file
    const blob = new Blob([html], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    const fileName = `portfolio-snapshot-${snapshot.end_date || 'export'}.html`
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        totalPositions: 0,
        winners: 0,
        losers: 0,
        totalDividends: 0,
        averageReturn: 0
      }
    }

    const totalPositions = positions.length
    
    // Calculate returns including dividends for each position
    const positionsWithReturns = positions.map(p => {
      const startPrice = p.start_price
      const endPrice = p.end_price
      const dividends = Number(p.dividends_paid) || 0
      
      if (!startPrice || !endPrice || startPrice === 0) {
        return { ...p, calculatedReturn: 0 }
      }
      
      const totalReturn = ((endPrice + dividends) - startPrice) / startPrice * 100
      return { ...p, calculatedReturn: totalReturn }
    })
    
    const winners = positionsWithReturns.filter(p => p.calculatedReturn > 0).length
    const losers = positionsWithReturns.filter(p => p.calculatedReturn < 0).length
    const totalDividends = positions.reduce((sum, p) => sum + (Number(p.dividends_paid) || 0), 0)
    const averageReturn = positionsWithReturns.reduce((sum, p) => sum + p.calculatedReturn, 0) / positions.length

    return {
      totalPositions,
      winners,
      losers,
      totalDividends,
      averageReturn
    }
  }, [positions])

  const columns = useMemo(() => [
    columnHelper.accessor('ticker', {
      header: 'Ticker',
      cell: info => (
        <div className="font-semibold text-foreground">
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
        <div className="text-foreground">
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      )
    }),
    columnHelper.accessor('end_date', {
      header: 'End Date',
      cell: info => (
        <div className="text-foreground">
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      )
    }),
    columnHelper.accessor('start_price', {
      header: 'Start Price',
      cell: info => {
        const value = info.getValue()
        return (
          <div className="text-foreground">
            {value !== null ? `$${value.toFixed(2)}` : '-'}
          </div>
        )
      }
    }),
    columnHelper.accessor('end_price', {
      header: 'End Price',
      cell: info => {
        const value = info.getValue()
        return (
          <div className="text-foreground">
            {value !== null ? `$${value.toFixed(2)}` : '-'}
          </div>
        )
      }
    }),
    columnHelper.accessor('dividends_paid', {
      header: 'Dividends',
      cell: info => {
        const value = info.getValue()
        const numValue = Number(value) || 0
        if (numValue === 0) {
          return <div className="text-muted-foreground">-</div>
        }
        return (
          <div className="text-foreground">
            ${numValue.toFixed(2)}
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'return_pct_with_dividends',
      header: 'Return %',
      cell: info => {
        const row = info.row.original
        const startPrice = row.start_price
        const endPrice = row.end_price
        const dividends = Number(row.dividends_paid) || 0
        
        if (!startPrice || !endPrice || startPrice === 0) {
          return <div className="text-muted-foreground">-</div>
        }
        
        // Calculate return including dividends: ((End Price + Dividends) - Start Price) / Start Price * 100
        const totalReturn = ((endPrice + dividends) - startPrice) / startPrice * 100
        
        return (
          <div className={`font-medium ${totalReturn >= 0 ? 'text-profit-green-600' : 'text-loss-red-600'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'position_status',
      header: 'Status',
      cell: info => {
        const status = info.row.original.position_status
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'Open' 
              ? 'bg-profit-green-100 text-profit-green-800 dark:bg-profit-green-900 dark:text-profit-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {status || '-'}
          </span>
        )
      }
    }),
  ], [])

  const table = useReactTable({
    data: positions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
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

  if (!snapshot) {
    return (
      <ProtectedRoute allowDemo={true}>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-foreground mb-4">Snapshot Not Found</h1>
              <p className="text-muted-foreground mb-6">The snapshot you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
              <Link href="/snapshots">
                <Button className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Snapshots
                </Button>
              </Link>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/snapshots" className="hover:text-foreground transition-colors">
                Snapshots
              </Link>
              <span>/</span>
              <span className="text-foreground">
                {snapshot.name || (snapshot.end_date ? new Date(snapshot.end_date).toLocaleDateString() : 'Untitled')}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {snapshot.name || 'Unnamed Snapshot'}
                </h1>
                <div className="flex items-center gap-6 text-muted-foreground">
                  {snapshot.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>From {new Date(snapshot.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {snapshot.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>To {new Date(snapshot.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {snapshot.notes && (
                  <p className="text-muted-foreground mt-2">{snapshot.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleEditSnapshot} className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleExportToHTML} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleFetchPrices}
                  disabled={isFetchingPrices}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetchingPrices ? 'animate-spin' : ''}`} />
                  {isFetchingPrices ? 'Fetching...' : 'Fetch Prices'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleFetchDividends}
                  disabled={isFetchingDividends}
                  className="flex items-center gap-2"
                >
                  <DollarSign className={`h-4 w-4 ${isFetchingDividends ? 'animate-spin' : ''}`} />
                  {isFetchingDividends ? 'Fetching...' : 'Fetch Dividends'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSnapshot}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-finance-blue-600 dark:text-finance-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Positions</p>
                  <p className="text-2xl font-bold text-foreground">{summaryStats.totalPositions}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-profit-green-600 dark:text-profit-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Winners</p>
                  <p className="text-2xl font-bold text-profit-green-600">{summaryStats.winners}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <TrendingDown className="w-8 h-8 text-loss-red-600 dark:text-loss-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Losers</p>
                  <p className="text-2xl font-bold text-loss-red-600">{summaryStats.losers}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-finance-blue-600 dark:text-finance-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Dividends</p>
                  <p className="text-2xl font-bold text-foreground">${summaryStats.totalDividends.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Portfolio Positions</h2>
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Search positions..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </div>

            {positionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-finance-blue-500"></div>
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No positions found for this snapshot</p>
              </div>
            ) : (
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
                  {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Edit Snapshot Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Edit Snapshot
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Name
                </label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Q1 2024 Snapshot"
                />
              </div>

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

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
                  Notes
                </label>
                <Input
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Quarterly portfolio snapshot"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSnapshot}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}