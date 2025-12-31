'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
});

export default function ApiDocsClient() {
    return (
        <div className="h-screen w-full p-4">
            <SwaggerUI url="/api/v1/docs" />
        </div>
    );
}
