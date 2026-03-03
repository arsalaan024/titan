
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, UserRoles } from '../types';
import { useSignUp, useUser } from '@clerk/clerk-react';

const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { user: existingUser } = useUser();

  React.useEffect(() => {
    if (existingUser) {
      navigate('/profile');
    }
  }, [existingUser, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRoles.STUDENT as UserRole,
    accessCode: ''
  });

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);

    console.log('--- CLERK ENROLLMENT START ---');

    try {
      const restrictedRoles = [UserRoles.ADMIN, UserRoles.CLUB_ADMIN, UserRoles.CAREER_ADMIN, UserRoles.SUPER_ADMIN];
      const normalizedCode = formData.accessCode.trim();
      const selectedRole = formData.role;

      console.log('Registration Profile:', { role: selectedRole, email: formData.email.trim() });

      if (restrictedRoles.includes(selectedRole as UserRoles) && normalizedCode !== 'TITAN2025') {
        console.warn('REGISTRATION BLOCKED: Invalid Access Code for restricted role.');
        throw new Error('Departmental Authorization Failed. Please verify your Secret Access Code.');
      }

      // Start the signup process
      await signUp.create({
        emailAddress: formData.email.trim(),
        password: formData.password,
        unsafeMetadata: {
          role: selectedRole,
          name: formData.name.trim()
        }
      });
      console.log('Clerk Identity created. Initiating verification...');

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
      console.log('Verification code sent to:', formData.email);

    } catch (err: any) {
      const clerkError = err.errors?.[0]?.message || err.message;
      console.error('PROVISIONING FAILED:', clerkError);
      setError(clerkError || 'Identity could not be verified.');
    } finally {
      setLoading(false);
      console.log('--- CLERK ENROLLMENT SEQUENCE ---');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        console.log('Verification Complete. Synchronizing session...');
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        console.error(completeSignUp);
        setError('Verification incomplete. Please check your code.');
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0]?.message || err.message;
      setError(clerkError || 'Code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-24">
      <div className="bg-white rounded-[4rem] shadow-2xl p-16 max-w-3xl w-full border border-gray-100 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <i className="fa-solid fa-id-card-clip text-[20rem]"></i>
        </div>

        <div className="text-center mb-16 relative">
          <div className="w-24 h-24 bg-maroon-800 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl mx-auto mb-10 shadow-2xl rotate-3">T</div>
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4 leading-none">Titan <br />Enrollment.</h2>
          <p className="text-gray-500 text-xl font-medium">
            {verifying ? 'Finalizing your institutional access.' : 'Provision your institutional role and access level.'}
          </p>
        </div>

        {error && (
          <div className="mb-10 p-8 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold flex items-center gap-5 animate-slide-up shadow-sm">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            {error}
          </div>
        )}

        {verifying ? (
          <form onSubmit={handleVerify} className="space-y-12 relative animate-fade-in">
            <div className="space-y-3">
              <label htmlFor="verifyCode" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2 text-center">Verification Code</label>
              <input
                id="verifyCode"
                type="text"
                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-4xl transition-all text-center tracking-[0.5em] placeholder:tracking-normal"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <p className="text-center text-sm text-gray-500 font-medium">Please enter the 6-digit status code sent to your email.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-maroon-800 text-white font-black py-8 rounded-[2rem] hover:bg-maroon-900 transition-all shadow-2xl uppercase tracking-widest text-sm mt-8 active:scale-95 disabled:opacity-50">
              {loading ? 'Validating Token...' : 'Finalize Identity'}
            </button>
            <button type="button" onClick={() => setVerifying(false)} className="w-full text-maroon-800 font-bold text-xs uppercase tracking-widest hover:underline">
              Back to registration
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-12 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label htmlFor="regName" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Official Display Name</label>
                <input
                  id="regName"
                  type="text"
                  className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-xl transition-all"
                  placeholder="Arsalaan Khan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="regEmail" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Institutional Email</label>
                <input
                  id="regEmail"
                  type="email"
                  className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-xl transition-all"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="regPass" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Gateway Password</label>
              <div className="relative group">
                <input
                  id="regPass"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-6 font-bold outline-none focus:ring-4 focus:ring-maroon-800/10 text-xl transition-all pr-16"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-maroon-800 transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <p className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Access Hierarchy Role</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { r: UserRoles.STUDENT, icon: 'fa-user-graduate', label: 'Student' },
                  { r: UserRoles.ADMIN, icon: 'fa-user-shield', label: 'General Admin' },
                  { r: UserRoles.SUPER_ADMIN, icon: 'fa-crown', label: 'Super Admin' }
                ].map(({ r, icon, label }) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={formData.role === r}
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`py-6 px-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 text-[10px] font-black uppercase tracking-tight transition-all border-2 ${formData.role === r
                      ? 'bg-maroon-800 text-white border-maroon-800 shadow-xl scale-105 z-10'
                      : 'bg-gray-50 text-gray-400 border-gray-50 hover:border-maroon-100 hover:text-maroon-800'
                      }`}
                  >
                    <i className={`fa-solid ${icon} text-2xl mb-1`}></i>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.role !== UserRoles.STUDENT && (
              <div className="animate-fade-in space-y-5 pt-8 border-t border-gray-100">
                <label htmlFor="authCode" className="block text-[10px] font-black text-maroon-800 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                  <i className="fa-solid fa-key text-lg"></i>
                  Departmental Secret Authorization Code
                </label>
                <div className="relative group">
                  <input
                    id="authCode"
                    type={showAccessCode ? "text" : "password"}
                    className="w-full bg-maroon-50 border-2 border-maroon-100 rounded-[1.5rem] px-8 py-6 font-black placeholder-maroon-200 focus:outline-none focus:border-maroon-800 transition-all text-xl pr-16"
                    placeholder="Enter departmental secret code"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-maroon-200 hover:text-maroon-800 transition-colors"
                  >
                    <i className={`fa-solid ${showAccessCode ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                  </button>
                </div>
                <p className="text-[10px] text-maroon-300 font-bold uppercase tracking-widest px-2 italic">Contact Super Admin to obtain your role provision key.</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-maroon-800 text-white font-black py-8 rounded-[2rem] hover:bg-maroon-900 transition-all shadow-2xl uppercase tracking-widest text-sm mt-8 active:scale-95 disabled:opacity-50">
              {loading ? 'Synthesizing Identity...' : 'Submit Registration'}
            </button>
          </form>
        )}

        <div className="mt-20 text-center border-t border-gray-50 pt-12">
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
            Already registered? <Link to="/login" className="text-maroon-800 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
