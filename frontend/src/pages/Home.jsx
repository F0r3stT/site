import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';


const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero_frame">
          <div className="hero__inner">
            <div className="hero__content">
              <h1>PCB & SMT Manufacturing Marketplace</h1>
              <p>
                Connect with trusted PCB manufacturers and SMT assembly
                lines in Armenia. From prototype to production.
              </p>
              <div className="hero__actions">
                <Link to="/register" className="btn btn--primary">Start Your Order</Link>
                <a href="#production" className="btn btn--secondary">More about Manufacturing</a>
              </div>
            </div>
            <div className="hero__visual">
              <img src="/resources/PCBFR.png" alt="Manufacturing illustration" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            {featuresData.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Production Sections */}
      <ProductionSection
        id="production"
        imageLeft={true}
        title="Advanced PCB Manufacturing"
        imageSrc="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2070&auto=format&fit=crop"
        features={productionFeatures}
      />

      {/* Services Section */}
      <section className="order-types-section" id="services">
        <div className="container">
          <h2 className="section-title">Manufacturing Services</h2>
          <div className="services-grid">
            {servicesData.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-header">
                  <i className={service.icon}></i>
                  <h3>{service.title}</h3>
                </div>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <i className="fas fa-check"></i> {feature}
                    </li>
                  ))}
                </ul>
                <button className="btn btn-outline">
                  {service.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <ProductionSection
        id="quality"
        imageLeft={false}
        title="Quality Assurance & Testing"
        imageSrc="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2074&auto=format&fit=crop"
        metrics={qualityMetrics}
        features={qualityFeatures}
      />
    </div>
  );
};

const ProductionSection = ({ id, imageLeft, title, imageSrc, features, metrics }) => {
  return (
    <section className={`production-section ${imageLeft ? 'image-left' : 'image-right'}`} id={id}>
      <div className="container">
        <div className="production-content">
          <div className="production-image">
            <img src={imageSrc} alt={title} />
            <div className="image-fade"></div>
          </div>
          <div className="production-text">
            <h2 className="section-title">{title}</h2>
            
            {metrics && (
              <div className="quality-metrics">
                {metrics.map((metric, index) => (
                  <div key={index} className="metric">
                    <div className="metric-value">{metric.value}</div>
                    <div className="metric-label">{metric.label}</div>
                  </div>
                ))}
              </div>
            )}
            
            {features && (
              <div className="quality-features">
                {features.map((feature, index) => (
                  <div key={index} className="quality-feature">
                    <i className={feature.icon}></i>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
            
            <button className="btn btn-primary">
              Start Manufacturing
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Data arrays
const featuresData = [
  {
    icon: 'fas fa-upload',
    title: 'Upload Your Design',
    description: 'Upload Gerber, BOM, Pick & Place files. Our system validates your design automatically.'
  },
  {
    icon: 'fas fa-search',
    title: 'Find Manufacturers',
    description: 'Our platform matches your requirements with qualified PCB/SMT factories in Armenia.'
  },
  {
    icon: 'fas fa-file-invoice-dollar',
    title: 'Receive Quotes',
    description: 'Get competitive quotes with lead times from multiple manufacturers.'
  },
  {
    icon: 'fas fa-truck-fast',
    title: 'Production & Delivery',
    description: 'Track production progress in real-time and receive your boards on time.'
  }
];

const productionFeatures = [
  {
    icon: 'fas fa-layer-group',
    title: 'Multi-Layer Technology',
    description: 'From 2 to 32 layers with precise layer alignment and impedance control.'
  },
  {
    icon: 'fas fa-bolt',
    title: 'High-Speed Design',
    description: 'Specialized in RF and high-frequency boards with controlled impedance.'
  },
  {
    icon: 'fas fa-industry',
    title: 'Automated Production',
    description: 'State-of-the-art automated lines ensuring consistency and quality.'
  },
  {
    icon: 'fas fa-leaf',
    title: 'Eco-Friendly Processes',
    description: 'Environmentally conscious manufacturing with reduced chemical usage.'
  }
];

const servicesData = [
  {
    icon: 'fas fa-microchip',
    title: 'PCB Fabrication',
    features: ['1-32 Layer PCBs', 'FR-4, Rogers, Aluminum', 'HDI & Impedance Control', 'ENIG, HASL, Immersion Silver'],
    buttonText: 'Order PCB Only'
  },
  {
    icon: 'fas fa-robot',
    title: 'SMT Assembly',
    features: ['Full Turnkey Assembly', 'BGA, QFN, 0201 Components', 'AOI & X-Ray Inspection', 'Functional Testing'],
    buttonText: 'Order PCB + SMT'
  },
  {
    icon: 'fas fa-tools',
    title: 'DFM Optimization',
    features: ['Design for Manufacturing', 'Cost Reduction Analysis', 'Yield Improvement', 'Expert Consultation'],
    buttonText: 'Request DFM Review'
  }
];

const qualityMetrics = [
  { value: '99.8%', label: 'First-Pass Yield' },
  { value: '100%', label: 'AOI Inspection' },
  { value: '24/7', label: 'Process Monitoring' },
  { value: 'IPC-A-610', label: 'Quality Standard' }
];

const qualityFeatures = [
  {
    icon: 'fas fa-search',
    title: 'Automated Optical Inspection',
    description: 'High-resolution AOI systems detect even the smallest defects.'
  },
  {
    icon: 'fas fa-x-ray',
    title: 'X-Ray Inspection',
    description: 'For BGA and hidden solder joints, ensuring perfect connections.'
  },
  {
    icon: 'fas fa-vial',
    title: 'Material Testing',
    description: 'Regular testing of raw materials to ensure consistency.'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Statistical Process Control',
    description: 'Real-time monitoring and control of all manufacturing parameters.'
  }
];

export default Home;