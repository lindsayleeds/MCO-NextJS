import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data for now - replace with actual API calls
  useEffect(() => {
    const mockPositions = [
      {
        id: '1',
        ticker: 'AAPL',
        company_name: 'Apple Inc.',
        start_date: '2024-01-15',
        start_price: 185.50,
        current_price: 195.30,
        status: 'Open'
      },
      {
        id: '2', 
        ticker: 'MSFT',
        company_name: 'Microsoft Corporation',
        start_date: '2024-02-01',
        start_price: 412.80,
        current_price: 428.90,
        status: 'Open'
      },
      {
        id: '3',
        ticker: 'GOOGL',
        company_name: 'Alphabet Inc.',
        start_date: '2024-01-20',
        start_price: 142.65,
        current_price: 138.25,
        status: 'Open'
      }
    ]
    
    setTimeout(() => {
      setPositions(mockPositions)
      setLoading(false)
    }, 1000)
  }, [])

  const calculateReturn = (startPrice, currentPrice) => {
    return ((currentPrice - startPrice) / startPrice * 100).toFixed(2)
  }

  const totalReturn = positions.reduce((acc, pos) => {
    const returnPct = parseFloat(calculateReturn(pos.start_price, pos.current_price))
    return acc + returnPct
  }, 0) / positions.length || 0

  return (
    <ProtectedRoute allowDemo={true}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Portfolio Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Track your investments and portfolio performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Positions</p>
                  <p className="text-2xl font-bold text-foreground">{positions.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-finance-blue-500" />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-foreground">$124,580</p>
                </div>
                <DollarSign className="w-8 h-8 text-finance-blue-500" />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Return</p>
                  <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'profit' : 'loss'}`}>
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                  </p>
                </div>
                {totalReturn >= 0 ? 
                  <TrendingUp className="w-8 h-8 text-profit-green-500" /> :
                  <TrendingDown className="w-8 h-8 text-loss-red-500" />
                }
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Positions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {positions.filter(p => p.status === 'Open').length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-finance-blue-500" />
              </div>
            </div>
          </div>

          {/* Recent Positions Table */}
          <div className="bg-card rounded-lg border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Recent Positions</h2>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-blue-500"></div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Start Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Return
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {positions.map((position) => {
                      const returnPct = calculateReturn(position.start_price, position.current_price)
                      const isPositive = parseFloat(returnPct) >= 0
                      
                      return (
                        <tr key={position.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {position.ticker}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-muted-foreground">
                              {position.company_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">
                              ${position.start_price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">
                              ${position.current_price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isPositive ? 'profit' : 'loss'}`}>
                              {isPositive ? '+' : ''}{returnPct}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                              position.status === 'Open' 
                                ? 'bg-profit-green-100 text-profit-green-800' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {position.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
