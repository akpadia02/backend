import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true, // removes whitespace from both ends of a string
    },
    completed: {
        type: Boolean,
        default: false, // if not provided, defaults to false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to the User model
        required: true,
    },
    subTodos:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubTodo', // reference to the SubTodo model
    }] // array of sub-todos, each referencing a SubTodo document

},{timestamps: true}); //createdAt, updatedAt

export const Todo = mongoose.model("Todo", todoSchema); // kya model and kispar
// when database may store hoga its gets converted to pural (todos)