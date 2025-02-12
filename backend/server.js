// backend/server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'mysecret'; // In production, use environment variables

// Middleware to parse JSON and handle CORS
app.use(express.json());
app.use(cors());

// Dummy user for demonstration purposes
const dummyUser = { id: 1, username: 'user', password: 'password' };

// LOGIN endpoint: Validate credentials and issue a JWT
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Basic credential check (DO NOT use in production!)
    if (username === dummyUser.username && password === dummyUser.password) {
        // Payload that will be encoded in the token
        const payload = { id: dummyUser.id, username: dummyUser.username };

        // Create the JWT token (expires in 1 hour)
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '100000' });
        console.log('Token:', token);
        return res.json({ token });
    } else {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Middleware to authenticate the JWT
const authenticateToken = (req, res, next) => {
    // Extract token from the Authorization header ("Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        console.log('checking token:', user);
        if (err) return res.sendStatus(403); // Forbidden if token invalid
        console.log('token is valid');
        req.user = user; // Attach user info from token to request
        next();
    });
};

// Protected endpoint: Only accessible with a valid JWT
app.get('/protected', authenticateToken, (req, res) => {
    console.log('protected endpoint reached and authenticated', req.user);
    res.json({ message: `Hello ${req.user.username}, this is protected data!` });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
