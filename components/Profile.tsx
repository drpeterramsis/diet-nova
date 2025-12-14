
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';

const Profile = () => {
  const { session, profile } = useAuth();
  const { notify } = useNotification();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && session) {
      setFullName(profile.full_name || '');
      setEmail(session.user.email || '');
    }
  }, [profile, session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    notify('Updating profile...', 'loading');

    try {
      const updates: any = {
        id: session?.user.id,
        full_name: fullName,
      };

      // Update Profile Data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (profileError) throw profileError;

      // Update Password if provided
      if (password) {
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match");
        }
        const { error: authError } = await supabase.auth.updateUser({
          password: password
        });
        if (authError) throw authError;
      }

      notify('Profile updated successfully! Reloading...', 'success');
      setPassword('');
      setConfirmPassword('');

      // Reload the page to apply settings to Header and app context
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
      if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
      
      // Prompt user for text confirmation
      const confirmation = window.prompt("Type 'DELETE' to confirm deletion:");
      if (confirmation !== 'DELETE') {
          if (confirmation !== null) alert("Deletion cancelled. Code did not match.");
          return;
      }

      setLoading(true);
      notify('Deleting account...', 'loading');
      
      try {
          if (!session?.user.id) {
             throw new Error("No active session found.");
          }

          console.log("Processing account deletion for:", session.user.id);

          // 1. Try the Secure RPC method (Best case)
          // This executes the 'delete_user' SQL function on the server.
          // It deletes the user from auth.users, which is the only way to prevent re-login.
          const { error: rpcError } = await supabase.rpc('delete_user');

          if (rpcError) {
             console.warn("RPC 'delete_user' failed (likely not set up or missing). Falling back to manual cleanup.", rpcError);
             
             // 2. Fallback: Manual Public Data Cleanup
             // If the RPC fails, we clean up the public data manually.
             // Note: This leaves the Auth User alive, so we MUST force logout at the end.
             
             // Delete meals
             await supabase.from('saved_meals').delete().eq('user_id', session.user.id);
             
             // Delete profile
             await supabase.from('profiles').delete().eq('id', session.user.id);
             
             notify("Account data cleared. Signing you out...", 'info');
          } else {
              // If RPC succeeded, the user is gone.
              notify("Account successfully deleted.", 'success');
          }

          // 3. Force Logout & Redirect
          // Regardless of whether we used RPC or Fallback, we must clear the local session.
          await supabase.auth.signOut();
          window.location.href = '/';
          
      } catch (err: any) {
          console.error("Deletion error:", err);
          // Self-Healing: If an error occurs (e.g., network, or weird state),
          // we still assume the user wants to leave.
          notify("Deletion processed with warnings. Signing out...", 'error');
          
          setTimeout(async () => {
             await supabase.auth.signOut();
             window.location.href = '/';
          }, 2000);
      }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-[var(--color-heading)] mb-6 flex items-center gap-2">
           <span>👤</span> Edit Profile
        </h2>

        <form onSubmit={handleUpdate} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Cannot be changed)</label>
                <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                    dir="ltr"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
            </div>

             <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            placeholder="Leave blank to keep current"
                            dir="ltr"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            placeholder="Confirm new password"
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3 rounded-lg font-bold transition shadow-md flex justify-center items-center gap-2"
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </form>

        <div className="mt-10 pt-6 border-t border-red-100">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">Deleting your account will permanently remove your profile, all saved meals, and your login credentials.</p>
            <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
            >
                {loading ? 'Deleting...' : 'Delete Account'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
