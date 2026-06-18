import { Response } from 'express';
import Customer from '../models/Customer';
import User from '../models/User';
import Task from '../models/Task';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAnalyticsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Multi-tenant check
    const orgId = req.user.orgId;

    // 1. Core KPIs
    const totalCustomers = await Customer.countDocuments({ orgId });
    
    const activeLeads = await Customer.countDocuments({ 
      orgId, 
      status: { $in: ['lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation'] } 
    });

    const wonDeals = await Customer.countDocuments({ orgId, status: 'won' });
    const lostDeals = await Customer.countDocuments({ orgId, status: 'lost' });

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
      
      const createdCount = await Customer.countDocuments({
        orgId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const wonCount = await Customer.countDocuments({
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
    const teamMembers = await User.find({ orgId }).select('name email role');
    const teamPerformance = await Promise.all(
      teamMembers.map(async (member) => {
        const totalAssigned = await Customer.countDocuments({ orgId, assignedMemberId: member._id });
        const wonCount = await Customer.countDocuments({ orgId, assignedMemberId: member._id, status: 'won' });
        const lostCount = await Customer.countDocuments({ orgId, assignedMemberId: member._id, status: 'lost' });
        
        const memberClosed = wonCount + lostCount;
        const memberConv = memberClosed > 0 ? Math.round((wonCount / memberClosed) * 100) : 0;

        const tasksCompleted = await Task.countDocuments({ 
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
      })
    );

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
  } catch (error: any) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
