import React, { useState } from 'react';
import "./App.css";
import tigerLogo from "./assets/tiger.png";
import { students } from "./data/students";
import VirtualIDCard from './components/VirtualIDCard';
import WalletCard from './components/WalletCard';
import StudentIDCard from './components/StudentIDCard';

const Form = () => {
    const [formData, setFormData] = useState({
        email: '',
        campusId: '',
        name: '',
        tNumber: '',
        major: '',
        photo: null
    });
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [student, setStudent] = useState(null);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showIDCard, setShowIDCard] = useState(false);
    const [isInfoConfirmed, setIsInfoConfirmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [studentData, setStudentData] = useState(null);

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
                    // Send OTP via SendGrid
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
                // Verify OTP
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

                // Double check the response
                if (data.message !== "OTP verified successfully") {
                    throw new Error('Invalid OTP verification response');
                }

                // Only proceed if we have both successful verification and valid student data
                if (student && data.message === "OTP verified successfully") {
                    setShowConfirmation(true);
                    setIsValidated(true);
                    setStudentData({
                        ...student,
                        validUntil: new Date().toLocaleDateString(),
                    });
                } else {
                    throw new Error('Verification failed. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err.message);
            if (err.message.includes('expired') || err.message.includes('No OTP found')) {
                // Reset OTP input and allow requesting new OTP
                setOtp('');
                setShowOtpInput(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            email: '',
            campusId: '',
            name: '',
            tNumber: '',
            major: '',
            photo: null
        });
        setShowOtpInput(false);
        setOtp('');
        setStudent(null);
        setError('');
        setShowConfirmation(false);
        setShowIDCard(false);
        setIsInfoConfirmed(false);
        setIsValidated(false);
        setStudentData(null);
    };

    const handleConfirmation = (confirmed) => {
        if (confirmed) {
            setShowIDCard(true);
            setShowConfirmation(false);
        } else {
            setShowConfirmation(false);
        }
    };

    const handleOTPSuccess = () => {
        setShowConfirmation(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
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
                    className="form-button confirm-button"
                >
                    Yes, Information is Correct
                </button>
                <button 
                    onClick={() => handleConfirmation(false)} 
                    className="form-button deny-button"
                >
                    No, Information is Incorrect
                </button>
            </div>
        </div>
    );

    return (
        <div className="form-container">
            {!showConfirmation && !showIDCard && (
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
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Full Name"
                                    required
                                />
                                <input
                                    type="text"
                                    name="tNumber"
                                    value={formData.tNumber}
                                    onChange={handleInputChange}
                                    placeholder="T Number"
                                    required
                                />
                                <input
                                    type="text"
                                    name="major"
                                    value={formData.major}
                                    onChange={handleInputChange}
                                    placeholder="Major"
                                    required
                                />
                                <button 
                                    type="submit" 
                                    className="form-button"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : (showOtpInput ? 'Verify OTP' : 'Submit')}
                                </button>
                            </form>
                            
                            {error && <div className="error-message">{error}</div>}
                        </div>
                    ) : (
                        <div className="verification-success">
                            {!isInfoConfirmed ? (
                                renderStudentInfo()
                            ) : (
                                <>
                                    <div className="success-message">Information verified successfully!</div>
                                    <VirtualIDCard student={student} />
                                    <button onClick={handleReset} className="form-button reset-button">
                                        Start Over
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {showConfirmation && !showIDCard && (
                <div className="confirmation-dialog">
                    <h3>Please confirm your information:</h3>
                    <div className="info-preview">
                        <p><strong>Name:</strong> {formData.name}</p>
                        <p><strong>T Number:</strong> {formData.tNumber}</p>
                        <p><strong>Major:</strong> {formData.major}</p>
                    </div>
                    <div className="confirmation-buttons">
                        <button onClick={() => handleConfirmation(true)}>
                            Yes, Create ID Card
                        </button>
                        <button onClick={() => handleConfirmation(false)}>
                            No, Edit Information
                        </button>
                    </div>
                </div>
            )}
            
            {showIDCard && (
                <StudentIDCard studentData={formData} />
            )}
        </div>
    );
};

export default Form;
