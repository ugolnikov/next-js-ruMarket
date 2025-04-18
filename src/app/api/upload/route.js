import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileServer } from '@/lib/supabaseStorage'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    // Проверяем авторизацию
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем файл из запроса
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Проверяем тип файла
    const fileType = file.type
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Загружаем файл с использованием серверной функции
    // Больше не нужно передавать cookies, так как они берутся внутри функции
    const result = await uploadFileServer(file)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      url: result.url,
      path: result.path
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 })
  }
}