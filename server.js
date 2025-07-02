const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');

dotenv.config();
const app = express();

const ContactMessage = require('./models/ContactMessage');
const JobApplication = require('./models/JobApplication');

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Error:', err));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session setup for login
app.use(session({
  secret: process.env.SECRET || 'swifttechsecret',
  resave: false,
  saveUninitialized: false
}));

// Multer setup for CV upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/services', (req, res) => {
  res.render('services');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.post('/send-message', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});


// LOGIN ROUTE
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('Login failed! Invalid username or password');
  }
});

app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.render('admin');
  } else {
    res.redirect('/login');
  }
});

// Route to view messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.render('admin-messages', { messages }); // ✅ pass messages here
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving messages');
  }
});


// JOB APPLICATION
app.get('/jobs', (req, res) => {
  res.render('apply');
});

app.post('/apply-job', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, experience, message } = req.body;
    const resumeFilePath = req.file ? req.file.path : "";

    const newApplication = new JobApplication({
      name,
      email,
      experience,
      message,
      resumeFilePath
    });

    await newApplication.save();
    console.log('Job application saved');

    res.send("Your application has been submitted successfully!");
  } catch (err) {
    console.error("Error saving job application:", err);
    res.status(500).send("Something went wrong.");
  }
});

const jobApplicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  experience: String,
  message: String,
  resumeFilePath: String,
  status: {
    type: String,
    default: 'Pending' // can be 'Pending', 'Approved', or 'Rejected'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

app.get('/admin/messages', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.render('admin-messages', { messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Error loading messages");
  }
});

app.get('/admin/jobs', async (req, res) => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    res.render('admin-jobs', { applications });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).send("Error loading applications");
  }
});

// Contact Message Schema
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

// Create the model
const Message = mongoose.model('Message', messageSchema);

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});