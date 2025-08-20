import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '', style }) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 64
  };

  const avatarSize = typeof size === 'number' ? size : (sizeMap[size] || sizeMap.md);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl'
  };

  const sizeClass = typeof size === 'number' ? '' : (sizeClasses[size] || sizeClasses.md);

  // 生成基于名称的背景色
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // 获取名称的第一个字符
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          // 如果图片加载失败，隐藏img元素，显示默认头像
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = parent.querySelector('.avatar-fallback');
            if (fallback) {
              (fallback as HTMLElement).style.display = 'flex';
            }
          }
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full ${getBackgroundColor(name)} flex items-center justify-center text-white font-semibold avatar-fallback ${className}`}
      style={{
        ...(typeof size === 'number' ? { width: avatarSize, height: avatarSize } : {}),
        ...style
      }}
    >
      {getInitial(name)}
    </div>
  );
};

export default Avatar;