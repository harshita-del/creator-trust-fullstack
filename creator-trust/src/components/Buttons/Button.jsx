// src/components/Buttons/Button.jsx
import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary', // primary | outline | ghost | danger
  size = 'md', // sm | md | lg
  as: Component = 'button',
  loading = false,
  disabled = false,
  icon = null,
  ...rest
}) {
  return (
    <Component
      className={`ct-btn ct-btn--${variant} ct-btn--${size}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="ct-btn__spinner" aria-hidden="true" />
      ) : (
        <>
          {icon && <span className="ct-btn__icon">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </Component>
  );
}
