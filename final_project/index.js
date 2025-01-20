const express = require('express');
const jwt = require('jsonwebtoken');
const methodOverride = require('method-override');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const ejs = require('ejs'); 
const genl_routes = require('./router/general.js').general;

const app = express();
app.use(methodOverride('_method'));  // Override HTTP methods using the _method query parameter

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// Authentication middleware for routes under /customer/auth/*
app.use("/customer/auth/*", function auth(req, res, next) {
  const token = req.session.token;
  if (!token) {
    return res.status(403).json({ message: 'Authentication required' });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));