import React, { useState } from 'react';
import "./App.css";
import tigerLogo from "./assets/tiger.png";
import { students } from "./data/students";
import VirtualIDCard from './components/VirtualIDCard';

const Form = () => {
    const [formData, setFormData] = useState({
        email: '',
        campusId: '',
    });
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [student, setStudent] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isInfoConfirmed, setIsInfoConfirmed] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const findStudent = (email, campusId) => {
        return students.find(s => 
            s.email.toLowerCase() === email.toLowerCase() && 
            s.studentId === campusId
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!showOtpInput) {
                const foundStudent = findStudent(formData.email, formData.campusId);
                if (foundStudent) {
                    const apiUrl = process.env.NODE_ENV === 'production' 
                        ? 'https://virtual-id-backend.onrender.com' 
                        : 'http://localhost:5002';
                    const response = await fetch(`${apiUrl}/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email })
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to send OTP');
                    }

                    setShowOtpInput(true);
                    setStudent(foundStudent);
                } else {
                    setError('Student not found. Please check your email and campus ID.');
                }
            } else {
                if (!otp || otp.length !== 6) {
                    throw new Error('Please enter a valid 6-digit OTP');
                }

                const apiUrl = process.env.NODE_ENV === 'production' 
                    ? 'https://virtual-id-backend.onrender.com' 
                    : 'http://localhost:5002';
                const response = await fetch(`${apiUrl}/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: formData.email, 
                        otp: parseInt(otp)
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Invalid OTP');
                }

                if (data.message === "OTP verified successfully" && student) {
                    setShowConfirmation(true);
                } else {
                    throw new Error('Verification failed. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err.message);
            if (err.message.includes('expired') || err.message.includes('No OTP found')) {
                setOtp('');
                setShowOtpInput(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ email: '', campusId: '' });
        setShowOtpInput(false);
        setOtp('');
        setStudent(null);
        setError('');
        setShowConfirmation(false);
        setIsInfoConfirmed(false);
        setEmailSent(false);
    };

    const handleConfirmation = (isCorrect) => {
        if (isCorrect) {
            setIsInfoConfirmed(true);
        } else {
            setError('Your information appears to be incorrect. Please visit the Administration Office (Room 105, Student Center) to update your records.');
            setShowConfirmation(false);
        }
    };

    const handleEmailSent = () => {
        setEmailSent(true);
        setTimeout(() => {
            handleReset();
        }, 3000);
    };

    const renderStudentInfo = () => (
        <div className="student-info-confirmation">
            <h3>Please verify your information:</h3>
            <div className="info-container">
                <div className="info-row">
                    <label>Name:</label>
                    <span>{student.name}</span>
                </div>
                <div className="info-row">
                    <label>Student ID:</label>
                    <span>{student.studentId}</span>
                </div>
                <div className="info-row">
                    <label>Email:</label>
                    <span>{student.email}</span>
                </div>
                <div className="info-row">
                    <label>Major:</label>
                    <span>{student.major}</span>
                </div>
                <div className="info-row">
                    <label>Classification:</label>
                    <span>{student.classification}</span>
                </div>
            </div>
            <div className="confirmation-buttons">
                <button 
                    onClick={() => handleConfirmation(true)} 
                    className="confirm-button"
                >
                    Yes, Information is Correct
                </button>
                <button 
                    onClick={() => handleConfirmation(false)} 
                    className="deny-button"
                >
                    No, Information is Incorrect
                </button>
            </div>
        </div>
    );

    return (
        <div className="form-container">
            <div className="form-header">
                <img src={tigerLogo} alt="tiger" className="form-image" />
                
                {!showConfirmation ? (
                    <div className="form-body">
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={showOtpInput}
                                required
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your campus ID"
                                value={formData.campusId}
                                onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                                disabled={showOtpInput}
                                required
                            />
                            {showOtpInput && (
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter OTP from your email"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            )}
                            <button 
                                type="submit" 
                                className="form-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : (showOtpInput ? 'Verify OTP' : 'Get OTP')}
                            </button>
                        </form>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                ) : (
                    <div className="verification-success">
                        {!isInfoConfirmed ? (
                            renderStudentInfo()
                        ) : (
                            <>
                                {emailSent ? (
                                    <div className="success-message">
                                        Email sent successfully! Redirecting...
                                    </div>
                                ) : (
                                    <>
                                        <div className="success-message">Information verified successfully!</div>
                                        <VirtualIDCard 
                                            student={student} 
                                            onReset={handleReset}
                                            onEmailSent={handleEmailSent}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Form;
