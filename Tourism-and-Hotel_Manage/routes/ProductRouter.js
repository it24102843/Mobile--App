import express from "express"
import { addProduct, deleteProduct, getProduct, getProducts, updateProduct, decreaseStock, increaseStock } from "../controllers/productController.js";

const productRouter=express.Router();

productRouter.post("/",addProduct)
productRouter.get("/",getProducts)
// specific sub-routes MUST come before the /:key wildcard
productRouter.patch("/:key/decrease-stock", decreaseStock)
productRouter.patch("/:key/increase-stock", increaseStock)
productRouter.put("/:key",updateProduct)
productRouter.delete("/:key",deleteProduct)
productRouter.get("/:key",getProduct)

export default productRouter;