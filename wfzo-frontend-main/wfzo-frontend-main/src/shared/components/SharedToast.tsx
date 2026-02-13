'use client';

import React, { forwardRef } from 'react';
import { Toast as ToastPR, ToastProps } from 'primereact/toast';

const SharedToast = forwardRef<ToastPR, ToastProps>((props, ref) => (
  <ToastPR
    ref={ref}
    position={props.position ?? 'top-right'}
    baseZIndex={9999}
    appendTo="self"
    {...props}
  />
));

SharedToast.displayName = 'SharedToast';

export default SharedToast;
