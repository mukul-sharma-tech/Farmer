import express from 'express';
import mongoose from 'mongoose';
const app = express();
import multer from 'multer';
import path from 'path';
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import pdfParse from "pdf-parse"; // Extracts text from PDFs
import { v2 as cloudinary } from 'cloudinary';


const mandi_key = "579b464db66ec23bdd000001dbb2b5ecf966428b50867dbddf2c44be";


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


    // Configuration
    cloudinary.config({
        cloud_name: 'dggulw4uq',
        api_key: '383773851561917',
        api_secret: '77dSFXvQJVuoXgk2uH3m1zvAUTo' // Click 'View API Keys' above to copy your API secret
    });

const PORT = 1000;

mongoose.connect('mongodb+srv://mukul:1010@nodecluster0.hurza.mongodb.net/?retryWrites=true&w=majority&appName=NodeCluster0',
    // {
        // dbName: "EcommerceAPI"
    // }
)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));


app.get('/', (req, res) => {
    res.render('home.ejs' , {url: null});
})


//rendering login file
app.get('/login', (req, res) => {
    res.render('login.ejs', { url: null });
});

//rendering register file
app.get('/register', (req, res) => {
    res.render('register.ejs', { url: null });
});

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});

const upload = multer({storage: storage});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    fileName: String,
    public_id: String,
    imgurl: String
});

const User = mongoose.model('Auth', userSchema);

//file upload   -> jo file me upload me name likha h whi name .single("file") me likhna h
app.post("/register", upload.single("file"), async (req, res) => {
    const file = req.file.path;

    // const name = req.body.name;
    // const email = req.body.email;
    // const password = req.body.password;
    // const imgurl = req.file.filename;
    // const public_id = req.file.filename;

    const { name, email, password } = req.body;

    const cloudinaryRes = await cloudinary.uploader.upload(file, {
        folder: 'uploadTry'
    });

    //Creating user in db
    const db = await User.create({
        name,
        email,
        password,
        filename: req.file.filename,
        public_id: cloudinaryRes.public_id,
        imgurl: cloudinaryRes.secure_url
    });

    // res.render("register.ejs", { url: cloudinaryRes.secure_url });

    res.redirect('/login');

    // res.json({ path: file,
    //     message: 'File uploaded successfully', cloudinaryRes });
});  


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    // if(user) {
    //     res.json({ message: 'User found' });
    // } else {
    //     res.json({ message: 'User not found' });
    // }

    // if(!user) {
    //     res.render('login.ejs');
    // }
    if (!user || user.password !== password) {
        return res.render('login.ejs', { error: "Invalid email or password" });
    } 
    // else if(user.password != password) {
    //         res.render('login.ejs');
    // }
    else { 
        res.render('profile.ejs', { user });
    }
});


app.get('/about', (req, res) => {
    res.render('about.ejs' , {url: null});
})

app.get('/contact', (req, res) => {
    res.render('contact.ejs' , {url: null});
})

app.get('/AIFarm', (req, res) => {
    res.render('AIFarm.ejs' , {url: null});
})

app.get('/weather', (req, res) => {
    res.render('weather.ejs' , {url: null});
})

app.get('/crop', (req, res) => {
    res.render('details.ejs' , {url: null});
})

app.get('/mandi', (req, res) => {
    res.render('mandi.ejs' , {url: null});
})



dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files from public folder

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Configure multer for file uploads
const upload2 = multer({ dest: "uploads/" });

// Handle chatbot messages
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const chat = model.startChat({ history: [] });
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        res.json({ response: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong!" });
    }
});

// Handle PDF Upload and Extraction
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
  }

  const pdfPath = req.file.path;

  try {
      if (!fs.existsSync(pdfPath)) {
          return res.status(404).json({ error: "File not found" });
      }

      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      fs.unlinkSync(pdfPath); // Delete the file after processing

      res.json({ text: pdfData.text });
  } catch (error) {
      console.error("Error processing PDF:", error);
      res.status(500).json({ error: "Failed to process PDF" });
  }
});


app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));