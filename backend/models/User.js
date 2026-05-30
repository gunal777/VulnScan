const moongoose = require('mongoose');

const schema = moongoose.Schema;

const userSchema = new schema(
{
   name: {
      type: String,
      required: true
   },

   email: {
      type: String,
      required: true,
      unique: true
   },

   password: {
      type: String,
      required: true
   },

   role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
   }
}, { timestamps: true });

module.exports = moongoose.model('User', userSchema);