import React from 'react';
import './StudentIDCard.css';

export default function StudentIDCard({ studentData }) {
  return (
    <div className="id-card">
      <div className="id-card-header">
        <h2>Tennessee State University</h2>
        <span>Student Identification Card</span>
      </div>
      
      <div className="id-card-body">
        <div className="photo-section">
          {studentData.photo && (
            <img 
              src={studentData.photo} 
              alt="Student" 
              className="student-photo"
            />
          )}
        </div>
        
        <div className="details-section">
          <div className="info-item">
            <label>Name:</label>
            <span>{studentData.name || 'N/A'}</span>
          </div>
          
          <div className="info-item">
            <label>T Number:</label>
            <span>{studentData.tNumber || 'N/A'}</span>
          </div>
          
          <div className="info-item">
            <label>Major:</label>
            <span>{studentData.major || 'N/A'}</span>
          </div>
          
          <div className="info-item">
            <label>Valid Until:</label>
            <span>December 1, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
} 