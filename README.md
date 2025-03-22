# Code-a-Thon Project

A full-stack web application built with Node.js, Express, and modern frontend technologies.

## Project Structure

- `Backend/` - Node.js/Express server
- `Code-a-Thon/` - Frontend application

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd Backend
   npm install
   
   # Install frontend dependencies
   cd ../Code-a-Thon
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the Backend directory
   - Copy `sendgrid.env.example` to `sendgrid.env` in the Code-a-Thon directory
   - Fill in the required environment variables

## Running the Application

1. Start the backend server:
   ```bash
   cd Backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd Code-a-Thon
   npm run dev
   ```

## Dependencies

### Backend
- Express.js
- CORS
- dotenv
- @sendgrid/mail

### Frontend
- Vite
- React
- ESLint

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.