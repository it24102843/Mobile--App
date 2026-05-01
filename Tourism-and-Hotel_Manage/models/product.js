import mongoose from "mongoose";

const productSchema=new mongoose.Schema({
    key :{
        type : String,
        required : true,
        unique: true,
        trim : true
    },
    name :{
        type : String,
        required : true
    },

    dailyRentalprice:{
        type : Number,
        required : true
        
    },
    category : {
        type : String,
        required : true,
        default : "uncategorized"
    },
    description :{
        type :String,
        required : true
    },
    availability :{
        type : Boolean,
        required : true,
        default : true
    },
    isRentable :{
        type: Boolean,
        default :true
    },
    pickupLocation :{
        type :String,
        default :"Kataragama"

    },
    stockCount :{
        type : Number,
        required : true,
        default : 0,
        min : 0
    },
    image :{
        type : [String],
        required : true,
        default : ["https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg"]

    }

})
const Product=mongoose.model("Product",productSchema)
export default Product;
