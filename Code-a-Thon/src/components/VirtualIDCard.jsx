import React from 'react';

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
                    data: student
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
    const barcodeUrl = `https://barcodeapi.org/api/128/${student.campusId}`;

    return (
        <div className="virtual-id-card">
            <div className="id-card-front">
                <div className="id-card-header">
                    <div className="id-card-logo">
                        <img src="/logo.png" alt="University Logo" />
                        <div className="id-card-title">
                            <h3>STUDENT ID CARD</h3>
                            <span>University of Technology</span>
                        </div>
                    </div>
                </div>
                <div className="id-card-body">
                    <div className="id-card-photo">
                        <img 
                            src={student.photo}
                            alt="Student"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div className="id-card-info">
                        <div className="info-row">
                            <div className="info-item">
                                <label>Name</label>
                                <span>{student.name}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-item">
                                <label>ID Number</label>
                                <span>{student.campusId}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-item">
                                <label>Major</label>
                                <span>{student.major}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="barcode-container">
                    <img 
                        src={barcodeUrl}
                        alt="Barcode"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </div>
                <div className="card-actions">
                    <button className="form-button" onClick={handleSendEmail}>
                        Send to Email
                    </button>
                    <button className="form-button" onClick={onReset}>
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VirtualIDCard; 