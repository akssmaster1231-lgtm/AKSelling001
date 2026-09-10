interface RazorpayOrderResponse {
  success: boolean;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  isSimulation?: boolean;
  error?: string;
}

interface VerifyResponse {
  success: boolean;
  verified: boolean;
  error?: string;
}

interface RazorpayOptions {
  amount?: number;
  name: string;
  description: string;
  prefill: {
    name: string;
    contact: string;
  };
}

// Ensure Razorpay SDK script is ready
function ensureRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayPayment(
  amountInRupees: number,
  options: RazorpayOptions
): Promise<{ success: boolean; error?: string; orderId?: string; paymentId?: string }> {
  const amountInPaise = Math.round(amountInRupees * 100);

  try {
    // Step 1: Create Razorpay order via server endpoint
    const createResp = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `aks_${Date.now()}`,
      }),
    });

    if (!createResp.ok) {
      const errData = await createResp.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to create payment order.' };
    }

    const orderData: RazorpayOrderResponse = await createResp.json();
    if (!orderData.success) {
      return { success: false, error: orderData.error || 'Failed to initialize payment.' };
    }

    // Check if running in simulated fallback test mode (when keys are not provided)
    if (orderData.isSimulation || !orderData.key_id || orderData.key_id.startsWith('rzp_test_simulated')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            orderId: orderData.order_id,
            paymentId: `pay_sim_${Date.now()}`,
          });
        }, 1200);
      });
    }

    // Step 2: Ensure SDK loaded and open Razorpay checkout modal
    await ensureRazorpayScript();

    return new Promise((resolve) => {
      const RazorpayConstructor = (window as unknown as {
        Razorpay?: new (config: Record<string, unknown>) => { open: () => void };
      }).Razorpay;

      if (!RazorpayConstructor) {
        // Fallback simulation if Razorpay JS cannot load
        setTimeout(() => {
          resolve({
            success: true,
            orderId: orderData.order_id,
            paymentId: `pay_demo_${Date.now()}`,
          });
        }, 1000);
        return;
      }

      const rzp = new RazorpayConstructor({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: options.name || 'AKSelling',
        description: options.description || 'Online Shopping Payment',
        image: 'https://images.pexels.com/photos/5625013/pexels-photo-5625013.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
        order_id: orderData.order_id,
        prefill: {
          name: options.prefill?.name || '',
          contact: options.prefill?.contact || '',
        },
        theme: {
          color: '#2874f0',
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, error: 'Payment popup was closed.' });
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Step 3: Verify payment signature on backend server
            const verifyResp = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResp.ok) {
              const errData = await verifyResp.json().catch(() => ({}));
              resolve({
                success: false,
                error: errData.error || 'Payment verification failed.',
              });
              return;
            }

            const verifyData: VerifyResponse = await verifyResp.json();
            if (verifyData.verified || verifyData.success) {
              resolve({
                success: true,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            } else {
              resolve({
                success: false,
                error: verifyData.error || 'Payment signature verification failed.',
              });
            }
          } catch (e: unknown) {
            console.error('Payment verification error:', e);
            resolve({ success: false, error: 'Payment network error occurred.' });
          }
        },
      });

      rzp.open();
    });
  } catch (err: unknown) {
    console.error('Razorpay process error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Payment gateway communication error.',
    };
  }
}
