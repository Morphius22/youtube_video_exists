const mongoose = require("mongoose");
require("dotenv").config();
const Videos = require("./models/videos");

//connect to mongoDB
mongoose.set("strictQuery", false);

async function main() {
  await mongoose.connect(process.env.mongoDB);
  console.log("connected to Mongo");
}

main().catch((err) => console.log(err));

async function getVideoIds() {
  const videoIds = await Videos.find({});
  console.log("these are the video IDs", videoIds);
  return videoIds;
}

async function checkVideoStatus(videoId, apiKey) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId.videoId}&part=snippet&key=${apiKey}`;
  console.log(apiUrl);

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items.length > 0) {
      console.log("Video exists:", data.items[0].snippet.title);
    } else {
      console.log("Video does not exist or is unavailable");
    }
  } catch (error) {
    console.error("Error fetching video details:", error);
  }
}

async function checkAllVideos() {
  const videoIds = await getVideoIds();
  for (const videoId of videoIds) {
    await checkVideoStatus(videoId, process.env.apiKey);
  }
}

checkAllVideos();
