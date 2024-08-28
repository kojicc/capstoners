import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../utils/authContext';
import { LoadingOverlay } from '@mantine/core';

const useProtectedRoute = ({ allowedRoles }) => {
    const { role, loading } = useContext(AuthContext);
    const router = useRouter();
    const [isRoleAllowed, setisRoleAllowed] = useState(true);

    useEffect(() => {
        const checkRole = () => {
            if (loading) {

                return ; // Wait for the loading state to finish
            }

            if (!role || role === 'null') {
                setisRoleAllowed(false);
                router.push('/login');
                return;
            }

            if (!allowedRoles.includes(role)) {
                setisRoleAllowed(false);
                router.push('/login');
                return;
            }

            setisRoleAllowed(true);
        };

        checkRole();
    }, [role, allowedRoles, router, loading]);

    return {isRoleAllowed,loading};
};

export default useProtectedRoute;
