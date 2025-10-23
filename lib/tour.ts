import dynamic from 'next/dynamic'

export type Role = 'ADMIN' | 'THERAPIST' | 'PARENT'

export type TourStep = {
  role?: Role
  title: string
  description: string
  hint?: string
  navigateTo?: string
  // React component to render demo content
  demo?: React.ComponentType
  // Optional CSS selector to highlight a target element
  target?: string
  // Extra padding around highlight box in px
  highlightPadding?: number
}

const ChatDemo = dynamic(() => import('@/components/tour/demos/ChatDemo'), { ssr: false })
const BoardDemo = dynamic(() => import('@/components/tour/demos/BoardDemo'), { ssr: false })

export function getRoleSteps(role: Role): TourStep[] {
  const common: TourStep[] = [
    { role, title: 'Welcome to BuddyBoard', description: 'This quick tour will show you the most useful areas. You can exit anytime.', hint: 'Use the Next/Back buttons below to navigate.', target: '#main' },
  ]
  if (role === 'PARENT') {
    return [
      ...common,
      { role, title: 'Home', description: 'Your home shows important updates and quick links.', navigateTo: '/parent', target: '#main' },
      { role, title: 'Messages', description: 'Chat with therapists and school staff in real-time.', navigateTo: '/parent/messages', demo: ChatDemo, target: '#main' },
      { role, title: 'My Kid', description: 'See goals, progress, and resources tailored for your child.', navigateTo: '/parent/my-kid', target: '#main' },
      { role, title: 'Board', description: 'View announcements and posts from parents and faculty.', navigateTo: '/board', demo: BoardDemo, target: '#main' },
      { role, title: 'Settings', description: 'Control notifications and account preferences.', navigateTo: '/parent/settings', target: '#main' },
      { role, title: 'That\'s it!', description: 'You\'re all set. You can restart this tour from the header anytime.' },
    ]
  } else if (role === 'THERAPIST') {
    return [
      ...common,
      { role, title: 'Home', description: 'Your dashboard summarizes today\'s schedule and tasks.', navigateTo: '/therapist', target: '#main' },
      { role, title: 'Messages', description: 'Coordinate with parents and staff easily.', navigateTo: '/therapist/messages', demo: ChatDemo, target: '#main' },
      { role, title: 'Schedule', description: 'Manage appointments and sessions.', navigateTo: '/therapist/schedule', target: '#main' },
      { role, title: 'Board', description: 'Share updates to the community board.', navigateTo: '/board', demo: BoardDemo, target: '#main' },
      { role, title: 'Settings', description: 'Update your preferences and profile.', navigateTo: '/therapist/settings', target: '#main' },
      { role, title: 'All set!', description: 'You can revisit this tour from the header.' },
    ]
  } else {
    // ADMIN
    return [
      ...common,
      { role, title: 'Home', description: 'Monitor the platform\'s activity and shortcuts.', navigateTo: '/admin', target: '#main' },
      { role, title: 'Messages', description: 'Communicate with all stakeholders.', navigateTo: '/admin/messages', demo: ChatDemo, target: '#main' },
      { role, title: 'Calendar', description: 'School-wide scheduling and events.', navigateTo: '/admin/calendar', target: '#main' },
      { role, title: 'Directory', description: 'Find staff and families quickly.', navigateTo: '/admin/directory', target: '#main' },
      { role, title: 'Moderation', description: 'Review and manage community posts.', navigateTo: '/admin/moderation', demo: BoardDemo, target: '#main' },
      { role, title: 'Settings', description: 'Configure policies and platform preferences.', navigateTo: '/admin/settings', target: '#main' },
      { role, title: 'Tour complete', description: 'Thanks! You can start this tour again from the header.' },
    ]
  }
}
