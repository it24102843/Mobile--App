import mongoose from "mongoose";

const inquirySchema=new mongoose.Schema({
    id : {
        type : Number,
        required :true,
        unique : true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email :{
        type : String,
        required : true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message : {
       type :String,
       required : true,
       trim: true 

    },
    date : {
        type : Date,
        required : true,
        default : Date.now

    },
    response : {

       type :String,
       required :false,
       default : ""
      

    },
    isResolved :{
        type : Boolean,
        required :true,
        default :false
    },
    phone: {
        type:String,
        required :false,
        default: "",
        trim: true
    }
})

const Inquiry=mongoose.model("Inquiries",inquirySchema);
export default Inquiry
