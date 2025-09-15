import React from 'react'

interface FullLogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const FullLogo: React.FC<FullLogoProps> = ({ 
  className = '', 
  size = 'medium', 
  showText = true 
}) => {
  const sizeClasses = {
    small: 'w-32 h-8',
    medium: 'w-48 h-12',
    large: 'w-64 h-16'
  }
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        className={sizeClasses[size]}
        viewBox="0 0 240 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="240" height="80" fill="url(#bgGradient)" rx="12"/>
        
        {/* School Building */}
        <rect x="20" y="35" width="60" height="35" fill="#ffffff" rx="4"/>
        <path d="M10 35 L50 15 L90 35 L85 35 L50 20 L15 35 Z" fill="#ffffff"/>
        
        {/* School Windows */}
        <rect x="28" y="42" width="8" height="8" fill="#2563eb" rx="1"/>
        <rect x="40" y="42" width="8" height="8" fill="#2563eb" rx="1"/>
        <rect x="52" y="42" width="8" height="8" fill="#2563eb" rx="1"/>
        <rect x="64" y="42" width="8" height="8" fill="#2563eb" rx="1"/>
        
        {/* School Door */}
        <rect x="44" y="55" width="12" height="15" fill="#1d4ed8" rx="1"/>
        
        {/* Graduation Cap */}
        <ellipse cx="50" cy="12" rx="12" ry="4" fill="#f59e0b"/>
        <rect x="38" y="12" width="24" height="2" fill="#d97706"/>
        <circle cx="50" cy="12" r="2" fill="#ffffff"/>
        
        {/* Books Stack */}
        <rect x="25" y="25" width="4" height="6" fill="#10b981" rx="1"/>
        <rect x="30" y="23" width="4" height="6" fill="#3b82f6" rx="1"/>
        <rect x="35" y="21" width="4" height="6" fill="#8b5cf6" rx="1"/>
        <rect x="40" y="23" width="4" height="6" fill="#f59e0b" rx="1"/>
        <rect x="45" y="25" width="4" height="6" fill="#ef4444" rx="1"/>
        <rect x="50" y="23" width="4" height="6" fill="#06b6d4" rx="1"/>
        <rect x="55" y="25" width="4" height="6" fill="#84cc16" rx="1"/>
        
        {/* School System Text */}
        {showText && (
          <>
            <text x="110" y="35" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#ffffff">
              School
            </text>
            <text x="110" y="55" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#fbbf24">
              System
            </text>
            
            {/* Subtitle */}
            <text x="110" y="68" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="normal" fill="#dbeafe" opacity="0.9">
              Finance Management
            </text>
          </>
        )}
        
        {/* Decorative Elements */}
        <circle cx="200" cy="20" r="3" fill="#fbbf24" opacity="0.8"/>
        <circle cx="210" cy="25" r="2" fill="#10b981" opacity="0.7"/>
        <circle cx="205" cy="35" r="2" fill="#3b82f6" opacity="0.7"/>
        <circle cx="215" cy="30" r="2" fill="#8b5cf6" opacity="0.7"/>
        
        {/* Chart-like Elements */}
        <rect x="190" y="45" width="3" height="15" fill="#fbbf24" opacity="0.6" rx="1"/>
        <rect x="195" y="40" width="3" height="20" fill="#10b981" opacity="0.6" rx="1"/>
        <rect x="200" y="35" width="3" height="25" fill="#3b82f6" opacity="0.6" rx="1"/>
        <rect x="205" y="42" width="3" height="18" fill="#8b5cf6" opacity="0.6" rx="1"/>
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="1" />
            <stop offset="30%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default FullLogo
