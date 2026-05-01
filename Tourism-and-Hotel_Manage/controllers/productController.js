import Product from "../models/product.js";
import { isItAdmin } from "./userController.js";

const DEFAULT_IMAGE =
    "https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg";

function normalizeText(value) {
    return `${value ?? ""}`.trim();
}

function normalizeImageList(imageValue) {
    const images = Array.isArray(imageValue) ? imageValue : [imageValue];

    const validImages = images
        .filter((image) => typeof image === "string" && image.trim())
        .map((image) => image.trim());

    return validImages.length > 0 ? validImages : [DEFAULT_IMAGE];
}

function normalizeBoolean(value, fallback = true) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

async function buildValidatedProductPayload(data, options = {}) {
    const {
        existingProduct = null,
        requireKey = true,
        allowKeyChange = false
    } = options;

    const key = normalizeText(allowKeyChange ? data?.key : existingProduct?.key ?? data?.key);
    const name = normalizeText(data?.name);
    const description = normalizeText(data?.description);
    const category = normalizeText(data?.category);
    const pickupLocation = normalizeText(data?.pickupLocation || existingProduct?.pickupLocation || "Kataragama");
    const dailyRentalprice = Number(data?.dailyRentalprice);
    const stockCount = Number(data?.stockCount);

    if (requireKey && !key) {
        return { error: { status: 400, message: "Equipment key is required." } };
    }

    if (!name) {
        return { error: { status: 400, message: "Equipment name is required." } };
    }

    if (!Number.isFinite(dailyRentalprice) || dailyRentalprice <= 0) {
        return { error: { status: 400, message: "Price per day must be a positive number." } };
    }

    if (!Number.isInteger(stockCount) || stockCount < 0) {
        return { error: { status: 400, message: "Stock count cannot be negative." } };
    }

    if (!category) {
        return { error: { status: 400, message: "Equipment category is required." } };
    }

    if (!description) {
        return { error: { status: 400, message: "Equipment description is required." } };
    }

    const image = normalizeImageList(data?.image ?? existingProduct?.image);
    const availability = stockCount > 0;

    return {
        payload: {
            key,
            name,
            dailyRentalprice,
            category,
            description,
            stockCount,
            image,
            pickupLocation,
            availability,
            isRentable: normalizeBoolean(data?.isRentable, existingProduct?.isRentable ?? true)
        }
    };
}

export async function addProduct(req, res) {
    try {
        if (req.user == null) {
            return res.status(401).json({ message: "Please login and try again" });
        }

        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const { payload, error } = await buildValidatedProductPayload(req.body, {
            requireKey: true,
            allowKeyChange: true
        });

        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const existingProduct = await Product.findOne({ key: payload.key });
        if (existingProduct) {
            return res.status(400).json({ message: "An equipment item with this key already exists." });
        }

        const newProduct = new Product(payload);
        await newProduct.save();

        res.json({
            message: "Product add successfully",
            product: newProduct
        });
    } catch (error) {
        res.status(500).json({ message: "Product addition failed" });
    }
}

export async function getProducts(req, res) {
    try {
        if (isItAdmin(req)) {
            const products = await Product.find().sort({ name: 1 });
            return res.json(products);
        }

        const products = await Product.find({
            isRentable: { $ne: false }
        }).sort({ name: 1 });

        res.json(products);
    } catch (e) {
        res.status(500).json({
            message: "Failed to get products"
        });
    }
}

export async function updateProduct(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({
                message: "You are not authorized to perform this action"
            });
        }

        const key = req.params.key;
        const existingProduct = await Product.findOne({ key });

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (req.body?.key && normalizeText(req.body.key) !== key) {
            return res.status(400).json({ message: "Equipment key cannot be changed." });
        }

        const { payload, error } = await buildValidatedProductPayload(req.body, {
            existingProduct,
            requireKey: true,
            allowKeyChange: false
        });

        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        await Product.updateOne({ key }, payload);
        const updatedProduct = await Product.findOne({ key });

        res.json({
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to update product"
        });
    }
}

export async function deleteProduct(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({
                message: "You are not authorize to perform this action"
            });
        }

        const key = req.params.key;
        const existingProduct = await Product.findOne({ key });

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Product.deleteOne({ key });
        res.json({
            message: "Product deleted successfully "
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to delete product"
        });
    }
}

export async function getProduct(req, res) {
    try {
        const key = req.params.key;
        const product = await Product.findOne({ key });

        if (product == null) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(product);
    } catch (e) {
        res.status(500).json({
            message: "Failed to get product"
        });
    }
}

export async function decreaseStock(req, res) {
    try {
        const key = req.params.key;
        const product = await Product.findOne({ key });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.stockCount <= 0) {
            return res.status(400).json({ message: "Out of stock" });
        }

        const newStock = product.stockCount - 1;

        await Product.updateOne(
            { key },
            {
                stockCount: newStock,
                availability: newStock > 0
            }
        );

        res.json({
            message: "Stock updated",
            stockCount: newStock
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to update stock" });
    }
}

export async function increaseStock(req, res) {
    try {
        const key = req.params.key;
        const qty = req.body.qty || 1;
        const product = await Product.findOne({ key });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const newStock = product.stockCount + qty;

        await Product.updateOne(
            { key },
            {
                stockCount: newStock,
                availability: newStock > 0
            }
        );

        res.json({
            message: "Stock restocked",
            stockCount: newStock
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to restock" });
    }
}
