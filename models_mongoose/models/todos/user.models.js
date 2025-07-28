import mongoose from 'mongoose';

const userSchema=new mongoose.Schema(
    {
        // username:String,
        // email:String,
        // isActive:Boolean,

        //object (validation)
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password:{
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
    },{timestamps: true} //createdAt, updatedAt
)

export const User=mongoose.model('User',userSchema); //kya model and kispar
// when database may store hoga its gets converted to pural (users)
// mongoose automatically adds 's' to the model name when creating the collection in the database