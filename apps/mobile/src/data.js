// Sample data — clearly illustrative, replaced by real sync later.
export const todayTxns = [
  { id: 't1', time: '8:12 AM', merchant: 'Chai Sutta Bar', category: 'Food', amount: 40, via: 'UPI', ref: 'UTR 9821…4402' },
  { id: 't2', time: '8:47 AM', merchant: 'Uber Auto', category: 'Travel', amount: 120, via: 'UPI', ref: 'UTR 9821…7719' },
  { id: 't3', time: '9:15 AM', merchant: 'Swiggy · Breakfast', category: 'Food', amount: 210, via: 'Card', ref: 'HDFC •• 4821' },
  { id: 't4', time: '10:02 AM', merchant: 'Jio Prepaid Recharge', category: 'Bills', amount: 239, via: 'UPI', ref: 'UTR 9821…9034' },
  { id: 't5', time: '10:40 AM', merchant: 'Metro Card Top-up', category: 'Travel', amount: 200, via: 'UPI', ref: 'UTR 9821…5560' },
  { id: 't6', time: '11:05 AM', merchant: 'Blue Tokai Coffee', category: 'Food', amount: 180, via: 'Card', ref: 'ICICI •• 1190' },
];

export const yesterdayTxns = [
  { id: 'y1', time: '8:40 PM', merchant: 'Zomato · Dinner', category: 'Food', amount: 480, via: 'Card', ref: 'HDFC •• 4821' },
  { id: 'y2', time: '7:30 PM', merchant: 'BookMyShow', category: 'Other', amount: 700, via: 'Card', ref: 'ICICI •• 1190' },
  { id: 'y3', time: '6:15 PM', merchant: 'Shell Petrol', category: 'Travel', amount: 1000, via: 'Card', ref: 'HDFC •• 4821' },
  { id: 'y4', time: '5:02 PM', merchant: 'DMart Groceries', category: 'Shopping', amount: 1340, via: 'Card', ref: 'HDFC •• 4821' },
  { id: 'y5', time: '2:45 PM', merchant: 'Parking · Phoenix Mall', category: 'Travel', amount: 100, via: 'UPI', ref: 'UTR 9770…2210' },
  { id: 'y6', time: '1:30 PM', merchant: 'Uber', category: 'Travel', amount: 230, via: 'UPI', ref: 'UTR 9770…8841' },
  { id: 'y7', time: '1:05 PM', merchant: 'Swiggy · Lunch', category: 'Food', amount: 260, via: 'UPI', ref: 'UTR 9770…5192' },
  { id: 'y8', time: '11:40 AM', merchant: 'Amazon.in', category: 'Shopping', amount: 1299, via: 'Card', ref: 'ICICI •• 1190' },
  { id: 'y9', time: '10:15 AM', merchant: 'Electricity Bill · BESCOM', category: 'Bills', amount: 890, via: 'UPI', ref: 'UTR 9770…3345' },
  { id: 'y10', time: '9:20 AM', merchant: 'Metro', category: 'Travel', amount: 60, via: 'UPI', ref: 'UTR 9770…1098' },
  { id: 'y11', time: '8:50 AM', merchant: 'Chai Point', category: 'Food', amount: 40, via: 'UPI', ref: 'UTR 9770…6671' },
];

export const monthCategories = [
  { name: 'Food', amount: 8240 },
  { name: 'Shopping', amount: 6400 },
  { name: 'Travel', amount: 4120 },
  { name: 'Bills', amount: 2850 },
  { name: 'Other', amount: 1900 },
];

export const monthTotal = 23510;
export const monthCount = 148;

export const weekTrend = [
  { day: 'M', amount: 1240 },
  { day: 'T', amount: 980 },
  { day: 'W', amount: 2140 },
  { day: 'T', amount: 760 },
  { day: 'F', amount: 1890 },
  { day: 'S', amount: 2430 },
  { day: 'S', amount: 1120 },
];

export const insights = [
  {
    title: 'Small taps, big total',
    body: 'UPI payments under ₹200 added up to ₹3,150 this week — 13% of your monthly spend. Nothing feels like money until it is.',
  },
  {
    title: 'Food delivery is up 38%',
    body: 'You spent ₹8,240 on food delivery this month vs ₹5,970 last month. Cooking twice a week could save you roughly ₹3,500.',
  },
  {
    title: 'Bills are the quiet win',
    body: 'Phone, electricity and subscriptions are steady at ₹2,850. Nothing to fix here — this is the part to protect.',
  },
];

export const yearMonths = [
  { m: 'Jan', amount: 19800 },
  { m: 'Feb', amount: 21400 },
  { m: 'Mar', amount: 18900 },
  { m: 'Apr', amount: 22600 },
  { m: 'May', amount: 24100 },
  { m: 'Jun', amount: 20900 },
  { m: 'Jul', amount: 23300 },
  { m: 'Aug', amount: 21800 },
  { m: 'Sep', amount: 19400 },
];

export const yearTotal = 194200;

// ---- Budgets (September) ----
export const budgets = [
  { name: 'Food', budget: 10000, spent: 8240, icon: 'fast-food-outline' },
  { name: 'Shopping', budget: 8000, spent: 6400, icon: 'bag-outline' },
  { name: 'Travel', budget: 6000, spent: 4120, icon: 'car-outline' },
  { name: 'Bills', budget: 3500, spent: 2850, icon: 'receipt-outline' },
  { name: 'Other', budget: 3000, spent: 1900, icon: 'shapes-outline' },
];

// ---- Upcoming bills & subscriptions ----
export const bills = [
  { id: 'b1', name: 'HDFC Credit Card', detail: 'Due Sep 28 · •• 4821', amount: 18420, dueIn: '6 days', autopay: true, icon: 'card-outline', kind: 'bill' },
  { id: 'b2', name: 'Electricity · BESCOM', detail: 'Due Oct 2', amount: 940, dueIn: '10 days', autopay: true, icon: 'flash-outline', kind: 'bill' },
  { id: 'b3', name: 'Jio Prepaid', detail: 'Plan expires Oct 5', amount: 239, dueIn: '13 days', autopay: false, icon: 'phone-portrait-outline', kind: 'bill' },
  { id: 'b4', name: 'ICICI Credit Card', detail: 'Due Oct 7 · •• 1190', amount: 9210, dueIn: '15 days', autopay: false, icon: 'card-outline', kind: 'bill' },
];

export const subscriptions = [
  { id: 's1', name: 'Spotify', amount: 119, cycle: '/mo', icon: 'musical-notes-outline' },
  { id: 's2', name: 'iCloud+ 200GB', amount: 219, cycle: '/mo', icon: 'cloud-outline' },
  { id: 's3', name: 'Swiggy One', amount: 149, cycle: '/mo', icon: 'bicycle-outline' },
  { id: 's4', name: 'Netflix', amount: 199, cycle: '/mo', icon: 'play-outline' },
];

// ---- How September was paid ----
export const paymentSplit = [
  { name: 'UPI', amount: 14260, note: '96 payments', icon: 'phone-portrait-outline' },
  { name: 'Credit cards', amount: 9250, note: '52 payments', icon: 'card-outline' },
];

// ---- Top merchants this month ----
export const topMerchants = [
  { name: 'Swiggy', category: 'Food', count: 18, amount: 4860 },
  { name: 'DMart', category: 'Shopping', count: 6, amount: 3920 },
  { name: 'Uber', category: 'Travel', count: 14, amount: 2380 },
  { name: 'Amazon.in', category: 'Shopping', count: 4, amount: 2140 },
  { name: 'Zomato', category: 'Food', count: 9, amount: 1980 },
];

// ---- Savings goals ----
export const savingsGoals = [
  { id: 'g1', name: 'Japan trip', saved: 42000, target: 150000, icon: 'airplane-outline' },
  { id: 'g2', name: 'Emergency fund', saved: 85000, target: 200000, icon: 'shield-checkmark-outline' },
];

export const allTxns = [...todayTxns, ...yesterdayTxns];
