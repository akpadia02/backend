import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    name: {
        type: String,   
        required: true,
    },
    diagonsedWith: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], //enumeration choices
    },
    gender: {
        type: String,
        required: true,
        enum: ["M","F","O"], //enumeration choices
    },
    admittedIn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
    },
},{timestamps: true});

export const Patient = mongoose.model('Patient', patientSchema);