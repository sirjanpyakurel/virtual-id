import React from 'react';
import tigerLogo from "../assets/tiger.png";

const VirtualIDCard = ({ student, onReset }) => {
    if (!student) return null;

    const handleSendEmail = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://virtual-id-backend.onrender.com';
            const response = await fetch(`${apiUrl}/send-id-card`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: student.email,
                    studentData: student
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send ID card');
            }

            alert('ID card sent successfully to your email!');
        } catch (error) {
            console.error('Error sending ID card:', error);
            alert('Failed to send ID card. Please try again.');
        }
    };

    return (
        <div className="virtual-id-card">
            <div className="id-card-header">
                <div className="id-card-logo">
                    <img src={tigerLogo} alt="TSU Logo" />
                    <div className="id-card-title">
                        <h3>TENNESSEE STATE UNIVERSITY</h3>
                        <span>Student Identification</span>
                    </div>
                </div>
            </div>
            <div className="id-card-body">
                <div className="id-card-photo">
                    <img 
                        src={student.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=003366&color=fff&size=200`}
                        alt={student.name} 
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
                    <div className="info-item">
                        <label>Classification</label>
                        <span>{student.classification}</span>
                    </div>
                </div>
            </div>
            <div className="barcode-container">
                <div className="barcode">
                    <img 
                        src={`https://barcode.tec-it.com/barcode.ashx?data=${student.studentId}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=&width=&height=50&minwidth=2`}
                        alt="Student ID Barcode"
                    />
                </div>
            </div>
            <div className="id-card-footer">
                <div className="validity">
                    <span>Valid through: 2024-2025</span>
                </div>
                <div className="signature">
                    <span>Authorized Signature</span>
                    <div className="signature-line"></div>
                </div>
            </div>
            <div className="card-actions">
                <button onClick={handleSendEmail} className="form-button send-email-button">
                    Send to Email
                </button>
                <button onClick={onReset} className="form-button reset-button">
                    Start Over
                </button>
            </div>
        </div>
    );
};

export default VirtualIDCard; 