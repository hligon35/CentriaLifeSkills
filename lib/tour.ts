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
const HomeDemo = dynamic(() => import('@/components/tour/demos/HomeDemo'), { ssr: false })
const MyKidDemo = dynamic(() => import('@/components/tour/demos/MyKidDemo'), { ssr: false })
const ScheduleDemo = dynamic(() => import('@/components/tour/demos/ScheduleDemo'), { ssr: false })
const SettingsDemo = dynamic(() => import('@/components/tour/demos/SettingsDemo'), { ssr: false })
const CalendarDemo = dynamic(() => import('@/components/tour/demos/CalendarDemo'), { ssr: false })
const DirectoryDemo = dynamic(() => import('@/components/tour/demos/DirectoryDemo'), { ssr: false })
const ModerationDemo = dynamic(() => import('@/components/tour/demos/ModerationDemo'), { ssr: false })

export function getRoleSteps(role: Role): TourStep[] {
  const common: TourStep[] = [
    { role, title: 'Welcome to BuddyBoard', description: 'This quick tour will show you the most useful areas. You can exit anytime.', hint: 'Use the Next/Back buttons below to navigate.', target: '[data-tour="tabs"]', highlightPadding: 6 },
  ]
  if (role === 'PARENT') {
    return [
      ...common,
      { role, title: 'Home', description: 'Your home shows important updates and quick links.', navigateTo: '/parent', demo: HomeDemo, target: '[data-tour="tabs"]' },
      { role, title: 'Messages', description: 'Chat with therapists and school staff in real-time.', navigateTo: '/parent/messages', demo: ChatDemo, target: '[data-tour="messages-list"]' },
      { role, title: 'My Kid', description: 'See goals, progress, and resources tailored for your child.', navigateTo: '/parent/my-kid', demo: MyKidDemo, target: '[data-tour="tabs"]' },
      { role, title: 'Board', description: 'View announcements and posts from parents and faculty.', navigateTo: '/board', demo: BoardDemo, target: '[data-tour="board-composer"]' },
      { role, title: 'Settings', description: 'Control notifications and account preferences.', navigateTo: '/parent/settings', demo: SettingsDemo, target: '[data-tour="settings-save"]' },
      { role, title: 'That\'s it!', description: 'You\'re all set. You can restart this tour from the header anytime.' },
    ]
  } else if (role === 'THERAPIST') {
    return [
      ...common,
      { role, title: 'Home', description: 'Your dashboard summarizes today\'s schedule and tasks.', navigateTo: '/therapist', demo: HomeDemo, target: '[data-tour="tabs"]' },
      { role, title: 'Messages', description: 'Coordinate with parents and staff easily.', navigateTo: '/therapist/messages', demo: ChatDemo, target: '[data-tour="messages-list"]' },
      { role, title: 'Schedule', description: 'Manage appointments and sessions.', navigateTo: '/therapist/schedule', demo: ScheduleDemo, target: 'main h1' },
      { role, title: 'Board', description: 'Share updates to the community board.', navigateTo: '/board', demo: BoardDemo, target: '[data-tour="board-composer"]' },
      { role, title: 'Settings', description: 'Update your preferences and profile.', navigateTo: '/therapist/settings', demo: SettingsDemo, target: '[data-tour="settings-save"]' },
      { role, title: 'All set!', description: 'You can revisit this tour from the header.' },
    ]
  } else {
    // ADMIN
    return [
      ...common,
      { role, title: 'Home', description: 'Monitor the platform\'s activity and shortcuts.', navigateTo: '/admin', demo: HomeDemo, target: '[data-tour="tabs"]' },
      { role, title: 'Messages', description: 'Communicate with all stakeholders.', navigateTo: '/admin/messages', demo: ChatDemo, target: '[data-tour="messages-list"]' },
      { role, title: 'Calendar', description: 'School-wide scheduling and events.', navigateTo: '/admin/calendar', demo: CalendarDemo, target: '[data-tour="calendar-tabs"]' },
      { role, title: 'Directory', description: 'Find staff and families quickly.', navigateTo: '/admin/directory', demo: DirectoryDemo, target: '[data-tour="directory-staff-search"]' },
  { role, title: 'Moderation', description: 'Review and manage community posts.', navigateTo: '/admin/moderation', demo: ModerationDemo, target: 'main h1' },
      { role, title: 'Settings', description: 'Configure policies and platform preferences.', navigateTo: '/admin/settings', demo: SettingsDemo, target: '[data-tour="settings-save"]' },
      { role, title: 'Tour complete', description: 'Thanks! You can start this tour again from the header.' },
    ]
  }
}
