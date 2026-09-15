interface VercelApiRequest {
  method?: string;
  body?: unknown;
}

interface VercelApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(body: unknown): void;
    end(): void;
  };
}

// Helper to set CORS headers
function setCorsHeaders(res: VercelApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

// Live Production Razorpay credentials for AKSelling
const DEFAULT_LIVE_KEY_ID = 'rzp_live_TOuYEwOlXSF8vU';
const DEFAULT_LIVE_KEY_SECRET = 'VMRuNI5kzeFSHvCNYllQNWcy';

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const rawBody = req.body;
    const body = (typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {}) as Record<string, unknown>;
    const { amount, currency = 'INR', receipt, notes } = body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      res.status(400).json({ success: false, error: 'Valid positive amount is required.' });
      return;
    }

    // Normalize amount to paise (1 Rupee = 100 Paise)
    const amountInPaise = numericAmount < 100 ? Math.round(numericAmount * 100) : Math.round(numericAmount);

    // Guaranteed live production keys
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || DEFAULT_LIVE_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || DEFAULT_LIVE_KEY_SECRET;

    // Call Razorpay Orders API
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: receipt || `aks_${Date.now()}`,
        payment_capture: 1,
        notes: notes || { app: 'AKSelling', platform: 'Vercel-Production' },
      }),
    });

    if (rzpResp.ok) {
      const rzpOrder = (await rzpResp.json()) as { id: string; amount: number; currency: string };
      res.status(200).json({
        success: true,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key_id: keyId,
        provider: 'razorpay',
        isSimulation: false,
      });
      return;
    }

    const errText = await rzpResp.text();
    console.error('[Vercel API] Razorpay Orders API rejected order:', errText);

    // Return structured failure with public key so client-side checkout fallback can still open
    res.status(200).json({
      success: false,
      error: `Razorpay API error: ${errText}`,
      key_id: keyId,
      fallbackAllowed: true,
    });
  } catch (err: unknown) {
    console.error('[Vercel API] Uncaught error in create-order:', err);
    const message = err instanceof Error ? err.message : 'Server error creating Razorpay order';
    res.status(200).json({
      success: false,
      error: message,
      key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || DEFAULT_LIVE_KEY_ID,
      fallbackAllowed: true,
    });
  }
}
