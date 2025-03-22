import React from 'react';
import './WalletCard.css';

export default function WalletCard({ studentData }) {
  return (
    <div className="wallet-card">
      <div className="wallet-card-header">
        <h2>Tennessee State University</h2>
        <span className="card-type">Student ID</span>
      </div>
      
      <div className="wallet-card-body">
        <div className="student-photo">
          {studentData.photo && (
            <img src={studentData.photo} alt="Student" />
          )}
        </div>
        
        <div className="student-info">
          <div className="info-row">
            <label>Name</label>
            <span>{studentData.name}</span>
          </div>
          <div className="info-row">
            <label>T Number</label>
            <span>{studentData.tNumber}</span>
          </div>
          <div className="info-row">
            <label>Major</label>
            <span>{studentData.major}</span>
          </div>
          <div className="info-row">
            <label>Valid Until</label>
            <span>{studentData.validUntil}</span>
          </div>
        </div>
        
        <div className="wallet-card-footer">
          <div className="barcode">
            {/* We'll add barcode/QR code here later */}
          </div>
          <div className="wallet-buttons">
            <button className="apple-wallet-btn">Add to Apple Wallet</button>
            <button className="google-wallet-btn">Add to Google Wallet</button>
          </div>
        </div>
      </div>
    </div>
  );
} 