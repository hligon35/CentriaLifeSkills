import InviteManager from './InviteManager'

export const dynamic = 'force-dynamic'

export default function AdminInvitesPage() {
  return (
    <main className="p-6 space-y-6">
      <InviteManager />
    </main>
  )
}
