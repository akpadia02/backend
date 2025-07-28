import mongoose from "mongoose";

const subTodoSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    complete: {
        type: Boolean,
        default: false, // if not provided, defaults to false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to the User model
    },

},{timestamps: true}); //createdAt, updatedAt

export const SubTodo = mongoose.model("SubTodo", subTodoSchema); 
