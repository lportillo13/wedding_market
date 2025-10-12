import { v2 as cloudinary, type ConfigOptions } from "cloudinary";

let configured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  const options: ConfigOptions = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  };

  cloudinary.config(options);
  configured = true;
}

export const isCloudinaryConfigured = configured;

export default cloudinary;
