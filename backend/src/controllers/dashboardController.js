const Record = require('../models/Record');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

// Helper: build match object respecting role
const buildMatch = (user) => {
  const match = { isDeleted: false };
  if (user.role !== ROLES.ADMIN) {
    match.owner = user.id;
  }
  return match;
};

exports.getSummary = asyncHandler(async (req, res) => {
  const match = buildMatch(req.user);

  const [totals, categoryTotals, recent, monthly] = await Promise.all([
    Record.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]),
    Record.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          type: { $first: '$type' },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Record.find(match).sort({ date: -1 }).limit(5),
    Record.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }, // last 12 months
    ]),
  ]);

  const totalIncome = totals.find((t) => t._id === 'income')?.total || 0;
  const totalExpense = totals.find((t) => t._id === 'expense')?.total || 0;

  return res.json({
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    categoryTotals: categoryTotals.map((c) => ({ category: c._id, total: c.total, sampleType: c.type })),
    recentActivity: recent,
    monthlyTrends: monthly.map((m) => ({
      year: m._id.year,
      month: m._id.month,
      income: m.income,
      expense: m.expense,
    })),
  });
});