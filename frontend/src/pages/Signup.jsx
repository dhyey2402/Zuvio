import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../components/ui/Button';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch('password', '');
  
  // Basic password strength calculation
  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return score;
    if (pwd.length > 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };
  
  const strength = calculateStrength(password);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signup({ 
        email: data.email, 
        password: data.password,
        full_name: data.fullName // Depending on backend expectation
      });
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in w-full">
      <div className="flex flex-col space-y-2 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create an account</h2>
        <p className="text-sm text-muted-foreground">
          Enter your details below to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md animate-slide-up">
            {errorMsg}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input 
            id="fullName" 
            placeholder="John Doe" 
            {...register('fullName', { required: 'Name is required' })}
            error={!!errors.fullName}
          />
          {errors.fullName && <p className="text-xs text-destructive animate-fade-in">{errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@example.com" 
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
            })}
            error={!!errors.email}
          />
          {errors.email && <p className="text-xs text-destructive animate-fade-in">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' }
              })}
              error={!!errors.password}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive animate-fade-in">{errors.password.message}</p>}
          
          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 animate-fade-in">
              {[1, 2, 3, 4].map((level) => (
                <div 
                  key={level} 
                  className={cn(
                    "h-1 w-full rounded-full transition-colors duration-300",
                    strength >= level ? (
                      strength === 1 ? 'bg-destructive' :
                      strength === 2 ? 'bg-amber-500' :
                      strength === 3 ? 'bg-emerald-400' :
                      'bg-emerald-500'
                    ) : 'bg-muted'
                  )}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type={showPassword ? 'text' : 'password'} 
            placeholder="••••••••"
            {...register('confirmPassword', { 
              validate: value => value === password || 'Passwords do not match'
            })}
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive animate-fade-in">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
          Create account
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button 
        variant="secondary" 
        type="button" 
        className="w-full bg-background hover:bg-muted"
        onClick={() => {
          import('../lib/axios').then(({ apiClient }) => {
            window.location.href = `${apiClient.defaults.baseURL}/auth/google/login`;
          });
        }}
      >
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
        Google
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-foreground hover:underline font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
          Sign in
        </Link>
      </p>
    </div>
  );
}
