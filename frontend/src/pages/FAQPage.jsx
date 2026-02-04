import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/FAQPage.css'; // Импортируем стили

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Данные FAQ с категориями
  const faqData = {
    general: [
      {
        id: 'general-1',
        question: 'What is PCB Manufacturing Hub?',
        answer: 'PCB Manufacturing Hub is a B2B platform connecting engineers and innovators with certified PCB manufacturers and SMT assembly lines in Armenia. We streamline the entire electronics production process from design to delivery.'
      },
      {
        id: 'general-2',
        question: 'Who can use this platform?',
        answer: 'Our platform is designed for hardware engineers, product designers, startups, and companies of all sizes who need professional PCB manufacturing services. Both B2B and B2C customers are welcome.'
      },
      {
        id: 'general-3',
        question: 'Is my design data secure?',
        answer: 'Absolutely. We use enterprise-grade encryption for all file transfers, secure cloud storage with access controls, and NDAs with all manufacturing partners. Your intellectual property is protected at every stage.'
      }
    ],
    ordering: [
      {
        id: 'ordering-1',
        question: 'How do I place an order?',
        answer: 'Simply upload your Gerber files, BOM, and assembly drawings through our platform. Fill in the specifications (layers, quantity, material), and we\'ll match you with suitable manufacturers who will provide quotes within 24 hours.'
      },
      {
        id: 'ordering-2',
        question: 'What file formats do you accept?',
        answer: 'We accept Gerber (RS-274X), ODB++, Eagle, Altium, KiCad, and PDF files. For BOM: Excel (.xlsx), CSV, or XML. All files are automatically validated for manufacturability.'
      },
      {
        id: 'ordering-3',
        question: 'What are the minimum order quantities?',
        answer: 'MOQs start from 5 pieces for prototype orders. For mass production, typical MOQs are 100+ pieces, but this varies by manufacturer and board complexity.'
      },
      {
        id: 'ordering-4',
        question: 'Can I get a prototype before full production?',
        answer: 'Yes! Most manufacturers offer prototyping services with 3-5 day turnaround. You can order prototypes before committing to mass production runs.'
      }
    ],
    manufacturing: [
      {
        id: 'manufacturing-1',
        question: 'What manufacturing capabilities are available in Armenia?',
        answer: 'Our network includes manufacturers with capabilities for 2-20 layer PCBs, HDI, flex/rigid-flex boards, impedance control, gold plating, and RoHS compliant finishes. SMT lines support 01005 components and BGA assembly.'
      },
      {
        id: 'manufacturing-2',
        question: 'What is the typical turnaround time?',
        answer: 'Prototypes: 3-7 days. Small batches: 7-14 days. Mass production: 14-30 days depending on quantity and complexity. Expedited services are available for most manufacturers.'
      },
      {
        id: 'manufacturing-3',
        question: 'Do you offer design for manufacturability (DFM) checks?',
        answer: 'Yes, all designs undergo automated DFM analysis. Our engineers provide feedback on potential issues before production begins, saving time and cost.'
      }
    ],
    shipping: [
      {
        id: 'shipping-1',
        question: 'Where do you ship?',
        answer: 'We ship worldwide from Armenia. Major destinations include EU, US, Russia, Middle East, and Asia. All shipments include tracking and insurance.'
      },
      {
        id: 'shipping-2',
        question: 'What are the shipping costs and methods?',
        answer: 'Shipping costs vary by weight, destination, and speed. Options include DHL, FedEx, UPS, and local postal services. You\'ll see shipping quotes before confirming your order.'
      },
      {
        id: 'shipping-3',
        question: 'Do you handle customs and import duties?',
        answer: 'We handle all export documentation from Armenia. Import duties and taxes are the responsibility of the recipient, but we provide all necessary paperwork to facilitate clearance.'
      }
    ],
    payment: [
      {
        id: 'payment-1',
        question: 'What payment methods do you accept?',
        answer: 'We accept bank transfers, credit cards (Visa/Mastercard), PayPal, and cryptocurrency (BTC, ETH). Payment terms are available for enterprise customers.'
      },
      {
        id: 'payment-2',
        question: 'When is payment required?',
        answer: 'For prototypes: 100% upfront. For production orders: 50% deposit with order confirmation, 50% before shipping. Milestone payments available for large orders.'
      },
      {
        id: 'payment-3',
        question: 'Is VAT included in the prices?',
        answer: 'Prices are shown exclusive of VAT. Armenian VAT (20%) applies to orders shipped within Armenia. For international orders, VAT/duties depend on the destination country\'s regulations.'
      }
    ]
  };

  // Категории для навигации
  const categories = [
    { id: 'general', name: 'General', icon: 'fas fa-info-circle' },
    { id: 'ordering', name: 'Ordering', icon: 'fas fa-shopping-cart' },
    { id: 'manufacturing', name: 'Manufacturing', icon: 'fas fa-industry' },
    { id: 'shipping', name: 'Shipping', icon: 'fas fa-shipping-fast' },
    { id: 'payment', name: 'Payment', icon: 'fas fa-credit-card' }
  ];

  return (
    <div className="faq-page">
      {/* Заголовок страницы */}
      <div className="faq-header">
        <div className="faq-header-content">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about PCB manufacturing, ordering, shipping, and payments</p>
        </div>
        <div className="faq-header-stats">
          <div className="stat-card">
            <i className="fas fa-question-circle"></i>
            <div>
              <h3>{Object.values(faqData).flat().length}</h3>
              <p>Questions Answered</p>
            </div>
          </div>
        </div>
      </div>

      <div className="faq-container">
        {/* Левая панель - навигация по категориям */}
        <div className="faq-sidebar">
          <div className="sidebar-section">
            <h3>Categories</h3>
            <div className="category-list">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <i className={category.icon}></i>
                  <span>{category.name}</span>
                  <span className="category-count">
                    {faqData[category.id]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Need Help?</h3>
            <div className="help-links">
              <Link to="/support" className="help-link">
                <i className="fas fa-headset" id='fa-head'></i>
                <span>Contact Support</span>
              </Link>
              <Link to="/manufacturers" className="help-link">
                <i className="fas fa-industry"></i>
                <span>Find Manufacturers</span>
              </Link>
              <button className="help-link" onClick={() => window.open('mailto:support@pcbhub.am')}>
                <i className="fas fa-envelope"></i>
                <span>Email Us</span>
              </button>
            </div>
          </div>
        </div>

        {/* Основной контент - вопросы и ответы */}
        <div className="faq-content">
          <div className="faq-category-header">
            <div className="category-title">
              <i className={categories.find(c => c.id === activeCategory)?.icon}></i>
              <h2>{categories.find(c => c.id === activeCategory)?.name}</h2>
            </div>
            <div className="category-description">
              <p>
                {activeCategory === 'general' && 'General information about our platform and services'}
                {activeCategory === 'ordering' && 'Questions about placing orders, file requirements, and quantities'}
                {activeCategory === 'manufacturing' && 'Technical details about manufacturing capabilities and processes'}
                {activeCategory === 'shipping' && 'Information about shipping, delivery, and customs'}
                {activeCategory === 'payment' && 'Payment methods, terms, and pricing information'}
              </p>
            </div>
          </div>

          <div className="faq-items">
            {faqData[activeCategory]?.map(item => (
              <FAQItem
                key={item.id}
                item={item}
                isOpen={openItems[item.id]}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </div>

          {/* Раздел "Не нашли ответ?" */}
          <div className="faq-cta">
            <div className="cta-content">
              <i className="fas fa-comments"></i>
              <div>
                <h3>Still have questions?</h3>
                <p>Can't find what you're looking for? Our support team is ready to help you with any questions about PCB manufacturing.</p>
              </div>
              <Link to="/support" className="cta-btn">
                <i className="fas fa-paper-plane"></i>
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент FAQ элемента с анимацией раскрытия
const FAQItem = ({ item, isOpen, onToggle }) => {
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <div className="faq-question" onClick={onToggle}>
        <div className="question-text">
          <h4>{item.question}</h4>
        </div>
        <div className="question-toggle">
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
      </div>
      <div className="faq-answer">
        <p>{item.answer}</p>
        {item.id === 'general-1' && (
          <div className="answer-actions">
            <button className="action-btn">
              <i className="fas fa-play-circle"></i>
              Watch Platform Tour
            </button>
            <button className="action-btn">
              <i className="fas fa-file-alt"></i>
              Read Documentation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQPage;