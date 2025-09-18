import BoardClient from '@/components/BoardClient'

export default function BoardPage() {
  return (
    <main className="mx-auto max-w-3xl p-4">
	<h1 className="text-xl font-semibold mb-4 text-center sm:text-left">Message Board</h1>
      <BoardClient />
    </main>
  )
}
