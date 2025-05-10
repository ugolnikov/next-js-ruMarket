import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: BigInt(userId) }
        })
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        // Serialize the data
        const { password: _, ...userData } = user
        const serializedUser = {
            ...userData,
            id: Number(userData.id),
            createdAt: userData.createdAt?.toISOString(),
            updatedAt: userData.updatedAt?.toISOString(),
            verification_requested_at: userData.verification_requested_at?.toISOString(),
            verification_approved_at: userData.verification_approved_at?.toISOString(),
            verification_rejected_at: userData.verification_rejected_at?.toISOString(),
            passport_issue_date: userData.passport_issue_date?.toISOString()
        }
        
        return NextResponse.json(serializedUser)
    } catch (error) {
        console.error('Error fetching verification request:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const userId = resolvedParams.userId
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const data = await request.json()
        
        // Validate action
        if (!data.action || !['approve', 'reject'].includes(data.action)) {
            return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
        }

        // If rejecting, require a reason
        if (data.action === 'reject' && !data.rejection_reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
        }

        // Prepare update data
        const updateData = {
            verification_status: data.action === 'approve' ? 'approved' : 'rejected',
        }
        
        if (data.action === 'approve') {
            updateData.role = 'seller'
            updateData.is_verify = true
            updateData.verification_approved_at = new Date()
        } else {
            updateData.verification_rejected_at = new Date()
            updateData.verification_rejection_reason = data.rejection_reason
        }

        const user = await prisma.user.update({
            where: { id: BigInt(userId) },
            data: updateData
        })
        
        // Serialize the data
        const { password: _, ...userData } = user
        const serializedUser = {
            ...userData,
            id: Number(userData.id),
            createdAt: userData.createdAt?.toISOString(),
            updatedAt: userData.updatedAt?.toISOString(),
            verification_requested_at: userData.verification_requested_at?.toISOString(),
            verification_approved_at: userData.verification_approved_at?.toISOString(),
            verification_rejected_at: userData.verification_rejected_at?.toISOString(),
            passport_issue_date: userData.passport_issue_date?.toISOString()
        }
        
        return NextResponse.json(serializedUser)
    } catch (error) {
        console.error('Error updating verification status:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}