import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import './VerifyEmail.css';
import axios from 'axios';

const VerifyEmail = () => {
    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const userId = queryParams.get('userId');
    const token = queryParams.get('token');
    const navigate = useNavigate();
    
    const { updateUser } = useAuth(); // Destructure updateUser
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const confirmAndUpdateUser = async () => {
            if (!userId || !token) {
                setMessage('Invalid verification link.');
                setIsError(true);
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.post(`https://localhost:7024/Account/confirmemail`, {
                    userId: userId,
                    token: token 
                });

                if (response.status === 200) {
                    // Use the updated user data from the response
                    updateUser({
                        ...response.data.user,
                        emailConfirmed: true
                    });
                }

                setMessage('Your email has been successfully verified!');
                setIsError(false);
            } catch (error) {
                console.error("Verification error:", error);
                setMessage(error.response?.data?.title || 'Error confirming email. Please try again.');
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        confirmAndUpdateUser();
    }, [userId, token, updateUser]);

    return (
        <div className="verify-container">
            <div className="verify-box">
                <h2>Email Verification</h2>
                {isLoading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : (
                    <div className={`message-container ${isError ? 'message-error' : 'message-success'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;