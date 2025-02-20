import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { inn } = await request.json()
        
        if (!inn) {
            return NextResponse.json({ error: 'INN is required' }, { status: 400 })
        }

        const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Token ${process.env.DADATA_API_KEY}`
            },
            body: JSON.stringify({ query: inn })
        })

        const data = await response.json()

        if (!data.suggestions || data.suggestions.length === 0) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        const company = data.suggestions[0]
        return NextResponse.json({
            name: company.value,
            inn: company.data.inn,
            kpp: company.data.kpp,
            address: company.data.address.value,
            management_name: company.data.management?.name,
            management_post: company.data.management?.post
        })
    } catch (error) {
        console.error('Error validating INN:', error)
        return NextResponse.json({ error: 'Failed to validate INN' }, { status: 500 })
    }
}