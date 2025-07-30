import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';



const app=express();

//CORS OPTIONS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));


// Needed to parse incoming JSON data from client requests (like POST/PUT), with a size limit to prevent abuse.
app.use(express.json({
    limit: '16kb' // Increase the limit as needed
}));

//Needed to handle form submissions and nested objects in URL-encoded data, while limiting request size for security.
app.use(express.urlencoded({
    limit: '16kb', 
    extended: true,
}));


//Needed to serve static assets (like images, stylesheets, JS files) so they are directly accessible by the client/browser.
app.use(express.static('public'));

app.use(cookieParser()); // Needed to parse cookies from incoming requests, allowing access to cookie data in req.cookies

export default app;