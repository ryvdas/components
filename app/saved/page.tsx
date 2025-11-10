'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import ResourceCard from '../../ResourceCard'
import { Heart, BookOpen, Filter, X, Trash2 } from 'lucide-react'

export default function SavedPage() {
  const [user, setUser] = useState<any>(null)
  const [savedResources, setSavedResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await fetchSavedResources(user.uid)
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchSavedResources = async (userId: string) => {
    setLoading(true)
    try {
      console.log('Fetching saved resources for user:', userId)
      const savedRef = collection(db, 'users', userId, 'savedResources')
      const q = query(savedRef, orderBy('savedAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      console.log('Query snapshot:', querySnapshot.docs.length, 'docs found')
      
      const resources = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('Resources:', resources)
      setSavedResources(resources)

      // Extract unique tags from saved resources
      const allTags = new Set<string>()
      resources.forEach((resource: any) => {
        if (resource.tags) {
          resource.tags.forEach((tag: string) => allTags.add(tag))
        }
      })
      setAvailableTags(Array.from(allTags).sort())
    } catch (error) {
      console.error('Error fetching saved resources:', error)
      setSavedResources([])
    } finally {
      setLoading(false)
    }
  }

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllTags = () => {
    setSelectedTags([])
  }

  const getFilteredResources = () => {
    let filtered = savedResources

    // Filter by learning style first
    if (filter !== 'all') {
      filtered = filtered.filter(resource => resource.learningStyle === filter)
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(resource => {
        if (!resource.tags) return false
        return selectedTags.some(tag => resource.tags.includes(tag))
      })
    }

    return filtered
  }

  const filteredResources = getFilteredResources()

  const handleDeleteResource = async (resourceId: string) => {
    if (!user) return
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedResources', resourceId))
      // Refresh the resources list
      await fetchSavedResources(user.uid)
    } catch (error) {
      console.error('Error deleting resource:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved resources...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view saved resources</h2>
          <p className="text-gray-600 mb-6">
            Create an account or sign in to save and organize your favorite learning resources.
          </p>
          <a 
            href="/auth"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Saved Resources</h1>
            <p className="text-lg text-gray-600">
              {savedResources.length} saved resource{savedResources.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => user && fetchSavedResources(user.uid)}
              className="mt-4 text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Filter */}
          {savedResources.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Filter by learning style:</span>
                </div>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Styles</option>
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="reading">Reading/Writing</option>
                  <option value="kinesthetic">Kinesthetic</option>
                </select>
              </div>
            </div>
          )}

          {/* Tag Filter Section */}
          {availableTags.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Filter by Tags</h3>
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <span className="mr-2">Active filters:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources Count */}
          {(selectedTags.length > 0 || filter !== 'all') && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
              {selectedTags.length > 0 && ` matching ${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`}
              {filter !== 'all' && ` for ${filter} learners`}
            </div>
          )}

          {/* Resources Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="relative">
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="absolute top-2 right-2 z-50 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                    aria-label="Delete resource"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ResourceCard 
                    resource={resource}
                    learningStyle={resource.learningStyle}
                  />
                </div>
              ))}
            </div>
          ) : savedResources.length > 0 ? (
            <div className="text-center py-12">
              <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">
                No saved resources match your current filter. Try selecting a different learning style.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved resources yet</h3>
              <p className="text-gray-600 mb-6">
                Start exploring topics and save resources you find interesting to build your personalized learning library.
              </p>
              <a 
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Start Learning
              </a>
            </div>
          )}

          {/* Learning Statistics */}
          {savedResources.length > 0 && (
            <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Profile</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {savedResources.length}
                  </div>
                  <p className="text-gray-600">Total Saved</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {new Set(savedResources.map(r => r.learningStyle)).size}
                  </div>
                  <p className="text-gray-600">Learning Styles</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {new Set(savedResources.map(r => r.type)).size}
                  </div>
                  <p className="text-gray-600">Resource Types</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {new Set(savedResources.map(r => r.channelTitle || r.url)).size}
                  </div>
                  <p className="text-gray-600">Sources</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
