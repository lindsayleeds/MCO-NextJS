# TanStack Table Documentation

## Overview
TanStack Table is a headless UI library for building powerful tables & datagrids for TypeScript/JavaScript. It provides framework adapters for React, Vue, Solid, Svelte, Angular, Qwik, and Lit.

## Installation

### Framework-Specific Packages
```bash
# React
npm install @tanstack/react-table

# Vue (compatible with Vue 3)
npm install @tanstack/vue-table

# Solid (compatible with Solid-JS 1)
npm install @tanstack/solid-table

# Svelte (compatible with Svelte 3 and 4)
npm install @tanstack/svelte-table

# Angular (compatible with Angular 17+ with Signals)
npm install @tanstack/angular-table

# Qwik (compatible with Qwik 1, CSR only)
npm install @tanstack/qwik-table

# Lit (compatible with Lit 3)
npm install @tanstack/lit-table

# Core package (vanilla JS for custom adapters)
npm install @tanstack/table-core
```

## Basic Setup

### React Example
```jsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

function Component() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(), // Required row model
  })
}
```

### Framework Agnostic
```javascript
// Vanilla JS
const table = createTable({ columns, data })

// React
const table = useReactTable({ columns, data })

// Solid
const table = createSolidTable({ columns, data })

// Svelte
const table = createSvelteTable({ columns, data })

// Vue
const table = useVueTable({ columns, data })
```

## Data Structure

### Basic Flat Data
```json
[
  {
    "firstName": "Tanner",
    "lastName": "Linsley", 
    "age": 33,
    "visits": 100,
    "progress": 50,
    "status": "Married"
  },
  {
    "firstName": "Kevin",
    "lastName": "Vandy",
    "age": 27,
    "visits": 200,
    "progress": 100,
    "status": "Single"
  }
]
```

### Nested Data Structure
```json
[
  {
    "name": {
      "first": "Tanner",
      "last": "Linsley"
    },
    "info": {
      "age": 33,
      "visits": 100
    }
  }
]
```

### Hierarchical Data with Sub-Rows
```json
[
  {
    "firstName": "Tanner",
    "lastName": "Linsley",
    "subRows": [
      {
        "firstName": "Kevin",
        "lastName": "Vandy"
      },
      {
        "firstName": "John", 
        "lastName": "Doe",
        "subRows": [
          // ... more nested rows
        ]
      }
    ]
  }
]
```

## Column Definitions

### Using createColumnHelper
```tsx
// Define your row shape
type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

const columnHelper = createColumnHelper<Person>()

// Column definitions
const defaultColumns = [
  // Display Column
  columnHelper.display({
    id: 'actions',
    cell: props => <RowActions row={props.row} />,
  }),
  
  // Grouping Column
  columnHelper.group({
    header: 'Name',
    footer: props => props.column.id,
    columns: [
      // Accessor Column
      columnHelper.accessor('firstName', {
        cell: info => info.getValue(),
        footer: props => props.column.id,
      }),
      // Accessor Column with custom getter
      columnHelper.accessor(row => row.lastName, {
        id: 'lastName',
        cell: info => info.getValue(),
        header: () => <span>Last Name</span>,
        footer: props => props.column.id,
      }),
    ],
  }),
  
  // More grouping and accessor columns...
]
```

### Custom Cell Formatting
```tsx
// Format cell value to uppercase
columnHelper.accessor('firstName', {
  cell: props => <span>{props.getValue().toUpperCase()}</span>,
})

// Access original row data
columnHelper.accessor('firstName', {
  cell: props => (
    <span>{`${props.row.original.id} - ${props.getValue()}`}</span>
  ),
})
```

## Row Models

TanStack Table uses a modular row model system. Import only what you need:

```ts
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  // ... other row models as needed
})
```

### Row Model Purposes
- **getCoreRowModel**: Basic 1:1 mapping of original data
- **getFilteredRowModel**: Applies column and global filtering
- **getGroupedRowModel**: Applies grouping and aggregation
- **getSortedRowModel**: Applies sorting
- **getExpandedRowModel**: Handles expanded/collapsed sub-rows
- **getPaginationRowModel**: Returns current page rows
- **getSelectedRowModel**: Returns selected rows only

## Pagination

### Basic Client-Side Pagination
```jsx
import { useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table'

const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel() // Enable pagination
})
```

### Managing Pagination State
```jsx
const [pagination, setPagination] = useState({
  pageIndex: 0, // Initial page
  pageSize: 10, // Default page size
})

const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  onPaginationChange: setPagination, // Sync external state
  state: {
    pagination,
  },
})
```

### Pagination UI Example
```jsx
<Button
  onClick={() => table.firstPage()}
  disabled={!table.getCanPreviousPage()}
>
  {'<<'}
</Button>
<Button
  onClick={() => table.previousPage()}
  disabled={!table.getCanPreviousPage()}
>
  {'<'}
</Button>
<Button
  onClick={() => table.nextPage()}
  disabled={!table.getCanNextPage()}
>
  {'>'}
</Button>
<Button
  onClick={() => table.lastPage()}
  disabled={!table.getCanNextPage()}
>
  {'>>'}
</Button>

<select
  value={table.getState().pagination.pageSize}
  onChange={e => table.setPageSize(Number(e.target.value))}
>
  {[10, 20, 30, 40, 50].map(pageSize => (
    <option key={pageSize} value={pageSize}>
      {pageSize}
    </option>
  ))}
</select>
```

## Filtering

### Column Filtering
```jsx
import { useReactTable, getFilteredRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(), // Enable filtering
})
```

### Managing Filter State
```tsx
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const table = useReactTable({
  columns,
  data,
  state: {
    columnFilters,
  },
  onColumnFiltersChange: setColumnFilters,
})
```

### Global Filtering
```jsx
// Global filter input
<input
  value={table.getState().globalFilter ?? ''}
  onChange={e => table.setGlobalFilter(String(e.target.value))}
  placeholder="Search all columns..."
/>
```

### Fuzzy Filtering
```typescript
const table = useReactTable({
  columns,
  data,
  filterFns: {
    fuzzy: fuzzyFilter, // Define custom fuzzy filter
  },
  globalFilterFn: 'fuzzy', // Use fuzzy filter for global search
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

## Row Selection

### Basic Row Selection
```ts
const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

const table = useReactTable({
  data,
  columns,
  onRowSelectionChange: setRowSelection,
  state: {
    rowSelection
  }
})
```

### Row Selection State Structure
```json
// Default (by index)
{
  "0": true,
  "1": false
}

// Custom row IDs (UUIDs)
{
  "13e79140-62a8-4f9c-b087-5da737903b76": true,
  "f3e2a5c0-5b7a-4d8a-9a5c-9c9b8a8e5f7e": false
}
```

### Conditional Row Selection
```ts
const table = useReactTable({
  // Only enable selection for adults
  enableRowSelection: row => row.original.age > 18
})
```

## Grouping

### Basic Grouping Setup
```tsx
import { getGroupedRowModel, getExpandedRowModel} from '@tanstack/react-table'

const table = useReactTable({
  columns,
  data,
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(), // For expand/collapse
})
```

### Managing Grouping State
```tsx
const [grouping, setGrouping] = useState<string[]>([])

const table = useReactTable({
  columns,
  data,
  state: {
    grouping: grouping,
  },
  onGroupingChange: setGrouping
})
```

### Custom Aggregation
```tsx
const column = columnHelper.accessor('key', {
  aggregationFn: 'myCustomAggregation',
})
```

### Grouped Column Display
```tsx
const table = useReactTable({
  // Move grouped columns to start
  groupedColumnMode: 'reorder',
})
```

## Column Visibility

### Toggle Column Visibility
```jsx
{table.getAllColumns().map((column) => (
  <label key={column.id}>
    <input
      checked={column.getIsVisible()}
      disabled={!column.getCanHide()}
      onChange={column.getToggleVisibilityHandler()}
      type="checkbox"
    />
    {column.columnDef.header}
  </label>
))}
```

## State Management

### Table State Interaction
```javascript
// Read state
table.getState().rowSelection

// Set state 
table.setRowSelection((old) => ({...old}))

// Reset state
table.resetRowSelection()
```

### Initial State Configuration
```jsx
const table = useReactTable({
  columns,
  data,
  initialState: {
    columnOrder: ['age', 'firstName', 'lastName'],
    columnVisibility: {
      id: false // Hide ID column by default
    },
    expanded: true, // Expand all rows
    sorting: [
      {
        id: 'age',
        desc: true // Sort by age descending
      }
    ]
  },
})
```

### External State Management
```jsx
const [sorting, setSorting] = useState([])

const table = useReactTable({
  columns,
  data,
  state: {
    sorting // Pass external state
  },
  onSortingChange: setSorting, // Sync changes
})
```

## Rendering

### Header Rendering
```jsx
{headerGroup.headers.map(header => (
  <th key={header.id} colSpan={header.colSpan}>
    {flexRender(header.column.columnDef.header, header.getContext())}
  </th>
))}
```

### Cell Rendering
```jsx
import { flexRender } from '@tanstack/react-table'

<tr>
  {row.getVisibleCells().map(cell => {
    return (
      <td key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    )
  })}
</tr>
```

### Custom Cell Components
```jsx
const columns = [
  {
    accessorKey: 'fullName',
    cell: ({ cell, row }) => {
      return (
        <div>
          <strong>{row.original.firstName}</strong> {row.original.lastName}
        </div>
      )
    }
  }
]
```

## Column Sizing

### Apply Column Sizes
```tsx
// Get column size
header.getSize()
column.getSize()
cell.column.getSize()

// Apply to elements
<th
  key={header.id}
  colSpan={header.colSpan}
  style={{ width: `${header.getSize()}px` }}
>
```

## Column Faceting

### Unique Values for Autocomplete
```ts
// Get unique values for filter suggestions
const autoCompleteSuggestions = 
  Array.from(column.getFacetedUniqueValues().keys())
    .sort()
    .slice(0, 5000)
```

### Server-Side Faceting
```ts
const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: (table, columnId) => {
    const uniqueValueMap = new Map<string, number>()
    // Custom server-side logic
    return uniqueValueMap
  },
  getFacetedMinMaxValues: (table, columnId) => {
    // Custom min/max calculation
    return [min, max]
  },
})
```

## Column Ordering

### Drag and Drop Reordering
```tsx
const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(c => c.id))

// Utility function for reordering
const reorderColumn = (movingColumnId: string, targetColumnId: string): string[] => {
  const newColumnOrder = [...columnOrder]
  newColumnOrder.splice(
    newColumnOrder.indexOf(targetColumnId),
    0,
    newColumnOrder.splice(newColumnOrder.indexOf(movingColumnId), 1)[0],
  )
  return newColumnOrder
}

const handleDragEnd = (e: DragEvent) => {
  if(!movingColumnId || !targetColumnId) return
  setColumnOrder(reorderColumn(movingColumnId, targetColumnId))
}
```

## Migration from React Table v7

### Installation Changes
```bash
# Remove old packages
npm uninstall react-table @types/react-table

# Install new package
npm install @tanstack/react-table
```

## Best Practices

### Stable References
```ts
// ✅ Good: Stable reference
const data: User[] = []
const [data, setData] = React.useState<User[]>([])
const data = ref<User[]>([]) // Vue

// ❌ Bad: Unstable reference (causes infinite re-renders)
function Component() {
  const data = [] // Redefined on every render
  const table = useReactTable({ data, columns })
}
```

### TypeScript Integration
```tsx
import { useReactTable, type SortingState } from '@tanstack/react-table'

const [sorting, setSorting] = useState<SortingState>([
  {
    id: 'age', // Autocomplete available
    desc: true,
  }
])
```

## Framework-Specific Notes

### Qwik
```ts
import { useQwikTable } from '@tanstack/qwik-table'

const table = useQwikTable(options)
// Returns table from Qwik Store with NoSerialize
```

### Angular (with Signals)
```ts
table = createAngularTable(() => ({
  columns: this.columns,
  data: this.data(),
  // ... other options
}))
```

### Svelte
```js
const options = writable({
  columns,
  data,
  // ... options
})
const table = createSvelteTable(options)
```

This documentation covers the core concepts and usage patterns for TanStack Table. For more detailed information and advanced features, refer to the official TanStack Table documentation.