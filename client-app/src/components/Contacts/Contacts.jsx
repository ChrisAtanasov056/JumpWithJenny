import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { sendContactForm } from '../../services/ContactService';
import { useCookieConsent } from '../../services/CookieConsentContext';
import SuccessModal from './SuccessModal';
import './Contacts.scss';

const Contacts = () => {
  const { t } = useTranslation();
  const { functionalAllowed, enableFunctional } = useCookieConsent();
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

  const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(false);

    try {
      const finalSubject =
        formData.subject === 'other'
          ? formData.customSubject
          : formData.subject
            ? t(`contacts.subject${capitalizeFirstLetter(formData.subject)}`)
            : '';

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
    <section id="contacts" className="alt-section contact-section" aria-labelledby="contacts-title">
      <div className="alt-wrap">
        <div className="contact-header">
          <h2 id="contacts-title" className="alt-section-title">
            {t('contacts.title')}
          </h2>
          <p className="contact-subtitle">{t('contacts.subtitle')}</p>
        </div>

        <div className="contact-grid">
          <form className="contact-form-card" onSubmit={handleSubmit}>
            <div className="contact-fields">
              <div className="contact-field">
                <label htmlFor="contact-name">{t('contacts.name')}</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('contacts.name')}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">{t('contacts.email')}</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('contacts.email')}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">{t('contacts.subject')}</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('contacts.selectSubject')}</option>
                  <option value="training">{t('contacts.subjectTraining')}</option>
                  <option value="trial">{t('contacts.subjectTrial')}</option>
                  <option value="shoes">{t('contacts.subjectShoes')}</option>
                  <option value="media">{t('contacts.subjectMedia')}</option>
                  <option value="other">{t('contacts.subjectOther')}</option>
                </select>
              </div>

              {formData.subject === 'other' && (
                <div className="contact-field">
                  <label htmlFor="contact-customSubject">{t('contacts.customSubject')}</label>
                  <input
                    type="text"
                    id="contact-customSubject"
                    name="customSubject"
                    value={formData.customSubject}
                    onChange={handleChange}
                    placeholder={t('contacts.customSubject')}
                    required
                  />
                </div>
              )}

              <div className="contact-field">
                <label htmlFor="contact-message">{t('contacts.message')}</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('contacts.message')}
                  required
                  rows={4}
                />
              </div>
            </div>

            <div className="contact-form-footer">
              <button
                type="submit"
                className="alt-btn contact-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('contacts.sending') : t('contacts.send')}
              </button>

              {(submitSuccess || submitError) && (
                <div
                  className={`contact-status ${submitSuccess ? 'is-success' : 'is-error'}`}
                  role={submitError ? 'alert' : 'status'}
                >
                  {submitSuccess ? t('contacts.successMessage') : t('contacts.errorMessage')}
                </div>
              )}
            </div>
          </form>

          <div className="contact-info-col">
            <div className="contact-glass-card">
              <h3>{t('contacts.location')}</h3>
              <div className="contact-map-wrap">
                {functionalAllowed ? (
                  <iframe
                    title={t('contacts.location')}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d526.4989883006733!2d27.466541253362816!3d42.519356308306406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40a695df713ef1f3%3A0x7d40c314b363a210!2z0J_Rg9C70YEg0JLQuNGC0LDQuyDRgdC_0L7RgNGC!5e1!3m2!1sbg!2sbg!4v1729614985370!5m2!1sbg!2sbg"
                    loading="lazy"
                    allowFullScreen
                  />
                ) : (
                  <div className="contact-map-placeholder">
                    <div className="contact-map-placeholder__pin" aria-hidden="true">
                      <FaMapMarkerAlt />
                    </div>
                    <p className="contact-map-placeholder__address">{t('contacts.address')}</p>
                    <p className="contact-map-placeholder__desc">{t('cookies.mapBlockedDescription')}</p>
                    <div className="contact-map-placeholder__actions">
                      <button
                        type="button"
                        className="alt-btn contact-map-placeholder__btn"
                        onClick={enableFunctional}
                      >
                        {t('cookies.mapEnableButton')}
                      </button>
                      <a
                        href="https://maps.google.com/?q=42.5193563,27.4665412"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-map-placeholder__link"
                      >
                        <span>{t('cookies.mapOpenExternal')}</span>
                        <FaExternalLinkAlt aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="contact-glass-card">
              <h3>{t('contacts.contactDetails')}</h3>
              <ul className="contact-details-list">
                <li>
                  <FaEnvelope aria-hidden="true" />
                  <a href="mailto:jumpwithjenny.kj@gmail.com">jumpwithjenny.kj@gmail.com</a>
                </li>
                <li>
                  <FaPhoneAlt aria-hidden="true" />
                  <a href="tel:+359884984167">+359 88 4984167</a>
                </li>
                <li>
                  <FaMapMarkerAlt aria-hidden="true" />
                  <span>{t('contacts.address')}</span>
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
