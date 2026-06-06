import { Request, Response } from 'express';

export const loginSuccess = (req: Request, res: Response) => {
  res.json({ message: 'Login successful', user: req.user });
};

export const loginFailed = (req: Request, res: Response) => {
  res.status(401).json({ error: 'Google authentication failed' });
};

export const logout = (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
};
