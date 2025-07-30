import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendContactForm } from '../../services/ContactService';
import './Contacts.scss';
import SuccessModal from './SuccessModal';


const Contacts = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    customSubject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(false);

    try {
      const finalSubject = formData.subject === 'other'
        ? formData.customSubject
        : t(`contacts.subject${capitalizeFirstLetter(formData.subject)}`);
      
      await sendContactForm({ ...formData, subject: finalSubject });
      
      setSubmitSuccess(true);
      setIsModalOpen(true);
      setFormData({ name: '', email: '', subject: '', customSubject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
    
  };

  return (
    <section id="contacts" className="contact-section">
      <div className="contact-container">
        <div className="contact-header">
          <h2 className="section-title">{t('contacts.title')}</h2>
          <p className="section-subtitle">{t('contacts.subtitle')}</p>
        </div>
        
        <div className="contact-content">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group floating-label">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={formData.name ? 'has-value' : ''}
                />
                <label htmlFor="name">{t('contacts.name')}</label>
                <span className="input-border"></span>
              </div>
              
              <div className="form-group floating-label">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={formData.email ? 'has-value' : ''}
                />
                <label htmlFor="email">{t('contacts.email')}</label>
                <span className="input-border"></span>
              </div>
              
              <div className="form-group floating-label select-group">
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={formData.subject ? 'has-value' : ''}
                >
                  <option value=""></option>
                  <option value="training">{t('contacts.subjectTraining')}</option>
                  <option value="trial">{t('contacts.subjectTrial')}</option>
                  <option value="shoes">{t('contacts.subjectShoes')}</option>
                  <option value="media">{t('contacts.subjectMedia')}</option>
                  <option value="other">{t('contacts.subjectOther')}</option>
                </select>
                <label htmlFor="subject">{t('contacts.subject')}</label>
                <span className="input-border"></span>
                <div className="select-arrow"></div>
              </div>
              
              {formData.subject === 'other' && (
                <div className="form-group floating-label">
                  <input
                    type="text"
                    id="customSubject"
                    name="customSubject"
                    value={formData.customSubject}
                    onChange={handleChange}
                    required
                    className={formData.customSubject ? 'has-value' : ''}
                  />
                  <label htmlFor="customSubject">{t('contacts.customSubject')}</label>
                  <span className="input-border"></span>
                </div>
              )}
              
              <div className="form-group floating-label textarea-group">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className={formData.message ? 'has-value' : ''}
                ></textarea>
                <label htmlFor="message">{t('contacts.message')}</label>
                <span className="input-border"></span>
              </div>
            </div>
            
            <div className="form-footer">
              <button 
                type="submit" 
                className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                <span className="button-text">
                  {isSubmitting ? t('contacts.sending') : t('contacts.send')}
                </span>
                {isSubmitting && <span className="button-spinner"></span>}
              </button>
              
              {(submitSuccess || submitError) && (
                <div className={`form-message ${submitSuccess ? 'success' : 'error'}`}>
                  {submitSuccess ? t('contacts.successMessage') : t('contacts.errorMessage')}
                </div>
              )}
            </div>
          </form>

          <div className="contact-info">
            <div className="map-section">
              <h3 className="info-title">{t('contacts.location')}</h3>
              <div className="map-container">
                <iframe
                  title="Google Map Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d526.4989883006733!2d27.466541253362816!3d42.519356308306406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40a695df713ef1f3%3A0x7d40c314b363a210!2z0J_Rg9C70YEg0JLQuNGC0LDQuyDRgdC_0L7RgNGC!5e1!3m2!1sbg!2sbg!4v1729614985370!5m2!1sbg!2sbg"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className="contact-details">
              <h3 className="info-title">{t('contacts.contactDetails')}</h3>
              <ul className="details-list">
                <li className="detail-item">
                  <span className="detail-icon">📧</span>
                  <span>jumpwithjenny.kj@gmail.com
                  </span>
                </li>
                <li className="detail-item">
                  <span className="detail-icon">📱</span>
                  <span>+359 88 4984167</span>
                </li>
                <li className="detail-item">
                  <span className="detail-icon">🏢</span>
                  <span>ж.к. Зорница, 75, партер, Бургас</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <SuccessModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
  
};

export default Contacts;