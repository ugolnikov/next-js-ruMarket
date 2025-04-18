import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// For client-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Creates a Supabase client for server components
 * @returns {Promise<Object>} Supabase client
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name, value, options) {
          cookieStore.set(name, value, options)
        },
        remove(name, options) {
          // можно также использовать cookieStore.delete(name)
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        }
      }
    }
  )
}

/**
 * Загружает файл в Supabase Storage (серверная версия)
 * @param {File} file - Файл для загрузки
 * @param {string} bucket - Имя бакета (по умолчанию 'products')
 * @param {string} folder - Папка внутри бакета (по умолчанию 'images')
 * @returns {Promise<{path: string, url: string} | null>} - Путь и URL загруженного файла или null в случае ошибки
 */
export const uploadFileServer = async (file, bucket = 'products', folder = 'images') => {
  try {
    if (!file) return null

    // Создаем уникальное имя файла
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Получаем клиент с JWT пользователя
    const supabaseServer = await createServerSupabaseClient()

    // Загружаем файл с JWT пользователя
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600'
      })

    if (error) {
      console.error('Error uploading file:', error)
      return null
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabaseServer.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      path: data.path,
      url: publicUrl
    }
  } catch (error) {
    console.error('Error in uploadFileServer:', error)
    return null
  }
}

/**
 * Загружает файл в Supabase Storage (клиентская версия)
 * @param {File} file - Файл для загрузки
 * @param {string} bucket - Имя бакета (по умолчанию 'products')
 * @param {string} folder - Папка внутри бакета (по умолчанию 'images')
 * @returns {Promise<{path: string, url: string} | null>} - Путь и URL загруженного файла или null в случае ошибки
 */
export const uploadFile = async (file, bucket = 'products', folder = 'images') => {
  try {
    if (!file) return null

    // Создаем уникальное имя файла
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Загружаем файл
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600'
      })

    if (error) {
      console.error('Error uploading file:', error)
      return null
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      path: data.path,
      url: publicUrl
    }
  } catch (error) {
    console.error('Error in uploadFile:', error)
    return null
  }
}

/**
 * Удаляет файл из Supabase Storage
 * @param {string} path - Путь к файлу
 * @param {string} bucket - Имя бакета
 * @returns {Promise<boolean>} - true если удаление успешно, иначе false
 */
export const deleteFile = async (path, bucket = 'products') => {
  try {
    if (!path) return false

    // Извлекаем путь из полного URL если необходимо
    const filePath = path.includes('supabase.co') 
      ? path.split('/').slice(-2).join('/') 
      : path

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteFile:', error)
    return false
  }
}

export default supabase