'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Heart, ExternalLink, Clock, User, BookOpen, Target, Zap, Code, Play, FileText, Layers, Award, Users } from 'lucide-react';

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    thumbnail?: string;
    channelTitle?: string;
    publishedAt?: string;
    description?: string;
    url?: string;
    type?: string;
    difficulty?: string;
    learningStyle?: string;
    category?: string;
    mastery?: string;
    estimatedTime?: number;
    duration?: string;
    isProjectBased?: boolean;
    isInteractive?: boolean;
    hasExercises?: boolean;
    tags?: string[];
    prerequisites?: string[];
    language?: string;
    framework?: string;
  };
  learningStyle?: string;
}

export default function ResourceCard({ resource, learningStyle }: ResourceCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        checkIfSaved();
      }
    });

    return () => unsubscribe();
  }, []);

  const checkIfSaved = async () => {
    if (!user) return;
    
    try {
      const savedDoc = await getDoc(doc(db, 'users', user.uid, 'savedResources', resource.id));
      setIsSaved(savedDoc.exists());
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSave = async () => {
    if (!user) return;

    try {
      const savedRef = doc(db, 'users', user.uid, 'savedResources', resource.id);
      
      if (isSaved) {
        console.log('Removing saved resource:', resource.id);
        await deleteDoc(savedRef);
        setIsSaved(false);
      } else {
        console.log('Saving resource:', resource.id);
        await setDoc(savedRef, {
          ...resource,
          savedAt: new Date(),
          learningStyle,
        });
        setIsSaved(true);
        console.log('Resource saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'course': return 'bg-green-100 text-green-800';
      case 'book': return 'bg-purple-100 text-purple-800';
      case 'podcast': return 'bg-orange-100 text-orange-800';
      case 'tool': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />
      case 'course': return <BookOpen className="h-4 w-4" />
      case 'tutorial': return <Code className="h-4 w-4" />
      case 'project': return <Layers className="h-4 w-4" />
      case 'article': return <FileText className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'tutorial': return 'bg-blue-100 text-blue-800'
      case 'project': return 'bg-green-100 text-green-800'
      case 'reference': return 'bg-purple-100 text-purple-800'
      case 'practice': return 'bg-orange-100 text-orange-800'
      case 'theory': return 'bg-indigo-100 text-indigo-800'
      case 'hands-on': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMasteryColor = (mastery?: string) => {
    switch (mastery) {
      case 'introduction': return 'bg-green-100 text-green-800'
      case 'foundational': return 'bg-blue-100 text-blue-800'
      case 'intermediate-level': return 'bg-purple-100 text-purple-800'
      case 'advanced-level': return 'bg-indigo-100 text-indigo-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
      <div className="relative">
        {/* Image placeholder - removed to prevent 404 errors */}
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-600 font-medium">Learning Resource</p>
          </div>
        </div>
        
        <button
          onClick={toggleSave}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            isSaved 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Resource Type Badge */}
        <div className="absolute top-3 left-3 flex items-center space-x-1 bg-white/95 px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
          {getTypeIcon(resource.type)}
          <span className="text-xs font-semibold capitalize text-gray-700">{resource.type}</span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {resource.title}
          </h3>
        </div>

        {resource.channelTitle && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <User className="h-4 w-4 mr-1" />
            {resource.channelTitle}
          </div>
        )}

        {resource.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {resource.description}
          </p>
        )}

        {/* Enhanced Metadata */}
        <div className="space-y-4 mb-6">
          {/* Time and Source */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {resource.estimatedTime ? `${Math.round(resource.estimatedTime / 60)}h ${resource.estimatedTime % 60}m` : (resource.duration || 'Duration not specified')}
            </div>
            {resource.publishedAt && (
              <div className="text-xs">
                {formatDate(resource.publishedAt)}
              </div>
            )}
          </div>

          {/* Learning Style and Difficulty - Always in badges */}
          <div className="flex items-center space-x-2">
            {resource.learningStyle && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                resource.learningStyle === 'visual' ? 'bg-blue-100 text-blue-800' :
                resource.learningStyle === 'auditory' ? 'bg-green-100 text-green-800' :
                resource.learningStyle === 'reading' ? 'bg-purple-100 text-purple-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {resource.learningStyle}
              </span>
            )}
            {resource.difficulty && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                {resource.difficulty}
              </span>
            )}
          </div>

          {/* Category and Mastery - Always in badges */}
          <div className="flex items-center space-x-2">
            {resource.category && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
                {resource.category}
              </span>
            )}
            {resource.mastery && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMasteryColor(resource.mastery)}`}>
                {resource.mastery}
              </span>
            )}
          </div>

          {/* Features */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {resource.isProjectBased && (
              <div className="flex items-center space-x-1">
                <Layers className="h-3 w-3" />
                <span>Project</span>
              </div>
            )}
            {resource.isInteractive && (
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>Interactive</span>
              </div>
            )}
            {resource.hasExercises && (
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>Exercises</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resource.tags.slice(0, 3).map((tag: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{resource.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Prerequisites */}
          {resource.prerequisites && resource.prerequisites.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Prerequisites:</span> {resource.prerequisites.join(', ')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {resource.language && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                {resource.language}
              </span>
            )}
            {resource.framework && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                {resource.framework}
              </span>
            )}
          </div>
          
          <a
            href={resource.url || `https://www.youtube.com/watch?v=${resource.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            {resource.type === 'video' || !resource.type ? 'Watch' : 'Read'}
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
