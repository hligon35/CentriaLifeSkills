export async function compressImage(file: File, quality = 0.7, maxWidth = 1280): Promise<Blob> {
  const img = document.createElement('img')
  const url = URL.createObjectURL(file)
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = e => rej(e); img.src = url })
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, maxWidth / img.width)
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/jpeg', quality))
}
