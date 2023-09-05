const mongoose = require("mongoose");
const Videos = require("./models/videos");
const nodemailer = require("nodemailer");
require("dotenv").config();

const badVideos = [];

//connect to mongoDB
mongoose.set("strictQuery", false);

async function main() {
  await mongoose.connect(process.env.mongoDB);
  console.log("connected to Mongo");
}

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
      await Videos.updateOne(
        { videoId: videoId.videoId },
        { $set: { status: "Exists" } }
      );
    } else {
      console.log("Video does not exist or is unavailable");
      await Videos.updateOne(
        { videoId: videoId.videoId },
        { $set: { status: "No" } }
      );
      badVideos.push(videoId);
      console.log("this is the bad videos array", badVideos);
      determineEmailSend(badVideos, videoId);
    }
  } catch (error) {
    console.error("Error fetching video details:", error);
  }
}

async function checkAllVideos() {
  await main();
  const videoIds = await getVideoIds();
  for (const videoId of videoIds) {
    await checkVideoStatus(videoId, process.env.apiKey);
  }
}

async function sendEmail(videoId) {
  // Create a transporter object using your email service's SMTP settings
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.username,
      pass: process.env.password,
    },
  });

  // Set up email options
  const mailOptions = {
    from: process.env.username,
    to: process.env.username,
    subject: "Content - Youtube Video Down",
    text: `A youtube video in our content is not working. It has a video id of ${badVideos}`,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

async function determineEmailSend(badVideos, videoId) {
  if (badVideos.length > 0) {
    sendEmail(videoId.videoId);
  }
}

checkAllVideos();
