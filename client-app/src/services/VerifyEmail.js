import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../services/AuthContext'; // Import your auth context
import './VerifyEmail.css';

const VerifyEmail = () => {
    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const userId = queryParams.get('userId'); // Get userId from the URL
    const token = queryParams.get('token'); // Get token from the URL
    const navigate = useNavigate();
    
    const { user } = useAuth(); // Get user from auth context
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const confirmEmail = async () => {
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

                console.log("API Response:", response);
                setMessage('Your email has been successfully verified!');
                setIsError(false);
            } catch (error) {
                console.error("Verification error:", error);
                setMessage('Error confirming email. Please try again.');
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        confirmEmail();
    }, [userId, token]);

    return (
        <div className="verify-container">
            <div className="verify-box">
                <h2>Email Verification</h2>
                {isLoading ? (
                    <div className="loading-spinner">Loading...</div>  // Add a CSS spinner if needed
                ) : (
                    <div className={`message-container ${isError ? 'message-error' : 'message-success'}`}>
                        {message}
                    </div>
                )}
                
                {/* Show button only if user is not logged in */}
                {user && <button onClick={() => navigate('/')}>Go to Home</button>}
            </div>
        </div>
    );
};

export default VerifyEmail;