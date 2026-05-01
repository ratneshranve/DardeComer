import { X, Clock, CheckCircle, XCircle, User, Phone, Package, MapPin } from "lucide-react"

const getStatusColor = (status) => {
  const colors = {
    "Ordered": "bg-blue-100 text-blue-700 border-blue-200",
    "Restaurant Accepted": "bg-green-100 text-green-700 border-green-200",
    "Accepted": "bg-green-100 text-green-700 border-green-200", // Keep for backward compatibility
    "Rejected": "bg-red-100 text-red-700 border-red-200",
    "Delivery Boy Assigned": "bg-purple-100 text-purple-700 border-purple-200",
    "Delivery Boy Reached Pickup": "bg-orange-100 text-orange-700 border-orange-200",
    "Reached Pickup": "bg-orange-100 text-orange-700 border-orange-200", // Keep for backward compatibility
    "Order ID Accepted": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Reached Drop": "bg-amber-100 text-amber-700 border-amber-200",
    "Ordered Delivered": "bg-emerald-100 text-emerald-700 border-emerald-200",
  }
  return colors[status] || "bg-slate-100 text-slate-700 border-slate-200"
}

const getStatusIcon = (status) => {
  if (status === "Rejected") return XCircle
  if (status === "Ordered Delivered") return CheckCircle
  return Clock
}

export default function ViewOrderDetectDeliveryDialog({ isOpen, onOpenChange, order }) {
  if (!isOpen || !order) return null

  const StatusIcon = getStatusIcon(order.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
            <p className="text-sm text-slate-500 mt-1">Order ID: #{order.orderId}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* User Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                User Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm font-medium text-slate-900">{order.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone Number</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {order.userNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurant Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Restaurant Information
              </h3>
              <div>
                <p className="text-xs text-slate-500">Restaurant Name</p>
                <p className="text-sm font-medium text-slate-900">{order.restaurantName}</p>
              </div>
            </div>

            {/* Delivery Boy Information */}
            {order.deliveryBoyName && (
              <div className="bg-slate-50 rounded-lg p-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Delivery Boy Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {order.deliveryBoyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {order.deliveryBoyNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items Summary */}
            <div className="bg-slate-50 rounded-lg p-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Summary
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(order.originalOrder?.items || order.originalOrder?.cart?.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.name || item.foodName}</p>
                          {item.variantName && <p className="text-xs text-slate-500">Variant: {item.variantName}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-600">Rs. {(item.price || item.variantPrice || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">Rs. {((item.quantity || 1) * (item.price || item.variantPrice || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pricing Breakdown */}
              <div className="mt-4 flex flex-col items-end space-y-2 px-4">
                <div className="flex justify-between w-full max-w-[250px] text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>Rs. {(order.originalOrder?.pricing?.subtotal || 0).toFixed(2)}</span>
                </div>
                {(order.originalOrder?.pricing?.deliveryFee > 0) && (
                  <div className="flex justify-between w-full max-w-[250px] text-sm text-slate-600">
                    <span>Delivery Fee</span>
                    <span>Rs. {order.originalOrder.pricing.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {(order.originalOrder?.pricing?.packagingFee > 0) && (
                  <div className="flex justify-between w-full max-w-[250px] text-sm text-slate-600">
                    <span>Packaging Fee</span>
                    <span>Rs. {order.originalOrder.pricing.packagingFee.toFixed(2)}</span>
                  </div>
                )}
                {(order.originalOrder?.pricing?.platformFee > 0) && (
                  <div className="flex justify-between w-full max-w-[250px] text-sm text-slate-600">
                    <span>Platform Fee</span>
                    <span>Rs. {order.originalOrder.pricing.platformFee.toFixed(2)}</span>
                  </div>
                )}
                {(order.originalOrder?.pricing?.tax > 0) && (
                  <div className="flex justify-between w-full max-w-[250px] text-sm text-slate-600">
                    <span>Tax</span>
                    <span>Rs. {order.originalOrder.pricing.tax.toFixed(2)}</span>
                  </div>
                )}
                {(order.originalOrder?.pricing?.discount > 0) && (
                  <div className="flex justify-between w-full max-w-[250px] text-sm text-red-600 font-medium">
                    <span>Discount</span>
                    <span>- Rs. {order.originalOrder.pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full max-w-[250px] text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span>Rs. {(order.originalOrder?.pricing?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Status</h3>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(order.status)}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold">{order.status}</span>
            </div>
          </div>

          {/* Status History Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Status History</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
              
              {/* Status items */}
              <div className="space-y-4">
                {order.statusHistory && order.statusHistory.map((historyItem, index) => {
                  const isLast = index === order.statusHistory.length - 1
                  const HistoryIcon = getStatusIcon(historyItem.status)
                  
                  return (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${getStatusColor(historyItem.status)}`}>
                        <HistoryIcon className="w-4 h-4" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${getStatusColor(historyItem.status).split(' ')[1]}`}>
                            {historyItem.status}
                          </span>
                          <span className="text-xs text-slate-500">{historyItem.timestamp}</span>
                        </div>
                        {historyItem.deliveryBoy && (
                          <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded p-2">
                            <p><span className="font-medium">Delivery Boy:</span> {historyItem.deliveryBoy}</p>
                            {historyItem.deliveryBoyNumber && (
                              <p><span className="font-medium">Phone:</span> {historyItem.deliveryBoyNumber}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Order Date & Time */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-slate-500">Order Date</p>
                <p className="font-medium text-slate-900">{order.orderDate}</p>
              </div>
              <div>
                <p className="text-slate-500">Order Time</p>
                <p className="font-medium text-slate-900">{order.orderTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

