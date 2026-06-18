"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const getAuditLogs = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Restrict Audit Logs access to leaders and managers
        if (req.user.role !== 'leader' && req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges to view audit logs.' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const action = req.query.action || '';
        const search = req.query.search || '';
        const query = { orgId: req.user.orgId };
        if (action) {
            query.action = action;
        }
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
            ];
        }
        const total = await AuditLog_1.default.countDocuments(query);
        const logs = await AuditLog_1.default.find(query)
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
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getAuditLogs = getAuditLogs;
