import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const ClientAvailability = dynamic(() => import('../availability/ClientAvailability'), { ssr: false })
const ClientTimesheets = dynamic(() => import('../timesheets/ClientTimesheets'), { ssr: false })
const TherapistClockSection = dynamic(
	() => import('../ClientDashboard').then(m => ({ default: m.TherapistClockSection })),
	{ ssr: false }
)
// Today dashboard (moved here from removed My Day page)
const ClientDashboard = dynamic(() => import('../ClientDashboard'), { ssr: false })

export default async function TherapistSchedulePage() {
	const me = await getSession()
	if (!me || me.role !== 'THERAPIST') redirect('/login')
	return (
		<main className="mx-auto max-w-4xl p-4 space-y-8">
			<div>
				<h1 className="text-xl font-semibold mb-4">Schedule</h1>
				<TherapistClockSection />
				{/* Today section inserted below clock */}
				<div className="mt-6">
					<ClientDashboard />
				</div>
			</div>
			<section>
				<h2 className="text-lg font-medium mb-3">Availability</h2>
				<ClientAvailability />
			</section>
			<section>
				<h2 className="text-lg font-medium mb-3">Timesheets</h2>
				<ClientTimesheets />
			</section>
		</main>
	)
}
