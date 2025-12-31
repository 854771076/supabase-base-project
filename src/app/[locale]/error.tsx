'use client';

import React, { useEffect } from 'react';
import { Button, Result } from 'antd';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%'
        }}>
            <Result
                status="error"
                title="Something went wrong!"
                subTitle="Sorry, an unexpected error has occurred."
                extra={[
                    <Button type="primary" key="retry" onClick={() => reset()}>
                        Try Again
                    </Button>,
                    <Button key="home" onClick={() => window.location.href = '/'}>
                        Back Home
                    </Button>,
                ]}
            />
        </div>
    );
}
