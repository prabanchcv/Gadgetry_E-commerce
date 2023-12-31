const mongoose = require("mongoose")


 
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
      },
      lastName: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      phoneNumber: {
        type: String,
        required: true
      },
      password: {
        type: String,
        required: true
      },
      
      is_blocked: {
        type: Boolean,
        required: true,
      },

  wishlist: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
      },
  ],

  cart: [
      {
          product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
          },
          quantity: {
              type: Number,
              default: 1,
          },
      },
  ],

  wallet: {
      balance: {
          type: Number,
          default: 0,
      },
      transactions: [
          {
              date: {
                  type: Date,
              },
              details: {
                type: String,
              },
              amount: {
                  type: Number,
              },
              status: {
                  type: String,
              },
          },
      ],
  },


});
userSchema.method("populateCart", async function () {
    await this.populate("cart.product").execPopulate();
  });

module.exports = mongoose.model("User", userSchema);
