import React from 'react';

const StudentDetails = ({ student }) => {
    if (!student) return null;

    return (
        <div className="student-details">
            <div className="profile-image-container">
                <img src={student.imageUrl} alt={`${student.name}'s profile`} className="profile-image" />
            </div>
            <h2>{student.name}</h2>
            <div className="info-container">
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
        </div>
    );
};

export default StudentDetails; 