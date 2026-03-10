import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import { LogIn, UserPlus } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUserInfo } = useAppStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : formData;

            const { data } = await api.post(endpoint, payload);

            setUserInfo(data);
            toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all">
                <div className="bg-brand-600 p-8 text-center">
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">AmigoSync</h2>
                    <p className="text-brand-100 mt-2 text-sm">Smart Group Coordination</p>
                </div>

                <div className="p-8">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Full Name</label>
                                    <input name="name" type="text" required onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors outline-none" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Phone Number</label>
                                    <input name="phone" type="tel" required onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors outline-none" placeholder="+1 234 567 8900" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Email address</label>
                            <input name="email" type="email" required onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors outline-none" placeholder="jane@example.com" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Password</label>
                            <input name="password" type="password" required onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors outline-none" placeholder="••••••••" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : isLogin ? <><LogIn className="mr-2" size={18} /> Sign In</> : <><UserPlus className="mr-2" size={18} /> Create Account</>}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
