import { Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Restrict Audit Logs access to leaders and managers
    if (req.user.role !== 'leader' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to view audit logs.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const action = (req.query.action as string) || '';
    const search = (req.query.search as string) || '';

    const query: any = { orgId: req.user.orgId };

    if (action) {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
