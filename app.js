const mongoose = require("mongoose");
require("dotenv").config();
const Videos = require("./models/videos");
const nodemailer = require("nodemailer");

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
      console.log("here is the videoid for email", videoId.videoId);
      sendEmail(videoId.videoId);
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
    text: `A youtube video in our content is not working. It has a video id of ${videoId}`,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
checkAllVideos();
