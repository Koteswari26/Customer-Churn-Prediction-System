import { Customer } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "BC-101",
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "+91 98765 43210",
    tenure: 3,
    monthlyCharges: 999, // ₹999 per month (100 Mbps fiber)
    totalCharges: 2997,
    contractType: "Month-to-month",
    internetService: "Fiber Optic",
    techSupport: "No",
    paymentMethod: "Electronic check",
    paperlessBilling: "Yes",
    churnProbability: 82, // Critical Churn Risk (NewMonth-to-Month customer without tech support, on high charges)
    complaintsCount: 3,
    lastActive: "Active 2 hours ago"
  },
  {
    id: "BC-102",
    name: "Priya Patel",
    email: "priya.patel@yahoo.com",
    phone: "+91 99123 45678",
    tenure: 48,
    monthlyCharges: 1499, // ₹1499 per month (200 Mbps fiber + OTT bundle)
    totalCharges: 71952,
    contractType: "Two year",
    internetService: "Fiber Optic",
    techSupport: "Yes",
    paymentMethod: "Bank transfer",
    paperlessBilling: "Yes",
    churnProbability: 8, // Very Safe (Long tenure, long contract, with tech support, bank auto-pay)
    complaintsCount: 0,
    lastActive: "Active today"
  },
  {
    id: "BC-103",
    name: "Amit Verma",
    email: "amit.verma@outlook.com",
    phone: "+91 98112 23344",
    tenure: 8,
    monthlyCharges: 599, // ₹599 (basic DSL broadband)
    totalCharges: 4792,
    contractType: "Month-to-month",
    internetService: "DSL",
    techSupport: "No",
    paymentMethod: "Electronic check",
    paperlessBilling: "Yes",
    churnProbability: 45, // Medium Churn Risk
    complaintsCount: 1,
    lastActive: "Active yesterday"
  },
  {
    id: "BC-104",
    name: "Neha Gupta",
    email: "neha.gupta@outlook.com",
    phone: "+91 88998 87766",
    tenure: 24,
    monthlyCharges: 799,
    totalCharges: 19176,
    contractType: "One year",
    internetService: "DSL",
    techSupport: "Yes",
    paymentMethod: "Credit card",
    paperlessBilling: "No",
    churnProbability: 18, // Safe (Good contract, auto payment, has support)
    complaintsCount: 0,
    lastActive: "Active 3 days ago"
  },
  {
    id: "BC-105",
    name: "Vikram Singh",
    email: "vikram.singh@gmail.com",
    phone: "+91 91234 56789",
    tenure: 5,
    monthlyCharges: 1299,
    totalCharges: 6495,
    contractType: "Month-to-month",
    internetService: "Fiber Optic",
    techSupport: "No",
    paymentMethod: "Electronic check",
    paperlessBilling: "Yes",
    churnProbability: 74, // High Churn Risk
    complaintsCount: 4,
    lastActive: "Active 5 hours ago"
  },
  {
    id: "BC-106",
    name: "Anjali Iyer",
    email: "anjali.iyer@gmail.com",
    phone: "+91 77665 54433",
    tenure: 60,
    monthlyCharges: 1999, // Premium high speed OTT tier
    totalCharges: 119940,
    contractType: "Two year",
    internetService: "Fiber Optic",
    techSupport: "Yes",
    paymentMethod: "Bank transfer",
    paperlessBilling: "Yes",
    churnProbability: 6, // Very Safe (Ideal customer)
    complaintsCount: 0,
    lastActive: "Active yesterday"
  },
  {
    id: "BC-107",
    name: "Sandeep Rao",
    email: "sandeep.rao@hotmail.com",
    phone: "+91 93456 78901",
    tenure: 14,
    monthlyCharges: 999,
    totalCharges: 13986,
    contractType: "Month-to-month",
    internetService: "Fiber Optic",
    techSupport: "No",
    paymentMethod: "Credit card",
    paperlessBilling: "Yes",
    churnProbability: 58, // Medium-High Risk
    complaintsCount: 2,
    lastActive: "Active 10 hours ago"
  },
  {
    id: "BC-108",
    name: "Karan Johar",
    email: "karan.johar@corp.in",
    phone: "+91 98123 77777",
    tenure: 2,
    monthlyCharges: 1499,
    totalCharges: 2998,
    contractType: "Month-to-month",
    internetService: "Fiber Optic",
    techSupport: "No",
    paymentMethod: "Mailed check",
    paperlessBilling: "Yes",
    churnProbability: 88, // Critical Churn Risk (New high tier month-to-month with no support in place, mailed payment)
    complaintsCount: 2,
    lastActive: "Active today"
  },
  {
    id: "BC-109",
    name: "Riya Sen",
    email: "riya.sen@yahoo.co.in",
    phone: "+91 81234 56712",
    tenure: 36,
    monthlyCharges: 499, // Basic broadband, no fiber
    totalCharges: 17964,
    contractType: "One year",
    internetService: "No",
    techSupport: "No internet",
    paymentMethod: "Bank transfer",
    paperlessBilling: "No",
    churnProbability: 11, // Safe (Simple plan, long commitment)
    complaintsCount: 0,
    lastActive: "Active 4 days ago"
  },
  {
    id: "BC-110",
    name: "Manish Pandey",
    email: "manish.p@gmail.com",
    phone: "+91 99880 12345",
    tenure: 12,
    monthlyCharges: 999,
    totalCharges: 11988,
    contractType: "Month-to-month",
    internetService: "Fiber Optic",
    techSupport: "Yes",
    paymentMethod: "Electronic check",
    paperlessBilling: "Yes",
    churnProbability: 40, // Medium Risk (Has support but on month-to-month contract)
    complaintsCount: 1,
    lastActive: "Active today"
  },
  {
    id: "BC-111",
    name: "Sunita Reddy",
    email: "sunita.reddy@gmail.com",
    phone: "+91 94440 98765",
    tenure: 45,
    monthlyCharges: 799,
    totalCharges: 35955,
    contractType: "Two year",
    internetService: "DSL",
    techSupport: "Yes",
    paymentMethod: "Credit card",
    paperlessBilling: "No",
    churnProbability: 10, // Safe
    complaintsCount: 0,
    lastActive: "Active yesterday"
  },
  {
    id: "BC-112",
    name: "Deepak Chawla",
    email: "deepak.c@outlook.in",
    phone: "+91 98989 89898",
    tenure: 1,
    monthlyCharges: 1299,
    totalCharges: 1299,
    contractType: "Month-to-month",
    internetService: "Fiber Optic",
    techSupport: "No",
    paymentMethod: "Electronic check",
    paperlessBilling: "Yes",
    churnProbability: 86, // Extremely high threat (1 month, high price, no support, active invoice complaints)
    complaintsCount: 3,
    lastActive: "Active 1 hour ago"
  }
];

export const RETENTION_PLAYBOOK = [
  {
    situation: "High-Risk Customer on Month-to-Month Fiber (Rahul, Vikram)",
    strategy: "Loyalty Contract Upgrade Upgrade Promo",
    action: "Suggest converting to the 'Bharat Yearly Saver' plan. Waive 1 month charges (₹999) + upgrade speed from 100 Mbps to 150 Mbps, saving them ₹150 per month in exchange for a 12-month contract.",
    expectedImpact: "Reduces churn probability by ~65%"
  },
  {
    situation: "New Fiber Customer complaining about setup or speed lags (Deepak)",
    strategy: "Immediate Technical Support Dispatch & SLA Waiver",
    action: "Assign a dedicated Senior Network Engineer within 12 hours for a free router health checkup. Issue a ₹300 bill credit as compensation for initial configuration glitches.",
    expectedImpact: "Reduces churn probability by ~50%"
  },
  {
    situation: "Customer with active billing complaints on electronic check payment",
    strategy: "Auto-Pay Transition Benefit Offer",
    action: "Offer a one-time ₹150 wallet credit if they enroll in automatic auto-debit payments via Bank Transfer or Credit Card, avoiding manual transaction fees and electronic check failures.",
    expectedImpact: "Reduces churn probability by ~35%"
  },
  {
    situation: "Out-of-Contract Premium OTT Tier User expressing pricing concerns",
    strategy: "Value bundle optimization",
    action: "Migrate standard plan to 'Silver Home Bundle' which contains the same speed + premium OTT subscriptions at 18% lower bundle cost than buying services standalone.",
    expectedImpact: "Reduces churn probability by ~45%"
  }
];
