import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, IndianRupee, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Card, CardContent } from "@food/components/ui/card"
import AnimatedPage from "@food/components/user/AnimatedPage"
import AddMoneyModal from "@food/components/user/AddMoneyModal"
import { userAPI } from "@food/api"
import { toast } from "sonner"
import { useCompanyName } from "@food/hooks/useCompanyName"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const TRANSACTION_TYPES = {
  ALL: "all",
  ADDITIONS: "additions",
  DEDUCTIONS: "deductions",
  REFUNDS: "refunds",
}

export default function Wallet() {
  const companyName = useCompanyName()
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const [selectedFilter, setSelectedFilter] = useState(TRANSACTION_TYPES.ALL)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false)

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userAPI.getWallet()
      const walletData = response?.data?.data?.wallet || response?.data?.wallet

      if (walletData) {
        setWallet(walletData)
        setTransactions(walletData.transactions || [])
      }
    } catch (err) {
      debugError("Error fetching wallet:", err)
      setError(err?.response?.data?.message || "Failed to load wallet")
      toast.error("Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const currentBalance = wallet?.balance || 0

  const referralEarnings = useMemo(() => {
    if (wallet?.referralEarnings != null) {
      return Number(wallet.referralEarnings) || 0
    }

    return transactions
      .filter(
        (transaction) =>
          transaction.type === "addition" &&
          transaction.status === "Completed" &&
          (transaction?.metadata?.source === "referral_signup" ||
            String(transaction.description || "").toLowerCase().startsWith("referral reward"))
      )
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)
  }, [wallet, transactions])

  const filteredTransactions = useMemo(() => {
    if (selectedFilter === TRANSACTION_TYPES.ALL) {
      return transactions
    }

    return transactions.filter((transaction) => {
      if (selectedFilter === TRANSACTION_TYPES.ADDITIONS) {
        return transaction.type === "addition"
      }
      if (selectedFilter === TRANSACTION_TYPES.DEDUCTIONS) {
        return transaction.type === "deduction"
      }
      if (selectedFilter === TRANSACTION_TYPES.REFUNDS) {
        return transaction.type === "refund"
      }
      return true
    })
  }, [selectedFilter, transactions])

  const formatAmount = (amount) => {
    const numeric = Number(amount ?? 0)
    const safe = Number.isFinite(numeric) ? numeric : 0
    return `${"\u20B9"}${safe.toLocaleString("en-IN")}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const formattedTime = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    return `${formattedDate} | ${formattedTime}`
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "addition":
        return <ArrowDownCircle className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-green-600 dark:text-green-400" />
      case "deduction":
        return <ArrowUpCircle className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-red-600 dark:text-red-400" />
      case "refund":
        return <RefreshCw className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-blue-600 dark:text-blue-400" />
      default:
        return null
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case "addition":
        return "text-green-600 dark:text-green-400"
      case "deduction":
        return "text-red-600 dark:text-red-400"
      case "refund":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="bg-white dark:bg-[#1a1a1a] sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 px-4 sm:px-6 md:px-8 lg:px-10 py-4 md:py-5">
            <button
              onClick={goBack}
              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700 dark:text-white" />
            </button>
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 md:py-8 lg:py-10 space-y-6 md:space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-12 md:py-16 lg:py-20">
            <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-gray-600 dark:text-gray-400" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 md:p-6">
            <p className="text-red-600 dark:text-red-400 text-sm md:text-base">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Compact & Light Wallet Card */}
            <Card className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border-0 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      Available Balance
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-baseline gap-1">
                      <span className="text-xl font-medium text-gray-400">₹</span>
                      {currentBalance.toLocaleString("en-IN")}
                    </h2>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-[#001A94] dark:text-blue-400" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Referral Earnings</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400">
                        {formatAmount(referralEarnings)}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Status</p>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Active Account</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setAddMoneyModalOpen(true)}
                    className="w-full sm:w-auto bg-[#001A94] hover:bg-blue-800 text-white rounded-xl font-bold px-6 py-5 h-auto transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Money
                  </Button>
                </div>
              </div>
            </Card>

            {/* Transactions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#001A94] rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h3>
                </div>

                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  {[
                    { id: TRANSACTION_TYPES.ALL, label: "All" },
                    { id: TRANSACTION_TYPES.ADDITIONS, label: "Credits" },
                    { id: TRANSACTION_TYPES.DEDUCTIONS, label: "Debits" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                        selectedFilter === filter.id
                          ? "bg-white dark:bg-gray-800 text-[#001A94] dark:text-white shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTransactions.length > 0 ? (
                <div className="grid gap-3">
                  {filteredTransactions.map((transaction, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={transaction.id || idx}
                      className="group relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-200 to-transparent dark:from-white/5 dark:to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300" />
                      <Card className="relative border-none bg-white dark:bg-[#111] shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none rounded-2xl overflow-hidden">
                        <CardContent className="p-4 md:p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                              transaction.type === 'addition' ? 'bg-green-500/10 text-green-600' :
                              transaction.type === 'refund' ? 'bg-blue-500/10 text-blue-600' :
                              'bg-gray-500/10 text-gray-600'
                            }`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-[300px]">
                                {transaction.description}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {formatDate(transaction.date || transaction.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-lg font-black tracking-tight ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === "deduction" ? "-" : "+"}
                              {formatAmount(transaction.amount)}
                            </p>
                            {transaction.status && transaction.status !== 'Completed' && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">
                                {transaction.status}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="h-8 w-8 text-gray-300 animate-spin-slow" />
                  </div>
                  <p className="text-gray-400 font-bold italic tracking-tight">No activity found in this period</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <AddMoneyModal
        open={addMoneyModalOpen}
        onOpenChange={setAddMoneyModalOpen}
        onSuccess={fetchWalletData}
      />
    </AnimatedPage>
  )
}
