import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCategories } from './hooks/useCategories';
import { useBudgets } from './hooks/useBudgets';
import { useReceiptProcessing } from './hooks/useReceiptProcessing';
import Header from './components/Header';
import ReceiptUpload from './components/ReceiptUpload';
import SpendingDashboard from './components/SpendingDashboard';
import BudgetManagement from './components/BudgetManagement';
import BudgetAlerts from './components/BudgetAlerts';
import SpendingTips from './components/tips/SpendingTips';
import Auth from './components/auth/Auth';
import './styles/App.css';

function App() {
  const { user, isLoading, signOut, isAuthenticated } = useAuth();
  const { 
    categories, 
    isLoading: categoriesLoading, 
    error: categoriesError, 
    updateCategoryTotal, 
    updateCategoryAmount,
    resetAllCategories 
  } = useCategories(user);
  
  const {
    budgets,
    budgetProgress,
    isLoading: budgetsLoading,
    error: budgetsError,
    updateBudget,
    createBudget,
    deleteBudget,
    getBudgetAlerts,
    fetchBudgets
  } = useBudgets(user);
  
  const {
    selectedFile,
    previewUrl,
    ocrText,
    structuredData,
    isExtracting,
    error: receiptError,
    handleFileSelect,
    handleCapture,
    handleCancel,
    processReceipt,
    setError: setReceiptError
  } = useReceiptProcessing(updateCategoryTotal, fetchBudgets);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spendingTips, setSpendingTips] = useState([]);
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState(null);
  const [tipsGeneratedInitially, setTipsGeneratedInitially] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setSpendingTips([]);
      setDismissedAlerts([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAddManualEntry = async ({ category: categoryName, total: amount }) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      if (!categoryName || !amount) {
        throw new Error("Category and amount are required.");
      }

      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      await updateCategoryTotal(categoryName, amount);
      
      // Refresh budgets to update progress
      await fetchBudgets();

      if (tipsGeneratedInitially) {
        handleGenerateTips();
      }
    } catch (err) {
      console.error(err);
      setReceiptError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (categoryId, newAmount) => {
    try {
      await updateCategoryAmount(categoryId, newAmount);
      // Refresh budgets to update progress
      await fetchBudgets();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleResetCategories = async () => {
    try {
      await resetAllCategories();
      // Refresh budgets to update progress
      await fetchBudgets();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleGenerateTips = async () => {
    if (!user) return;
    
    setIsTipsLoading(true);
    setTipsError(null);
    setSpendingTips([]);

    try {
      const relevantCategories = categories.filter(cat => (cat.total_spent || 0) > 0);

      if (relevantCategories.length === 0) {
        setTipsError("You don't have any spending data to analyze yet!");
        return;
      }

      const prompt = `
        You are a friendly and helpful financial assistant. Based on the following spending data (in JSON format), provide 2-3 short, actionable, and non-judgmental tips to help the user spend smarter. Focus on the categories with the highest spending, but be encouraging. Please return ONLY a valid JSON array of strings, like ["Tip one...", "Tip two..."]. Do not include any other text, markdown formatting, or explanations.

        Spending Data:
        ${JSON.stringify(relevantCategories)}
      `;
      
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      let responseText = msg.content[0].text;
      let tipsData;

      try {
        tipsData = JSON.parse(responseText);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\\[[\\s\\S]*\\]/);
        if (jsonMatch) {
          tipsData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("The AI's response was not in the expected format.");
        }
      }

      if (!Array.isArray(tipsData)) {
          throw new Error("The AI's response was not a valid array of tips.");
      }
      
      setSpendingTips(tipsData);
      setTipsGeneratedInitially(true);

    } catch (err) {
      console.error("Error generating spending tips:", err);
      setTipsError("Sorry, I couldn't generate tips at the moment. Please try again.");
    } finally {
      setIsTipsLoading(false);
    }
  };

  const handleDismissAlert = (alertIndex) => {
    setDismissedAlerts(prev => [...prev, alertIndex]);
  };

  const activeBudgetAlerts = getBudgetAlerts().filter((_, index) => 
    !dismissedAlerts.includes(index)
  );

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="App">
      <Header user={user} onSignOut={handleSignOut} />
      
      {/* Budget Alerts */}
      <BudgetAlerts 
        budgetAlerts={activeBudgetAlerts}
        onDismiss={handleDismissAlert}
      />
      
      <div className="content-row">
        <ReceiptUpload
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          ocrText={ocrText}
          structuredData={structuredData}
          isExtracting={isExtracting}
          error={receiptError || categoriesError || budgetsError}
          onFileSelect={handleFileSelect}
          onCapture={handleCapture}
          onCancel={handleCancel}
          onProcessReceipt={processReceipt}
          categories={categories}
          onAddManualEntry={handleAddManualEntry}
          isSubmitting={isSubmitting}
        />
        
        <SpendingDashboard
          categories={categories}
          isResetting={categoriesLoading}
          onReset={handleResetCategories}
          onUpdateCategory={handleUpdateCategory}
          budgets={budgets}
          budgetProgress={budgetProgress}
        />
        
        <div className="right-column">
          <BudgetManagement
            categories={categories}
            budgets={budgets}
            budgetProgress={budgetProgress}
            onUpdateBudget={updateBudget}
            onCreateBudget={createBudget}
            onDeleteBudget={deleteBudget}
            isLoading={budgetsLoading}
          />
          
          <SpendingTips 
            tips={spendingTips}
            onGenerate={handleGenerateTips}
            isLoading={isTipsLoading}
            error={tipsError}
          />
        </div>
      </div>
    </div>
  );
}

export default App;