import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export const useBudgets = (user) => {
  const [budgets, setBudgets] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateBudgetProgress = useCallback((budget, category) => {
    const spentAmount = category.total_spent || 0;
    const budgetAmount = budget.budget_amount || 0;
    
    if (budgetAmount === 0) {
      return {
        budget_id: budget.id,
        category_name: category.name,
        budget_amount: budgetAmount,
        spent_amount: spentAmount,
        remaining_amount: 0,
        progress_percentage: 0,
        is_over_budget: false,
        alert_level: 'safe',
        budget_type: budget.budget_type
      };
    }
    
    const progressPercentage = (spentAmount / budgetAmount) * 100;
    const remainingAmount = Math.max(budgetAmount - spentAmount, 0);
    const isOverBudget = spentAmount > budgetAmount;
    
    let alertLevel = 'safe';
    if (progressPercentage >= 90) {
      alertLevel = 'critical';
    } else if (progressPercentage >= 80) {
      alertLevel = 'warning';
    } else if (progressPercentage >= 60) {
      alertLevel = 'info';
    }
    
    return {
      budget_id: budget.id,
      category_name: category.name,
      budget_amount: budgetAmount,
      spent_amount: spentAmount,
      remaining_amount: remainingAmount,
      progress_percentage: progressPercentage,
      is_over_budget: isOverBudget,
      alert_level: alertLevel,
      budget_type: budget.budget_type
    };
  }, []);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch budgets with category information
      const { data: budgetData, error: budgetError } = await supabase 
        .from('budgets') 
        .select(`
          *,
          categories (
            id,
            name,
            total_spent
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at');
      
      if (budgetError) {
        throw budgetError;
      }

      setBudgets(budgetData || []);

      // Calculate budget progress for each budget
      const progressData = (budgetData || []).map(budget => {
        if (budget.categories) {
          return calculateBudgetProgress(budget, budget.categories);
        }
        return null;
      }).filter(Boolean);

      setBudgetProgress(progressData);
    } catch (err) {
      setError("Could not fetch budgets from the database.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateBudgetProgress]);

  const updateBudget = async (budgetId, budgetAmount) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ 
          budget_amount: budgetAmount,
          budget_type: 'monthly',
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }
      
      await fetchBudgets();
    } catch (err) {
      throw new Error(`Could not update budget: ${err.message}`);
    }
  };

  const createBudget = async (categoryId, budgetAmount) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const { error: insertError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          budget_amount: budgetAmount,
          budget_type: 'monthly',
          start_date: new Date().toISOString().split('T')[0]
        });

      if (insertError) {
        throw insertError;
      }
      
      await fetchBudgets();
    } catch (err) {
      throw new Error(`Could not create budget: ${err.message}`);
    }
  };

  const deleteBudget = async (budgetId) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }
      
      await fetchBudgets();
    } catch (err) {
      throw new Error(`Could not delete budget: ${err.message}`);
    }
  };

  const getBudgetAlerts = () => {
    return budgetProgress.filter(progress => 
      progress.alert_level === 'critical' || progress.alert_level === 'warning'
    );
  };

  const getBudgetForCategory = (categoryId) => {
    return budgets.find(budget => budget.category_id === categoryId);
  };

  const getProgressForCategory = (categoryId) => {
    return budgetProgress.find(progress => 
      budgets.find(budget => budget.id === progress.budget_id)?.category_id === categoryId
    );
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user, fetchBudgets]);

  return {
    budgets,
    budgetProgress,
    isLoading,
    error,
    fetchBudgets,
    updateBudget,
    createBudget,
    deleteBudget,
    getBudgetAlerts,
    getBudgetForCategory,
    getProgressForCategory
  };
}; 