import { PredictorInput, PredictionResult, PredictionExplanation, DecisionTreeNode, ForestTreeVote, ModelType } from './types';

// Sigmoid function helper
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function runChurnPrediction(input: PredictorInput): PredictionResult {
  const { tenure, monthlyCharges, contractType, internetService, techSupport, paymentMethod, paperlessBilling, modelType } = input;

  if (modelType === 'LogisticRegression') {
    return predictLogisticRegression(input);
  } else if (modelType === 'DecisionTree') {
    return predictDecisionTree(input);
  } else {
    return predictRandomForest(input);
  }
}

// 1. Logistic Regression Model
function predictLogisticRegression(input: PredictorInput): PredictionResult {
  const { tenure, monthlyCharges, contractType, internetService, techSupport, paymentMethod, paperlessBilling } = input;

  // Define coefficients mathematically
  const INTERCEPT = 1.25;
  const W_TENURE = -0.065; // Each month reduces log-odds
  const W_CHARGES = 0.0006; // High charges slightly increase log-odds
  const W_M2M = 1.35; // Month-to-month contract increases danger
  const W_ONE_YEAR = -0.75; // One year contract decreases risk
  const W_TWO_YEAR = -1.95; // Two year contract decreases risk strongly
  const W_FIBER = 0.55; // Fiber optic users have higher expectation/churn
  const W_DSL = -0.15;
  const W_TECH_SUPPORT = -0.65; // Receiving tech support reduces risk
  const W_E_CHECK = 0.60; // Electronic check payment increases churn
  const W_AUTO_PAY = -0.80; // Auto pays decrease risk
  const W_PAPERLESS = 0.35; // Paperless billing correlates with active switching

  // Compute log odds
  let z = INTERCEPT;
  z += tenure * W_TENURE;
  z += monthlyCharges * W_CHARGES;

  if (contractType === 'Month-to-month') z += W_M2M;
  else if (contractType === 'One year') z += W_ONE_YEAR;
  else if (contractType === 'Two year') z += W_TWO_YEAR;

  if (internetService === 'Fiber Optic') z += W_FIBER;
  else if (internetService === 'DSL') z += W_DSL;

  if (techSupport === 'Yes') z += W_TECH_SUPPORT;

  if (paymentMethod === 'Electronic check') z += W_E_CHECK;
  else if (paymentMethod === 'Bank transfer' || paymentMethod === 'Credit card') z += W_AUTO_PAY;

  if (paperlessBilling === 'Yes') z += W_PAPERLESS;

  const probability = Math.round(sigmoid(z) * 100);
  const prediction = probability > 50 ? 'Churn' : 'Retain';

  // Construct mathematical formula expression
  const formula = `z = ${INTERCEPT.toFixed(2)} + (${W_TENURE})×(Tenure: ${tenure}) + (${W_CHARGES.toFixed(4)})×(Charges: ${monthlyCharges}) + [ContractCoef] + [ServiceCoef] + [SupportCoef] + [PaymentCoef] + [PaperlessCoef]`;

  // Dynamic factors list
  const explanations: PredictionExplanation[] = [];

  // Contract analysis
  if (contractType === 'Month-to-month') {
    explanations.push({
      factor: "Month-to-Month Contract",
      impact: "High Risk",
      description: `Short-term rolls offer zero friction. Adds +${W_M2M} to risk score.`,
      coefficient: W_M2M
    });
  } else {
    const val = contractType === 'One year' ? W_ONE_YEAR : W_TWO_YEAR;
    explanations.push({
      factor: `${contractType} Contract`,
      impact: "Strongly Reducing Risk",
      description: `Fixed-term commitments represent high customer loyalty. Deducts ${Math.abs(val)} from risk.`,
      coefficient: val
    });
  }

  // Tenure analysis
  const tenureImpactValue = tenure * W_TENURE;
  if (tenure < 6) {
    explanations.push({
      factor: `Very Short Tenure (${tenure} mo)`,
      impact: "High Risk",
      description: `New customers in their first 6 months have low brand attachment. Tenure log-odds change: ${tenureImpactValue.toFixed(2)}.`,
      coefficient: W_TENURE
    });
  } else if (tenure > 24) {
    explanations.push({
      factor: `Long Tenure (${tenure} mo)`,
      impact: "Strongly Reducing Risk",
      description: `Vested customer with high history of satisfaction. Deducts ${Math.abs(tenureImpactValue).toFixed(2)} from risk score.`,
      coefficient: W_TENURE
    });
  } else {
    explanations.push({
      factor: `Medium Tenure (${tenure} mo)`,
      impact: "Reducing Risk",
      description: `Stabilized contract history. Deducts ${Math.abs(tenureImpactValue).toFixed(2)} from risk score.`,
      coefficient: W_TENURE
    });
  }

  // Monthly charges analysis
  const chargeImpactValue = monthlyCharges * W_CHARGES;
  if (monthlyCharges > 1000) {
    explanations.push({
      factor: `High Billing (₹${monthlyCharges}/mo)`,
      impact: "High Risk",
      description: `Heavy financial burden increases sensitivity to cheaper competitors. Adds +${chargeImpactValue.toFixed(2)} to risk score.`,
      coefficient: W_CHARGES
    });
  } else {
    explanations.push({
      factor: `Affordable Billing (₹${monthlyCharges}/mo)`,
      impact: "Reducing Risk",
      description: `Low financial friction lowers switching motivation. Adds +${chargeImpactValue.toFixed(2)} to score.`,
      coefficient: W_CHARGES
    });
  }

  // Tech support analysis
  if (techSupport === 'Yes') {
    explanations.push({
      factor: "Subscribed Tech Support",
      impact: "Reducing Risk",
      description: `Interactions with helper technicians tie users to services. Deducts ${Math.abs(W_TECH_SUPPORT)} from risk.`,
      coefficient: W_TECH_SUPPORT
    });
  } else if (techSupport === 'No' && internetService !== 'No') {
    explanations.push({
      factor: "No Technical Support",
      impact: "High Risk",
      description: `Self-operating clients who face unresolved network troubles often churn.`,
      coefficient: 0
    });
  }

  // Payment channel analysis
  if (paymentMethod === 'Electronic check') {
    explanations.push({
      factor: "Manual Electronic Checks",
      impact: "High Risk",
      description: `Requires active monthly logins to pay. Highly correlates with service re-evaluations. Adds +${W_E_CHECK}.`,
      coefficient: W_E_CHECK
    });
  } else if (paymentMethod === 'Bank transfer' || paymentMethod === 'Credit card') {
    explanations.push({
      factor: "Automated Payments",
      impact: "Strongly Reducing Risk",
      description: `Direct seamless autopay setups eliminate billing roadblocks. Deducts ${Math.abs(W_AUTO_PAY)} from risk.`,
      coefficient: W_AUTO_PAY
    });
  }

  return {
    probability,
    prediction,
    modelUsed: 'LogisticRegression',
    explanations,
    mathDetails: {
      regressionFormula: formula,
      regressionScore: Number(z.toFixed(3))
    }
  };
}

// 2. Decision Tree Model
function predictDecisionTree(input: PredictorInput): PredictionResult {
  const { tenure, monthlyCharges, contractType, internetService, techSupport, paymentMethod, paperlessBilling } = input;

  const path: DecisionTreeNode[] = [];
  let prob = 50; // Start at pre-split root node 50% probability

  // Level 1 split: Contract Type
  if (contractType === 'Month-to-month') {
    prob += 20;
    path.push({
      condition: "Contract Type == Month-to-month?",
      passed: true,
      scoreImpact: +20,
      currentProbability: prob
    });

    // Level 2 split: Tenure
    if (tenure < 12) {
      prob += 15;
      path.push({
        condition: "Tenure < 12 months?",
        passed: true,
        scoreImpact: +15,
        currentProbability: prob
      });

      // Level 3 split: Monthly Charges
      if (monthlyCharges > 900) {
        prob += 10;
        path.push({
          condition: "Monthly Charges > ₹900?",
          passed: true,
          scoreImpact: +10,
          currentProbability: prob
        });
      } else {
        prob -= 15;
        path.push({
          condition: "Monthly Charges > ₹900?",
          passed: false,
          scoreImpact: -15,
          currentProbability: prob
        });
      }
    } else {
      prob -= 15;
      path.push({
        condition: "Tenure < 12 months?",
        passed: false,
        scoreImpact: -15,
        currentProbability: prob
      });

      // Level 3 split: Tech support
      if (techSupport === 'Yes') {
        prob -= 20;
        path.push({
          condition: "Tech Support subscribed?",
          passed: true,
          scoreImpact: -20,
          currentProbability: prob
        });
      } else {
        prob += 10;
        path.push({
          condition: "Tech Support subscribed?",
          passed: false,
          scoreImpact: +10,
          currentProbability: prob
        });
      }
    }
  } else {
    // One or Two Year contract
    prob -= 25;
    path.push({
      condition: "Contract Type == Month-to-month?",
      passed: false,
      scoreImpact: -25,
      currentProbability: prob
    });

    // Level 2: Tenure
    if (tenure >= 36) {
      prob -= 15;
      path.push({
        condition: "Tenure >= 36 months?",
        passed: true,
        scoreImpact: -15,
        currentProbability: prob
      });
    } else {
      prob += 5;
      path.push({
        condition: "Tenure >= 36 months?",
        passed: false,
        scoreImpact: +5,
        currentProbability: prob
      });
    }

    // Level 3: Billing AutoPay
    if (paymentMethod === 'Bank transfer' || paymentMethod === 'Credit card') {
      prob -= 5;
      path.push({
        condition: "AutoPay set (Bank/Card)?",
        passed: true,
        scoreImpact: -5,
        currentProbability: prob
      });
    } else {
      prob += 5;
      path.push({
        condition: "AutoPay set (Bank/Card)?",
        passed: false,
        scoreImpact: +5,
        currentProbability: prob
      });
    }
  }

  // Ensure bounds
  const probability = Math.max(2, Math.min(98, prob));
  const prediction = probability > 50 ? 'Churn' : 'Retain';

  // Format dynamic explanations based on leaf outcome
  const explanations: PredictionExplanation[] = path.map(node => {
    const isGood = node.scoreImpact < 0;
    return {
      factor: node.condition.replace('?', ''),
      impact: isGood ? "Reducing Risk" : "High Risk",
      description: `Splitting condition evaluated as ${node.passed ? 'TRUE' : 'FALSE'}, changing current node risk by ${node.scoreImpact > 0 ? '+' : ''}${node.scoreImpact}%.`
    };
  });

  return {
    probability,
    prediction,
    modelUsed: 'DecisionTree',
    explanations,
    mathDetails: {
      decisionTreePath: path
    }
  };
}

// 3. Random Forest Model
function predictRandomForest(input: PredictorInput): PredictionResult {
  const { tenure, monthlyCharges, contractType, internetService, techSupport, paymentMethod, paperlessBilling } = input;

  // We bootstrap 5 trees with diverse focus subsets
  const votes: ForestTreeVote[] = [
    // Tree 1 focus: Contract & Tenure
    {
      treeId: 1,
      treeName: "Tree 1 (Contract & Tenure Commitments)",
      vote: contractType === 'Month-to-month' && tenure <= 10 ? 'Churn' : 'Retain',
      probability: contractType === 'Month-to-month' ? (tenure <= 10 ? 88 : 55) : 12,
      primaryFactor: `Contract Type is '${contractType}', tenure is ${tenure} months.`
    },
    // Tree 2 focus: Financial Charges & Plan Rates
    {
      treeId: 2,
      treeName: "Tree 2 (Financial Charges & Bill Level)",
      vote: monthlyCharges > 1100 ? 'Churn' : 'Retain',
      probability: monthlyCharges > 1100 ? 76 : 30,
      primaryFactor: `Monthly billing is ${monthlyCharges > 1100 ? 'High' : 'Affordable'} (₹${monthlyCharges}).`
    },
    // Tree 3 focus: Service Support & Tech Care
    {
      treeId: 3,
      treeName: "Tree 3 (Customer Support & Care Setup)",
      vote: techSupport === 'No' && internetService === 'Fiber Optic' ? 'Churn' : 'Retain',
      probability: techSupport === 'No' && internetService === 'Fiber Optic' ? 70 : 25,
      primaryFactor: `Has Support = '${techSupport}' with internet type '${internetService}'.`
    },
    // Tree 4 focus: Payment Auto debit & Invoices
    {
      treeId: 4,
      treeName: "Tree 4 (Billing Methods & Auto Debit)",
      vote: paymentMethod === 'Electronic check' && paperlessBilling === 'Yes' ? 'Churn' : 'Retain',
      probability: paymentMethod === 'Electronic check' && paperlessBilling === 'Yes' ? 82 : 35,
      primaryFactor: `Invoice is via Manual Electronic Checks with active Electronic bills.`
    },
    // Tree 5 focus: Composite Account Duration Risk
    {
      treeId: 5,
      treeName: "Tree 5 (Composite Brand Loyalty)",
      vote: tenure < 6 ? 'Churn' : 'Retain',
      probability: tenure < 6 ? 85 : (tenure > 30 ? 10 : 42),
      primaryFactor: `Tenure longevity assessment (${tenure} months).`
    }
  ];

  // Random Forest calculates the average prediction probability across all estimators
  const avgProb = Math.round(votes.reduce((acc, v) => acc + v.probability, 0) / votes.length);
  const prediction = avgProb > 50 ? 'Churn' : 'Retain';

  // Aggregate Explanations
  const explanations: PredictionExplanation[] = [
    {
      factor: "Random Forest Ensemble Decision",
      impact: prediction === "Churn" ? "High Risk" : "Strongly Reducing Risk",
      description: `Calculated from the consensus of 5 bootstrap estimators. Churn probability average is ${avgProb}% (${votes.filter(t => t.vote === 'Churn').length} of 5 estimators voted Churn).`
    }
  ];

  // Add individual tree behaviors
  votes.forEach((tree, idx) => {
    explanations.push({
      factor: `Estimator #${tree.treeId} (${tree.vote} Vote)`,
      impact: tree.vote === 'Churn' ? "High Risk" : "Reducing Risk",
      description: `${tree.treeName} predicted ${tree.vote} (${tree.probability}% risk) based on: ${tree.primaryFactor}`
    });
  });

  return {
    probability: avgProb,
    prediction,
    modelUsed: 'RandomForest',
    explanations,
    mathDetails: {
      forestVotes: votes
    }
  };
}
