import { useEffect, useState, useCallback } from 'react';
import { orderAPI } from '@food/api';
import { useCart } from '@food/context/CartContext';
import { toast } from 'sonner';

/**
 * Hook to automatically recover orders that were stuck in 'payment_pending' 
 * due to app crashes or interrupted redirects on low RAM devices.
 */
export const usePaymentRecovery = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { clearCart } = useCart();

  const checkPendingPayments = useCallback(async () => {
    const isAuthenticated = localStorage.getItem('user_authenticated') === 'true' || !!localStorage.getItem('user_accessToken');
    if (!isAuthenticated) return;

    try {
      // Calling getOrders triggers syncPendingOrdersPayment on the backend
      const response = await orderAPI.getOrders({ limit: 5 });
      
      if (response.data?.success) {
        // The backend sync happens before returning the list.
        // We check if any 'payment_pending' orders were recovered.
        // If the cart is still full but we find a recently 'created' order, 
        // it means a recovery might have happened.
        
        // We can also check a local flag 'payment_in_progress'
        const paymentInProgress = localStorage.getItem('payment_in_progress');
        if (paymentInProgress) {
          setIsVerifying(true);
          // Small delay to show the user we are working
          setTimeout(() => {
            localStorage.removeItem('payment_in_progress');
            setIsVerifying(false);
            
            // If we find the order is now created, we might want to clear cart if not already cleared
            // But usually the backend sync handles the status. 
            // The frontend should clear cart if it sees a success.
            const orders = response.data.data?.orders || [];
            const recoveredOrder = orders.find(o => 
               o.orderStatus !== 'payment_pending' && 
               o._id === paymentInProgress
            );

            if (recoveredOrder) {
              clearCart();
              toast.success("Payment verified! Your order has been placed.");
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Payment recovery check failed:', error);
    }
  }, [clearCart]);

  useEffect(() => {
    checkPendingPayments();
  }, [checkPendingPayments]);

  return { isVerifying };
};
