const express = require('express');
const jwt = require('jsonwebtoken');
let { books } = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

// Function to check if the username is valid
const isValid = (username) => {
  return users.some(user => user.username === username);
};

// Function to check if the username and password match the records
const authenticatedUser = (username, password) => {
  const user = users.find(user => user.username === username);
  return user && user.password === password;
};

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const token = req.session.token;

  if (!token) {
    return res.status(403).json({ message: 'You must be logged in to delete reviews.' });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const username = decoded.username;
    const isbn = req.params.isbn;

    if (!books[isbn]) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const reviews = books[isbn].reviews;

    // Check if the review exists and if it belongs to the current user
    if (reviews[username]) {
      // Delete the user's review
      delete reviews[username];
      return res.status(200).json({ message: 'Review deleted successfully.' });
    } else {
      return res.status(404).json({ message: 'Review not found for this user.' });
    }
  });
});

regd_users.post('/auth/review/:isbn', (req, res) => {
  const token = req.session.token;

  if (!token) {
    return res.status(403).json({ message: 'You must be logged in to review books.' });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const username = decoded.username;
    const isbn = req.params.isbn;
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ message: 'Review is required.' });
    }

    if (!books[isbn]) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    books[isbn].reviews[username] = review;

    return res.status(200).json({ message: 'Review added/modified successfully.', reviews: books[isbn].reviews });
  });
});

regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (!isValid(username)) {
    return res.status(401).json({ message: 'Invalid username.' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid password.' });
  }

  const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });

  req.session.token = token;

  return res.status(200).json({ message: 'Login successful', token });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
