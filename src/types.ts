export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tenure: number; // months
  monthlyCharges: number; // in ₹ Rupees
  totalCharges: number; // in ₹ Rupees
  contractType: 'Month-to-month' | 'One year' | 'Two year';
  internetService: 'DSL' | 'Fiber Optic' | 'No';
  techSupport: 'Yes' | 'No' | 'No internet';
  paymentMethod: 'Electronic check' | 'Mailed check' | 'Bank transfer' | 'Credit card';
  paperlessBilling: 'Yes' | 'No';
  churnProbability: number; // Initial pre-calculated probability
  complaintsCount: number;
  lastActive: string;
}

export type ModelType = 'LogisticRegression' | 'DecisionTree' | 'RandomForest';

export interface PredictorInput {
  tenure: number;
  monthlyCharges: number;
  contractType: 'Month-to-month' | 'One year' | 'Two year';
  internetService: 'DSL' | 'Fiber Optic' | 'No';
  techSupport: 'Yes' | 'No' | 'No internet';
  paymentMethod: 'Electronic check' | 'Mailed check' | 'Bank transfer' | 'Credit card';
  paperlessBilling: 'Yes' | 'No';
  modelType: ModelType;
}

export interface PredictionExplanation {
  factor: string;
  impact: 'High Risk' | 'Medium Risk' | 'Reducing Risk' | 'Strongly Reducing Risk';
  description: string;
  coefficient?: number;
}

export interface DecisionTreeNode {
  condition: string;
  passed: boolean;
  scoreImpact: number;
  currentProbability: number;
}

export interface ForestTreeVote {
  treeId: number;
  treeName: string;
  vote: 'Churn' | 'Retain';
  probability: number;
  primaryFactor: string;
}

export interface PredictionResult {
  probability: number; // 0 to 100
  prediction: 'Churn' | 'Retain';
  modelUsed: ModelType;
  explanations: PredictionExplanation[];
  mathDetails?: {
    regressionFormula?: string;
    regressionScore?: number;
    decisionTreePath?: DecisionTreeNode[];
    forestVotes?: ForestTreeVote[];
  };
}

export interface FeedbackLog {
  id: string;
  customerId?: string;
  customerName: string;
  message: string;
  reply: string;
  timestamp: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  dissatisfactionLevel: number; // 0 to 100
  category: string;
  recommendation: string;
}

export interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  dissatisfaction?: number;
  category?: string;
}
