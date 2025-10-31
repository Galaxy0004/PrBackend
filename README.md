# MeritMaze - Backend 

Welcome to the backend repository for **MeritMaze**. This server powers the entire MeritMaze application, handling everything from user authentication and data storage to real-time interactions and AI integrations.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)



## 📋 Table of Contents

* [About The Project](#about-the-project)
* [Key Features](#key-features)
* [Tech Stack](#tech-stack)
* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
* [Project Structure](#project-structure)
* [API Endpoints](#api-endpoints)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

---

## 🌟 About The Project

This backend is a robust RESTful API built with Node.js, Express, and MongoDB. It serves as the central nervous system for the MeritMaze platform, providing the necessary endpoints for the React frontend to consume. It manages user data, study logs, notes, study rooms, forum content, and integrates with third-party services like Google OAuth and the Gemini AI API.

---

## 🔥 Key Features

* **🔒 Secure Authentication**: Implements Google OAuth 2.0 strategy using **Passport.js** for secure and seamless user authentication.
* **📝 RESTful API**: A well-structured API for all CRUD (Create, Read, Update, Delete) operations related to users, notes, rooms, study logs, and forum posts.
* **🤖 Gemini AI Integration**: Server-side logic to securely handle requests to the Gemini API for the chatbot and self-quizzing features.
* **💾 MongoDB Integration**: Utilizes **Mongoose** for elegant and straightforward schema-based modeling of application data stored in MongoDB.
* **⚙️ Scalable Architecture**: Organized into controllers, models, and routes for maintainability and scalability.

---

## 💻 Tech Stack

* **Runtime**: [Node.js](https://nodejs.org/)
* **Framework**: [Express.js](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
* **Authentication**: [Passport.js](http://www.passportjs.org/) (passport-google-oauth20)
* **Environment Variables**: [dotenv](https://www.npmjs.com/package/dotenv)

---

## 🚀 Getting Started

To get the backend server running locally, follow these steps.

### Prerequisites

Make sure you have Node.js, npm, and MongoDB (running either locally or via a cloud service like MongoDB Atlas) installed.
* npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repository**
    ```sh
    git clone [https://github.com/your-username/meritmaze-backend.git](https://github.com/your-username/meritmaze-backend.git)
    ```
2.  **Navigate to the project directory**
    ```sh
    cd meritmaze-backend
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Create a `.env` file** in the root directory and add the following environment variables.
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string

    GOOGLE_CLIENT_ID=your_google_client_id_from_google_cloud_console
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    GEMINI_API_KEY=your_google_gemini_api_key

    # A secret for session management or JWTs
    SESSION_SECRET=a_very_strong_and_random_secret_key
    ```
5.  **Start the server**
    ```sh
    npm start
    ```
    The API server will be running on `http://localhost:5000`.

---

## 📂 Project Structure

The backend codebase is organized as follows:

```
.
├── config/          # Database connection (db.js) and Passport.js strategy (passport.js)
├── controllers/     # Business logic for handling requests (authController.js, etc.)
├── models/          # Mongoose schemas for MongoDB collections (User.js, Note.js, etc.)
├── routes/          # API endpoint definitions and routing
├── .env             # Environment variables (not committed to Git)
└── server.js        # The main entry point for the Express application
```

---

## 📡 API Endpoints

The API provides several endpoints to manage application data. Here is a high-level overview:

* `POST /api/auth/google`: Initiate Google OAuth flow.
* `GET /api/auth/google/callback`: Callback URL for Google OAuth.
* `GET /api/auth/logout`: Log out the current user.
* `GET /api/user/profile`: Get profile data for the logged-in user.
* `POST /api/notes`: Create a new note.
* `GET /api/notes`: Get all notes for the logged-in user.
* `POST /api/rooms`: Create a new study room.
* `POST /api/forum/ask`: Post a new question to the forum.
* `POST /api/gemini/quiz`: Endpoint to generate a quiz using the Gemini API.

... and many more for handling all application features.

---

## 🤝 Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request


---

## 📬 Contact

Mail : llikhitha004@gmail.com

Project Link: [https://github.com/your-username/meritmaze-backend](https://github.com/your-username/meritmaze-backend)
