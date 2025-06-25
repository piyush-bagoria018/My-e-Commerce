import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    priceHistory: [
        {
            date: { type: Date, default: Date.now },
            price: { type: Number, required: true },
        },
    ],
    category: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    productImages: [{
        type: String,
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    ratings: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    slug: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;