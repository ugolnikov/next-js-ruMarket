'use client'
import React from 'react'
import styled from 'styled-components'

const LoaderWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
`

const LoaderSpinner = styled.div`
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4438ca;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`

const Loader = () => {
    return (
        <LoaderWrapper>
            <LoaderSpinner />
        </LoaderWrapper>
    )
}

export default Loader
