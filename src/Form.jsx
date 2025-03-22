import React, { useState } from 'react';
import "./App.css";
import tigerLogo from "./assets/tiger.png"; // Import the image
import { students } from "./data/students";
import StudentDetails from "./components/StudentDetails";

const Form = () => {
    const [formData, setFormData] = useState({
        email: '',
        campusId: ''
    });
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [studentInfo, setStudentInfo] = useState(null);
    const DEFAULT_OTP = '000000';

    const findStudent = (email, campusId) => {
        return students.find(student => 
            student.email.toLowerCase() === email.toLowerCase() && 
            student.studentId === campusId
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!showOtpInput) {
            const student = findStudent(formData.email, formData.campusId);
            if (student) {
                setShowOtpInput(true);
            } else {
                alert('Student not found. Please check your email and campus ID.');
            }
        } else {
            if (otp === DEFAULT_OTP) {
                const student = findStudent(formData.email, formData.campusId);
                setStudentInfo(student);
            } else {
                alert('Invalid OTP. Please try again.');
            }
        }
    };

    const handleReset = () => {
        setFormData({ email: '', campusId: '' });
        setShowOtpInput(false);
        setOtp('');
        setStudentInfo(null);
    };

    if (studentInfo) {
        return (
            <div className="form-container">
                <div className="form-header">
                    <img src={tigerLogo} alt="tiger" className="form-image" />
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <StudentDetails student={studentInfo} />
                        <button 
                            className="form-button reset-button"
                            onClick={handleReset}
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="form-container">
            <div className="form-header">
                <img src={tigerLogo} alt="tiger" className="form-image" />
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
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        )}
                        <button type="submit" className="form-button">
                            {showOtpInput ? 'Verify OTP' : 'Submit'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Form;
