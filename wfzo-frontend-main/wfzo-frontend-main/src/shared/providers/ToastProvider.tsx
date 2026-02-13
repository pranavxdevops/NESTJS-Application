'use client';

import { useEffect, useRef } from 'react';
import type { Toast } from 'primereact/toast';

import { toastRef } from '@/lib/utils/toastRef';
import SharedToast from '../components/SharedToast';

const ToastProvider = () => {
  const localRef = useRef<Toast>(null);

  useEffect(() => {
    toastRef.current = localRef.current;
  }, []);

  return <SharedToast ref={localRef} />;
};

export default ToastProvider;
