const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const videosSchema = new Schema({
  title: { type: String, required: true },
  snippet: { type: String, required: true },
  status: { type: String, required: true, enum: ["Exists", "No"] },
  videoId: { type: String, required: true },
});

videosSchema.virtual("url").get(function () {
  return `/${this._id}`;
});

// Export model
module.exports = mongoose.model("Videos", videosSchema);
