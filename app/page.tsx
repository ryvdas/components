'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '../SearchBar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-6xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Learn <span className="text-blue-600">Anything</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Discover personalized learning resources that match your unique learning style
          </p>
          
          <div className="mb-16">
            <SearchBar />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-6">🎯</div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Personalized Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Take our quiz to discover your learning style and get resources tailored just for you
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-6">📚</div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Curated Resources</h3>
              <p className="text-gray-600 leading-relaxed">
                Access high-quality videos, articles, and courses from trusted sources
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-6">📈</div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Save bookmarks, track your learning journey, and celebrate your achievements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
