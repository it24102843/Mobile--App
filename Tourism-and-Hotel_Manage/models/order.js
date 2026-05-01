import mongoose from "mongoose";

const orderSchema=new mongoose.Schema({
    orderId:{
        type:String,
        required:true,
        unique:true
    },
    userId:{
        type:String,
        default:null
    },
    email:{
        type:String,
        required:true
    },

    orderDate :{
        type:Date,
        required:true,
        default:Date.now
    },
    orderedItems :{
        type: [
            {
                product:{
                    key:{
                        type:String,
                        required:true
                    },
                    name:{
                        type: String,
                        required:true
                    },
                    image :{
                        type:String,
                        required:true
                    },
                    dailyRentalprice:{
                        type: Number,
                        required:true
                    }
                },
                quantity:{
                    type:Number,
                    required:true
                }
            }

        ],
        required:true,
    },
    days:{
        type:Number,
        required:true
    },
    startingDate :{
        type:Date,
        required:true
    },
    endingDate:{
        type:Date,
        required:true
    },
    isApproved:{
        type:String,
        required:true,
        default:false

    },
    status:{
        type:String,
        required:true,
        default:"Pending"
    },
    paymentMethod:{
        type:String,
        enum:["checkout","online","bank_deposit"],
        default:"checkout"
    },
    paymentStatus:{
        type:String,
        enum:["pending","verified","rejected","refunded"],
        default:"pending"
    },
    refundStatus:{
        type:String,
        enum:["not_applicable","pending","processing","refunded","not_eligible"],
        default:"not_applicable"
    },
    totalAmount:{
        type:Number,
        required:true
    }

})

const Order=mongoose.model("Order",orderSchema);

export default Order
