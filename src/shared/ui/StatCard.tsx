import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  badge?: {
    text: string;
    type?: 'success' | 'warning' | 'info' | 'danger';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-huit-blue',
  badge,
}) => {
  const badgeTypeClass = {
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    danger: styles.badgeDanger,
    info: styles.badgeInfo,
  }[badge?.type || 'info'];

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={`${styles.iconBox} ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {badge && (
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${badgeTypeClass}`}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
};
