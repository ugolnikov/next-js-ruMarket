import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { auth, handlers: { GET, POST }, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Необходимо указать email и пароль')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    throw new Error('Пользователь не найден')
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    throw new Error('Неверный пароль')
                }
                return {
                    id: Number(user.id),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    is_admin: user.is_admin || false,
                    phone: user.phone,
                    is_verify: user.is_verify,
                    company_name: user.company_name,
                    logo: user.logo, 
                    inn: user.inn,
                    address: user.address
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                // Fetch fresh user data
                const user = await prisma.user.findUnique({
                    where: { id: BigInt(token.id) }
                })
                
                session.user = {
                    id: String(user.id),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    is_admin: user.is_admin || false, 
                    phone: user.phone,
                    is_verify: user.is_verify, 
                    company_name: user.company_name,
                    logo: user.logo, 
                    inn: user.inn, 
                    address: user.address,
                    seller_type: user.seller_type,
                    verification_status: user.verification_status,
                    verification_rejection_reason: user.verification_rejection_reason,
                    verification_approved_at: user.verification_approved_at,
                    passport_number: user.passport_number,
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.phone = user.phone
            }
            return token
        }
    },
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/login'
    }
})