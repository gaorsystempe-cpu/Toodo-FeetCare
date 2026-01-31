
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scaxvbaandiqafarvkoz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYXh2YmFhbmRpcWFmYXJ2a296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODg4MjIsImV4cCI6MjA4NTQ2NDgyMn0.skAyDUjzXIc-FrFIIs6VlITuI-_9dg-IumXn2vHtWLg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
