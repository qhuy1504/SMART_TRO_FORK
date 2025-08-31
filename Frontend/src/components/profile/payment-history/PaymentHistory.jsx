import React from 'react';
import { useTranslation } from 'react-i18next';
import '../ProfilePages.css';

const PaymentHistory = () => {
  const { t } = useTranslation();
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>
          <i className="fa fa-credit-card"></i>
          {t('profile.paymentHistory.title')}
        </h2>
        <p>{t('profile.paymentHistory.subtitle')}</p>
      </div>

      <div className="content-card">
        <div className="coming-soon">
          <i className="fa fa-money"></i>
          <h3>{t('profile.paymentHistory.comingSoon.title')}</h3>
          <p>{t('profile.paymentHistory.comingSoon.message')}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
