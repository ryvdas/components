/**
 * Gamification System for LearnMatch
 * Handles XP, badges, streaks, and achievements
 */

import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from './firebase'

// ==================== TYPES & INTERFACES ====================

export interface GamificationStats {
  xp: number
  level: number
  streak: {
    current: number
    longest: number
    lastActive: string // ISO date string
  }
  badges: Record<string, boolean>
  videoProgress: Record<string, number> // videoId -> progress percentage (0-100)
  completedResources: number
  completedPaths: number
  lastLogin?: string // ISO date string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  requirement: string
}

export const BADGE_DEFINITIONS: Record<string, Badge> = {
  first_step: {
    id: 'first_step',
    name: 'First Step',
    description: 'You\'ve started your journey!',
    icon: '🧩',
    requirement: 'Complete first resource'
  },
  streak_starter: {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Consistency pays off!',
    icon: '🔥',
    requirement: 'Maintain a 3-day streak'
  },
  focused_learner: {
    id: 'focused_learner',
    name: 'Focused Learner',
    description: 'Focused and steady progress',
    icon: '🎯',
    requirement: 'Watch 10 full videos'
  },
  dedicated_learner: {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Committed to growth',
    icon: '📚',
    requirement: 'Complete 10 resources'
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'A true master of learning',
    icon: '🏆',
    requirement: 'Reach 1000 XP'
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: '7 days strong!',
    icon: '⚡',
    requirement: 'Maintain a 7-day streak'
  },
  path_completer: {
    id: 'path_completer',
    name: 'Path Completer',
    description: 'You finished a full learning path!',
    icon: '🎓',
    requirement: 'Complete your first learning path'
  }
}

// ==================== XP & LEVEL CALCULATION ====================

export const XP_REWARDS = {
  VIDEO_WATCHED: (progressPercent: number) => Math.min(Math.floor(progressPercent / 10), 10), // 1 XP per 10%, max 10
  ARTICLE_COMPLETE: 8,
  PATH_COMPLETE: 50,
  DAILY_LOGIN: 5,
  STREAK_3_DAYS: 15,
  STREAK_7_DAYS: 30
}

export const LEVEL_THRESHOLDS = {
  1: 0,      // 0-100 XP
  2: 100,    // 101-300 XP
  3: 300,    // 301-600 XP
  4: 600,    // 600+ XP (+300 per level after)
  increment: 300 // XP needed per level after level 4
}

export function calculateLevel(xp: number): number {
  if (xp < 100) return 1
  if (xp < 300) return 2
  if (xp < 600) return 3
  
  // Level 4+ requires 600 XP + 300 per additional level
  const additionalXP = xp - 600
  return 4 + Math.floor(additionalXP / 300)
}

export function getXPForNextLevel(xp: number, level: number): number {
  if (level === 1) return 100 - xp
  if (level === 2) return 300 - xp
  if (level === 3) return 600 - xp
  
  // After level 3, increments of 300
  const xpForCurrentLevel = 600 + (level - 4) * 300
  const xpForNextLevel = xpForCurrentLevel + 300
  return xpForNextLevel - xp
}

// ==================== STREAK MANAGEMENT ====================

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0]
}

export function isYesterday(date: Date, lastActiveDate: Date): boolean {
  const yesterday = new Date(date)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(yesterday, lastActiveDate)
}

export function updateStreak(stats: GamificationStats | null): { current: number; longest: number } {
  const now = new Date()
  
  if (!stats) {
    // First time - start streak at 1
    return {
      current: 1,
      longest: 1
    }
  }
  
  const lastActive = new Date(stats.streak.lastActive)
  
  if (isSameDay(now, lastActive)) {
    // Already active today - no change
    return stats.streak
  }
  
  if (isYesterday(now, lastActive)) {
    // Consecutive day - increment streak
    const newCurrent = stats.streak.current + 1
    return {
      current: newCurrent,
      longest: Math.max(newCurrent, stats.streak.longest)
    }
  }
  
  // Streak broken - reset to 1
  return {
    current: 1,
    longest: stats.streak.longest
  }
}

// ==================== BADGE UNLOCK LOGIC ====================

export function checkBadgeUnlocks(
  oldStats: GamificationStats | null,
  newStats: GamificationStats
): string[] {
  const unlockedBadges: string[] = []
  
  // Check each badge
  for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
    // Skip if already unlocked
    if (newStats.badges[badgeId]) continue
    
    // Check unlock conditions
    let shouldUnlock = false
    
    switch (badgeId) {
      case 'first_step':
        shouldUnlock = newStats.completedResources >= 1
        break
      case 'streak_starter':
        shouldUnlock = newStats.streak.current >= 3
        break
      case 'focused_learner':
        // Count videos watched to completion
        const videosCompleted = Object.values(newStats.videoProgress)
          .filter(progress => progress === 100).length
        shouldUnlock = videosCompleted >= 10
        break
      case 'dedicated_learner':
        shouldUnlock = newStats.completedResources >= 10
        break
      case 'expert':
        shouldUnlock = newStats.xp >= 1000
        break
      case 'week_warrior':
        shouldUnlock = newStats.streak.current >= 7
        break
      case 'path_completer':
        shouldUnlock = newStats.completedPaths >= 1
        break
    }
    
    if (shouldUnlock) {
      unlockedBadges.push(badgeId)
      newStats.badges[badgeId] = true
    }
  }
  
  return unlockedBadges
}

// ==================== FIREBASE OPERATIONS ====================

export async function getGamificationStats(userId: string): Promise<GamificationStats | null> {
  try {
    const statsDoc = await getDoc(doc(db, 'users', userId, 'gamification', 'stats'))
    
    if (statsDoc.exists()) {
      return statsDoc.data() as GamificationStats
    }
    
    // Create initial stats if they don't exist
    const initialStats: GamificationStats = {
      xp: 0,
      level: 1,
      streak: {
        current: 0,
        longest: 0,
        lastActive: new Date().toISOString()
      },
      badges: {},
      videoProgress: {},
      completedResources: 0,
      completedPaths: 0,
      lastLogin: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'users', userId, 'gamification', 'stats'), initialStats)
    return initialStats
  } catch (error) {
    console.error('Error getting gamification stats:', error)
    return null
  }
}

export async function updateGamificationStats(
  userId: string,
  updates: Partial<GamificationStats>
): Promise<void> {
  try {
    const statsRef = doc(db, 'users', userId, 'gamification', 'stats')
    await updateDoc(statsRef, updates)
  } catch (error) {
    console.error('Error updating gamification stats:', error)
  }
}

export async function addXP(
  userId: string,
  xpAmount: number,
  reason: string
): Promise<{ newLevel: number; leveledUp: boolean; unlockedBadges?: string[] }> {
  try {
    const stats = await getGamificationStats(userId)
    if (!stats) return { newLevel: 1, leveledUp: false }
    
    const oldLevel = stats.level
    const newXP = stats.xp + xpAmount
    const newLevel = calculateLevel(newXP)
    const leveledUp = newLevel > oldLevel
    
    await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), {
      xp: newXP,
      level: newLevel
    })
    
    // Check for badge unlocks
    const updatedStats: GamificationStats = {
      ...stats,
      xp: newXP,
      level: newLevel
    }
    
    const unlockedBadges = checkBadgeUnlocks(stats, updatedStats)
    if (unlockedBadges.length > 0) {
      const badgeUpdates: Record<string, boolean> = {}
      unlockedBadges.forEach(badgeId => {
        badgeUpdates[`badges.${badgeId}`] = true
      })
      
      await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), badgeUpdates)
    }
    
    console.log(`Added ${xpAmount} XP to user ${userId} (reason: ${reason})`)
    
    return { newLevel, leveledUp, unlockedBadges: unlockedBadges || [] }
  } catch (error) {
    console.error('Error adding XP:', error)
    return { newLevel: 1, leveledUp: false }
  }
}

// ==================== EVENT HANDLERS ====================

export async function handleVideoProgress(
  userId: string,
  videoId: string,
  progressPercent: number
): Promise<void> {
  try {
    const stats = await getGamificationStats(userId)
    if (!stats) return
    
    const oldProgress = stats.videoProgress[videoId] || 0
    
    // Update video progress
    await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), {
      [`videoProgress.${videoId}`]: progressPercent
    })
    
    // Award XP based on progress
    if (progressPercent >= 10 && oldProgress < 10) {
      const xpEarned = XP_REWARDS.VIDEO_WATCHED(progressPercent)
      await addXP(userId, xpEarned, `Watched ${Math.round(progressPercent)}% of video`)
    }
    
    // Award completion XP
    if (progressPercent >= 100 && oldProgress < 100) {
      await addXP(userId, XP_REWARDS.VIDEO_WATCHED(100), 'Completed video')
      
      // Update completed resources count
      await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), {
        completedResources: increment(1)
      })
    }
  } catch (error) {
    console.error('Error handling video progress:', error)
  }
}

export async function handleArticleComplete(userId: string): Promise<void> {
  try {
    await addXP(userId, XP_REWARDS.ARTICLE_COMPLETE, 'Completed article')
    
    await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), {
      completedResources: increment(1)
    })
  } catch (error) {
    console.error('Error handling article completion:', error)
  }
}

export async function handlePathComplete(userId: string): Promise<void> {
  try {
    await addXP(userId, XP_REWARDS.PATH_COMPLETE, 'Completed learning path')
    
    await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), {
      completedPaths: increment(1)
    })
  } catch (error) {
    console.error('Error handling path completion:', error)
  }
}

export async function handleDailyLogin(userId: string): Promise<void> {
  try {
    const stats = await getGamificationStats(userId)
    if (!stats) return
    
    const now = new Date()
    const lastLogin = stats.lastLogin ? new Date(stats.lastLogin) : null
    
    // Check if already logged in today
    if (lastLogin && isSameDay(now, lastLogin)) {
      return // Already logged in today
    }
    
    // Update streak
    const newStreak = updateStreak(stats)
    const wasSameLevel = stats.streak.current === newStreak.current
    
    // Update last login and streak
    await updateDoc(doc(db, 'users', userId, 'gamification', 'stats'), {
      lastLogin: now.toISOString(),
      'streak.lastActive': now.toISOString(),
      'streak.current': newStreak.current,
      'streak.longest': newStreak.longest
    })
    
    // Award daily login XP
    await addXP(userId, XP_REWARDS.DAILY_LOGIN, 'Daily login bonus')
    
    // Award streak bonus XP
    let streakBonus = 0
    if (newStreak.current === 3 && !wasSameLevel) {
      streakBonus = XP_REWARDS.STREAK_3_DAYS
    } else if (newStreak.current === 7 && !wasSameLevel) {
      streakBonus = XP_REWARDS.STREAK_7_DAYS
    }
    
    if (streakBonus > 0) {
      await addXP(userId, streakBonus, 'Streak bonus')
    }
  } catch (error) {
    console.error('Error handling daily login:', error)
  }
}

