import React from 'react';
import { Tray } from '@phosphor-icons/react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className={styles.root}>
      <div className={styles.iconBox}>
        {icon || <Tray size={32} weight="duotone" />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && (
        <p className={styles.description}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={styles.action}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
