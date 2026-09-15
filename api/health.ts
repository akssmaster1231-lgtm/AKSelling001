interface VercelApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

export default function handler(_req: unknown, res: VercelApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    app: 'AKSelling',
    razorpay: 'live',
    timestamp: new Date().toISOString(),
  });
}
