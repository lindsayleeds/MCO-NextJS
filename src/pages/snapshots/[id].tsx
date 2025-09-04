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
  Download
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

        // Fetch snapshot positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('snapshot_positions')
          .select('*')
          .eq('snapshot_id', id)
          .order('ticker', { ascending: true })

        if (positionsError) {
          console.error('Error fetching snapshot positions:', positionsError)
          return
        }

        setPositions(positionsData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
        setPositionsLoading(false)
      }
    }

    fetchData()
  }, [id, router])

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

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPositions = positions.length
    const winners = positions.filter(p => (p.return_pct_at_snapshot ?? 0) > 0).length
    const losers = positions.filter(p => (p.return_pct_at_snapshot ?? 0) < 0).length
    const totalDividends = positions.reduce((sum, p) => sum + (Number(p.dividends_paid) || 0), 0)
    const averageReturn = positions.length > 0 
      ? positions.reduce((sum, p) => sum + (p.return_pct_at_snapshot || 0), 0) / positions.length
      : 0

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
    columnHelper.accessor('return_pct_at_snapshot', {
      header: 'Return %',
      cell: info => {
        const value = info.getValue()
        if (value === null) {
          return <div className="text-muted-foreground">-</div>
        }
        return (
          <div className={`font-medium ${value >= 0 ? 'text-profit-green-600' : 'text-loss-red-600'}`}>
            {value >= 0 ? '+' : ''}{value.toFixed(2)}%
          </div>
        )
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
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
    },
    onGlobalFilterChange: setGlobalFilter,
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
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
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