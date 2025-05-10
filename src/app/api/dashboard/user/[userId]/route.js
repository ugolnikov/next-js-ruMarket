import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        // Ensure the user can only update their own profile unless they're an admin
        if (session.user.id !== Number(userId) && !session.user.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const data = await request.json()
        
        // Extract verification data
        const { 
            seller_type, // 'individual' or 'company'
            company_name, 
            inn, 
            address, 
            phone,
            passport_number, // For individuals
            passport_issued_by, // For individuals
            passport_issue_date, // For individuals
            verification_documents, // URLs to uploaded documents
            logo
        } = data

        // Prepare update data
        const updateData = {
            company_name,
            inn,
            address,
            phone,
            passport_number,
            passport_issued_by,
            passport_issue_date,
            verification_documents,
            logo
        }

        // If the user is requesting to become a seller
        if (data.role === 'seller') {
            // Set verification status to 'pending' for admin approval
            updateData.seller_type = seller_type
            updateData.verification_status = 'pending'
            updateData.verification_requested_at = new Date()
        }

        // If admin is approving or rejecting verification
        if (session.user.is_admin && data.verification_action) {
            if (data.verification_action === 'approve') {
                updateData.role = 'seller'
                updateData.verification_status = 'approved'
                updateData.verification_approved_at = new Date()
                updateData.is_verify = true
            } else if (data.verification_action === 'reject') {
                updateData.verification_status = 'rejected'
                updateData.verification_rejected_at = new Date()
                updateData.verification_rejection_reason = data.verification_rejection_reason || 'Rejected by admin'
            }
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        )

        const user = await prisma.user.update({
            where: { id: BigInt(userId) },
            data: updateData
        })

        // Serialize the user data
        const { password: _, ...userData } = user
        const serializedUser = {
            ...userData,
            id: Number(userData.id),
            createdAt: userData.createdAt?.toISOString(),
            updatedAt: userData.updatedAt?.toISOString(),
            verification_requested_at: userData.verification_requested_at?.toISOString(),
            verification_approved_at: userData.verification_approved_at?.toISOString(),
            verification_rejected_at: userData.verification_rejected_at?.toISOString()
        }

        return NextResponse.json(serializedUser)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        // Ensure the user can only view their own profile unless they're an admin
        if (session.user.id !== Number(userId) && !session.user.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const user = await prisma.user.findUnique({
            where: { id: BigInt(userId) }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Serialize the user data
        const { password: _, ...userData } = user
        const serializedUser = {
            ...userData,
            id: Number(userData.id),
            createdAt: userData.createdAt?.toISOString(),
            updatedAt: userData.updatedAt?.toISOString(),
            verification_requested_at: userData.verification_requested_at?.toISOString(),
            verification_approved_at: userData.verification_approved_at?.toISOString(),
            verification_rejected_at: userData.verification_rejected_at?.toISOString()
        }

        return NextResponse.json(serializedUser)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}