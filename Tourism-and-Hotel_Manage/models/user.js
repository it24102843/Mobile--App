import mongoose from "mongoose";

const userSchema=new mongoose.Schema({

    userId:{
        type: String,
        unique: true,
    },
    email:{
        type : String,
        required : true,
        unique : true,
        trim: true,
        lowercase: true
    },
    password:{
        type: String,
        required : true,
    },
    isBlocked:{
        type:Boolean,
        required:true,
        default:false

    },
    isAdmin:{
        type:Boolean,
        required:true,
        default:false

    },
    role :{
        type: String,
        required : true,
        default :"customer"
    },
    firstName : {
        type: String,
        required : true,
        trim: true,
        minlength: 3,

    },
    lastName : {
        type: String,
        default : "",
        trim: true,

    },
    address : {
        type: String,
        required : true,
        trim: true,

    },
    phone : {
       type : String,
       required : true,
       trim: true,

    },
    profilePicture : {
        type : String,
        required : true,
        default : "https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-female-user-profile-vector-illustration-isolated-background-women-profile-sign-business-concept_157943-38866.jpg"
    }
    

},{
    timestamps:true
});
const User=mongoose.model("User",userSchema);

export default User;
