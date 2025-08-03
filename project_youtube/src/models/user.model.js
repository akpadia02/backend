import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { use } from 'react';

const userSchema=new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, //cloudinary url
        default: 'https://res.cloudinary.com/dz1qj3v2h/image/upload/v1698234567/default-avatar.png',
        required: true,
    },
    coverImage: {
        type: String, //cloudinary url
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
    }],
    password:{
        type: String,  //encrpytion decryption use bcrypt
        required: [true,'Password is required'],
    },
    refreshToken:{
        type: String,
    } 

},{timestamps: true}); 


userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();
    try {
        // const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,10);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d',
    });
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({_id:this._id},process.env.REFRESH_TOKEN_SECRET,{    
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '10d',
    });
}

export const User=mongoose.model('User',userSchema);