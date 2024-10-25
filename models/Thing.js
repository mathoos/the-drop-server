const mongoose = require('mongoose');

const thingSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tag: { type: String, required: true },
  imageUrl: { type: String, required: true },
  userId: { type: String, required: true },
  publicId: { type: String, required: true }  // Champ pour stocker l'identifiant public de l'image sur Cloudinary
});

module.exports = mongoose.model('Thing', thingSchema);