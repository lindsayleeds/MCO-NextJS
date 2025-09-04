import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
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
import { ChevronDown, ChevronUp, Camera, Calendar, TrendingUp, Eye, Trash2, Plus, Edit3 } from 'lucide-react'
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


const columnHelper = createColumnHelper<Snapshot>()

export default function Snapshots() {
  const router = useRouter()
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSnapshot, setEditingSnapshot] = useState<Snapshot | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
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

  const handleViewSnapshot = useCallback((snapshot: Snapshot) => {
    router.push(`/snapshots/${snapshot.id}`)
  }, [router])

  const handleEditSnapshot = (snapshot: Snapshot) => {
    setEditingSnapshot(snapshot)
    setIsAddMode(false)
    setEditForm({
      name: snapshot.name || '',
      start_date: snapshot.start_date || '',
      end_date: snapshot.end_date || '',
      notes: snapshot.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleAddSnapshot = () => {
    setEditingSnapshot(null)
    setIsAddMode(true)
    
    // Get last day of previous month
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0) // 0 gets last day of previous month
    const lastDayPrevMonth = lastMonth.toISOString().split('T')[0]
    
    setEditForm({
      name: '',
      start_date: '2024-08-05',
      end_date: lastDayPrevMonth,
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleSaveSnapshot = async () => {
    setIsSaving(true)
    try {
      const snapshotData = {
        name: editForm.name || null,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        notes: editForm.notes || null,
      }

      if (isAddMode) {
        // Call FastAPI endpoint to create snapshot with positions
        const requestBody = {
          end_date: editForm.end_date,
          ...(editForm.start_date && { start_date: editForm.start_date }),
          ...(editForm.notes && { notes: editForm.notes })
        }

        const response = await fetch('http://localhost:4021/snapshots/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`)
        }

        const result = await response.json()
        console.log('Snapshot created:', result)

        // After FastAPI creates the snapshot, update the name if provided
        if (editForm.name && result.snapshot_id) {
          const { error: updateError } = await supabase
            .from('snapshots')
            .update({ name: editForm.name })
            .eq('id', result.snapshot_id)

          if (updateError) {
            console.error('Error updating snapshot name:', updateError)
          }
        }

        // Refresh the snapshots list
        const { data: refreshedSnapshots, error: fetchError } = await supabase
          .from('snapshots')
          .select('*')
          .order('end_date', { ascending: false })

        if (!fetchError && refreshedSnapshots) {
          setSnapshots(refreshedSnapshots)
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
      alert(`Error ${isAddMode ? 'creating' : 'updating'} snapshot: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSnapshot = async (snapshot: Snapshot) => {
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

      setSnapshots(prev => prev.filter(snap => snap.id !== snapshot.id))
    } catch (error) {
      console.error('Error deleting snapshot:', error)
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <div className="text-sm font-medium text-foreground">
          {info.getValue() || '-'}
        </div>
      )
    }),
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
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-foreground hover:text-accent-foreground hover:bg-accent"
            onClick={() => handleViewSnapshot(info.row.original)}
          >
            <span className="sr-only">View snapshot</span>
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-foreground hover:text-accent-foreground hover:bg-accent"
            onClick={() => handleEditSnapshot(info.row.original)}
          >
            <span className="sr-only">Edit snapshot</span>
            <Edit3 className="h-4 w-4" />
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
  ], [handleViewSnapshot])

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
                Add Snapshot
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
                        <p className="text-sm mb-4">Add your first portfolio snapshot to track performance over time</p>
                        <Button onClick={handleAddSnapshot} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Snapshot
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
                {isAddMode ? 'Add New Snapshot' : 'Edit Snapshot'}
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
              <Button onClick={handleSaveSnapshot} disabled={isSaving}>
                {isSaving 
                  ? (isAddMode ? 'Creating...' : 'Saving...')
                  : (isAddMode ? 'Add Snapshot' : 'Save Changes')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </Layout>
    </ProtectedRoute>
  )
}