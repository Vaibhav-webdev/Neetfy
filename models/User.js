import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
  email: {
    type: String,
    required: true,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    default: "",  // ✅ default add kiya
  },

  // Wishlist Products
  wishlist: {
    type: [
      {
        title: String,
        price: Number,
        rating: Number,
        image: String,
        category: String,
        popular: Boolean,
      }
    ],
    default: []  // ✅ default empty array
  },

  // Orders
  orders: {
    type: [
      {
        id: String,
        date: String,
        status: String,
        product: String,
        items: Number,
        total: Number,
        image: String
      }
    ],
    default: []  // ✅ default empty array
  }

},
{
  timestamps: true
}
);

export default mongoose.model("User", userSchema);