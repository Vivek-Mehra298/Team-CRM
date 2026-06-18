import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const orgIsolation = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.orgId) {
    return res.status(403).json({ error: 'No organization context found' });
  }
  req.orgFilter = { orgId: req.user.orgId };
  next();
};
