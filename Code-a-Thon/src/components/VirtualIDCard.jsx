import React from 'react';
import tigerLogo from "../assets/tiger.png";

const VirtualIDCard = ({ student, onReset }) => {
    if (!student) return null;

    const handleSendEmail = async () => {
        try {
            // Convert avatar URL to base64 if using UI Avatars
            let imageData = null;
            const avatarUrl = student.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=ffffff&color=4a148c&size=200`;
            
            try {
                const response = await fetch(avatarUrl);
                const blob = await response.blob();
                imageData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error converting image to base64:', error);
            }

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
                        classification: student.classification || 'Student', // Default to 'Student' if not provided
                        imageUrl: imageData,
                        barcodeUrl: `https://barcodeapi.org/api/128/${student.studentId}`
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
                <div className="id-card-header">
                    <h1>Tennessee State University</h1>
                    <h2>Student ID Card</h2>
                </div>
                <div className="id-card-body">
                    <div className="student-info">
                        <p><strong>Name:</strong> {student.name}</p>
                        <p><strong>ID Number:</strong> {student.studentId}</p>
                        <p><strong>Major:</strong> {student.major}</p>
                        <p><strong>Classification:</strong> {student.classification || 'Student'}</p>
                    </div>
                    <div className="barcode-container">
                        <img src={barcodeUrl} alt="Barcode" />
                    </div>
                    <p className="valid-through">Valid through: 2024-2025</p>
                </div>
            </div>
            <div className="card-actions">
                <button className="action-button send-email-btn" onClick={handleSendEmail}>
                    Send to Email
                </button>
                <button className="action-button start-over-btn" onClick={onReset}>
                    Start Over
                </button>
            </div>
        </div>
    );
};

export default VirtualIDCard; 