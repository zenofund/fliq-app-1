import { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../lib/auth';
import { setToken } from '../../lib/jwt';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            const user = await registerUser(req.body);
            const token = setToken(user.id);
            res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/`);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};