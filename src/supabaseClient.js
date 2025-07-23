// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// URL y key reales de tu proyecto
const supabaseUrl = "https://wncyqrhmcvgssehcufpb.supabase.co";
const supabaseKey = "sb_publishable_bNPVLrCfWUqDh-IxXre5OQ_wT_N05wL";

export const supabase = createClient(supabaseUrl, supabaseKey);
