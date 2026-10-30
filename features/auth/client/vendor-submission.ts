/** React resets native file controls after an action resolves, including a
 * recoverable result. Retain only these two files in memory for a safe retry. */
export function attachVendorSignupImages(data: FormData, images: { logo: File | null; hero: File | null }) {
  if (images.logo) data.set('logo_file', images.logo);
  if (images.hero) data.set('hero_file', images.hero);
  return data;
}
