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
          {/* Background Circle */}
          <circle cx="16" cy="16" r="16" fill="url(#gradient1)"/>
          
          {/* School Building */}
          <rect x="6" y="18" width="20" height="10" fill="#ffffff" rx="1"/>
          
          {/* School Roof */}
          <path d="M4 18 L16 8 L28 18 L26 18 L16 12 L6 18 Z" fill="#ffffff"/>
          
          {/* School Windows */}
          <rect x="9" y="21" width="3" height="3" fill="#2563eb" rx="0.5"/>
          <rect x="14" y="21" width="3" height="3" fill="#2563eb" rx="0.5"/>
          <rect x="19" y="21" width="3" height="3" fill="#2563eb" rx="0.5"/>
          
          {/* School Door */}
          <rect x="14" y="24" width="4" height="4" fill="#1d4ed8" rx="0.5"/>
          
          {/* Graduation Cap */}
          <ellipse cx="16" cy="6" rx="4" ry="1.5" fill="#f59e0b"/>
          <rect x="12" y="6" width="8" height="0.8" fill="#d97706"/>
          <circle cx="16" cy="6" r="0.8" fill="#ffffff"/>
          
          {/* Books Stack */}
          <rect x="8" y="14" width="2" height="3" fill="#10b981" rx="0.3"/>
          <rect x="10.5" y="13" width="2" height="3" fill="#3b82f6" rx="0.3"/>
          <rect x="13" y="12" width="2" height="3" fill="#8b5cf6" rx="0.3"/>
          <rect x="15.5" y="13" width="2" height="3" fill="#f59e0b" rx="0.3"/>
          <rect x="18" y="14" width="2" height="3" fill="#ef4444" rx="0.3"/>
          
          {/* Decorative Elements */}
          <circle cx="24" cy="10" r="1" fill="#ffffff" opacity="0.8"/>
          <circle cx="26" cy="12" r="0.8" fill="#ffffff" opacity="0.6"/>
          <circle cx="8" cy="10" r="0.8" fill="#ffffff" opacity="0.6"/>
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
              <stop offset="50%" stopColor="#1d4ed8" stopOpacity="1" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="1" />
            </linearGradient>
          </defs>
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
