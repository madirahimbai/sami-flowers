import sharp from 'sharp';

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 70;

/** Resizes and re-encodes an uploaded photo to a size sensible for a
 * catalog/product page and returns it as a JPEG data: URI. A raw
 * full-resolution phone photo can be several MB — stored directly as
 * base64 across dozens of products, that bloats every page that lists
 * them. This keeps visual quality essentially unchanged at display size
 * while cutting stored size dramatically. */
export async function compressImage(buf: Buffer): Promise<string> {
  const out = await sharp(buf)
    .rotate() // respects EXIF orientation before resizing
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${out.toString('base64')}`;
}
