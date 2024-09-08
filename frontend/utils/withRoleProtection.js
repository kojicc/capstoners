import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/utils/authContext'; // Adjust the import path as necessary
import { LoadingOverlay, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

export const withRoleProtection = (WrappedComponent, allowedRoles) => {
  const RoleProtectedComponent = (props) => {
    const { role, loading: contextLoading } = useContext(AuthContext);
    const [isRoleAllowed, setIsRoleAllowed] = useState(true);
    const router = useRouter();
    const [visible, setVisible] = useState(true);

    useEffect(() => {
      const checkUserRole = () => {
        if (role) {
          const roleAllowed = allowedRoles.includes(role);
          setIsRoleAllowed(roleAllowed);

          if (!roleAllowed) {
            modals.openConfirmModal({
              title: 'Unauthorized Access',
              children: (
                <Text size="sm">
                  Your role is{' '}
                  <b>
                    <i>{role}</i>
                  </b>{' '}
                  and you are currently unauthorized. Please login as student/admin first.
                </Text>
              ),
              labels: { confirm: 'Login', cancel: 'Go back to home page' },
              onCancel: () => router.push('/'),
              onConfirm: () => router.push('/login'),
              withCloseButton: false,
            });
          }
        } else {
          router.push('/login');
        }
      };

      // Check role if it's available, otherwise, wait for loading to finish
      if (!contextLoading) {
        checkUserRole();
      }
    }, [role, contextLoading, router]);

    if (contextLoading || !isRoleAllowed) {
      return (
        <LoadingOverlay visible={visible} zIndex={1000} overlayOpacity={0.8} overlayBlur={2} />
      );
    }

    return <WrappedComponent {...props} />;
  };

  return RoleProtectedComponent;
};
