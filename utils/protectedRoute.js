import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../utils/authContext';
import { LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/utils/auth';


const useProtectedRoute = ({ allowedRoles }) => {
    //pangkuha current role
      const { role,loading } = useAuth();

    // const { role, loading } = useContext(AuthContext);
    const router = useRouter();
    const [isRoleAllowed, setisRoleAllowed] = useState(false);
    const [visible, { toggle }] = useDisclosure(false);

    useEffect(() => {
        const checkRole = () => {
            if (loading) {
                console.log('Loading...');

                return ; // Wait for the loading state to finish
            }

            if (!role || role === 'null') {
                console.log('No role found');
                setisRoleAllowed(false);
                // router.push('/login');
                return;
            }

            if (!allowedRoles.includes(role)) {
                console.log('Role not allowed:', role);
                setisRoleAllowed(false);
                // router.push('/login');
                return ;
            }

            setisRoleAllowed(true);
        };

        checkRole();
    }, [role, allowedRoles, router, loading]);

    return {isRoleAllowed,loading};
};

export default useProtectedRoute;
