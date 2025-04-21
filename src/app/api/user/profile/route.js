import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get request data - could be JSON or FormData
        let data;
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            data = await request.json();
        } else {
            // Handle as regular form data
            const formData = await request.formData();
            data = Object.fromEntries(formData);
        }

        // Create update object with only the fields that are provided
        const updateData = {};
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.logo !== undefined) updateData.logo = data.logo;
        
        const updatedUser = await prisma.user.update({
            where: { id: BigInt(session.user.id) },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            user: {
                ...updatedUser,
                id: Number(updatedUser.id)
            }
        })
    } catch (error) {
        console.error('Error updating user profile:', error)
        return NextResponse.json({ 
            success: false,
            errors: { message: 'Failed to update profile', details: error.message }
        }, { status: 500 })
    }
}