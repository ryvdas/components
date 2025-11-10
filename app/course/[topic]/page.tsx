'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getYouTubeVideos, getLearningStyleKeywords } from '../../../lib/youtube'
import { getResourcesByTopic, filterResourcesByStyle } from '../../../lib/resources'
import { generateVideoRecommendations, getDetailedYouTubeVideos, VideoAnalysis, generateEducationalResources, generateLearningPathway, pathwayModulesToResources } from '../../../lib/gemini'
import CourseLayout from '../../../components/CourseLayout'
import { Loader2, ArrowLeft, Plus, Sparkles, Wand2, BookOpen, Target } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

export default function CoursePage() {
  const params = useParams()
  let rawTopic = params.topic as string
  
  // Decode URL parameter (handles %20 and other encoded characters)
  rawTopic = decodeURIComponent(rawTopic || '')
  
  // Convert URL parameter back to readable format (handles both hyphens and spaces)
  const getDisplayTopic = (urlTopic: string) => {
    // First decode any URL encoding
    const decoded = decodeURIComponent(urlTopic || '')
    // Replace hyphens with spaces, then normalize
    return decoded
      .replace(/-/g, ' ')
      .replace(/%20/g, ' ')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim()
  }
  
  const displayTopic = getDisplayTopic(rawTopic)
  
  // Normalize topic for duplicate checking (standardize format)
  const normalizeTopic = (topicName: string): string => {
    return topicName
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const normalizedTopic = normalizeTopic(displayTopic)
  
  // Convert display topic to URL format (for navigation)
  const getTopicUrl = (topicName: string): string => {
    return topicName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-')
  }
  
  const topicUrl = getTopicUrl(displayTopic)
  const topic = rawTopic // Keep raw topic for URL purposes
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [learningStyle, setLearningStyle] = useState<string>('')
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [staticResources, setStaticResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [learningPlan, setLearningPlan] = useState<any>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [userTimeCommitment, setUserTimeCommitment] = useState<number>(10) // Default 10 hours

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user')
      setUser(user)
      if (user) {
        await fetchUserLearningStyle()
        await checkExistingPlan()
      }
      console.log('Setting loading to false')
      setLoading(false)
    })

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Timeout reached, setting loading to false')
      setLoading(false)
    }, 5000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (displayTopic && learningStyle && !learningPlan) {
      fetchResources()
    }
  }, [displayTopic, learningStyle, learningPlan])

  const fetchUserLearningStyle = async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setLearningStyle(userData.learningStyle || '')
        setUserTimeCommitment(userData.hoursPerWeek || 10) // Get user's time commitment
      }
    } catch (error) {
      console.error('Error fetching learning style:', error)
    }
  }

  const checkExistingPlan = async () => {
    if (!user || !displayTopic) return

    try {
      // Get all plans and check if any normalized topic matches
      const plansRef = collection(db, 'users', user.uid, 'learningPlans')
      const querySnapshot = await getDocs(plansRef)
      
      // Check if any plan has a normalized topic that matches
      const existingPlan = querySnapshot.docs.find(doc => {
        const planData = doc.data()
        const planTopic = planData.topic || planData.normalizedTopic || ''
        return normalizeTopic(planTopic) === normalizedTopic
      })
      
      if (existingPlan) {
        const planDoc = existingPlan
        const planData = planDoc.data()
        setLearningPlan({ id: planDoc.id, ...planData })
        
        // If plan has resources, use them
        if (planData.resources && planData.resources.length > 0) {
          setYoutubeVideos(planData.resources.filter((r: any) => r.type === 'video'))
          setStaticResources(planData.resources.filter((r: any) => r.type !== 'video'))
        }
      }
    } catch (error) {
      console.error('Error checking existing plan:', error)
    }
  }

  const createLearningPlan = async () => {
    if (!user) return

    try {
      // Normalize topic for consistent storage and duplicate checking
      const normalizedTopicForStorage = normalizedTopic
      
      // Check if a plan with this normalized topic already exists
      const plansRef = collection(db, 'users', user.uid, 'learningPlans')
      const querySnapshot = await getDocs(plansRef)
      const existingPlan = querySnapshot.docs.find(doc => {
        const planData = doc.data()
        const planTopic = planData.topic || planData.normalizedTopic || ''
        return normalizeTopic(planTopic) === normalizedTopicForStorage
      })
      
      if (existingPlan) {
        setLearningPlan(existingPlan.data())
        return
      }
      
      const planId = `${normalizedTopicForStorage.replace(/\s+/g, '-')}-${Date.now()}`
      const newPlan = {
        id: planId,
        topic: displayTopic, // Store the display format for readability
        normalizedTopic: normalizedTopicForStorage, // Store normalized version for duplicate checking
        title: `Learn ${displayTopic}`,
        description: `A personalized learning plan for ${displayTopic}`,
        difficulty: 'beginner',
        estimatedHours: 10,
        learningStyle: learningStyle || 'visual',
        resources: [],
        progress: 0,
        createdAt: new Date()
      }

      await setDoc(doc(db, 'users', user.uid, 'learningPlans', planId), newPlan)
      setLearningPlan(newPlan)
    } catch (error) {
      console.error('Error creating learning plan:', error)
    }
  }

  // Organize existing resources into a logical learning pathway
  const organizeResourcesIntoPathway = async (resources: any[], learningStyle: string) => {
    const prompt = `
You are an expert educational content organizer. Given a list of learning resources, organize them into a logical learning pathway.

Resources to organize:
${JSON.stringify(resources.map(r => ({
  title: r.title,
  type: r.type,
  difficulty: r.difficulty,
  category: r.category,
  mastery: r.mastery,
  estimatedTime: r.estimatedTime
})), null, 2)}

Instructions:
1. Select 6-10 resources that would make the most logical progression
2. Order them from foundational concepts to advanced topics
3. Consider difficulty levels: beginner → intermediate → advanced
4. Consider mastery levels: foundational → intermediate-level → advanced-level
5. Prioritize resources that match the ${learningStyle} learning style
6. Return ONLY the resource titles in order (no explanations, no additional text)

Format as a JSON array of resource titles:
["Resource Title 1", "Resource Title 2", "Resource Title 3", ...]
`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini API key not configured')
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      const generatedText = response.data.candidates[0].content.parts[0].text.trim()
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('Could not parse resource ordering from AI response')
      }

      const orderedTitles = JSON.parse(jsonMatch[0])
      
      // Reorder resources based on the AI-generated order
      const orderedResources = orderedTitles
        .map((title: string) => resources.find(r => r.title === title))
        .filter((r: any) => r !== undefined)
      
      return orderedResources
    } catch (error) {
      console.error('Error organizing resources with AI, falling back to manual sorting:', error)
      // Fallback to manual sorting if AI fails
      return sortResourcesManually(resources)
    }
  }

  // Manual fallback sorting when AI is unavailable
  const sortResourcesManually = (resources: any[]) => {
    const difficultyOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 }
    const masteryOrder = { 'introduction': 0, 'foundational': 1, 'intermediate-level': 2, 'advanced-level': 3, 'expert': 4 }
    const categoryOrder = { 'tutorial': 0, 'hands-on': 1, 'project': 2, 'practice': 3, 'theory': 4, 'reference': 5 }

    return [...resources].sort((a, b) => {
      // First, sort by difficulty
      const diffA = difficultyOrder[a.difficulty] ?? 999
      const diffB = difficultyOrder[b.difficulty] ?? 999
      if (diffA !== diffB) return diffA - diffB

      // Then by mastery level
      const masteryA = masteryOrder[a.mastery] ?? 999
      const masteryB = masteryOrder[b.mastery] ?? 999
      if (masteryA !== masteryB) return masteryA - masteryB

      // Then by category (tutorials/hands-on before theory)
      const catA = categoryOrder[a.category] ?? 999
      const catB = categoryOrder[b.category] ?? 999
      if (catA !== catB) return catA - catB

      // Finally by estimated time
      return (a.estimatedTime || 0) - (b.estimatedTime || 0)
    }).slice(0, 10) // Limit to top 10 resources
  }

  // Calculate match score for a resource (copy from learn page)
  const calculateMatchScore = (resource: any): 'perfect' | 'slight' | 'low' => {
    if (!learningStyle || !resource.learningStyle) return 'low'
    
    // Perfect match: exact learning style match AND both hands-on/project category AND isProjectBased AND isInteractive
    if (resource.learningStyle === learningStyle) {
      const isHandsOnOrProject = resource.category === 'hands-on' || resource.category === 'project'
      const isHighlyInteractive = resource.isProjectBased && resource.isInteractive
      
      if (isHandsOnOrProject && isHighlyInteractive) {
        return 'perfect'
      }
      return 'slight'
    }
    
    const learningStyleCompatibility: Record<string, string[]> = {
      'visual': ['reading', 'auditory'],
      'auditory': ['kinesthetic', 'reading'],
      'reading': ['visual', 'kinesthetic', 'auditory'],
      'kinesthetic': ['visual', 'auditory', 'reading']
    }
    
    const compatibleStyles = learningStyleCompatibility[learningStyle] || []
    if (compatibleStyles.includes(resource.learningStyle)) {
      return 'slight'
    }
    
    return 'low'
  }

  // Auto-generate pathway with perfect matches
  const autoGeneratePathwayWithPerfectMatches = async () => {
    if (!user) return
    
    try {
      // Fetch resources first
      await fetchResources()
      
      // Get all available resources
      const allResourcesTemp = [
        ...youtubeVideos.map(video => ({
          ...video,
          type: 'video',
          difficulty: 'intermediate',
          mastery: 'foundational',
          category: 'tutorial'
        })),
        ...staticResources
      ]

      if (allResourcesTemp.length === 0) {
        throw new Error('No resources found for this topic.')
      }

      // Filter for perfect matches only
      const perfectMatches = allResourcesTemp.filter(resource => calculateMatchScore(resource) === 'perfect')
      
      // If we have perfect matches, use them; otherwise, use all resources sorted
      const resourcesToUse = perfectMatches.length > 0 
        ? sortResourcesManually(perfectMatches) 
        : sortResourcesManually(allResourcesTemp).slice(0, 6)

      // Save all resources to saved menu
      for (const resource of resourcesToUse) {
        const savedRef = doc(db, 'users', user.uid, 'savedResources', resource.id)
        await setDoc(savedRef, {
          ...resource,
          savedAt: new Date(),
          learningStyle,
        }, { merge: true })
      }

      // Separate videos from other resources
      const videos = resourcesToUse.filter(r => r.type === 'video')
      const otherResources = resourcesToUse.filter(r => r.type !== 'video')
      
      // Set resources
      setStaticResources(otherResources)
      setYoutubeVideos(videos)
      
      // Calculate total estimated time
      const totalMinutes = resourcesToUse.reduce((sum, r) => sum + (r.estimatedTime || 0), 0)
      const estimatedHours = Math.ceil(totalMinutes / 60)
      
      // Update learning plan with organized resources
      if (learningPlan) {
        const updatedPlan = {
          ...learningPlan,
          resources: resourcesToUse,
          estimatedHours: estimatedHours,
          topic: displayTopic,
          learningStyle: learningStyle
        }
        
        await setDoc(doc(db, 'users', user.uid, 'learningPlans', learningPlan.id), updatedPlan)
        setLearningPlan(updatedPlan)
      }
      
      // Reload the page to show the newly generated course
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error auto-generating pathway:', error)
      setError(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    }
  }

  const generateAICourse = async () => {
    if (!user) return
    
    setIsGeneratingAI(true)
    try {
      // Create learning plan first
      await createLearningPlan()
      
      console.log(`Generating AI course for ${displayTopic} with ${learningStyle} learning style`)
      
      // Fetch all available resources for this topic
      await fetchResources()
      
      // Get the combined resources
      const allResourcesTemp = [
        ...youtubeVideos.map(video => ({
          ...video,
          type: 'video',
          difficulty: 'intermediate',
          mastery: 'foundational',
          category: 'tutorial'
        })),
        ...staticResources
      ]

      if (allResourcesTemp.length === 0) {
        throw new Error('No resources found for this topic. Please try a different topic.')
      }

      // Organize resources into a logical pathway using AI
      const organizedResources = await organizeResourcesIntoPathway(allResourcesTemp, learningStyle)
      
      if (organizedResources.length === 0) {
        throw new Error('Could not organize resources into a pathway')
      }

      // Separate videos from other resources
      const videos = organizedResources.filter(r => r.type === 'video')
      const otherResources = organizedResources.filter(r => r.type !== 'video')
      
      // Set resources
      setStaticResources(otherResources)
      setYoutubeVideos(videos)
      
      // Calculate total estimated time
      const totalMinutes = organizedResources.reduce((sum, r) => sum + (r.estimatedTime || 0), 0)
      const estimatedHours = Math.ceil(totalMinutes / 60)
      
      // Update learning plan with organized resources
      if (learningPlan) {
        const updatedPlan = {
          ...learningPlan,
          resources: organizedResources,
          estimatedHours: estimatedHours,
          topic: displayTopic,
          learningStyle: learningStyle
        }
        
        await setDoc(doc(db, 'users', user.uid, 'learningPlans', learningPlan.id), updatedPlan)
        setLearningPlan(updatedPlan)
      }
      
      console.log('AI course generation completed successfully')
      
      // Reload the page to show the newly generated course
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error generating AI course:', error)
      setError(`Failed to generate AI course: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsGeneratingAI(false)
    }
  }
  
  // Helper function to extract YouTube video ID from URL
  const extractYouTubeVideoId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : ''
  }

  const fetchResources = async () => {
    setError('')
    
    try {
      // Fetch YouTube videos with learning style enhancement
      const videos = await getYouTubeVideos(displayTopic, learningStyle)
      setYoutubeVideos(videos)

      // Get static resources for the topic
      const resources = getResourcesByTopic(displayTopic.toLowerCase())
      const filteredResources = filterResourcesByStyle(resources, learningStyle)
      setStaticResources(filteredResources)
    } catch (error) {
      console.error('Error fetching resources:', error)
      setError('Failed to load course resources')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access courses</h2>
          <Link 
            href="/auth"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading course</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Combine all resources
  const allResources = [
    ...youtubeVideos.map(video => ({
      ...video,
      type: 'video',
      difficulty: 'intermediate'
    })),
    ...staticResources
  ]

  if (allResources.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Learning {displayTopic}?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Let's create your personalized course! Choose how you'd like to get started.
            </p>
          </div>

          {/* Course Creation Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* AI Generated Course */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-200">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Generated Course</h3>
                <p className="text-gray-600 mb-6">
                  Our AI will create a comprehensive, structured learning pathway tailored to your learning style ({learningStyle}) and time commitment ({userTimeCommitment} hours). The pathway includes carefully curated resources from reputable platforms, organized in logical progression from foundational to advanced concepts.
                </p>
                <button
                  onClick={generateAICourse}
                  disabled={isGeneratingAI}
                  className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Generate AI Course
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  ✨ Takes 30 seconds to create your personalized course
                </p>
              </div>
            </div>

            {/* Manual Course Creation */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <Target className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Your Own Course</h3>
                <p className="text-gray-600 mb-6">
                  Start with basic resources and add your own content as you discover it. Perfect for when you want full control.
                </p>
                <button
                  onClick={async () => {
                    await createLearningPlan()
                    await autoGeneratePathwayWithPerfectMatches()
                  }}
                  className="w-full bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Course
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  🎯 Automatically creates pathway from perfect matches
                </p>
              </div>
            </div>
          </div>

          {/* Additional Help */}
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-900">Need help choosing?</h4>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                <strong>AI Generated Course</strong> is perfect for beginners or when you want a structured learning path.<br/>
                <strong>Build Your Own Course</strong> is great when you already have some resources in mind.
              </p>
              <Link
                href={`/learn/${topicUrl}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
              >
                Browse resources first →
              </Link>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Learn {displayTopic}</h1>
                <p className="text-gray-600">
                  Personalized course for {learningStyle} learners
                  {learningPlan && (
                    <span className="ml-2 text-green-600 font-medium">• Learning Plan Active</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {allResources.length} resources
              </div>
              <Link
                href={`/learn/${topicUrl}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Resources
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Course Layout */}
      <CourseLayout topic={displayTopic} resources={allResources} />
    </div>
  )
}
