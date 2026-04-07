const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

const { validateUserRegistration, validateRequest } = require('../middleware/validator');

router.post('/register', validateUserRegistration, validateRequest, registerUser);
router.post('/login', loginUser);

module.exports = router;
