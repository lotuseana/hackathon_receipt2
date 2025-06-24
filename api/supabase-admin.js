import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key, not anon key

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Example: List all users (admin action)
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
