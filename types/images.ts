export type MediaAsset = {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes?: number;
  type?: "image" | "video";
};

export type CloudinaryImage = MediaAsset;
