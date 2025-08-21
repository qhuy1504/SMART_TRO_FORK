import React from 'react';
import { useTranslation } from 'react-i18next';
import './ProfilePages.css';

const MyPosts = () => {
  const { t } = useTranslation();
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>
          <i className="fa fa-list"></i>
          {t('profile.myPosts.title')}
        </h2>
        <p>{t('profile.myPosts.subtitle')}</p>
      </div>

      <div className="content-card">
        <div className="coming-soon">
          <i className="fa fa-list-alt"></i>
          <h3>{t('profile.myPosts.comingSoon.title')}</h3>
          <p>{t('profile.myPosts.comingSoon.message')}</p>
        </div>
      </div>
    </div>
  );
};

export default MyPosts;
