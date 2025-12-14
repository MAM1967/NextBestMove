"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountActivationEmail, sendWelcomeEmail } from "@/lib/email/resend";

async function bootstrapUserProfile(
  userId: string,
  email: string,
  name: string
): Promise<{ error: string | null; isDuplicate: boolean }> {
  const supabase = await createClient();

  // Verify we have the correct user session
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser || currentUser.id !== userId) {
    console.log("Session mismatch:", { 
      expectedUserId: userId, 
      currentUserId: currentUser?.id,
      hasSession: !!currentUser 
    });
    // If session isn't established, it likely means the user already exists
    // (signUp returned existing user but didn't establish session)
    // Check if profile exists - if so, it's a duplicate
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();
    
    if (existingProfile) {
      console.log("Profile exists but no session - treating as duplicate");
      return { error: null, isDuplicate: true };
    }
    
    // No session and no profile - this is a real error
    return { 
      error: "Session not established. Please try signing in instead.", 
      isDuplicate: false 
    };
  }

  // Create user record in users table
  const { error } = await supabase.from("users").insert({
    id: userId,
    email,
    name,
    timezone: "America/New_York", // Default timezone
    streak_count: 0,
    calendar_connected: false,
  });

  if (error) {
    // Log the full error for debugging
    console.log("Bootstrap insert error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error, null, 2)
    });

    // PostgreSQL error codes:
    // 23505 = unique_violation (duplicate key - either primary key or unique constraint)
    // 42501 = insufficient_privilege (RLS policy violation)
    // PGRST301 = PostgREST error (often RLS related)
    // Also check for common duplicate error messages
    const isDuplicateError = 
      error.code === "23505" || 
      error.message?.toLowerCase().includes("duplicate") ||
      error.message?.toLowerCase().includes("already exists") ||
      error.message?.toLowerCase().includes("unique constraint") ||
      error.message?.toLowerCase().includes("violates unique constraint") ||
      error.message?.toLowerCase().includes("violates primary key constraint") ||
      error.details?.toLowerCase().includes("duplicate") ||
      error.details?.toLowerCase().includes("already exists") ||
      error.hint?.toLowerCase().includes("duplicate") ||
      error.hint?.toLowerCase().includes("already exists");

    // Check for RLS/permission errors that might indicate duplicate
    const isRLSError = 
      error.code === "42501" ||
      error.code === "PGRST301" ||
      error.message?.toLowerCase().includes("permission denied") ||
      error.message?.toLowerCase().includes("new row violates row-level security") ||
      error.message?.toLowerCase().includes("policy");

    if (isDuplicateError) {
      // This is a duplicate (either email or user ID)
      console.log("Detected as duplicate based on error:", error.code, error.message);
      return { error: null, isDuplicate: true };
    }

    // If it's an RLS error, it might be because the user already exists
    // but the session doesn't match (duplicate case)
    if (isRLSError) {
      console.log("RLS error detected - might be duplicate:", error.code, error.message);
      // Check if user profile exists
      const { data: checkProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (checkProfile) {
        console.log("Profile exists - treating RLS error as duplicate");
        return { error: null, isDuplicate: true };
      }
    }

    // Other errors are real problems
    console.log("Not a duplicate - real error:", error.code, error.message);
    return { error: error.message, isDuplicate: false };
  }

  return { error: null, isDuplicate: false };
}

export async function signUpAction(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  // Check if a user with this email already exists in the users table
  // This catches duplicates before attempting signUp
  const { data: existingUser, error: checkError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  console.log("Pre-signUp duplicate check:", { 
    email: email.toLowerCase().trim(), 
    existingUser, 
    checkError: checkError?.message 
  });

  if (existingUser) {
    // User already exists - this is a duplicate sign-up attempt
    console.log("Duplicate detected before signUp:", existingUser);
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  // Also try to sign in to check if account exists in auth.users
  // This catches the case where user exists in auth.users but not in users table
  const { error: preSignInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!preSignInError) {
    // Account exists and password works - it's a duplicate
    // Sign out immediately since we don't want to sign them in
    await supabase.auth.signOut();
    console.log("Duplicate detected: can sign in before signUp");
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  // Get base URL for email redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.NODE_ENV === "production" ? "https://nextbestmove.app" : "http://localhost:3000");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      // Set emailRedirectTo to customize the confirmation link
      // Note: This doesn't prevent Supabase from sending its default email
      // To fully disable Supabase emails, disable "Enable email confirmations" 
      // in Supabase Dashboard > Authentication > Settings
      emailRedirectTo: `${baseUrl}/auth/sign-in`,
    },
  });

  // Log for debugging
  console.log("SignUp result:", { 
    hasError: !!error, 
    hasUser: !!data?.user, 
    errorMessage: error?.message,
    userEmail: data?.user?.email,
    userId: data?.user?.id,
    userCreatedAt: data?.user?.created_at,
    userConfirmedAt: data?.user?.confirmed_at
  });

  if (error) {
    // Handle different error types
    let errorMessage = error.message;
    
    // Check for common Supabase auth errors
    if (error.message.includes("already registered") || 
        error.message.includes("User already registered") ||
        error.message.includes("email address is already") ||
        error.message.includes("already been registered")) {
      errorMessage = "An account with this email already exists. Please sign in instead.";
    }
    
    return { error: errorMessage };
  }

  // Check if user was actually created
  // Supabase might return success but no user if:
  // 1. Email confirmation is required (user is created but unconfirmed)
  // 2. Duplicate email (depending on configuration)
  if (!data?.user) {
    // Try to sign in with the provided password to check if account exists
    const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!signInError && signInData?.user) {
      // Account exists and password works - it's a duplicate
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    
    // If sign-in fails, the account might not exist, but signUp also didn't create one
    // This could be due to email confirmation requirements or other config
    return { error: "Failed to create account. The email may already be registered. Please try signing in, or check your email for a confirmation link if you recently signed up." };
  }

  // Check if this is a new user or an existing user
  // If created_at is more than a few seconds ago, it's likely an existing user
  const userCreatedAt = new Date(data.user.created_at);
  const now = new Date();
  const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;
  
  console.log("User creation check:", {
    userId: data.user.id,
    createdAt: data.user.created_at,
    secondsSinceCreation,
    isNewUser: secondsSinceCreation < 5
  });

  // Verify session is established (required for RLS policy)
  const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
  console.log("Session check:", { 
    sessionUserId: sessionUser?.id, 
    signUpUserId: data.user.id,
    match: sessionUser?.id === data.user.id,
    sessionError: sessionError?.message
  });

  // If session is not established, try to sign in to check if it's a duplicate
  if (!sessionUser || sessionUser.id !== data.user.id) {
    // Try to sign in with the provided credentials
    // If this works, it means the account already exists (duplicate)
    const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!signInError && signInData?.user) {
      // Account exists and password works - it's a duplicate
      // Sign out immediately since we don't want to sign them in
      await supabase.auth.signOut();
      console.log("Duplicate detected: can sign in with provided credentials");
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    
    // If user was created more than 5 seconds ago and we can't sign in,
    // it's likely an existing user (duplicate)
    if (secondsSinceCreation > 5) {
      console.log("User appears to be existing (created >5s ago) - treating as duplicate");
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    
    // For new users, session might not be established yet
    // This can happen if email confirmation is required
    // Try to establish session by signing in with the credentials we just used
    console.log("No session for new user - attempting to establish session");
    const { error: establishSessionError, data: establishSessionData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (establishSessionError) {
      // Can't establish session - this might be a duplicate or email confirmation issue
      console.log("Cannot establish session - might be duplicate or confirmation required");
      // Check if user exists in users table
      const { data: checkUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      
      if (checkUser) {
        return { error: "An account with this email already exists. Please sign in instead." };
      }
      
      // Might need email confirmation
      return { error: "Please check your email to confirm your account before continuing." };
    }
    
    // Session established - verify it matches
    if (establishSessionData?.user?.id !== data.user.id) {
      // Different user - it's a duplicate
      await supabase.auth.signOut();
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    
    console.log("Session established after sign-in");
  }

  // Before bootstrapping, check if user profile already exists by user ID
  // This catches the case where signUp returns an existing user from auth.users
  const { data: existingProfileById } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", data.user.id)
    .single();

  if (existingProfileById) {
    // User profile already exists - this is a duplicate sign-up attempt
    console.log("Duplicate detected: profile exists for user ID:", data.user.id);
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  // Bootstrap user profile
  console.log("Attempting to bootstrap profile for user:", { userId: data.user.id, email, name });
  const profileResult = await bootstrapUserProfile(data.user.id, email, name);
  console.log("Bootstrap result:", profileResult);
  
  if (profileResult.isDuplicate) {
    // Profile already exists - this is a duplicate sign-up attempt
    console.log("Duplicate detected during bootstrap for user ID:", data.user.id);
    return { error: "An account with this email already exists. Please sign in instead." };
  }
  if (profileResult.error) {
    // Profile creation failed
    // If the error is "Session not established", it likely means the user already exists
    // Try to sign in to verify
    if (profileResult.error.includes("Session not established")) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!signInError) {
        // Can sign in - it's a duplicate
        await supabase.auth.signOut(); // Don't leave them signed in
        console.log("Session error but can sign in - treating as duplicate");
        return { error: "An account with this email already exists. Please sign in instead." };
      }
    }
    
    // If we get here and it's not a duplicate, it's a real error
    // But let's double-check if maybe the profile was created by another process
    const { data: doubleCheck } = await supabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .single();
    
    if (doubleCheck) {
      // Profile exists now - must have been a race condition or duplicate
      console.log("Profile exists after failed insert - treating as duplicate");
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    
    // Real error - show actual error in development
    console.error("Profile bootstrap failed:", profileResult.error);
    const errorMessage = process.env.NODE_ENV === "development"
      ? `Account created but profile setup failed: ${profileResult.error}`
      : "Account created but profile setup failed. Please contact support.";
    return { error: errorMessage };
  }

  // Send welcome/activation email via Resend
  // IMPORTANT: To prevent Supabase from sending its default confirmation email,
  // disable "Enable email confirmations" in Supabase Dashboard > Authentication > Settings
  // This ensures only Resend emails are sent
  try {
    // Check if email confirmation is required
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient.auth.admin.getUserById(data.user.id);
    
    if (userData?.user && !userData.user.email_confirmed_at) {
      // Email confirmation required - send activation email
      // Use magiclink type instead of signup (doesn't require password)
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: `${baseUrl}/auth/sign-in`,
        },
      });
      
      if (linkData?.properties?.action_link) {
        const emailResult = await sendAccountActivationEmail({
          to: email,
          userName: name,
          activationLink: linkData.properties.action_link,
        });
        console.log("✅ Account activation email sent via Resend:", {
          emailId: emailResult?.id,
          email: email.substring(0, 3) + "***",
        });
      }
    } else {
      // No confirmation required - send welcome email
      const emailResult = await sendWelcomeEmail({
        to: email,
        userName: name,
      });
      console.log("✅ Welcome email sent via Resend:", {
        emailId: emailResult?.id,
        email: email.substring(0, 3) + "***",
      });
    }
  } catch (emailError) {
    // Don't fail sign-up if email fails - just log it
    console.error("⚠️ Failed to send welcome/activation email:", {
      error: emailError instanceof Error ? emailError.message : String(emailError),
      email: email.substring(0, 3) + "***",
      stack: emailError instanceof Error ? emailError.stack : undefined,
    });
  }

  return { success: true };
}

