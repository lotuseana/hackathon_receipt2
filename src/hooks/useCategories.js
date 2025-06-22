import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const useCategories = (user) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase 
      .from('categories') 
      .select('*') 
      .eq('user_id', user.id)
      .order('name');
    
    if (fetchError) {
      setError("Could not fetch categories from the database.");
      console.error(fetchError);
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  const updateCategoryTotal = async (categoryName, amount) => {
    if (!user) return;
    
    setError(null);
    
    const { data: categoryData, error: fetchError } = await supabase
      .from('categories')
      .select('id, total_spent')
      .eq('user_id', user.id)
      .ilike('name', categoryName)
      .single();

    if (fetchError || !categoryData) {
      throw new Error(`Could not find the category "${categoryName}" in the database.`);
    }

    const newTotal = categoryData.total_spent + amount;

    const { error: updateError } = await supabase
      .from('categories')
      .update({ total_spent: newTotal })
      .eq('id', categoryData.id);

    if (updateError) {
      throw new Error(`Could not update category total: ${updateError.message}`);
    }
    
    await fetchCategories();
  };

  const updateCategoryAmount = async (categoryId, newAmount) => {
    if (!user) return;
    
    setError(null);
    
    if (isNaN(newAmount) || newAmount < 0) {
      throw new Error(`Invalid amount: ${newAmount}`);
    }

    const { error: updateError } = await supabase
      .from('categories')
      .update({ total_spent: newAmount })
      .eq('id', categoryId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Could not update category amount: ${updateError.message}`);
    }
    
    await fetchCategories();
  };

  const resetAllCategories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase
      .from('categories')
      .update({ total_spent: 0 })
      .eq('user_id', user.id);

    if (error) {
      setError("Could not reset category totals.");
      console.error(error);
    } else {
      await fetchCategories();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  return {
    categories,
    isLoading,
    error,
    updateCategoryTotal,
    updateCategoryAmount,
    resetAllCategories,
    fetchCategories
  };
}; 