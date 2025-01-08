const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
  //do the analysis here
  console.log('Time:', Date.now());
  console.log('Request Type:', req.method);
  console.log('Request URL:', req.url);
  next();
});
