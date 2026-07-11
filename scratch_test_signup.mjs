import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/"/g, '');
const supabaseServiceKey = env.split('\n').find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/"/g, '');
const supabaseAnonKey = env.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/"/g, '');

const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false }, realtime: { transport: ws } });
const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false }, realtime: { transport: ws } });

async function run() {
  const email = `test+${Date.now()}@example.com`;
  const password = 'password123';
  
  console.log('1. Signing up', email);
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });
  
  if (signUpError) {
    console.error('Signup error:', signUpError);
    return;
  }
  
  const userId = signUpData.user.id;
  console.log('User signed up. ID:', userId);
  
  console.log('2. Auto-confirming via admin');
  const { data: updateData, error: updateError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true
  });
  
  if (updateError) {
    console.error('Admin update error:', updateError);
    return;
  }
  console.log('Admin update success.');
  
  console.log('3. Trying to sign in');
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) {
    console.error('SignIn error:', signInError);
  } else {
    console.log('SignIn success! Session:', !!signInData.session);
  }
}

run();
