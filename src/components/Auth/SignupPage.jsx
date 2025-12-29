import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const ROLES = [
    { id: 'admin', label: 'Admin', route: '/dashboard/admin' },
    { id: 'ambulance', label: 'Ambulance', route: '/dashboard/ambulance' },
    { id: 'fire', label: 'Fire Engine', route: '/dashboard/fire' },
    { id: 'disaster', label: 'Disaster Management', route: '/dashboard/disaster' },
    { id: 'police', label: 'Traffic Police', route: '/dashboard/police' },
    { id: 'installer', label: 'Traffic Lights Installer', route: '/dashboard/installer' }
];

const SignupPage = () => {
    const navigate = useNavigate();
    const [focused, setFocused] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!formData.role) {
            setError("Please select a role");
            setLoading(false);
            return;
        }

        try {
            // 1. Create User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            let imageUrl = null;

            // 2. Upload Profile Image to ImgBB (if selected)
            if (image) {
                const formData = new FormData();
                formData.append('image', image);
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    imageUrl = data.data.url;
                } else {
                    console.error("ImgBB Upload Error:", data);
                    // Start fallback or continue without image? Continuing without image for now, or could throw error.
                }
            }

            // 3. Store User Data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role,
                profileImage: imageUrl,
                createdAt: new Date()
            });

            // 4. Navigate to specific dashboard
            const roleRoute = ROLES.find(r => r.id === formData.role)?.route || '/';
            navigate(roleRoute);

        } catch (err) {
            console.error("Signup Error:", err);
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: '100vw',
            minHeight: '100vh',
            background: 'var(--color-bg-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflowY: 'auto',
            padding: '40px 0'
        }}>
            <div style={{ zIndex: 1, width: '100%', maxWidth: '500px', padding: '20px', animation: 'fadeInUp 0.8s ease-out' }}>
                <Link to="/login" style={{ textDecoration: 'none', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', display: 'block', marginBottom: '30px' }}>&larr; Back to Login</Link>

                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.5rem',
                    marginBottom: '10px',
                    color: '#000',
                    lineHeight: 1
                }}>
                    CREATE YOUR<br />ACCOUNT
                </h1>

                <p style={{ color: '#666', marginBottom: '40px', lineHeight: 1.5 }}>
                    Join the intelligent emergency response network.
                </p>

                {error && <div style={{ color: 'red', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSignup}>

                    {/* Profile Image & Dropdown */}
                    <div style={{ marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#e0e0e0',
                                border: '2px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                            }}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '2rem' }}>+</div>
                                )}
                            </div>
                            <input type="file" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        </div>

                        <div style={{ flexGrow: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}>SELECT ROLE</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc',
                                    background: '#fff', fontSize: '1rem', outline: 'none'
                                }}
                            >
                                <option value="" disabled>-- Choose Role --</option>
                                {ROLES.map(role => (
                                    <option key={role.id} value={role.id}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            onFocus={() => setFocused('name')}
                            onBlur={() => setFocused('')}
                            style={{
                                width: '100%', padding: '15px 0', background: 'transparent',
                                border: 'none', borderBottom: `1px solid ${focused === 'name' ? '#000' : '#ccc'}`,
                                outline: 'none', color: '#000'
                            }}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onFocus={() => setFocused('email')}
                            onBlur={() => setFocused('')}
                            style={{
                                width: '100%', padding: '15px 0', background: 'transparent',
                                border: 'none', borderBottom: `1px solid ${focused === 'email' ? '#000' : '#ccc'}`,
                                outline: 'none', color: '#000'
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
                                width: '100%', padding: '15px 0', background: 'transparent',
                                border: 'none', borderBottom: `1px solid ${focused === 'password' ? '#000' : '#ccc'}`,
                                outline: 'none', color: '#000', marginBottom: '20px'
                            }}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            onFocus={() => setFocused('confirm')}
                            onBlur={() => setFocused('')}
                            style={{
                                width: '100%', padding: '15px 0', background: 'transparent',
                                border: 'none', borderBottom: `1px solid ${focused === 'confirm' ? '#000' : '#ccc'}`,
                                outline: 'none', color: '#000'
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
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                </form>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <span style={{ color: '#888' }}>Already have an account? </span>
                    <Link to="/login" style={{ color: '#000', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid #000' }}>Login</Link>
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

export default SignupPage;
