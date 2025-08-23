import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Config ---
// PASTE YOUR LIVE RENDER URL HERE
const BACKEND_URL = 'https://predictions-backend-api.onrender.com'; 

// --- Child Components ---

const AuthForm = ({ isLogin, onSubmit, onToggle, message }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="w-full p-3 border rounded-md" />
                )}
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-3 border rounded-md" />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full p-3 border rounded-md" />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300">
                    {isLogin ? 'Login' : 'Create Account'}
                </button>
            </form>
            {message && <p className={`mt-4 text-center font-semibold ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{message.text}</p>}
            <p className="mt-6 text-center">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={onToggle} className="text-blue-600 font-semibold ml-2 hover:underline">
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </p>
            <p className="text-xs text-gray-400 text-center mt-4">v3.0 - Debug</p>
        </div>
    );
};

// --- Main App Component ---

export default function App() {
    // Auth State
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoginView, setIsLoginView] = useState(true);
    const [authMessage, setAuthMessage] = useState('');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const api = useMemo(() => ({
        register: async (userData) => {
            const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return response;
        },
        login: async (credentials) => {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            return response;
        }
    }), []);
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            setToken(currentToken);
            try {
                const payload = JSON.parse(atob(currentToken.split('.')[1]));
                setUser({ name: payload.name, id: payload.userId });
            } catch (e) {
                console.error("Invalid token:", e);
                handleLogout();
            }
        }
    }, [handleLogout]);


    const handleRegister = async (formData) => {
        setIsLoading(true);
        try {
            const response = await api.register(formData);
            const data = await response.json();
            if (response.ok) {
                setAuthMessage({ type: 'success', text: data.message + ' Please log in.' });
                setIsLoginView(true);
            } else {
                setAuthMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setAuthMessage({ type: 'error', text: 'Could not connect to the server.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (formData) => {
        setIsLoading(true);
        console.log("Attempting to log in...");
        try {
            const response = await api.login(formData);
            const data = await response.json();
            if (response.ok) {
                console.log("Login successful.");
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setAuthMessage('');
            } else {
                console.log("Login failed:", data.message);
                setAuthMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            console.error("Login network error:", error);
            setAuthMessage({ type: 'error', text: 'Could not connect to the server.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return <div className="bg-gray-100 min-h-screen flex items-center justify-center"><p className="text-2xl font-semibold">Loading...</p></div>;
    }

    if (!token) {
        return (
             <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Premier League Predictions</h1>
                    <p className="text-gray-600 mt-2">Welcome! Please log in or register to play.</p>
                </header>
                <AuthForm 
                    isLogin={isLoginView} 
                    onSubmit={isLoginView ? handleLogin : handleRegister}
                    onToggle={() => setIsLoginView(!isLoginView)}
                    message={authMessage}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 text-gray-800 font-sans min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
                    <button onClick={handleLogout} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">Logout</button>
                </header>
                <main>
                    <p>You are logged in!</p>
                </main>
            </div>
        </div>
    );
}