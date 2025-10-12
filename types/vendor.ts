export type VendorImage = {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes?: number;
};

export type VendorImagesPayload = {
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[];
};
