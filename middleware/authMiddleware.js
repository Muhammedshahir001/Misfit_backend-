import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      const user = await User.findById(decoded.id).select('-password -refreshTokens -blacklistedTokens');
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', tokenExpired: true });
      }
      return res.status(401).json({ error: 'Not authorized, token invalid' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};
