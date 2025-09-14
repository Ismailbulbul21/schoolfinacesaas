import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* School Building Base */}
          <rect x="4" y="18" width="24" height="12" fill="#2563eb" rx="2"/>
          
          {/* School Roof */}
          <path d="M2 18 L16 8 L30 18 L28 18 L16 10 L4 18 Z" fill="#1d4ed8"/>
          
          {/* School Windows */}
          <rect x="7" y="21" width="4" height="4" fill="#dbeafe" rx="1"/>
          <rect x="13" y="21" width="4" height="4" fill="#dbeafe" rx="1"/>
          <rect x="19" y="21" width="4" height="4" fill="#dbeafe" rx="1"/>
          
          {/* School Door */}
          <rect x="14" y="24" width="4" height="6" fill="#1e40af" rx="1"/>
          
          {/* Graduation Cap */}
          <ellipse cx="16" cy="6" rx="6" ry="2" fill="#f59e0b"/>
          <rect x="10" y="6" width="12" height="1" fill="#d97706"/>
          <circle cx="16" cy="6" r="1" fill="#ffffff"/>
          
          {/* Books */}
          <rect x="6" y="12" width="3" height="4" fill="#10b981" rx="0.5"/>
          <rect x="10" y="11" width="3" height="4" fill="#3b82f6" rx="0.5"/>
          <rect x="14" y="10" width="3" height="4" fill="#8b5cf6" rx="0.5"/>
          <rect x="18" y="11" width="3" height="4" fill="#f59e0b" rx="0.5"/>
          <rect x="22" y="12" width="3" height="4" fill="#ef4444" rx="0.5"/>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
            School
          </span>
          <span className={`font-bold text-blue-600 ${textSizeClasses[size]}`}>
            System
          </span>
        </div>
      )}
    </div>
  )
}

export default Logo
