import AuthLayoutClient from './AuthLayoutClient'
import Head from 'next/head'

const AuthLayout = ({ children }) => {
    return (
        <>
            <Head>
                <title>Вход в аккаунт</title>
            </Head>
            <AuthLayoutClient>{children}</AuthLayoutClient>
        </>
    )
}

export default AuthLayout
