# Gamification System Implementation Guide

## ✅ What's Been Completed

### 1. Core Gamification Library (`lib/gamification.ts`)
- ✅ XP calculation and level system
- ✅ Streak tracking logic
- ✅ Badge definitions and unlock conditions
- ✅ Firebase operations for stats
- ✅ Event handlers for all actions

### 2. UI Components
- ✅ `GamificationBar.tsx` - XP bar with level, streak, and badges display

## 🔨 Implementation Steps

### Step 1: Update Quiz Guard to Track Daily Login
**File:** `components/QuizGuard.tsx`

Add daily login tracking when user logs in:

```typescript
import { handleDailyLogin } from '../lib/gamification'

// Inside the useEffect where auth state changes:
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUser(user)
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists() && userDoc.data().quizCompleted) {
        setQuizCompleted(true)
        // Add this line:
        await handleDailyLogin(user.uid)
      }
    }
    setLoading(false)
  })
  
  return () => unsubscribe()
}, [])
```

### Step 2: Integrate Video Progress Tracking
**File:** `components/CoursePlayer.tsx`

Update the `updateProgress` function to award XP:

```typescript
import { handleVideoProgress } from '../lib/gamification'

const updateProgress = async (newProgress: number, completed: boolean = false) => {
  if (!user) return

  try {
    await setDoc(doc(db, 'users', user.uid, 'courseProgress', resource.id), {
      resourceId: resource.id,
      progress: newProgress,
      completed,
      lastUpdated: new Date(),
      resourceType: resource.type || 'video'
    }, { merge: true })

    setProgress(newProgress)
    setIsCompleted(completed)
    
    // Add this:
    if (resource.type === 'video') {
      await handleVideoProgress(user.uid, resource.id, newProgress)
    }
    
    if (onProgress) {
      onProgress(newProgress)
    }
    
    if (completed && onComplete) {
      onComplete()
    }
  } catch (error) {
    console.error('Error updating progress:', error)
  }
}
```

### Step 3: Track Article Completions
**File:** `components/CoursePlayer.tsx`

When user marks an article complete:

```typescript
const markAsCompleted = async () => {
  updateProgress(100, true)
  
  // Add this:
  if (resource.type === 'article' || resource.type === 'tutorial') {
    await handleArticleComplete(user.uid)
  }
}
```

### Step 4: Track Path Completions
**File:** `components/CourseLayout.tsx`

When all resources in a path are completed:

```typescript
import { handlePathComplete } from '../lib/gamification'

const handleResourceComplete = async (resourceId: string) => {
  const newCompleted = new Set(completedResources)
  newCompleted.add(resourceId)
  setCompletedResources(newCompleted)
  
  // Add this:
  if (newCompleted.size === resources.length && user) {
    await handlePathComplete(user.uid)
  }
}
```

### Step 5: Add Gamification Bar to Dashboard
**File:** `app/dashboard/page.tsx`

```typescript
import GamificationBar from '../../components/GamificationBar'

// Inside the component, after loading check:
{user && userData && (
  <div className="mb-8">
    <GamificationBar userId={user.uid} />
  </div>
)}
```

### Step 6: Create Badge Toast Component
**Create:** `components/AchievementToast.tsx`

```typescript
'use client'

import { Award, X } from 'lucide-react'

interface AchievementToastProps {
  badge: {
    id: string
    name: string
    description: string
    icon: string
  }
  onClose: () => void
}

export default function AchievementToast({ badge, onClose }: AchievementToastProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-sm border-2 border-yellow-400 animate-slide-up z-50">
      <div className="flex items-start space-x-3">
        <div className="text-4xl">{badge.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Award className="h-5 w-5 text-yellow-500" />
            <h4 className="font-bold text-gray-900">Badge Unlocked!</h4>
          </div>
          <h5 className="font-semibold text-gray-800">{badge.name}</h5>
          <p className="text-sm text-gray-600">{badge.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
```

Then call it when badges are unlocked in `lib/gamification.ts`:

```typescript
// Return unlocked badges so UI can show them
return { newLevel, leveledUp, unlockedBadges }
```

### Step 7: Show Toast Notifications
**File:** `app/dashboard/page.tsx` (or wherever badges unlock)

```typescript
import { useState } from 'react'
import AchievementToast from '../../components/AchievementToast'
import { BADGE_DEFINITIONS } from '../../lib/gamification'

const [unlockedBadge, setUnlockedBadge] = useState<string | null>(null)

// When badge is unlocked, show toast:
useEffect(() => {
  if (stats) {
    // Check for newly unlocked badges and show toast
    // This would be triggered after addXP returns unlockedBadges
  }
}, [stats])

{unlockedBadge && (
  <AchievementToast
    badge={BADGE_DEFINITIONS[unlockedBadge]}
    onClose={() => setUnlockedBadge(null)}
  />
)}
```

## 📊 Data Flow Summary

1. **User watches video** → `handleVideoProgress()` → Updates progress → Awards XP every 10%
2. **User completes article** → `handleArticleComplete()` → Awards 8 XP + increments count
3. **User completes path** → `handlePathComplete()` → Awards 50 XP + increments count
4. **Daily login** → `handleDailyLogin()` → Updates streak + awards 5 XP + streak bonuses
5. **Any XP added** → `addXP()` → Recalculates level → Checks badges → Returns unlocked badges

## 🎨 CSS Additions Needed

Add to `app/globals.css`:

```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

## 🧪 Testing Checklist

- [ ] Daily login awards 5 XP
- [ ] Video watched to 50% awards 5 XP
- [ ] Video completed awards 10 XP
- [ ] Article completed awards 8 XP
- [ ] Path completed awards 50 XP
- [ ] 3-day streak awards 15 bonus XP
- [ ] 7-day streak awards 30 bonus XP
- [ ] Level up correctly calculated
- [ ] First resource unlocks "First Step" badge
- [ ] 3-day streak unlocks "Streak Starter" badge
- [ ] 10 completed resources unlocks "Dedicated Learner" badge
- [ ] XP bar updates in real-time
- [ ] Streak resets after missing a day

## 🚀 Next Steps

1. Implement all code additions above
2. Test each event trigger
3. Add smooth animations for XP gains
4. Create badge gallery page
5. Add leaderboard (future enhancement)
6. Add challenge system (future enhancement)

## 📝 Notes

- All gamification data stored in `users/{userId}/gamification/stats`
- Stats initialize automatically on first access
- Badge unlocks checked after every XP gain
- Streak updates on daily login
- No manual intervention needed - fully automated

