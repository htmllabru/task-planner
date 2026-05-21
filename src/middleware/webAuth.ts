// Редирект на /login для защищённых HTML-страниц (cookie JWT)
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export function webAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.redirect('/login');
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

export function webGuest(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  if (token) {
    try {
      verifyToken(token);
      res.redirect('/cabinet');
      return;
    } catch {
      res.clearCookie('token');
    }
  }
  next();
}
