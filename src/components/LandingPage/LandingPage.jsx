import React, { useEffect } from 'react';
import './LandingPage.css';
import Hero from './Hero';
import Concept from './Concept';
import Impact from './Impact';
import Tech from './Tech';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.vital-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="vital-container">
      <nav className="vital-nav">
        <div className="vital-logo">VITAL ROUTE</div>
        <button className="vital-login-btn" onClick={() => navigate('/login')}>Login</button>
      </nav>

      <Hero />
      <Concept />
      <Impact />
      <Tech />
      <Footer />
    </div>
  );
};

export default LandingPage;
