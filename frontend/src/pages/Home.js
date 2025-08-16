import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Home page component - Landing page with features and call-to-action
 * Features: Hero section, feature showcase, statistics, responsive design
 */
const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>AI-Powered Predictions Made Simple</h1>
            <p>
              Harness the power of advanced machine learning to make accurate predictions 
              from your data. Upload your files or input data manually and get instant, 
              reliable results with confidence scores.
            </p>
            <div className="hero-buttons">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-large">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <div className="prediction-demo">
              <div className="demo-card">
                <div className="demo-header">
                  <div className="demo-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="demo-title">AI Prediction</span>
                </div>
                <div className="demo-content">
                  <div className="demo-input">
                    <div className="input-label">Input Data</div>
                    <div className="input-values">
                      <span>1.5</span>
                      <span>2.3</span>
                      <span>4.1</span>
                      <span>0.8</span>
                    </div>
                  </div>
                  <div className="demo-arrow">→</div>
                  <div className="demo-result">
                    <div className="result-value">85%</div>
                    <div className="result-label">Confidence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Why Choose Our AI Prediction Platform?</h2>
            <p>Powerful features designed to make AI predictions accessible to everyone</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>Advanced AI Models</h3>
              <p>
                State-of-the-art machine learning models trained on diverse datasets 
                to provide accurate and reliable predictions across various domains.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>
                Get predictions in milliseconds with our optimized TensorFlow.js 
                implementation. No waiting, just instant results.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>
                Your data is encrypted and secure. We use JWT authentication and 
                follow industry-standard security practices to protect your information.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Multiple Input Methods</h3>
              <p>
                Upload files (CSV, JSON, images) or input data manually. 
                Flexible data input options to suit your workflow.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Detailed Analytics</h3>
              <p>
                Track your prediction history, analyze confidence trends, 
                and gain insights from comprehensive statistics and visualizations.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Cloud-Ready</h3>
              <p>
                Deployed on reliable cloud infrastructure with automatic scaling. 
                Access your predictions from anywhere, anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>99.2%</h3>
              <p>Model Accuracy</p>
            </div>
            <div className="stat-item">
              <h3>&lt;50ms</h3>
              <p>Average Response Time</p>
            </div>
            <div className="stat-item">
              <h3>10K+</h3>
              <p>Predictions Made</p>
            </div>
            <div className="stat-item">
              <h3>500+</h3>
              <p>Active Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>How It Works</h2>
            <p>Get started with AI predictions in three simple steps</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload or Input Data</h3>
                <p>
                  Choose your preferred method: upload files (CSV, JSON, images) 
                  or manually input your data through our intuitive interface.
                </p>
              </div>
            </div>
            
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Processing</h3>
                <p>
                  Our advanced machine learning models analyze your data using 
                  TensorFlow.js to generate accurate predictions with confidence scores.
                </p>
              </div>
            </div>
            
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Results</h3>
                <p>
                  View detailed prediction results, confidence levels, and save 
                  your predictions for future reference and analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience AI Predictions?</h2>
            <p>
              Join thousands of users who trust our platform for accurate, 
              fast, and reliable AI-powered predictions.
            </p>
            <div className="cta-buttons">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Start Predicting Now
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-large">
                    I Have an Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx="true">{`
        .home-page {
          min-height: 100vh;
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6rem 0 4rem;
          overflow: hidden;
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .hero-content p {
          font-size: 1.25rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          min-width: 180px;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .prediction-demo {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .demo-card {
          background: white;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .demo-dots {
          display: flex;
          gap: 0.5rem;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .dot.red { background: #ef4444; }
        .dot.yellow { background: #f59e0b; }
        .dot.green { background: #10b981; }

        .demo-title {
          color: #64748b;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .demo-content {
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          color: #1e293b;
        }

        .demo-input {
          text-align: center;
        }

        .input-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 1rem;
        }

        .input-values {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .input-values span {
          background: #f1f5f9;
          padding: 0.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          min-width: 40px;
        }

        .demo-arrow {
          font-size: 2rem;
          color: #4f46e5;
          font-weight: bold;
        }

        .demo-result {
          text-align: center;
        }

        .result-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        .result-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .features-section,
        .how-it-works-section {
          padding: 6rem 0;
          background: white;
        }

        .section-header {
          margin-bottom: 4rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .section-header p {
          font-size: 1.2rem;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          text-align: center;
          padding: 2.5rem;
          border-radius: 1rem;
          background: #f8fafc;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          font-size: 2rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        .stats-section {
          background: #f8fafc;
          padding: 4rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          text-align: center;
        }

        .stat-item h3 {
          font-size: 3rem;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 0.5rem;
        }

        .stat-item p {
          color: #6b7280;
          font-weight: 500;
          font-size: 1.1rem;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 3rem;
        }

        .step-item {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .step-content p {
          color: #6b7280;
          line-height: 1.6;
        }

        .cta-section {
          background: linear-gradient(135deg, #1f2937 0%, #4f46e5 100%);
          color: white;
          padding: 6rem 0;
          text-align: center;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .cta-content p {
          font-size: 1.2rem;
          margin-bottom: 3rem;
          opacity: 0.9;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
          }

          .hero-content h1 {
            font-size: 2.5rem;
          }

          .hero-content p {
            font-size: 1.1rem;
          }

          .hero-buttons,
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn-large {
            min-width: 200px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }

          .step-item {
            flex-direction: column;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .cta-content h2 {
            font-size: 2rem;
          }

          .demo-content {
            flex-direction: column;
            gap: 1.5rem;
          }

          .demo-arrow {
            transform: rotate(90deg);
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            padding: 2rem 1.5rem;
          }

          .hero-section {
            padding: 4rem 0 3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
