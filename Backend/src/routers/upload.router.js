import { configCloudinary } from "../config/cloudinary.config.js";

const uploadImageToCloudinary = async (fileBuffer) => {
  try {
    console.log("Uploading to Cloudinary...");

    const cloudinary = configCloudinary();
    if (!fileBuffer) {
      throw new Error("No file buffer provided");
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", timeout: 60000 },
        (error, result) => {
          if (error || !result) {
            console.error("Upload error:", error); // Log error details
            reject(new Error(error.message || "Error uploading to Cloudinary"));
          } else {
            resolve(result);
          }
        }
      );

      fileBuffer.pipe(uploadStream);
    });

    console.log("Upload successful:", result); // Log successful result
    return result.url;
  } catch (error) {
    console.error("Error during upload:", error);
    throw new Error(error.message || "Unknown error during upload");
  }
};

export default uploadImageToCloudinary;
