import React from 'react';
import { useTranslation } from 'react-i18next';
import '../ProfilePages.css';

const Pricing = () => {
  const { t } = useTranslation();

  const pricingPlans = [
    {
      name: t('profile.pricing.plans.regular.name'),
      price: '2.000',
      duration: t('profile.pricing.plans.regular.duration'),
      features: t('profile.pricing.plans.regular.features', { returnObjects: true }),
      color: '#6c757d',
      popular: false
    },
    {
      name: t('profile.pricing.plans.vip1.name'),
      price: '20.000',
      duration: t('profile.pricing.plans.vip1.duration'),
      features: t('profile.pricing.plans.vip1.features', { returnObjects: true }),
      color: '#28a745',
      popular: false
    },
    {
      name: t('profile.pricing.plans.vip2.name'),
      price: '50.000',
      duration: t('profile.pricing.plans.vip2.duration'),
      features: t('profile.pricing.plans.vip2.features', { returnObjects: true }),
      color: '#ffc107',
      popular: true,
      popularText: t('profile.pricing.plans.vip2.popular')
    },
    {
      name: t('profile.pricing.plans.vip3.name'),
      price: '100.000',
      duration: t('profile.pricing.plans.vip3.duration'),
      features: t('profile.pricing.plans.vip3.features', { returnObjects: true }),
      color: '#dc3545',
      popular: false
    }
  ];

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>
          <i className="fa fa-table"></i>
          {t('profile.pricing.title')}
        </h2>
        <p>{t('profile.pricing.subtitle')}</p>
      </div>

      <div className="pricing-grid">
        {pricingPlans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">{plan.popularText || t('profile.pricing.plans.vip2.popular')}</div>}
            
            <div className="plan-header" style={{ backgroundColor: plan.color }}>
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="currency">đ</span>
              </div>
              <p className="duration">{plan.duration}</p>
            </div>

            <div className="plan-features">
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <i className="fa fa-check"></i>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="plan-footer">
              <button 
                className="btn-select"
                style={{ backgroundColor: plan.color }}
              >
                <i className="fa fa-credit-card"></i>
                {t('profile.pricing.selectPlan')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pricing-note">
        <div className="note-card">
          <h4>
            <i className="fa fa-info-circle"></i>
            {t('profile.pricing.notes.title')}
          </h4>
          <ul>
            {t('profile.pricing.notes.items', { returnObjects: true }).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
