import './App.css';

export default function Header() {
    return (
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <img src="/id-card.svg" alt="TSU Logo" className="header-logo" />
            <div className="header-text">
              <h1>TSU Virtual Student ID Card</h1>
              <p>Tennessee State University</p>
            </div>
          </div>
        </div>
      </header>
    );
}