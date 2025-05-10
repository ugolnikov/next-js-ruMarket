import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function PUT(request) {
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
        if (data.address !== undefined) updateData.address = data.address;
        if (data.company_name !== undefined) updateData.company_name = data.company_name;
        if (data.inn !== undefined) updateData.inn = data.inn;
        
        // Handle verification request
        if (data.request_verification === 'true' || data.request_verification === true) {
            updateData.verification_status = 'pending';
            updateData.verification_requested_at = new Date();
            updateData.seller_type = data.seller_type || 'individual';
            
            // Store verification documents if provided
            if (data.verification_documents) {
                updateData.verification_documents = Array.isArray(data.verification_documents) 
                    ? data.verification_documents 
                    : [data.verification_documents];
            }
            
            // Store passport data for individuals
            if (data.seller_type === 'individual') {
                if (data.passport_number) updateData.passport_number = data.passport_number;
                if (data.passport_issued_by) updateData.passport_issued_by = data.passport_issued_by;
                if (data.passport_issue_date) updateData.passport_issue_date = new Date(data.passport_issue_date);
            }
        }
        
        // Important: Don't allow users to set themselves as verified
        // Only admins can do this through the verification approval process
        delete data.is_verify;
        
        const updatedUser = await prisma.user.update({
            where: { id: BigInt(session.user.id) },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            user: {
                ...updatedUser,
                id: Number(updatedUser.id),
                createdAt: updatedUser.createdAt?.toISOString(),
                updatedAt: updatedUser.updatedAt?.toISOString(),
                verification_requested_at: updatedUser.verification_requested_at?.toISOString(),
                verification_approved_at: updatedUser.verification_approved_at?.toISOString(),
                verification_rejected_at: updatedUser.verification_rejected_at?.toISOString(),
                passport_issue_date: updatedUser.passport_issue_date?.toISOString()
            }
        })
    } catch (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export { PUT }