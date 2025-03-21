import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discountPrice: {
        type: Number,
    },
    stock: {
        type: Number,
        required: true,
    },
    images: [
        {
            url: String,
            public_id: String, // If using Cloudinary or any storage service
        },
    ],
    colours: [
        {
            name: String,
            hexCode: String,
        },
    ],
    sizes: [String], // Optional, mainly for fashion products
    ratings: {
        type: Number,
        default: 0,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
},
{ timestamps: true })

productSchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

export const Product = mongoose.model("Product", productSchema)