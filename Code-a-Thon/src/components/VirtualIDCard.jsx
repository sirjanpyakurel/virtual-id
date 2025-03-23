import React from 'react';
import tigerLogo from "../assets/tiger.png";

const VirtualIDCard = ({ student, onReset }) => {
    if (!student) return null;

    const handleSendEmail = async () => {
        try {
            const response = await fetch('https://virtual-id-backend.onrender.com/send-id-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: student.email,
                    studentData: {
                        name: student.name,
                        studentId: student.studentId,
                        major: student.major,
                        imageUrl: student.imageUrl
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert('ID card sent to your email successfully!');
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Failed to send ID card to email. Please try again.');
        }
    };

    // Generate barcode URL using the student's ID
    const barcodeUrl = `https://barcodeapi.org/api/128/${student.studentId}`;

    return (
        <div className="virtual-id-container">
            <div className="virtual-id-card">
                <div className="id-card-front">
                    <div className="id-card-header">
                        <div className="id-card-logo">
                            <img src={tigerLogo} alt="TSU Logo" />
                            <div className="id-card-title">
                                <h3>TENNESSEE STATE UNIVERSITY</h3>
                                <span>Student ID Card</span>
                            </div>
                        </div>
                    </div>

                    <div className="id-card-body">
                        <div className="id-card-photo">
                            <img 
                                src={student.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=ffffff&color=4a148c&size=200`}
                                alt={student.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="id-card-info">
                            <div className="info-item">
                                <label>Name</label>
                                <span>{student.name}</span>
                            </div>
                            <div className="info-item">
                                <label>ID Number</label>
                                <span>{student.studentId}</span>
                            </div>
                            <div className="info-item">
                                <label>Major</label>
                                <span>{student.major}</span>
                            </div>
                        </div>
                    </div>

                    <div className="barcode-container">
                        <img 
                            src={barcodeUrl}
                            alt="Barcode"
                            style={{ maxWidth: '80%', height: 'auto' }}
                        />
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <button className="form-button send-email-button" onClick={handleSendEmail}>
                    Send to Email
                </button>
                <button className="form-button reset-button" onClick={onReset}>
                    Start Over
                </button>
            </div>
        </div>
    );
};

export default VirtualIDCard; 