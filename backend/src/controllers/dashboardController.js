const Record = require('../models/Record');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

// Helper: build match object respecting role + filters
const buildMatch = (user, query) => {
  const match = { isDeleted: false };
  // Uncomment to scope non-admins to their own data
  // if (user.role !== ROLES.ADMIN) match.owner = user.id;
  if (query.type) match.type = query.type;
  if (query.category) match.category = query.category;
  if (query.startDate || query.endDate) {
    match.date = {};
    if (query.startDate) match.date.$gte = new Date(query.startDate);
    if (query.endDate) match.date.$lte = new Date(query.endDate);
  }
  return match;
};

exports.getSummary = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 5, 1), 50);
  const skip = (page - 1) * pageSize;
  const match = buildMatch(req.user, req.query);

  const [totals, categoryTotals, recent, monthly, recentTotal] = await Promise.all([
    Record.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Record.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, type: { $first: '$type' } } },
      { $sort: { total: -1 } },
    ]),
    Record.find(match).sort({ date: -1 }).skip(skip).limit(pageSize).populate('owner', 'name role'),
    Record.aggregate([
      { $match: match },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                  income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
                  expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
    Record.countDocuments(match),
  ]);

  const totalIncome = totals.find((t) => t._id === 'income')?.total || 0;
  const totalExpense = totals.find((t) => t._id === 'expense')?.total || 0;
  const totalPages = Math.max(1, Math.ceil(recentTotal / pageSize));

  return res.json({
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    categoryTotals: categoryTotals.map((c) => ({ category: c._id, total: c.total, sampleType: c.type })),
    recentActivity: recent,
    recentMeta: { page, pageSize, total: recentTotal, totalPages },
    monthlyTrends: monthly.map((m) => ({ year: m._id.year, month: m._id.month, income: m.income, expense: m.expense })),
  });
});
