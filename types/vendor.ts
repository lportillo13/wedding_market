import type { CloudinaryImage } from "./images";

export type VendorImage = CloudinaryImage;

export type VendorImagesPayload = {
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[];
};
