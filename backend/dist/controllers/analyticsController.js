"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsSummary = void 0;
const Customer_1 = __importDefault(require("../models/Customer"));
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const getAnalyticsSummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Multi-tenant check
        const orgId = req.user.orgId;
        // 1. Core KPIs
        const totalCustomers = await Customer_1.default.countDocuments({ orgId });
        const activeLeads = await Customer_1.default.countDocuments({
            orgId,
            status: { $in: ['lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation'] }
        });
        const wonDeals = await Customer_1.default.countDocuments({ orgId, status: 'won' });
        const lostDeals = await Customer_1.default.countDocuments({ orgId, status: 'lost' });
        const totalClosed = wonDeals + lostDeals;
        const conversionRate = totalClosed > 0
            ? Math.round((wonDeals / totalClosed) * 100 * 10) / 10
            : 0;
        // 2. Monthly Growth (Last 6 Months)
        const monthlyGrowth = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            const createdCount = await Customer_1.default.countDocuments({
                orgId,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const wonCount = await Customer_1.default.countDocuments({
                orgId,
                status: 'won',
                updatedAt: { $gte: startOfMonth, $lte: endOfMonth } // Assume deal won date is when status was updated to won
            });
            const monthName = startOfMonth.toLocaleString('default', { month: 'short' });
            monthlyGrowth.push({
                month: monthName,
                leads: createdCount,
                dealsWon: wonCount,
            });
        }
        // 3. Team Performance ranking
        const teamMembers = await User_1.default.find({ orgId }).select('name email role');
        const teamPerformance = await Promise.all(teamMembers.map(async (member) => {
            const totalAssigned = await Customer_1.default.countDocuments({ orgId, assignedMemberId: member._id });
            const wonCount = await Customer_1.default.countDocuments({ orgId, assignedMemberId: member._id, status: 'won' });
            const lostCount = await Customer_1.default.countDocuments({ orgId, assignedMemberId: member._id, status: 'lost' });
            const memberClosed = wonCount + lostCount;
            const memberConv = memberClosed > 0 ? Math.round((wonCount / memberClosed) * 100) : 0;
            const tasksCompleted = await Task_1.default.countDocuments({
                orgId,
                assignedMemberId: member._id,
                status: 'completed'
            });
            return {
                id: member._id,
                name: member.name,
                role: member.role,
                assigned: totalAssigned,
                won: wonCount,
                conversion: memberConv,
                tasksCompleted,
            };
        }));
        // Sort by won deals descending
        teamPerformance.sort((a, b) => b.won - a.won);
        res.status(200).json({
            summary: {
                totalCustomers,
                activeLeads,
                wonDeals,
                conversionRate,
                monthlyGrowth,
                teamPerformance,
            }
        });
    }
    catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getAnalyticsSummary = getAnalyticsSummary;
