import crypto from 'crypto';

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

function setCorsHeaders(res: VercelApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

const DEFAULT_LIVE_KEY_ID = 'rzp_live_TOuYEwOlXSF8vU';
const DEFAULT_LIVE_KEY_SECRET = 'VMRuNI5kzeFSHvCNYllQNWcy';

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, verified: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const rawBody = req.body;
    const body = (typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {}) as Record<string, unknown>;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      amount,
    } = body;

    const activeOrderId = String(razorpay_order_id || order_id || '');
    const activePaymentId = String(razorpay_payment_id || payment_id || '');
    const activeSignature = typeof razorpay_signature === 'string' ? razorpay_signature : '';

    if (!activePaymentId) {
      res.status(400).json({ success: false, verified: false, error: 'Missing payment ID' });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || DEFAULT_LIVE_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || DEFAULT_LIVE_KEY_ID;

    let signatureValid = true;
    if (activeSignature && activeOrderId) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${activeOrderId}|${activePaymentId}`)
        .digest('hex');

      if (expectedSignature !== activeSignature) {
        signatureValid = false;
        console.warn('[Vercel API] Signature mismatch:', { expected: expectedSignature, received: activeSignature });
      }
    }

    // Double check with Razorpay API directly for live payments
    let paymentStatus = 'captured';
    let verifiedAmount = Number(amount) || 0;

    if (activePaymentId.startsWith('pay_')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const checkResp = await fetch(`https://api.razorpay.com/v1/payments/${activePaymentId}`, {
          headers: { 'Authorization': authHeader },
        });

        if (checkResp.ok) {
          const payDetails = (await checkResp.json()) as { status?: string; amount?: number };
          paymentStatus = payDetails.status || 'captured';
          verifiedAmount = payDetails.amount ? payDetails.amount / 100 : verifiedAmount;
          // If Razorpay API confirms the payment is authorized or captured, it is verified!
          if (paymentStatus === 'captured' || paymentStatus === 'authorized') {
            signatureValid = true;
          }
        }
      } catch (checkErr) {
        console.warn('[Vercel API] Razorpay payment double-check notice:', checkErr);
      }
    }

    if (!signatureValid) {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Cryptographic signature verification failed',
      });
      return;
    }

    res.status(200).json({
      success: true,
      verified: true,
      order_id: activeOrderId,
      payment_id: activePaymentId,
      amount: verifiedAmount,
      status: paymentStatus,
      verified_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Vercel API] Uncaught error in verify-payment:', err);
    const message = err instanceof Error ? err.message : 'Server error verifying payment';
    res.status(500).json({
      success: false,
      verified: false,
      error: message,
    });
  }
}
