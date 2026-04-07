import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const surveyImagesBucket =
  import.meta.env.VITE_SUPABASE_SURVEY_IMAGES_BUCKET || 'survey-images';

export const cmsEditorEmail = import.meta.env.VITE_SUPABASE_EDITOR_EMAIL || '';
export const cmsEditorPassword = import.meta.env.VITE_SUPABASE_EDITOR_PASSWORD || '';
