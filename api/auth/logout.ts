/**
 * Logout Endpoint
 * Returns success - client-side token deletion handles actual logout
 * In JWT auth, tokens are stateless so we can't invalidate them server-side
 */

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // In JWT-based auth, logout is handled client-side by deleting the token
    // Server just confirms the logout was received
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
}
