import { supabase } from './supabase'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB

export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

export async function uploadMediaFile(
  file: File,
  folder = 'uploads'
): Promise<UploadResult> {
  if (!supabase) {
    return { success: false, error: 'Chưa cấu hình Supabase kết nối.' }
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return {
      success: false,
      error: 'Định dạng file không hỗ trợ. Vui lòng chọn ảnh (JPG, PNG, WEBP, GIF) hoặc video (MP4, WEBM).'
    }
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { success: false, error: 'Kích thước ảnh vượt quá 20MB. Vui lòng chọn ảnh nhỏ hơn.' }
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { success: false, error: 'Kích thước video vượt quá 50MB. Vui lòng chọn video ngắn hơn.' }
  }

  try {
    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4')
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      // Check if bucket not found
      if (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.message?.toLowerCase().includes('not found')) {
        return {
          success: false,
          error: 'Bucket lưu trữ "memories" chưa được tạo trên Supabase. Vui lòng chạy file migration 002_extended_features.sql trong SQL Editor.'
        }
      }
      return { success: false, error: `Tải lên thất bại: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage
      .from('memories')
      .getPublicUrl(fileName)

    return {
      success: true,
      url: publicUrlData.publicUrl
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định khi tải file.'
    return { success: false, error: message }
  }
}

export async function deleteMediaFile(fileUrl: string): Promise<boolean> {
  if (!supabase) return false
  try {
    // Parse storage path from public URL
    const marker = '/storage/v1/object/public/memories/'
    const index = fileUrl.indexOf(marker)
    if (index === -1) return false
    const path = fileUrl.substring(index + marker.length)
    const { error } = await supabase.storage.from('memories').remove([path])
    return !error
  } catch {
    return false
  }
}
