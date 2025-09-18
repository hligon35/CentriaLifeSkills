import { redirect } from 'next/navigation'

export default async function ParentChildrenPage() {
  redirect('/parent/my-kid')
}
