'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { User, LogOut, Settings, Target, Heart, BookOpen, Accessibility, Palette, Bell, Shield } from 'lucide-react'

interface UserDropdownProps {
  user: any
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleEditQuiz = () => {
    router.push('/quiz?edit=true')
    setIsOpen(false)
  }

  const handleAccountSettings = () => {
    // TODO: Implement account settings page
    console.log('Account settings clicked')
    setIsOpen(false)
  }

  const handleAccessibilitySettings = () => {
    // TODO: Implement accessibility settings page
    console.log('Accessibility settings clicked')
    setIsOpen(false)
  }

  const menuItems = [
    {
      icon: Target,
      label: 'Edit Learning Style',
      onClick: handleEditQuiz,
      description: 'Update your learning preferences'
    },
    {
      icon: BookOpen,
      label: 'Learning Plans',
      onClick: () => {
        router.push('/plans')
        setIsOpen(false)
      },
      description: 'View your learning plans'
    },
    {
      icon: Target,
      label: 'Dashboard',
      onClick: () => {
        router.push('/dashboard')
        setIsOpen(false)
      },
      description: 'Overview of your learning progress'
    },
    {
      icon: Heart,
      label: 'Saved Resources',
      onClick: () => {
        router.push('/saved')
        setIsOpen(false)
      },
      description: 'Your bookmarked resources'
    }
  ]

  const settingsItems = [
    {
      icon: Settings,
      label: 'Account Settings',
      onClick: handleAccountSettings,
      description: 'Manage your account'
    },
    {
      icon: Accessibility,
      label: 'Accessibility',
      onClick: handleAccessibilitySettings,
      description: 'Customize your experience'
    },
    {
      icon: Palette,
      label: 'Appearance',
      onClick: () => {
        console.log('Appearance settings clicked')
        setIsOpen(false)
      },
      description: 'Theme and display options'
    },
    {
      icon: Bell,
      label: 'Notifications',
      onClick: () => {
        console.log('Notification settings clicked')
        setIsOpen(false)
      },
      description: 'Manage your notifications'
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      onClick: () => {
        console.log('Privacy settings clicked')
        setIsOpen(false)
      },
      description: 'Control your data and security'
    }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
      >
        <User className="h-5 w-5" />
        <span className="text-sm font-medium">{user.email}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">Learning Profile</p>
              </div>
            </div>
          </div>

          {/* Learning Menu Items */}
          <div className="py-2">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Learning</h3>
            </div>
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Settings Menu Items */}
          <div className="py-2 border-t border-gray-100">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h3>
            </div>
            {settingsItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
