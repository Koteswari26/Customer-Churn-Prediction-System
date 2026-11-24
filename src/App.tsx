import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Brain,
  MessageSquare,
  BookOpen,
  Users,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  ArrowRight,
  RefreshCw,
  Send,
  User,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { INITIAL_CUSTOMERS, RETENTION_PLAYBOOK } from './data';
import { runChurnPrediction } from './mlEngine';
import { Customer, ModelType, PredictorInput, PredictionResult, FeedbackLog, Message } from './types';

export default function App() {
  // --- Persistent State & Tab Selection ---
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('churn_predictor_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>(() => {
    const saved = localStorage.getItem('churn_predictor_feedback');
    return saved ? JSON.parse(saved) : [
      {
        id: "FB-001",
        customerName: "Rahul Sharma",
        message: "Broadband speeds drop every evening, and charges of ₹999 are too high for this service stability constraint.",
        reply: "We sincerely apologize, Rahul. We've scheduled an automated port optimization and recorded a ₹150 monthly discount package offer on your monthly fiber subscription.",
        timestamp: "2026-06-09 10:15 AM",
        sentiment: "Negative" as const,
        dissatisfactionLevel: 82,
        category: "Network Speed",
        recommendation: "Offer ₹150 Monthly billing discount"
      },
      {
        id: "FB-002",
        customerName: "Sandeep Rao",
        message: "I am happy with the download velocity, but your manual check payment gateway keeps crashing each month.",
        reply: "Apologies for the billing site friction, Sandeep! We would love to move you to bank auto-pay. Doing so credits ₹150 on your next broadband bill automatically.",
        timestamp: "2026-06-09 11:32 AM",
        sentiment: "Neutral" as const,
        dissatisfactionLevel: 45,
        category: "Billing",
        recommendation: "Auto-Pay transition setup"
      }
    ];
  });

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('churn_predictor_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('churn_predictor_feedback', JSON.stringify(feedbackLogs));
  }, [feedbackLogs]);

  const [activeTab, setActiveTab] = useState<'overview' | 'predictor' | 'chatbot' | 'playbook'>('overview');

  // --- Dynamic Directory Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContract, setFilterContract] = useState<string>('All');
  const [filterService, setFilterService] = useState<string>('All');

  // --- Predictor Form Inputs ---
  const [predForm, setPredForm] = useState<PredictorInput>({
    tenure: 12,
    monthlyCharges: 799,
    contractType: 'Month-to-month',
    internetService: 'Fiber Optic',
    techSupport: 'No',
    paymentMethod: 'Electronic check',
    paperlessBilling: 'Yes',
    modelType: 'LogisticRegression'
  });

  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  // --- Active Customer Chat Context ---
  const [activeChatCustomerId, setActiveChatCustomerId] = useState<string>(customers[0]?.id || '');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({
    "BC-101": [
      { sender: 'bot', text: "Namaste Rahul, I am your support agent. I see you are on our ₹999 Fiber plan. How can I help you today?", timestamp: "10:10 AM" }
    ]
  });
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- New Customer Creation Modal/Form State ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    email: '',
    phone: '',
    tenure: 6,
    monthlyCharges: 799,
    contractType: 'Month-to-month' as const,
    internetService: 'Fiber Optic' as const,
    techSupport: 'No' as const,
    paymentMethod: 'Electronic check' as const,
    paperlessBilling: 'Yes' as const
  });

  // --- Live Reactive Calculations ---
  // Recalculates metrics for Overview dashboard dynamically
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchContract = filterContract === 'All' || c.contractType === filterContract;
      const matchService = filterService === 'All' || c.internetService === filterService;
      return matchSearch && matchContract && matchService;
    });
  }, [customers, searchQuery, filterContract, filterService]);

  const stats = useMemo(() => {
    const total = filteredCustomers.length;
    if (total === 0) return { active: 0, avgTenure: 0, totalRevenue: 0, riskRevenue: 0, retainRate: 0 };

    let totalTenure = 0;
    let totalRev = 0;
    let riskRev = 0;
    let churnCount = 0;

    customers.forEach(c => {
      totalTenure += c.tenure;
      totalRev += c.monthlyCharges;
      if (c.churnProbability > 65) {
        riskRev += c.monthlyCharges;
        churnCount++;
      }
    });

    const activeCount = customers.length;
    const avgTenure = Math.round(totalTenure / activeCount);
    const retainRate = Math.round(((activeCount - churnCount) / activeCount) * 100);

    return {
      active: activeCount,
      avgTenure,
      totalRevenue: totalRev,
      riskRevenue: riskRev,
      retainRate
    };
  }, [customers, filteredCustomers]);

  // Recharts Chart datasets
  const chartRiskData = useMemo(() => {
    let safe = 0;
    let warning = 0;
    let critical = 0;

    filteredCustomers.forEach(c => {
      if (c.churnProbability <= 30) safe++;
      else if (c.churnProbability <= 70) warning++;
      else critical++;
    });

    return [
      { name: 'Safe (<30%)', value: safe, fill: '#10b981' },
      { name: 'Moderate (30-70%)', value: warning, fill: '#f59e0b' },
      { name: 'Critical (>70%)', value: critical, fill: '#ef4444' }
    ];
  }, [filteredCustomers]);

  const chartServiceChargesData = useMemo(() => {
    const services = ['DSL', 'Fiber Optic', 'No'];
    return services.map(srv => {
      const peers = filteredCustomers.filter(c => c.internetService === srv);
      const avgChg = peers.length ? Math.round(peers.reduce((acc, p) => acc + p.monthlyCharges, 0) / peers.length) : 0;
      const avgRisk = peers.length ? Math.round(peers.reduce((acc, p) => acc + p.churnProbability, 0) / peers.length) : 0;
      return {
        service: srv === 'No' ? 'No Internet' : srv,
        'Avg Monthly Charges (₹)': avgChg,
        'Avg Churn Risk (%)': avgRisk
      };
    });
  }, [filteredCustomers]);

  // Trigger Local Prediction
  const estimatePredictor = (inputFormObj: PredictorInput) => {
    const result = runChurnPrediction(inputFormObj);
    setPredictionResult(result);
  };

  // Run initial default prediction assessment
  useEffect(() => {
    estimatePredictor(predForm);
  }, []);

  // Sync Form when contract/charges modified
  const handleFormChange = (key: keyof PredictorInput, val: any) => {
    const updated = { ...predForm, [key]: val };
    setPredForm(updated);
    estimatePredictor(updated);
  };

  // Load selected customer profile direct to ML Form
  const loadCustomerToPredictor = (customer: Customer) => {
    const target: PredictorInput = {
      tenure: customer.tenure,
      monthlyCharges: customer.monthlyCharges,
      contractType: customer.contractType,
      internetService: customer.internetService,
      techSupport: customer.techSupport,
      paymentMethod: customer.paymentMethod,
      paperlessBilling: customer.paperlessBilling,
      modelType: predForm.modelType
    };
    setPredForm(target);
    estimatePredictor(target);
    setActiveTab('predictor');
  };

  // Switch to chatbot tab targeting specific customer
  const loadCustomerToChatbot = (customer: Customer) => {
    setActiveChatCustomerId(customer.id);
    if (!chatHistory[customer.id]) {
      setChatHistory(prev => ({
        ...prev,
        [customer.id]: [
          { sender: 'bot', text: `Hello ${customer.name}, thank you for holding. We value your ₹${customer.monthlyCharges}/mo ${customer.internetService} connection and want you to remain satisfied. What feedback or issues are you facing?`, timestamp: "12:00 PM" }
        ]
      }));
    }
    setActiveTab('chatbot');
  };

  const activeChatCustomer = useMemo(() => {
    return customers.find(c => c.id === activeChatCustomerId) || customers[0];
  }, [customers, activeChatCustomerId]);

  // Send feedback message to backend Node API
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeChatCustomer) return;

    const userText = chatMessage;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { sender: 'user', text: userText, timestamp: timeNow };

    // Append user message
    setChatHistory(prev => ({
      ...prev,
      [activeChatCustomer.id]: [...(prev[activeChatCustomer.id] || []), userMsg]
    }));
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeChatCustomer.name,
          message: userText,
          monthlyCharges: activeChatCustomer.monthlyCharges,
          contractType: activeChatCustomer.contractType,
          techSupport: activeChatCustomer.techSupport,
          internetService: activeChatCustomer.internetService
        })
      });

      if (!response.ok) throw new Error("Server error occurred on chat");
      const data = await response.json();

      const botMsg: Message = {
        sender: 'bot',
        text: data.reply,
        timestamp: timeNow,
        sentiment: data.sentiment,
        dissatisfaction: data.dissatisfactionLevel,
        category: data.complaintCategory
      };

      // Append bot response
      setChatHistory(prev => ({
        ...prev,
        [activeChatCustomer.id]: [...(prev[activeChatCustomer.id] || []), botMsg]
      }));

      // Update customer complaintsCount in state dynamically
      setCustomers(prev => prev.map(c => {
        if (c.id === activeChatCustomer.id) {
          // Adjust probability and raise complaint metrics
          const addedComplaints = c.complaintsCount + 1;
          const adjustedChg = Math.min(99, Math.max(5, c.churnProbability + (data.dissatisfactionLevel > 60 ? 10 : -8)));
          return {
            ...c,
            complaintsCount: addedComplaints,
            churnProbability: Math.round(adjustedChg)
          };
        }
        return c;
      }));

      // Add Dialogue item to feedback logs
      const newFB: FeedbackLog = {
        id: `FB-${Date.now().toString().slice(-3)}`,
        customerId: activeChatCustomer.id,
        customerName: activeChatCustomer.name,
        message: userText,
        reply: data.reply,
        timestamp: new Date().toLocaleDateString() + ' ' + timeNow,
        sentiment: data.sentiment,
        dissatisfactionLevel: data.dissatisfactionLevel,
        category: data.complaintCategory,
        recommendation: data.recommendation
      };
      setFeedbackLogs(prev => [newFB, ...prev]);

    } catch (err) {
      console.error(err);
      const errBotMsg: Message = {
        sender: 'bot',
        text: `We are analyzing your technical connection parameters and will coordinate with our line dispatchers shortly to optimize your ₹${activeChatCustomer.monthlyCharges} feedback status.`,
        timestamp: timeNow
      };
      setChatHistory(prev => ({
        ...prev,
        [activeChatCustomer.id]: [...(prev[activeChatCustomer.id] || []), errBotMsg]
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add new customer to memory database
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.email) return;

    const computedTotalCharges = newCust.monthlyCharges * newCust.tenure;
    // Initial probability engine estimate
    const defaultProbResult = runChurnPrediction({
      tenure: newCust.tenure,
      monthlyCharges: newCust.monthlyCharges,
      contractType: newCust.contractType,
      internetService: newCust.internetService,
      techSupport: newCust.techSupport,
      paymentMethod: newCust.paymentMethod,
      paperlessBilling: newCust.paperlessBilling,
      modelType: 'LogisticRegression'
    });

    const added: Customer = {
      id: `BC-${100 + customers.length + 1}`,
      name: newCust.name,
      email: newCust.email,
      phone: newCust.phone || "+91 99999 11111",
      tenure: Number(newCust.tenure),
      monthlyCharges: Number(newCust.monthlyCharges),
      totalCharges: computedTotalCharges,
      contractType: newCust.contractType,
      internetService: newCust.internetService,
      techSupport: newCust.techSupport,
      paymentMethod: newCust.paymentMethod,
      paperlessBilling: newCust.paperlessBilling,
      churnProbability: defaultProbResult.probability,
      complaintsCount: 0,
      lastActive: "Just registered"
    };

    setCustomers(prev => [...prev, added]);
    setShowAddForm(false);
    // Reset form fields
    setNewCust({
      name: '',
      email: '',
      phone: '',
      tenure: 6,
      monthlyCharges: 799,
      contractType: 'Month-to-month',
      internetService: 'Fiber Optic',
      techSupport: 'No',
      paymentMethod: 'Electronic check',
      paperlessBilling: 'Yes'
    });
  };

  // Reset the database values back to initial seeds
  const handleResetDatabase = () => {
    if (confirm("Reset dataset back to factory defaults? Any new custom input and feedback logs will be cleared.")) {
      localStorage.removeItem('churn_predictor_customers');
      localStorage.removeItem('churn_predictor_feedback');
      setCustomers(INITIAL_CUSTOMERS);
      setFeedbackLogs([]);
      setChatHistory({
        "BC-101": [
          { sender: 'bot', text: "Namaste Rahul, I am your support agent. I see you are on our ₹999 Fiber plan. How can I help you today?", timestamp: "10:10 AM" }
        ]
      });
      alert("Database successfully refreshed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* --- Top Global Header --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Brain className="h-6 w-6" id="logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Customer Churn Predictor <sub className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-1.5 py-0.5 rounded">ML & AI Bot</sub>
              </h1>
              <p className="text-xs text-slate-500">
                Retention Command Dashboard & Machine Learning Classification Platform
              </p>
            </div>
          </div>
          {/* Navigation tabs in simple unified layout on the container page */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Overview & Leads
            </button>
            <button
              id="tab-predictor"
              onClick={() => setActiveTab('predictor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'predictor'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              ML Predictor Tool
            </button>
            <button
              id="tab-chatbot"
              onClick={() => setActiveTab('chatbot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all relative ${
                activeTab === 'chatbot'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Retention AI Chat
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            </button>
            <button
              id="tab-playbook"
              onClick={() => setActiveTab('playbook')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'playbook'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Playbook & Logs
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Application Body --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* --- TAB 1: OVERVIEW & LEAD MANAGER --- */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn" id="overview-container">
            {/* KPI Cards section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Customers</p>
                  <p className="text-xl font-bold text-slate-900">{stats.active}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Retention Rate</p>
                  <p className="text-xl font-bold text-slate-900">{stats.retainRate}%</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                  <IndianRupee className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Monthly Revenue</p>
                  <p className="text-xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Revenue At Churn Risk</p>
                  <p className="text-xl font-bold text-red-600">₹{stats.riskRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Avg Tenure</p>
                  <p className="text-xl font-bold text-slate-900">{stats.avgTenure} Mos</p>
                </div>
              </div>
            </div>

            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart: Churn risk level */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">
                  CHURN THREAT SEGMENTATION
                </h3>
                <div className="h-[240px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartRiskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartRiskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Customers`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-semibold">
                  <div className="text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                    Safe
                    <span className="block text-lg font-bold">
                      {customers.filter(c => c.churnProbability <= 30).length}
                    </span>
                  </div>
                  <div className="text-yellow-600 bg-yellow-50 py-1.5 rounded-lg border border-yellow-100">
                    Moderate
                    <span className="block text-lg font-bold">
                      {customers.filter(c => c.churnProbability > 30 && c.churnProbability <= 70).length}
                    </span>
                  </div>
                  <div className="text-red-600 bg-red-50 py-1.5 rounded-lg border border-red-100">
                    Critical
                    <span className="block text-lg font-bold">
                      {customers.filter(c => c.churnProbability > 70).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart: Internet Service Costs vs Churn level */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                    INTERNET SERVICES: CHARGES & CHURN RISK RATIOS
                  </h3>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 p-1.5 rounded text-indigo-700 font-semibold uppercase">
                    DSL vs Fiber
                  </span>
                </div>
                <div className="h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartServiceChargesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="service" fill="#64748b" fontSize={11} stroke="#cbd5e1" />
                      <YAxis fill="#64748b" fontSize={11} stroke="#cbd5e1" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Avg Monthly Charges (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Avg Churn Risk (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Customers table & lead controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Active Customer Directory</h3>
                  <p className="text-xs text-slate-500">
                    Click on any customer record to immediately test ML classifiers or start an empathetic retention chat.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Search bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search accounts name/email/ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>

                  {/* Filter Selects */}
                  <select
                    value={filterContract}
                    onChange={(e) => setFilterContract(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All">All Commitments</option>
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>

                  <select
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All">All Internet Bands</option>
                    <option value="Fiber Optic">Fiber Optic</option>
                    <option value="DSL">DSL Broadband</option>
                    <option value="No">No Internet</option>
                  </select>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </button>

                  <button
                    onClick={handleResetDatabase}
                    title="Restore Initial seeds"
                    className="p-2 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Add Customer Collapsible Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddCustomerSubmit}
                  className="p-5 bg-indigo-50/50 border-b border-indigo-100/50 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown"
                >
                  <div className="md:col-span-4">
                    <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                      New Subscription Client Registration
                    </h4>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Full Name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Patil"
                      value={newCust.name}
                      onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address*</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@domain.com"
                      value={newCust.email}
                      onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9XXXX XXXXX"
                      value={newCust.phone}
                      onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Contract Duration</label>
                    <select
                      value={newCust.contractType}
                      onChange={(e) => setNewCust({ ...newCust, contractType: e.target.value as any })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Month-to-month">Month-to-month</option>
                      <option value="One year">One year</option>
                      <option value="Two year">Two year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      Monthly Bill Amount <span className="text-indigo-600">(₹ Rupees)</span>
                    </label>
                    <input
                      type="number"
                      min={299}
                      max={2999}
                      value={newCust.monthlyCharges}
                      onChange={(e) => setNewCust({ ...newCust, monthlyCharges: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Active Tenure (Months)</label>
                    <input
                      type="number"
                      min={1}
                      max={84}
                      value={newCust.tenure}
                      onChange={(e) => setNewCust({ ...newCust, tenure: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Broadband Bandwidth</label>
                    <select
                      value={newCust.internetService}
                      onChange={(e) => setNewCust({ ...newCust, internetService: e.target.value as any })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Fiber Optic">Fiber Optic (Premium)</option>
                      <option value="DSL">DSL (Economic Link)</option>
                      <option value="No">No Internet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tech Customer Support</label>
                    <select
                      value={newCust.techSupport}
                      onChange={(e) => setNewCust({ ...newCust, techSupport: e.target.value as any })}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Yes">Subscribed Helpdesk</option>
                      <option value="No">No Helpdesk Setup</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                    >
                      Save Account Profile
                    </button>
                  </div>
                </form>
              )}

              {/* Table Data list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-5">ID & Name</th>
                      <th className="py-3.5 px-5">Plans & commitment</th>
                      <th className="py-3.5 px-5">Usage Timeline</th>
                      <th className="py-3.5 px-5">Monthly Bills</th>
                      <th className="py-3.5 px-5">Complaints</th>
                      <th className="py-3.5 px-5 text-center">Churn Risk Rating</th>
                      <th className="py-3.5 px-5 text-right">Intervention Support Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                          No customer leads match the currently configured search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => {
                        // Badge formatting computed parameters
                        let scoreColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                        let riskLabel = "Safe";
                        if (customer.churnProbability > 75) {
                          scoreColor = "text-rose-700 bg-rose-50 border-rose-100 animate-pulse";
                          riskLabel = "Critical";
                        } else if (customer.churnProbability > 30) {
                          scoreColor = "text-amber-700 bg-amber-50 border-amber-100";
                          riskLabel = "Alert Warning";
                        }

                        return (
                          <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-5">
                              <p className="font-bold text-slate-900">{customer.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono tracking-wider">{customer.id} • {customer.email}</p>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-semibold text-slate-700">{customer.contractType}</span>
                              <span className="block text-[10px] text-slate-500">{customer.internetService} Bandwidth</span>
                            </td>
                            <td className="py-4 px-5">
                              <p className="font-semibold text-slate-700">{customer.tenure} Months joined</p>
                              <span className="block text-[10px] text-slate-400">{customer.lastActive}</span>
                            </td>
                            <td className="py-4 px-5 font-semibold text-slate-900">
                              ₹{customer.monthlyCharges.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                            </td>
                            <td className="py-4 px-5">
                              {customer.complaintsCount > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  {customer.complaintsCount} Tickets
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Zero complaints</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <div className={`inline-flex flex-col items-center px-4 py-1.5 rounded-lg border font-bold text-sm leading-tight ${scoreColor}`}>
                                {customer.churnProbability}%
                                <span className="text-[7px] tracking-wider uppercase font-extrabold opacity-80">{riskLabel}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-right space-x-1.5">
                              <button
                                onClick={() => loadCustomerToPredictor(customer)}
                                title="Run detailed Machine Learning analysis with variables"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <Brain className="h-3 w-3" />
                                ML Predict
                              </button>
                              <button
                                onClick={() => loadCustomerToChatbot(customer)}
                                title="Connect to AI chatbot with live complaints profiling"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <MessageSquare className="h-3 w-3" />
                                AI Chatbot
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: MACHINE LEARNING MULTI-MODEL PREDICTOR --- */}
        {activeTab === 'predictor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="predictor-container">
            {/* Input parameters card */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded">
                  MODEL TESTING SUITE
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Configure Customer Profile</h3>
                <p className="text-xs text-slate-500">
                  Alter parameters to test predictions for Logistic Regression coefficients, Decision Trees logic partitions, or Random Forest ensembling.
                </p>
              </div>

              {/* Form elements */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex justify-between">
                    <span>Algorithm Classifier:</span>
                    <span className="text-indigo-600 underline font-mono cursor-help text-[10px]">What is this?</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleFormChange('modelType', 'LogisticRegression')}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        predForm.modelType === 'LogisticRegression'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Logistic Reg.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormChange('modelType', 'DecisionTree')}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        predForm.modelType === 'DecisionTree'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Decision Tree
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormChange('modelType', 'RandomForest')}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        predForm.modelType === 'RandomForest'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Random Forest
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tenure longevity (months)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={predForm.tenure}
                      onChange={(e) => handleFormChange('tenure', Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Plan Charges (₹ Rupees/mo)
                    </label>
                    <input
                      type="number"
                      min={199}
                      max={2499}
                      value={predForm.monthlyCharges}
                      onChange={(e) => handleFormChange('monthlyCharges', Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Contract Term
                    </label>
                    <select
                      value={predForm.contractType}
                      onChange={(e) => handleFormChange('contractType', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Month-to-month">Month-to-month</option>
                      <option value="One year">One year (Loyalty)</option>
                      <option value="Two year">Two year (Committed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Internet Bandwidth
                    </label>
                    <select
                      value={predForm.internetService}
                      onChange={(e) => handleFormChange('internetService', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Fiber Optic">Fiber Optic (100+ Mbps)</option>
                      <option value="DSL">DSL Broadband (Economic)</option>
                      <option value="No">No Internet Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 col-span-2">
                      Technical support backup
                    </label>
                    <select
                      value={predForm.techSupport}
                      onChange={(e) => handleFormChange('techSupport', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Yes">Yes, support is Active</option>
                      <option value="No">No support subscribed</option>
                      <option value="No internet">No Internet link active</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Paperless e-billing
                    </label>
                    <select
                      value={predForm.paperlessBilling}
                      onChange={(e) => handleFormChange('paperlessBilling', e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Yes">Yes (Email Receipt)</option>
                      <option value="No">No (Mailed paper bill)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    System Payment gateway type
                  </label>
                  <select
                    value={predForm.paymentMethod}
                    onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Electronic check">Electronic Check verification (Manual)</option>
                    <option value="Mailed check">Mailed Physical Check (Manual)</option>
                    <option value="Bank transfer">Bank Auto-debit Transfer (Auto-pay)</option>
                    <option value="Credit card">Credit Card integration (Auto-pay)</option>
                  </select>
                </div>
              </div>

              {/* Automatic pricing visual */}
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-xs flex justify-between items-center text-slate-500">
                <div>
                  <p className="font-semibold">Calculated Total Lifetime Spend:</p>
                  <p className="font-mono text-slate-400">Tenure ({predForm.tenure}) × Monthly billings (₹{predForm.monthlyCharges})</p>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-slate-900 text-base">₹{(predForm.tenure * predForm.monthlyCharges).toLocaleString()}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Indian Currency</span>
                </div>
              </div>
            </div>

            {/* Prediction Outcomes section */}
            <div className="lg:col-span-7 space-y-6">
              {predictionResult && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  {/* Results probability gauge card */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                    {/* Ring score circular visual */}
                    <div className="relative h-28 w-28 flex items-center justify-center rounded-full bg-slate-50 shadow-xs border border-slate-100">
                      <svg className="absolute inset-0 h-full w-full rotate-270">
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="#e2e8f0"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke={predictionResult.probability > 70 ? '#f43f5e' : (predictionResult.probability > 30 ? '#fbbf24' : '#10b981')}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="289"
                          strokeDashoffset={289 - (289 * predictionResult.probability) / 100}
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-2xl font-black text-slate-900 block font-mono">{predictionResult.probability}%</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">RISK LEVEL</span>
                      </div>
                    </div>

                    <div className="text-center sm:text-left space-y-1.5 flex-1">
                      <span className={`text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border leading-none ${
                        predictionResult.prediction === 'Churn'
                          ? 'text-rose-700 bg-rose-50 border-rose-100'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-100'
                      }`}>
                        PREDICTED STATUS: {predictionResult.prediction === 'Churn' ? 'HIGH RISK OF CHURN' : 'HIGH LIKELIHOOD TO RETAIN'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        Classifier consensus: {predictionResult.prediction === 'Churn' ? "Customer is highly likely to switch to competitors." : "Customer is loyal and safe."}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Evaluated using active mathematical model parameters configured on our micro-node server.
                      </p>
                    </div>
                  </div>

                  {/* MATHEMATICS BLOCK */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      Algorithmic Step-by-Step Mathematical Explanation
                    </h4>

                    {/* Logistic Regression Formula UI */}
                    {predictionResult.modelUsed === 'LogisticRegression' && predictionResult.mathDetails && (
                      <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-xs">
                        <div className="border-b border-slate-800 pb-2">
                          <p className="text-[10px] text-slate-400">Logistic Coefficient Estimation (Probability equation):</p>
                          <p className="text-indigo-400 font-bold mt-1">P(Churn) = 1 / (1 + e^-z)</p>
                        </div>
                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto py-1">
                          {predictionResult.mathDetails.regressionFormula}
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 flex justify-between items-center text-[11px]">
                          <span>Calculated log-odds variable (z):</span>
                          <span className="font-bold text-yellow-400">{predictionResult.mathDetails.regressionScore}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          *A positive (z) log-odds leads to &gt;50% churn probability (Sigmoid threshold). Negative (z) maps below 50% risk.
                        </p>
                      </div>
                    )}

                    {/* Decision Tree path list UI */}
                    {predictionResult.modelUsed === 'DecisionTree' && predictionResult.mathDetails?.decisionTreePath && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] text-slate-400 font-bold font-mono">ROOT NODE SPLITTING BREADCRUMB CHAIN:</p>
                        <div className="relative border-l-2 border-slate-200 pl-4 ml-2.5 py-1 space-y-4">
                          {predictionResult.mathDetails.decisionTreePath.map((node, i) => (
                            <div key={i} className="relative">
                              {/* Node indicator dot */}
                              <span className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white shadow-xs ${
                                node.passed ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-400 border-slate-200'
                              }`}>
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{node.condition}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-semibold">
                                  <span>Evaluated:</span>
                                  <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                    node.passed ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' : 'text-slate-700 bg-slate-50 border border-slate-200'
                                  }`}>
                                    {node.passed ? 'True (Passed)' : 'False (Failed)'}
                                  </span>
                                  <span>Risk Change:</span>
                                  <span className={`font-mono font-bold ${node.scoreImpact > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {node.scoreImpact > 0 ? `+${node.scoreImpact}%` : `${node.scoreImpact}%`}
                                  </span>
                                  <span>Current probability state:</span>
                                  <span className="bg-slate-100 px-1 py-0.2 text-slate-800 rounded font-bold font-mono">{node.currentProbability}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Random Forest Consensus Votes UI */}
                    {predictionResult.modelUsed === 'RandomForest' && predictionResult.mathDetails?.forestVotes && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-bold font-mono">Consensus of 5 Random Estimators (Trees) votes:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                          {predictionResult.mathDetails.forestVotes.map((vote, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border text-center space-y-1 ${
                                vote.vote === 'Churn'
                                  ? 'bg-rose-50/50 border-rose-100 text-rose-800'
                                  : 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                              }`}
                            >
                              <span className="text-[9px] block font-extrabold text-slate-400 leading-tight">TREE #{vote.treeId}</span>
                              <span className="text-xs font-black block leading-none">{vote.vote}</span>
                              <span className="text-[10px] font-mono font-bold block">{vote.probability}% Risk</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg text-[11px] text-indigo-800 flex justify-between items-center font-semibold">
                          <span>Arithmetic Forest Mean Probability:</span>
                          <span className="font-mono font-black text-xs text-indigo-900">
                            ({predictionResult.mathDetails.forestVotes.map(t => t.probability).join(' + ')}) / 5 = {predictionResult.probability}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Impact factor analysis cards */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                      Primary Risk Contributors (Feature Importance)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {predictionResult.explanations.map((expl, i) => {
                        let color = "border-slate-100 bg-slate-50 text-slate-700";
                        if (expl.impact === 'High Risk') {
                          color = "border-rose-100 bg-rose-50/20 text-rose-900";
                        } else if (expl.impact === 'Strongly Reducing Risk' || expl.impact === 'Reducing Risk') {
                          color = "border-emerald-100 bg-emerald-50/20 text-emerald-900";
                        }

                        return (
                          <div key={i} className={`p-3 rounded-xl border space-y-1 ${color}`}>
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-xs">{expl.factor}</p>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                                expl.impact === 'High Risk'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {expl.impact}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-tight">{expl.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action suggestions block */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      AUTOMATED RETENTION PLAY REMEDY SUGGESTION
                    </h5>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {predictionResult.prediction === 'Churn'
                        ? `This account represents a heavy churn threat. Suggest targeting them with an upgraded loyalty package. Pitch waiving setup charges, or moving the manual Electronic Check plan to auto-debit payments inside a committed 1-Year savings term to cut risk probability instantly.`
                        : `This customer metrics look steady. Continue standard service notifications and avoid over-messaging promotions to sustain their current high retention commitment pattern.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: RETENTION AI CHATBOT WITH SENTIMENT METRICS --- */}
        {activeTab === 'chatbot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="chatbot-container">
            {/* Customer selection pane */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded">
                  CHAT EMULATOR
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">Active Support Targets</h3>
                <p className="text-xs text-slate-500">
                  Select a registered customer plan profile with complaints to evaluate sentiment in real-time.
                </p>
              </div>

              {/* Customer quick selector list */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                {customers.map((c) => {
                  const isTarget = c.id === activeChatCustomerId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChatCustomerId(c.id);
                        if (!chatHistory[c.id]) {
                          setChatHistory(prev => ({
                            ...prev,
                            [c.id]: [
                              { sender: 'bot', text: `Hello ${c.name}, thank you for holding. We value your ₹${c.monthlyCharges}/mo ${c.internetService} connection and want you to remain satisfied. What feedback or issues are you facing?`, timestamp: "12:00 PM" }
                            ]
                          }));
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isTarget
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0 pr-1">
                        <p className="font-bold text-xs text-slate-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">₹{c.monthlyCharges}/mo • {c.contractType}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wider leading-none uppercase ${
                          c.churnProbability > 70
                            ? 'text-rose-700 bg-rose-50 border border-rose-100 animate-pulse'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                        }`}>
                          {c.churnProbability}% Risk
                        </span>
                        {c.complaintsCount > 0 && (
                          <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 rounded">
                            {c.complaintsCount} logged
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Sentiment telemetry diagnostics */}
              {activeChatCustomer && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3 text-emerald-500" />
                    LIVE TELEMETRY LOGS
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[9px] block text-slate-400 font-bold uppercase">LAST SENTIMENT</span>
                      <span className="text-xs font-bold text-slate-800">
                        {(() => {
                          const history = chatHistory[activeChatCustomer.id] || [];
                          const lastBot = [...history].reverse().find(m => m.sender === 'bot' && m.sentiment);
                          return lastBot?.sentiment || "Pending dialogue";
                        })()}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[9px] block text-slate-400 font-bold uppercase">DISSATISFACTION</span>
                      <span className="text-xs font-bold text-slate-800">
                        {(() => {
                          const history = chatHistory[activeChatCustomer.id] || [];
                          const lastBot = [...history].reverse().find(m => m.sender === 'bot' && typeof m.dissatisfaction === 'number');
                          return lastBot ? `${lastBot.dissatisfaction}%` : "0%";
                        })()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] block text-slate-400 font-bold uppercase mb-1">COMPLAINT TOPIC</span>
                    <p className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      {(() => {
                        const history = chatHistory[activeChatCustomer.id] || [];
                        const lastBot = [...history].reverse().find(m => m.sender === 'bot' && m.category);
                        return lastBot?.category || "Awaiting grievance";
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Chat console window */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
              {/* Chat head summary */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {activeChatCustomer?.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{activeChatCustomer?.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Plan Rate: ₹{activeChatCustomer?.monthlyCharges}/month fiber ({activeChatCustomer?.contractType})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Active Session ID: {activeChatCustomer?.id}
                  </span>
                </div>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {(chatHistory[activeChatCustomer?.id] || []).map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeSlideIn`}
                    >
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs space-y-1 shadow-2xs ${
                        isUser
                          ? 'bg-slate-900 text-slate-100 rounded-br-none'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        <div className="flex items-center justify-between gap-4 text-[9px] opacity-75">
                          <span className="font-mono">{msg.timestamp}</span>
                          {!isUser && msg.sentiment && (
                            <span className="font-extrabold uppercase bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded-xs border border-emerald-100">
                              Sentiment: {msg.sentiment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-xl rounded-bl-none px-4 py-3 text-xs text-slate-400 italic flex items-center gap-2 shadow-2xs">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                      AI specialist analyzing client tone and drafting retention program...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat text box input */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  required
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type customer grievance text (e.g. 'broadband drops every night', 'my price tier looks expensive...')"
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 select-none cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  Send Feedback
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 4: RETENTION PLAYBOOK & DIALOGUE LOGS --- */}
        {activeTab === 'playbook' && (
          <div className="space-y-8 animate-fadeIn" id="playbook-container">
            {/* Playbook rules cards */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded">
                  TACTICAL COMPENDIUM
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Active Retention Strategy Playbook</h3>
                <p className="text-xs text-slate-500">
                  Standard business remediation routines configured based on customer complaints and sentiment metrics (Objective 4).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RETENTION_PLAYBOOK.map((item, index) => (
                  <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold uppercase px-2 py-0.5 rounded">
                        Strategy #{index + 1}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        {item.expectedImpact}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-800">{item.situation}</h4>
                      <p className="text-[10px] text-indigo-600 font-bold">{item.strategy}</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audited sentiment feedback dialogues captured */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Audited Feedback logs (Sentiment extraction pipeline)</h4>
                  <p className="text-[11px] text-slate-500">
                    Dialogue transactions catalog and structured retention directives identified at the router helpdesk.
                  </p>
                </div>
                <span className="text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded text-slate-600 font-mono">
                  {feedbackLogs.length} entries captured
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-5">ID & Lead ID</th>
                      <th className="py-3 px-5">Captured Feedback statement</th>
                      <th className="py-3 px-5">Tone analysis</th>
                      <th className="py-3 px-5">Severity Level</th>
                      <th className="py-3 px-5">Topic Topic</th>
                      <th className="py-3 px-5">Prescribed Retentive Remedy Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {feedbackLogs.map((log) => {
                      let sentBadge = "text-slate-600 bg-slate-50";
                      if (log.sentiment === "Negative") sentBadge = "text-rose-700 bg-rose-50 border-rose-100";
                      else if (log.sentiment === "Positive") sentBadge = "text-emerald-700 bg-emerald-50 border-emerald-100";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <p className="font-bold text-slate-900">{log.customerName}</p>
                            <span className="font-mono text-[9px] text-slate-400">{log.id} • {log.timestamp}</span>
                          </td>
                          <td className="py-3.5 px-5 max-w-sm">
                            <p className="font-medium text-slate-700 italic">"{log.message}"</p>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] border ${sentBadge}`}>
                              {log.sentiment}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                            {log.dissatisfactionLevel}% dissatisfaction
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-600 text-[10px] uppercase">
                            {log.category}
                          </td>
                          <td className="py-3.5 px-5">
                            <p className="text-xs font-semibold text-slate-800">{log.recommendation}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Page Footer --- */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm">Churn Prediction Engine</h5>
            <p className="text-xs leading-relaxed max-w-xs">
              Bharat Fiber & Telecom systems analytics suite designed to intercept potential customer closures at an early stage utilizing Machine Learning classifiers and interactive AI assistants.
            </p>
          </div>
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm">Scientific Framework</h5>
            <ul className="text-xs space-y-1.5 font-mono">
              <li>• Logistic Regression Probability models</li>
              <li>• Sequential criterion decision trees</li>
              <li>• Consensual Forest bootstrapped estimators</li>
              <li>• Generative sentiment feedback analyzers</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm">Operation Parameters</h5>
            <p className="text-xs">
              System running on standard loop port <code className="bg-slate-800 text-indigo-400 px-1 py-0.5 rounded font-bold">3000</code>. Money calculated and denominated in Indian Rupees (₹) to support localized campaigns.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Copyright © 2026-2027 Bharat Telecom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
