const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'image', 'text', 'video', etc.
  content: { type: String },
});

module.exports = mongoose.model('Component', ComponentSchema);
