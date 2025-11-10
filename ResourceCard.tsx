'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Heart, ExternalLink, Clock, User, BookOpen, Target, Zap, Code, Play, FileText, Layers, Award, Users, Check, Plus, Share2 } from 'lucide-react';

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
      case 'interactive': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'project': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'video': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'article': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'course': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      case 'tutorial': return 'bg-blue-600 text-white border-blue-700'
      case 'project': return 'bg-green-600 text-white border-green-700'
      case 'reference': return 'bg-purple-600 text-white border-purple-700'
      case 'practice': return 'bg-orange-600 text-white border-orange-700'
      case 'theory': return 'bg-indigo-600 text-white border-indigo-700'
      case 'hands-on': return 'bg-red-600 text-white border-red-700'
      default: return 'bg-gray-600 text-white border-gray-700'
    }
  }

  const getMasteryColor = (mastery?: string) => {
    switch (mastery) {
      case 'introduction': return 'bg-emerald-600 text-white border-emerald-700'
      case 'foundational': return 'bg-cyan-600 text-white border-cyan-700'
      case 'intermediate-level': return 'bg-blue-600 text-white border-blue-700'
      case 'advanced-level': return 'bg-indigo-600 text-white border-indigo-700'
      case 'expert': return 'bg-red-600 text-white border-red-700'
      default: return 'bg-gray-600 text-white border-gray-700'
    }
  }

  // Check if this is a perfect match for learning style
  const isPerfectMatch = resource.learningStyle === learningStyle;

  // Determine primary category to display
  const getPrimaryCategory = () => {
    if (resource.category) {
      return { text: resource.category, icon: <Target className="h-4 w-4" /> };
    }
    if (resource.type) {
      return { text: resource.type, icon: getTypeIcon(resource.type) };
    }
    return { text: 'resource', icon: <BookOpen className="h-4 w-4" /> };
  };

  const primaryCategory = getPrimaryCategory();

  return (
    <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      <div className="p-6 flex-1">
        {/* Top Section: Badges & Actions */}
        <div className="flex items-start justify-between mb-6">
          {/* Left: Primary Category Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(primaryCategory.text)} inline-flex items-center whitespace-nowrap`}>
              {primaryCategory.icon}
              <span className="ml-4 capitalize">{primaryCategory.text}</span>
            </span>
          </div>

          {/* Right: Match Indicator */}
          {isPerfectMatch && (
            <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              Perfect Match
            </span>
          )}
        </div>

        {/* Title Section */}
        <div className="mt-6">
          <a 
            href={resource.url || `https://www.youtube.com/watch?v=${resource.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
              {resource.title}
            </h3>
          </a>
          
          {resource.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {resource.description}
            </p>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              {resource.estimatedTime ? `${Math.round(resource.estimatedTime / 60)}h ${resource.estimatedTime % 60}m` : (resource.duration || 'N/A')}
            </span>
          </div>
          
          {resource.difficulty && (
            <span className={`px-3 py-1 rounded text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
              {resource.difficulty}
            </span>
          )}
        </div>

        {/* Tags Section */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {resource.tags.slice(0, 6).map((tag: string, index: number) => (
              <span 
                key={index} 
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 6 && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs">
                +{resource.tags.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Prerequisites Section */}
        {resource.prerequisites && resource.prerequisites.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Prerequisites
            </span>
            <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
              <BookOpen className="w-3 h-3 inline mt-0.5 flex-shrink-0" />
              <span>{resource.prerequisites.slice(0, 3).join(', ')}{resource.prerequisites.length > 3 ? ` +${resource.prerequisites.length - 3} more` : ''}</span>
            </p>
          </div>
        )}

        {/* Additional Metadata - Language/Framework */}
        {(resource.language || resource.framework) && (
          <div className="mt-6 border-t border-gray-100 pt-4 flex items-center gap-2">
            {resource.language && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                {resource.language}
              </span>
            )}
            {resource.framework && (
              <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                {resource.framework}
              </span>
            )}
          </div>
        )}

        {/* Action Section */}
        <div className="mt-6 flex gap-3">
          <a
            href={resource.url || `https://www.youtube.com/watch?v=${resource.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {resource.type === 'video' ? 'Watch' : resource.type === 'course' ? 'Start Course' : 'Read'}
            {resource.type === 'video' ? <Play className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
          </a>
          <button
            onClick={toggleSave}
            className={`flex-1 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              isSaved
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Add to saved'}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
