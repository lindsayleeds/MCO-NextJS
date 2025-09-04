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
import { ChevronDown, ChevronUp, Camera, Calendar, TrendingUp, Eye, Trash2, Plus } from 'lucide-react'
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
  start_date: string | null
  end_date: string | null
  notes: string | null
  status: string
  overall_portfolio_return_pct: number | null
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<Snapshot>()

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSnapshot, setEditingSnapshot] = useState<Snapshot | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    notes: '',
  })

  // Fetch snapshots from Supabase
  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const { data, error } = await supabase
          .from('snapshots')
          .select('*')
          .order('end_date', { ascending: false })

        if (error) {
          console.error('Error fetching snapshots:', error)
          return
        }

        setSnapshots(data || [])
      } catch (error) {
        console.error('Error fetching snapshots:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSnapshots()
  }, [])

  const handleEditSnapshot = (snapshot: Snapshot) => {
    setEditingSnapshot(snapshot)
    setIsAddMode(false)
    setEditForm({
      start_date: snapshot.start_date || '',
      end_date: snapshot.end_date || '',
      notes: snapshot.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleAddSnapshot = () => {
    setEditingSnapshot(null)
    setIsAddMode(true)
    const today = new Date().toISOString().split('T')[0]
    setEditForm({
      start_date: '',
      end_date: today,
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleSaveSnapshot = async () => {
    try {
      const snapshotData = {
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        notes: editForm.notes || null,
      }

      if (isAddMode) {
        const { data, error } = await supabase
          .from('snapshots')
          .insert([{
            ...snapshotData,
            status: 'pending',
            overall_portfolio_return_pct: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (error) {
          console.error('Error adding snapshot:', error)
          return
        }

        if (data && data[0]) {
          setSnapshots(prev => [data[0], ...prev])
        }
      } else {
        if (!editingSnapshot) return
        
        const updateData = {
          ...snapshotData,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('snapshots')
          .update(updateData)
          .eq('id', editingSnapshot.id)

        if (error) {
          console.error('Error updating snapshot:', error)
          return
        }

        setSnapshots(prev => prev.map(snap => 
          snap.id === editingSnapshot.id 
            ? { ...snap, ...updateData }
            : snap
        ))
      }

      setIsModalOpen(false)
      setEditingSnapshot(null)
      setIsAddMode(false)
    } catch (error) {
      console.error('Error saving snapshot:', error)
    }
  }

  const handleDeleteSnapshot = async (snapshot: Snapshot) => {
    const displayName = snapshot.end_date ? `snapshot ending ${new Date(snapshot.end_date).toLocaleDateString()}` : 'this snapshot'
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

      setSnapshots(prev => prev.filter(snap => snap.id !== snapshot.id))
    } catch (error) {
      console.error('Error deleting snapshot:', error)
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor('start_date', {
      header: 'Start Date',
      cell: info => (
        <div className="text-sm text-foreground">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}
        </div>
      )
    }),
    columnHelper.accessor('end_date', {
      header: 'End Date',
      cell: info => (
        <div className="text-sm text-foreground">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}
        </div>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
        return (
          <div className={`text-sm font-medium ${
            status === 'completed' ? 'text-green-600' : 
            status === 'pending' ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        )
      }
    }),
    columnHelper.accessor('overall_portfolio_return_pct', {
      header: 'Portfolio Return',
      cell: info => {
        const value = info.getValue()
        if (value === null) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        return (
          <div className={`text-sm font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {value.toFixed(2)}%
          </div>
        )
      }
    }),
    columnHelper.accessor('notes', {
      header: 'Notes',
      cell: info => (
        <div className="text-muted-foreground max-w-xs truncate">
          {info.getValue() || '-'}
        </div>
      )
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
            onClick={() => handleEditSnapshot(info.row.original)}
          >
            <span className="sr-only">Edit snapshot</span>
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
            onClick={() => handleDeleteSnapshot(info.row.original)}
          >
            <span className="sr-only">Delete snapshot</span>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }),
  ], [])

  const table = useReactTable({
    data: snapshots,
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                  <Camera className="w-8 h-8 mr-3 text-finance-blue-600 dark:text-finance-blue-400" />
                  Portfolio Snapshots
                </h1>
                <p className="text-muted-foreground mt-2">
                  Capture and compare your portfolio performance over time
                </p>
              </div>
              <Button onClick={handleAddSnapshot} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Take Snapshot
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <Camera className="w-8 h-8 text-finance-blue-600 dark:text-finance-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Snapshots</p>
                  <p className="text-2xl font-bold text-foreground">{snapshots.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-finance-blue-600 dark:text-finance-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Latest End Date</p>
                  <p className="text-2xl font-bold text-foreground">
                    {snapshots.length > 0 && snapshots[0].end_date
                      ? new Date(snapshots[0].end_date).toLocaleDateString()
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-profit-green-600 dark:text-profit-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Latest Return</p>
                  <p className="text-2xl font-bold text-foreground">
                    {snapshots.length > 0 && snapshots[0].overall_portfolio_return_pct !== null
                      ? `${snapshots[0].overall_portfolio_return_pct.toFixed(2)}%`
                      : '-'
                    }
                  </p>
                </div>
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
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Camera className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No snapshots yet</p>
                        <p className="text-sm mb-4">Take your first portfolio snapshot to track performance over time</p>
                        <Button onClick={handleAddSnapshot} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Take Snapshot
                        </Button>
                      </div>
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

        {/* Add/Edit Snapshot Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                {isAddMode ? 'Take New Snapshot' : 'Edit Snapshot'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
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

              {isAddMode && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    This snapshot will capture your current portfolio positions and their values.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSnapshot}>
                {isAddMode ? 'Take Snapshot' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}