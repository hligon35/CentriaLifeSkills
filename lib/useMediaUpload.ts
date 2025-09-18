"use client"
import { useState, useCallback } from 'react'
import { api, isApiError } from './api'

export interface UseMediaUploadOptions {
  endpoint?: string // default /api/media/upload
  maxSizeMB?: number
  accept?: string[]
}

export interface UseMediaUploadResult {
  uploading: boolean
  error: string | null
  upload: (file: File) => Promise<{ url: string } | null>
  reset: () => void
}

export function useMediaUpload(opts: UseMediaUploadOptions = {}): UseMediaUploadResult {
  const { endpoint = '/api/media/upload', maxSizeMB = 8, accept } = opts
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => { setError(null) }, [])

  const upload = useCallback(async (file: File) => {
    setError(null)
    if (accept && !accept.some(a => file.type.startsWith(a) || file.name.toLowerCase().endsWith(a))) {
      setError('Unsupported file type')
      return null
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large (max ${maxSizeMB}MB)`) 
      return null
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      const j = await res.json().catch(()=>null)
      if (!res.ok || !j?.url) {
        setError(j?.error || 'Upload failed')
        return null
      }
      return { url: j.url as string }
    } catch (e) {
      if (isApiError(e)) setError(e.message); else setError('Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }, [endpoint, maxSizeMB, accept])

  return { uploading, error, upload, reset }
}
