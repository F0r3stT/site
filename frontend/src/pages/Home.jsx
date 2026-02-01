// src/pages/Home.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';

const Home = () => {
  useEffect(() => {
    // Анимация для элементов при скролле
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Наблюдаем за элементами с анимацией
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section - точно как на изображении */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content-wrapper">
            <div className="hero-content slide-up">
              <h1>PCB & SMT Manufacturing Marketplace</h1>
              <p className="hero-subtitle">
                Connect with trusted PCB manufacturers and SMT assembly lines in Armenia. 
                From prototype to production.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary scale-in" style={{animationDelay: '0.2s'}}>
                  Start Your Order
                </Link>
                <a href="#manufacturing" className="btn btn-secondary scale-in" style={{animationDelay: '0.3s'}}>
                  More about Manufacturing
                </a>
              </div>
            </div>
            <div className="hero-image slide-up" style={{animationDelay: '0.1s'}}>
              <img src="/resources/PCBFR.png" alt="PCB Manufacturing" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - точно как на изображении */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title slide-up">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <div className="step-icon">
                <i className="fas fa-upload"></i>
              </div>
              <h3>Upload Your Design</h3>
              <p>Upload Gerber, BOM, Pick & Place files. Our system validates your design automatically.</p>
            </div>
            
            <div className="step-card animate-on-scroll" style={{animationDelay: '0.2s'}}>
              <div className="step-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Find Manufacturers</h3>
              <p>Our platform matches your requirements with qualified PCB/SMT factories in Armenia.</p>
            </div>
            
            <div className="step-card animate-on-scroll" style={{animationDelay: '0.3s'}}>
              <div className="step-icon">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h3>Receive Quotes</h3>
              <p>Get competitive quotes with lead times from multiple manufacturers.</p>
            </div>
            
            <div className="step-card animate-on-scroll" style={{animationDelay: '0.4s'}}>
              <div className="step-icon">
                <i className="fas fa-truck-fast"></i>
              </div>
              <h3>Production & Delivery</h3>
              <p>Track production progress in real-time and receive your boards on time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced PCB Manufacturing Section - точно как на изображении */}
      <section className="manufacturing-section" id="manufacturing">
        <div className="container">
          <div className="manufacturing-content">
            <div className="manufacturing-image animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2070&auto=format&fit=crop" alt="PCB Manufacturing" />
            </div>
            <div className="manufacturing-text">
              <h2 className="section-title slide-up">Advanced PCB Manufacturing</h2>
              
              <div className="manufacturing-features">
                <div className="manufacturing-feature animate-on-scroll" style={{animationDelay: '0.2s'}}>
                  <i className="fas fa-layer-group"></i>
                  <div>
                    <h3>Multi-Layer Technology</h3>
                    <p>From 2 to 32 layers with precise layer alignment and impedance control.</p>
                  </div>
                </div>
                
                <div className="manufacturing-feature animate-on-scroll" style={{animationDelay: '0.3s'}}>
                  <i className="fas fa-bolt"></i>
                  <div>
                    <h3>High-Speed Design</h3>
                    <p>Specialized in RF and high-frequency boards with controlled impedance.</p>
                  </div>
                </div>
                
                <div className="manufacturing-feature animate-on-scroll" style={{animationDelay: '0.4s'}}>
                  <i className="fas fa-industry"></i>
                  <div>
                    <h3>Automated Production</h3>
                    <p>State-of-the-art automated lines ensuring consistency and quality.</p>
                  </div>
                </div>
                
                <div className="manufacturing-feature animate-on-scroll" style={{animationDelay: '0.5s'}}>
                  <i className="fas fa-leaf"></i>
                  <div>
                    <h3>Eco-Friendly Processes</h3>
                    <p>Environmentally conscious manufacturing with reduced chemical usage.</p>
                  </div>
                </div>
              </div>
              
              <Link to="/register" button className="btn btn-primary scale-in" style={{animationDelay: '0.6s'}}>
                Start Manufacturing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing Services Section - точно как на изображении */}
      <section className="services-section" id="services">
        <div className="container">
          <h2 className="section-title slide-up">Manufacturing Services</h2>
          <div className="services-grid">
            <div className="service-card animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <div className="service-header">
                <i className="fas fa-microchip"></i>
                <h3>PCB Fabrication</h3>
              </div>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> 1-32 Layer PCBs</li>
                <li><i className="fas fa-check"></i> FR-4, Rogers, Aluminum</li>
                <li><i className="fas fa-check"></i> HDI & Impedance Control</li>
                <li><i className="fas fa-check"></i> ENIG, HASL, Immersion Silver</li>
              </ul>
              <button className="btn btn-outline">Order PCB Only</button>
            </div>
            
            <div className="service-card animate-on-scroll" style={{animationDelay: '0.2s'}}>
              <div className="service-header">
                <i className="fas fa-robot"></i>
                <h3>SMT Assembly</h3>
              </div>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Full Turnkey Assembly</li>
                <li><i className="fas fa-check"></i> BGA, QFN, 0201 Components</li>
                <li><i className="fas fa-check"></i> AOI & X-Ray Inspection</li>
                <li><i className="fas fa-check"></i> Functional Testing</li>
              </ul>
              <button className="btn btn-outline">Order PCB + SMT</button>
            </div>
            
            <div className="service-card animate-on-scroll" style={{animationDelay: '0.3s'}}>
              <div className="service-header">
                <i className="fas fa-tools"></i>
                <h3>DFM Optimization</h3>
              </div>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Design for Manufacturing</li>
                <li><i className="fas fa-check"></i> Cost Reduction Analysis</li>
                <li><i className="fas fa-check"></i> Yield Improvement</li>
                <li><i className="fas fa-check"></i> Expert Consultation</li>
              </ul>
              <button className="btn btn-outline">Request DFM Review</button>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Assurance Section - точно как на изображении */}
      <section className="quality-section" id="factories">
        <div className="container">
          <div className="quality-content">
            <div className="quality-text">
              <h2 className="section-title slide-up">Quality Assurance & Testing</h2>
              
              <div className="quality-metrics">
                <div className="quality-metric animate-on-scroll" style={{animationDelay: '0.1s'}}>
                  <div className="metric-value">99.8%</div>
                  <div className="metric-label">First-Pass Yield</div>
                </div>
                <div className="quality-metric animate-on-scroll" style={{animationDelay: '0.2s'}}>
                  <div className="metric-value">100%</div>
                  <div className="metric-label">AOI Inspection</div>
                </div>
                <div className="quality-metric animate-on-scroll" style={{animationDelay: '0.3s'}}>
                  <div className="metric-value">24/7</div>
                  <div className="metric-label">Process Monitoring</div>
                </div>
                <div className="quality-metric animate-on-scroll" style={{animationDelay: '0.4s'}}>
                  <div className="metric-value">IPC-A-610</div>
                  <div className="metric-label">Quality Standard</div>
                </div>
              </div>
              
              <div className="quality-features">
                <div className="quality-feature animate-on-scroll" style={{animationDelay: '0.5s'}}>
                  <i className="fas fa-search"></i>
                  <div>
                    <h3>Automated Optical Inspection</h3>
                    <p>High-resolution AOI systems detect even the smallest defects.</p>
                  </div>
                </div>
                <div className="quality-feature animate-on-scroll" style={{animationDelay: '0.6s'}}>
                  <i className="fas fa-x-ray"></i>
                  <div>
                    <h3>X-Ray Inspection</h3>
                    <p>For BGA and hidden solder joints, ensuring perfect connections.</p>
                  </div>
                </div>
                <div className="quality-feature animate-on-scroll" style={{animationDelay: '0.7s'}}>
                  <i className="fas fa-vial"></i>
                  <div>
                    <h3>Material Testing</h3>
                    <p>Regular testing of raw materials to ensure consistency.</p>
                  </div>
                </div>
                <div className="quality-feature animate-on-scroll" style={{animationDelay: '0.8s'}}>
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <h3>Statistical Process Control</h3>
                    <p>Real-time monitoring and control of all manufacturing parameters.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="quality-image animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2074&auto=format&fit=crop" alt="Quality Inspection" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <h2 className="section-title slide-up">Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <h3>Get Started Today</h3>
              <p>Ready to manufacture your PCBs? Contact us for a consultation or start your order directly.</p>
              <div className="contact-details">
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <span>contact@tangram.am</span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <span>+374 10 123456</span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Yerevan, Armenia</span>
                </div>
              </div>
            </div>
            <div className="contact-form animate-on-scroll" style={{animationDelay: '0.2s'}}>
              <h3>Send us a message</h3>
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" rows="4"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;