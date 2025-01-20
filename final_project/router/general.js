const express = require('express');
const axios = require('axios'); // Import Axios
let { books } = require("./booksdb.js");
let { isValid, users } = require("./auth_users.js");
const jwt = require('jsonwebtoken');
const public_users = express.Router();

//API ENDPOINTS
public_users.get('/api/books', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});
public_users.get('/api/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const response = await axios.get(`http://localhost:5000/isbn/${isbn}`); 
    res.status(200).json(response.data);
  } catch (error) {
    res.status(404).json({ message: `Book with ISBN ${isbn} not found.`, error: error.message });
  }
});

public_users.get('/api/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const response = await axios.get(`http://localhost:5000/author/${author}`); 
    res.status(200).json(response.data);
  } catch (error) {
    res.status(404).json({ message: `No books found by author: ${author}`, error: error.message });
  }
});

public_users.get('/api/title/:title', async (req, res) => {
  const title = req.params.title.toLowerCase();
  try {
    const response = await axios.get(`http://localhost:5000/title/${title}`);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(404).json({ message: `No books found with the title: ${title}`, error: error.message });
  }
});


public_users.get("/", (req, res) => {
  res.send(books);
});

// Render the review form when visiting '/review/:isbn'
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const token = req.session ? req.session.token : null; 

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  let userReview = null;
  let reviewText = ''; 

  if (token) {
    jwt.verify(token, 'your_secret_key', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
      }

      const username = decoded.username;

      if (books[isbn].reviews && books[isbn].reviews[username]) {
        userReview = books[isbn].reviews[username];
        reviewText = userReview;  
      }

      res.render('review', { isbn, userReview, reviewText });  
    });
  } else {
    res.render('review', { isbn, userReview: null, reviewText: '' }); 
  }
});

public_users.get('/login', (req, res) => {
  res.render('login');
});

public_users.get("/register", (req, res) => {
    res.render("register");
});

public_users.post("/register", (req, res) => {
  const { username, password } = req.body; 

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(409).json({ message: "Username already exists." });
  }

  users.push({ username, password });
  
  return res.status(201).json({ message: "User registered successfully." });
});

public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    res.send(book);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const authorBooks = [];

  for (const isbn in books) {
    if (books[isbn].author === author) {
      authorBooks.push({ isbn, ...books[isbn] });
    }
  }

  if (authorBooks.length > 0) {
    return res.status(200).json(authorBooks);
  } else {
    return res.status(404).json({ message: `No books found by author: ${author}` });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title.toLowerCase();
  const titleBooks = [];

  for (const isbn in books) {
    if (books[isbn].title.toLowerCase().includes(title)) {
      titleBooks.push({ isbn, ...books[isbn] });
    }
  }

  if (titleBooks.length > 0) {
    return res.status(200).json(titleBooks);
  } else {
    return res.status(404).json({ message: `No books found with the title: ${title}` });
  }
});


module.exports.general = public_users;
