import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCategories } from './hooks/useCategories';
import { useBudgets } from './hooks/useBudgets';
import { useReceiptProcessing } from './hooks/useReceiptProcessing';
import { useSpendingItems } from './hooks/useSpendingItems';
import Header from './components/Header';
import ReceiptUpload from './components/ReceiptUpload';
import SpendingDashboard from './components/SpendingDashboard';
import BudgetManagement from './components/BudgetManagement';
import Auth from './components/auth/Auth';
import SideMenu from './components/SideMenu';
import Mascot from './components/Mascot';
import './styles/App.css';

function App() {
  const { user, isLoading, signOut, isAuthenticated } = useAuth();
  const { 
    categories, 
    isLoading: categoriesLoading, 
    error: categoriesError, 
    addSpendingItem,
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
    fetchBudgets
  } = useBudgets(user);
  
  const { fetchAllSpendingItems, fetchSpendingItems } = useSpendingItems(user);

  const handleReceiptProcessed = async (newReceiptItems) => {
    setMascotLoading(true);
    try {
      const allEntries = await fetchAllSpendingItems();
      const tip = await getSmartTip(allEntries, newReceiptItems);
      setMascotTip(tip);
    } catch (err) {
      setMascotTip('Budgie could not fetch a tip this time.');
    } finally {
      setMascotLoading(false);
    }
  };

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
  } = useReceiptProcessing(addSpendingItem, fetchBudgets, categories, handleReceiptProcessed);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBudgetMenuOpen, setBudgetMenuOpen] = useState(false);
  const [mascotTip, setMascotTip] = useState('');
  const [mascotLoading, setMascotLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      handleCancel();
      await signOut();
      setBudgetMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getSmartTip = async (allEntries, newEntryOrEntries) => {
    let prompt;
    if (Array.isArray(newEntryOrEntries)) {
      prompt = `You are Budgie, a friendly bird mascot for a budgeting app. Give concise, friendly, and actionable budgeting tips in a warm but succinct tone. Use at most one emoji per tip, and keep the tip short and to the point. Given the user's full spending history (as an array of entries) and the most recent receipt upload (as an array of new items), provide a positive budgeting tip or insight. Focus on helping the user spend smarter, spot trends, or stay motivated. Do not repeat previous tips. Return only the tip, no extra text or formatting.\n\nAll Entries: ${JSON.stringify(allEntries)}\nNew Receipt Items: ${JSON.stringify(newEntryOrEntries)}`;
    } else {
      prompt = `You are Budgie, a friendly bird mascot for a budgeting app. Give concise, friendly, and actionable budgeting tips in a warm but succinct tone. Use at most one emoji per tip, and keep the tip short and to the point. Given the user's full spending history (as an array of entries) and the most recent new entry, provide a positive budgeting tip or insight. Focus on helping the user spend smarter, spot trends, or stay motivated. Do not repeat previous tips. Return only the tip, no extra text or formatting.\n\nAll Entries: ${JSON.stringify(allEntries)}\nNew Entry: ${JSON.stringify(newEntryOrEntries)}`;
    }
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    console.log('Anthropic API response:', data);
    console.log('Extracted tip:', data.tip);
    return data.tip || '';
  };

  const handleAddManualEntry = async ({ category: categoryName, total: amount, name: itemName }) => {
    if (!user) return;
    setIsSubmitting(true);
    setMascotLoading(true);
    try {
      if (!categoryName || !amount || !itemName) {
        throw new Error("Category, amount, and item name are required.");
      }
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }
      await addSpendingItem({ categoryName, amount, itemName });
      await fetchBudgets();
      const allEntries = await fetchAllSpendingItems();
      const newEntry = { item_name: itemName, amount, categoryName };
      const tip = await getSmartTip(allEntries, newEntry);
      setMascotTip(tip);
    } catch (err) {
      console.error(err);
      setReceiptError(err.message);
    } finally {
      setIsSubmitting(false);
      setMascotLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId, newAmount, adjustment) => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      const currentAmount = category ? category.total_spent || 0 : 0;
      const adj = adjustment !== undefined ? adjustment : newAmount - currentAmount;
      await updateCategoryAmount(categoryId, newAmount, adj);
      await fetchBudgets();
      if (adj !== 0) {
        setMascotLoading(true);
        const allEntries = await fetchAllSpendingItems();
        const newEntry = { item_name: 'Adjustment', amount: adj, categoryName: category?.name };
        const tip = await getSmartTip(allEntries, newEntry);
        setMascotTip(tip);
        setMascotLoading(false);
      }
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

  // Helper: Get budget progress percentage for a category
  const getBudgetFilledPercentage = (categoryId) => {
    const progress = budgetProgress.find(progress =>
      budgets.find(budget => budget.id === progress.budget_id)?.category_id === categoryId
    );
    return progress ? progress.progress_percentage : 0;
  };

  // Sort categories by budget filled percentage, descending
  const sortedCategories = [...categories].sort((a, b) => {
    return getBudgetFilledPercentage(b.id) - getBudgetFilledPercentage(a.id);
  });

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="App">
      <Header 
        user={user} 
        onSignOut={handleSignOut} 
        onManageBudgets={() => setBudgetMenuOpen(true)}
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
          categories={sortedCategories}
          isResetting={categoriesLoading}
          onReset={handleResetCategories}
          onUpdateCategory={handleUpdateCategory}
          budgets={budgets}
          budgetProgress={budgetProgress}
          fetchSpendingItems={fetchSpendingItems}
        />
      </div>

      <SideMenu isOpen={isBudgetMenuOpen} onClose={() => setBudgetMenuOpen(false)}>
        <BudgetManagement
          categories={sortedCategories}
          budgets={budgets}
          budgetProgress={budgetProgress}
          onUpdateBudget={updateBudget}
          onCreateBudget={createBudget}
          onDeleteBudget={deleteBudget}
          isLoading={budgetsLoading}
        />
      </SideMenu>

      <Mascot tip={mascotLoading ? 'Budgie is thinking...' : mascotTip} visible={true} />
    </div>
  );
}

export default App;