import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      order_id,
      order_number,
      courier_name = 'Shadowfax Surface',
      pickup_pincode = '122015',
      delivery_pincode = '110001',
      customer_name,
      customer_phone,
      customer_address,
      total_amount,
      payment_method,
      provider = 'nimbuspost',
    } = req.body || {};

    const cleanPrefix = courier_name.toUpperCase().includes('DELHIVERY')
      ? 'DEL'
      : courier_name.toUpperCase().includes('NIMBUS') || courier_name.toUpperCase().includes('EKART')
      ? 'NP'
      : courier_name.toUpperCase().includes('BLUEDART')
      ? 'BD'
      : 'SFX';
    const awbCode = `${cleanPrefix}${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return res.status(200).json({
      success: true,
      provider,
      order_id: order_id || `ORD-${Date.now()}`,
      order_number: order_number || `ORD-${Date.now()}`,
      awb_code: awbCode,
      courier_name,
      pickup_pincode,
      delivery_pincode,
      customer_name,
      customer_phone,
      customer_address,
      total_amount,
      payment_method,
      status: 'MANIFEST_GENERATED',
      tracking_url: provider === 'nimbuspost'
        ? `https://ship.nimbuspost.com/shipping/tracking?awb=${awbCode}`
        : `https://shiprocket.co/tracking/${awbCode}`,
      label_url: provider === 'nimbuspost'
        ? `https://ship.nimbuspost.com/shipping/print-label/${awbCode}`
        : `https://shiprocket.co/print-label/${awbCode}`,
      portal_url: provider === 'nimbuspost'
        ? 'https://ship.nimbuspost.com/shipping/order'
        : 'https://app.shiprocket.in/orders',
      created_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Create shipment error:', err);
    return res.status(500).json({ error: 'Failed to create automated logistics shipment' });
  }
}
