import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key_change_in_production';

export const createToken = (userId: string, role: string = 'client', email: string = '') => {
    return jwt.sign({ id: userId, role, email }, SECRET_KEY, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, SECRET_KEY);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Assuming you attach user info to the request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden' });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden' });
    }
};
