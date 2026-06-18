"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgIsolation = void 0;
const orgIsolation = (req, res, next) => {
    if (!req.user || !req.user.orgId) {
        return res.status(403).json({ error: 'No organization context found' });
    }
    req.orgFilter = { orgId: req.user.orgId };
    next();
};
exports.orgIsolation = orgIsolation;
