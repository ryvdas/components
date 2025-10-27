'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Play, CheckCircle, Clock, BookOpen, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react'
import CoursePlayer from './CoursePlayer'

interface CourseLayoutProps {
  topic: string
  resources: any[]
}

export default function CourseLayout({ topic, resources }: CourseLayoutProps) {
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0)
  const [completedResources, setCompletedResources] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await loadCompletedResources()
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadCompletedResources = async () => {
    if (!user) return

    try {
      const progressRef = collection(db, 'users', user.uid, 'courseProgress')
      const q = query(progressRef, where('completed', '==', true))
      const querySnapshot = await getDocs(q)
      
      const completed = new Set<string>()
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.completed) {
          completed.add(data.resourceId)
        }
      })
      
      setCompletedResources(completed)
    } catch (error) {
      console.error('Error loading completed resources:', error)
    }
  }

  const handleResourceComplete = async (resourceId: string) => {
    const newCompleted = new Set(completedResources)
    newCompleted.add(resourceId)
    setCompletedResources(newCompleted)
  }

  const handleProgressUpdate = (resourceId: string, progress: number) => {
    // Update progress in real-time
    console.log(`Resource ${resourceId} progress: ${progress}%`)
  }

  const getOverallProgress = () => {
    if (resources.length === 0) return 0
    return Math.round((completedResources.size / resources.length) * 100)
  }

  const getNextIncompleteResource = () => {
    return resources.findIndex(resource => !completedResources.has(resource.id))
  }

  const goToNextResource = () => {
    const nextIndex = getNextIncompleteResource()
    if (nextIndex !== -1) {
      setCurrentResourceIndex(nextIndex)
    } else {
      // All resources completed, go to first one
      setCurrentResourceIndex(0)
    }
  }

  const goToPreviousResource = () => {
    if (currentResourceIndex > 0) {
      setCurrentResourceIndex(currentResourceIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentResource = resources[currentResourceIndex]
  const overallProgress = getOverallProgress()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* Course Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-900">Learn {topic}</h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Course Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {completedResources.size} of {resources.length} resources completed
            </div>
          </div>

          {/* Resource List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Course Content</h3>
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <button
                    key={resource.id}
                    onClick={() => setCurrentResourceIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentResourceIndex
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {completedResources.has(resource.id) ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Play className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resource.title}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="capitalize">{resource.learningStyle}</span>
                          <span>•</span>
                          <span>{resource.duration || 'No duration'}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentResource?.title || 'No resource selected'}
                </h2>
                <p className="text-sm text-gray-600">
                  Resource {currentResourceIndex + 1} of {resources.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousResource}
                disabled={currentResourceIndex === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={goToNextResource}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Course Player */}
        <div className="flex-1 p-6">
          {currentResource ? (
            <CoursePlayer
              resource={currentResource}
              onComplete={() => handleResourceComplete(currentResource.id)}
              onProgress={(progress) => handleProgressUpdate(currentResource.id, progress)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources available</h3>
              <p className="text-gray-600">There are no resources available for this course.</p>
            </div>
          )}
        </div>

        {/* Completion Message */}
        {overallProgress === 100 && (
          <div className="bg-green-50 border-t border-green-200 px-6 py-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Congratulations!</h3>
                <p className="text-green-700">You've completed the {topic} course!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
