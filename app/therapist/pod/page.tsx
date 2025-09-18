import { redirect } from 'next/navigation'

// This route has been deprecated; redirect therapists to the unified Schedule page.
export default function DeprecatedMyDayRedirect() {
  redirect('/therapist/schedule')
}
