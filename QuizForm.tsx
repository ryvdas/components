'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Eye, Headphones, BookOpen, Activity, ArrowLeft } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    visual: string;
    auditory: string;
    reading: string;
    kinesthetic: string;
  };
}

const questions: QuizQuestion[] = [
  {
    id: '1',
    question: 'When learning something new, I prefer to:',
    options: {
      visual: 'See diagrams, charts, or videos',
      auditory: 'Listen to explanations or discussions',
      reading: 'Read detailed instructions or articles',
      kinesthetic: 'Try it out hands-on immediately'
    }
  },
  {
    id: '2',
    question: 'I learn best when I can:',
    options: {
      visual: 'Visualize concepts in my mind',
      auditory: 'Discuss ideas with others',
      reading: 'Take detailed notes and review them',
      kinesthetic: 'Practice and experiment directly'
    }
  },
  {
    id: '3',
    question: 'My ideal learning environment includes:',
    options: {
      visual: 'Visual aids, colors, and spatial organization',
      auditory: 'Background music or quiet discussion',
      reading: 'Well-organized text and reference materials',
      kinesthetic: 'Interactive tools and physical movement'
    }
  },
  {
    id: '4',
    question: 'When solving problems, I typically:',
    options: {
      visual: 'Draw diagrams or create visual representations',
      auditory: 'Talk through the problem out loud',
      reading: 'Write down the problem and solutions step by step',
      kinesthetic: 'Build models or try different approaches physically'
    }
  }
];

const learningStyles = {
  visual: { icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  auditory: { icon: Headphones, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  reading: { icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  kinesthetic: { icon: Activity, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
};

export default function QuizForm() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLearningStyle, setCurrentLearningStyle] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Check if this is edit mode
        const editMode = searchParams.get('edit') === 'true';
        setIsEditMode(editMode);
        
        if (editMode) {
          // Load current learning style for editing
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentLearningStyle(userData.learningStyle || '');
          }
        } else {
          // Check if user already has a learning style (new users only)
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().learningStyle) {
            router.push('/');
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateLearningStyle(newAnswers);
    }
  };

  const calculateLearningStyle = async (finalAnswers: Record<string, string>) => {
    const scores = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 };
    
    Object.values(finalAnswers).forEach(answer => {
      scores[answer as keyof typeof scores]++;
    });

    const learningStyle = Object.keys(scores).reduce((a, b) => 
      scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b
    );

    setSubmitting(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        learningStyle,
        quizCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      
      if (isEditMode) {
        router.push('/plans');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error saving learning style:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to take the quiz</h2>
          <button
            onClick={() => router.push('/auth')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          {isEditMode && (
            <div className="mb-6">
              <button
                onClick={() => router.push('/plans')}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </button>
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isEditMode ? 'Update Your Learning Style' : 'Find Your Learning Style'}
          </h1>
          <p className="text-lg text-gray-600">
            {isEditMode 
              ? 'Update your learning preferences to get better recommendations'
              : 'Answer these questions to get personalized learning recommendations'
            }
          </p>
          {isEditMode && currentLearningStyle && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <span className="text-sm font-medium">
                Current: <span className="capitalize">{currentLearningStyle}</span> learner
              </span>
            </div>
          )}
          <div className="mt-4">
            <div className="flex justify-center space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentQuestion ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            {currentQ.question}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentQ.options).map(([style, option]) => {
              const styleConfig = learningStyles[style as keyof typeof learningStyles];
              const Icon = styleConfig.icon;
              
              return (
                <button
                  key={style}
                  onClick={() => handleAnswer(style)}
                  disabled={submitting}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                    styleConfig.bgColor
                  } ${styleConfig.borderColor} hover:border-current`}
                >
                  <div className="flex items-start space-x-4">
                    <Icon className={`h-8 w-8 ${styleConfig.color} flex-shrink-0 mt-1`} />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 mb-2 capitalize">{style}</h3>
                      <p className="text-gray-700">{option}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {submitting && (
            <div className="mt-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Calculating your learning style...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

