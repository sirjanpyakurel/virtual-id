import './App.css';
import tigerLogo from './assets/tiger.png';

export default function Header() {
    return (
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-logos">
              <img src={tigerLogo} alt="TSU Tiger" className="header-tiger-logo" />
              <img src="/id-card.svg" alt="ID Card" className="header-id-logo" />
            </div>
            <div className="header-text">
              <h1>TSU Virtual Student ID Card</h1>
              <p>Tennessee State University</p>
            </div>
          </div>
        </div>
      </header>
    );
}