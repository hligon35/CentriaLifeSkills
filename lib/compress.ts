// Lightweight image compression stub for client-side use.
// For now, return the original file; can be replaced with canvas compression.
export async function compressImage(file: File): Promise<File> {
  return file
}
