import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from 'react-i18next';
import './VerifyEmail.css';
import api from '../services/api';

const VerifyEmail = () => {
    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const userId = queryParams.get('userId');
    const token = queryParams.get('token');

    const { updateUser } = useAuth();
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const confirmAndUpdateUser = async () => {
            setIsLoading(true);
            if (!userId || !token) {
                setMessage(t('Invalid verification link.'));
                setIsError(true);
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.post('/Account/confirmemail', {
                    userId,
                    token,
                    language: i18n.language,
                });

                if (response.status === 200) {
                    updateUser({
                        ...response.data.user,
                        emailConfirmed: true,
                    });
                    setMessage(t('Your email has been successfully verified!'));
                    setIsError(false);
                }
            } catch (error) {
                console.error("Verification error:", error);
                setMessage(error.response?.data?.title || t('Error confirming email. Please try again.'));
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        confirmAndUpdateUser();
    }, [userId, token, updateUser, i18n.language, t]);

    useEffect(() => {
        if (!isLoading && !isError) {
            const timer = setTimeout(() => {
                navigate('/');
            }, 7000); // Auto-redirect after 7 sec
            return () => clearTimeout(timer); // Cleanup on unmount
        }
    }, [isLoading, isError, navigate]);

    return (
        <div className="verify-container">
            <div className="verify-box">
                <h2>{t('Email Verification')}</h2>
                {isLoading ? (
                    <div className="loading-spinner">{t('Loading...')}</div>
                ) : (
                    <>
                        <div className={`message-container ${isError ? 'message-error' : 'message-success'}`}>
                            {message}
                        </div>
                        <button onClick={() => navigate('/')} className="return-home-btn">
                            {t('Return to Home')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
