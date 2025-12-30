import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ROLES = [
    { id: 'admin', label: 'Admin', route: '/dashboard/admin' },
    { id: 'ambulance', label: 'Ambulance', route: '/dashboard/ambulance' },
    { id: 'fire', label: 'Fire Engine', route: '/dashboard/fire' },
    { id: 'disaster', label: 'Disaster Management', route: '/dashboard/disaster' },
    { id: 'police', label: 'Traffic Police', route: '/dashboard/police' },
    { id: 'installer', label: 'Traffic Lights Installer', route: '/dashboard/installer' }
];

import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
    const navigate = useNavigate();
    const [focused, setFocused] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Sign In
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Get User Role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role;

                // 3. Navigate to specific dashboard
                const roleRoute = ROLES.find(r => r.id === role)?.route || '/';
                navigate(roleRoute);
            } else {
                // Handle case where user auth exists but firestore doc doesn't (rare sync issue)
                console.error("No user profile found!");
                navigate('/');
            }

        } catch (err) {
            console.error("Login Error:", err);
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role;
                const roleRoute = ROLES.find(r => r.id === role)?.route || '/';
                navigate(roleRoute);
            } else {
                // User not registered, redirect to signup
                // Pass email/name state to potentially pre-fill signup (optional enhancement for SignupPage to handle)
                navigate('/signup', { state: { email: user.email, fullName: user.displayName } });
            }
        } catch (err) {
            console.error("Google Login Error:", err);
            setError("Failed to sign in with Google.");
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'var(--color-bg-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Abstract Element */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-20%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(200,200,200,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                zIndex: 0
            }}></div>

            <div style={{ zIndex: 1, width: '100%', maxWidth: '400px', padding: '20px', animation: 'fadeInUp 0.8s ease-out' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', display: 'block', marginBottom: '40px' }}>&larr; Back to Home</Link>

                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '3rem',
                    marginBottom: '10px',
                    color: '#000',
                    lineHeight: 1
                }}>
                    ACCESS<br />VITAL ROUTE
                </h1>

                <p style={{ color: '#666', marginBottom: '40px', lineHeight: 1.5, fontSize: '1rem' }}>
                    Sign in to manage and monitor intelligent emergency traffic control.
                </p>

                {error && <div style={{ color: 'red', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onFocus={() => setFocused('email')}
                            onBlur={() => setFocused('')}
                            style={{
                                width: '100%',
                                padding: '15px 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `1px solid ${focused === 'email' ? '#000' : '#ccc'}`,
                                outline: 'none',
                                fontSize: '1.1rem',
                                color: '#000',
                                transition: 'border-color 0.3s ease'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <input
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            onFocus={() => setFocused('password')}
                            onBlur={() => setFocused('')}
                            style={{
                                width: '100%',
                                padding: '15px 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `1px solid ${focused === 'password' ? '#000' : '#ccc'}`,
                                outline: 'none',
                                fontSize: '1.1rem',
                                color: '#000',
                                transition: 'border-color 0.3s ease'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-hover-effect"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: '#000',
                            color: '#fff',
                            borderRadius: '50px',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'transform 0.2s ease, background 0.2s ease',
                            marginBottom: '20px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: '#fff',
                            color: '#000',
                            borderRadius: '50px',
                            border: '1px solid #ddd',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>G</span> Continue with Google
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <span style={{ color: '#888' }}>Don't have an account? </span>
                    <Link to="/signup" style={{ color: '#000', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid #000' }}>Sign up</Link>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .btn-hover-effect:hover {
                    background: #222 !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
