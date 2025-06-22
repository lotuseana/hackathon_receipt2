import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export function useSpendingItems(user) {
  const [error, setError] = useState(null);

  const fetchSpendingItems = useCallback(async (categoryId) => {
    if (!user || !categoryId) return [];

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('spending_items')
        .select('id, item_name, amount, created_at')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching spending items:', err);
      setError(err.message);
      return [];
    }
  }, [user]);

  return { fetchSpendingItems, error };
} 