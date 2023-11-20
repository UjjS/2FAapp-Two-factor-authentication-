// index.js

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB database
mongoose.connect('mongodb+srv://shikharujjwal:Sangita123@cluster0.xraiqug.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Define the user schema for MongoDB
const userSchema = new mongoose.Schema({
  username: String,
  secret: String,
});

// Create a User model based on the user schema
const User = mongoose.model('User', userSchema);

// Serve the HTML file when the root URL is accessed
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle user registration
app.post('/register', async (req, res) => {
  // Extract the username from the request body
  const { username } = req.body;

  // Generate a secret key for the user using Speakeasy
  const secret = speakeasy.generateSecret({ length: 20 });

  // Create a new user in the MongoDB database
  const newUser = new User({
    username,
    secret: secret.base32,
  });

  // Save the new user to the database
  await newUser.save();

  // Generate an OTP authentication URL for the QR code
  const otpauth_url = speakeasy.otpauthURL({
    secret: secret.ascii,
    label: 'YourApp',
    issuer: 'YourApp',
  });

  // Generate a QR code based on the OTP authentication URL
  QRCode.toDataURL(otpauth_url, (err, data_url) => {
    // Send the data URL back to the client
    res.json({ data_url });
  });
});

// Handle user verification
// ... (other imports and setup)

app.post('/verify', async (req, res) => {
    try {
      const { username, token } = req.body;
  
      // Use await with findOne to get the user based on the provided username
      const user = await User.findOne({ username });
  
      // If the user is not found, send a 404 response
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Verify the provided token against the user's secret using Speakeasy
      const verified = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token,
      });
  
      // Send the verification result back to the client
      res.json({ verified });
    } catch (error) {
      console.error('Error during verification:', error);
      res.status(500).json({ message: 'Internal server error during verification' });
    }
  });
  
  

// Start the Express server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
