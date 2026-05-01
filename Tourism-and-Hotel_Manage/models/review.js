import mongoose from 'mongoose';

const reviewSchema=new mongoose.Schema({
    email : {
        type : String,
        required :true,
        //unique : true
    },
    name :{
        type : String,
        required :true

    },
    rating : {
        type : Number,
        min : 0,
        max : 5,
        default : 0,
        //required : true
    },
    comment : {
        type : String,
        required :true

    },
    date : {
        type :Date,
        required :true,
        default : Date.now()
    },
    profilePicture : {
        type :String,
        required : true,
        default : "https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-female-user-profile-vector-illustration-isolated-background-women-profile-sign-business-concept_157943-38866.jpg"
    },

    isApproved :{
        type : Boolean,
        required : true,
        default : false

    },
    section: {
        type: String,
        required: true,
        default: 'All'
    }

})

export default mongoose.model("Review",reviewSchema);