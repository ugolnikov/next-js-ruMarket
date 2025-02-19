import React from 'react';
import OrderDetails from '@/components/OrderDetails';

export default function Page({ params }) {
    const resolvedParams = React.use(params);
    
    return <OrderDetails orderNumber={resolvedParams.orderNumber} />;
}
