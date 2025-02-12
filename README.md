# Implement JWT Auth in 5 minutes

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The backend will run on http://localhost:3000 and the frontend dev server will start in development mode. Follow the Expo instructions in the terminal to run on your preferred platform (web, iOS, or Android).

Default credentials:
- Username: user
- Password: password

Below is a step‐by‐step, on how to use JWTs for auth between a backend API and a React frontend. This example will help you understand:

- **How a JWT is created and signed on the backend.**
- **How the JWT is returned to the client upon login.**
- **How the client stores and then uses the JWT to access a protected API endpoint.**

> **Note:** In this example we'll use a simple Node.js/Express server for the backend and a plain Expo app for the frontend. In production you would secure your JWT secret, handle errors more gracefully, and likely use libraries for secure storage.

---

## 1. Project Structure

For clarity, here's a simplified folder structure:

```
jwt-minimal-example/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── package.json
    └── App.js
```

---

## 2. Backend: Node.js/Express Server with JWT

### **2.1. Overview**

- **Endpoint `/login`:**  
  Accepts a username and password. If the credentials match our dummy user, it creates a JWT that includes user info (e.g., user ID and username) and returns it to the client.

- **Endpoint `/protected`:**  
  A sample protected route that requires the JWT. The middleware verifies the token, and if valid, the endpoint returns protected data.

### **2.2. Dependencies**

Install the following packages in your `backend` folder:

```bash
cd backend
npm init -y
npm install express jsonwebtoken cors
```

### **2.3. Code: `server.js`**

```js
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
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
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
    if (err) return res.sendStatus(403); // Forbidden if token invalid
    req.user = user; // Attach user info from token to request
    next();
  });
};

// Protected endpoint: Only accessible with a valid JWT
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, this is protected data!` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **2.4. Running the Backend**

From your `backend` folder, run:

```bash
node server.js
```

Your server should now be listening on port 3000.

---

## 3. Frontend: Expo App

### **3.1. Creating a New Expo Project**

1. Create a new Expo project in your `frontend` folder:
```bash
npx create-expo-app@latest frontend
cd frontend
```

2. Install the required dependencies:
```bash
npx expo install @expo/vector-icons expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-gesture-handler
```

3. Configure for TypeScript (optional but recommended):
```bash
npx expo customize tsconfig.json
```

4. Update your `package.json` to use expo-router:
```json
{
  "main": "expo-router/entry"
}
```

5. Create an `app` directory in your project root and add an `index.tsx` (or `index.js`) file - this will be your main screen.

### **3.2. Code: `app/index.tsx`**

```tsx
import React, { useState } from 'react';
import { SafeAreaView, View, TextInput, Button, Text, StyleSheet } from 'react-native';

export default function App() {
  // State for login credentials, token, and messages
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('password');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  // Function to handle login
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/login', {  // Change URL if necessary
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setMessage('Login successful!');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      setMessage('Error connecting to the server');
    }
  };

  // Function to call a protected API endpoint using the JWT
  const callProtected = async () => {
    try {
      const response = await fetch('http://localhost:3000/protected', {  // Change URL if necessary
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Access denied');
      }
    } catch (error) {
      setMessage('Error calling the protected endpoint');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Login</Text>
        <TextInput 
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Login" onPress={handleLogin} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Call Protected Endpoint" onPress={callProtected} disabled={!token} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center'
  },
  input: {
    height: 40,
    borderColor: 'gray', 
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
  },
});
```

### **3.3. Running the Frontend**

1. Start your Expo development server:
   ```bash
   npx expo start
   ```

2. Use your preferred method to run the app:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

> **Important:**  
> - **Networking:** When testing on a real device or simulator, you'll need to update the fetch URLs in the code to point to your machine's local IP address instead of `localhost`. For example: `http://192.168.1.100:3000/login`
> - **Storage:** For simplicity, the JWT is stored in component state here. In a production Expo app, use [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/) for secure token storage:
>   ```bash
>   npx expo install expo-secure-store
>   ```

---

## 4. Understanding the Flow

1. **User Logs In:**  
   - The Expo app sends a POST request to `/login` with credentials.
   - The backend validates the credentials and creates a JWT using `jsonwebtoken`.
   - The JWT is returned to the frontend.

2. **Token Storage:**  
   - The Expo app saves the JWT (in this minimal example, in state).

3. **Accessing Protected Resources:**  
   - The Expo app calls the `/protected` endpoint.
   - It sends the JWT in the `Authorization` header.
   - The backend middleware verifies the JWT.
   - If valid, the backend returns protected data.

4. **Session Persistence:**  
   - As long as the JWT is valid (i.e., not expired), the session remains authenticated.
   - When the token expires, the user must log in again (or use a refresh token strategy, which is a more advanced topic).

---

## 5. Next Steps

- **Experiment:**  
  Modify the payload, expiration times, or add additional protected endpoints.
  
- **Secure Storage:**  
  Replace the in-memory token storage in the Expo app with a more persistent method (like `expo-secure-store` or AsyncStorage).

- **Error Handling & Refresh:**  
  Add better error handling and explore implementing a token refresh strategy.

By building and testing this minimal example, you'll gain a practical understanding of how JWT-based authentication works end-to-end. Once you're comfortable with this flow, you can begin integrating similar concepts into your Expo/React Native app with your preferred backend (and eventually, Clerk for more advanced features).