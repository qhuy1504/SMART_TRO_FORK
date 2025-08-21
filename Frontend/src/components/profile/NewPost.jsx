import React from 'react';
import { useTranslation } from 'react-i18next';
import './ProfilePages.css';

const NewPost = () => {
  const { t } = useTranslation();
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>
          <i className="fa fa-plus-circle"></i>
          {t('profile.newPost.title')}
        </h2>
        <p>{t('profile.newPost.subtitle')}</p>
      </div>

      <div className="content-card">
        <div className="coming-soon">
          <i className="fa fa-clock-o"></i>
          <h3>{t('profile.newPost.comingSoon.title')}</h3>
          <p>{t('profile.newPost.comingSoon.message')}</p>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
