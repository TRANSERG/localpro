import { getClients, getProfiles, getTasks } from '@/lib/db'
import TasksPage from './client'

export default async function Page() {
  const [tasks, clients, profiles] = await Promise.all([getTasks(), getClients(), getProfiles()])
  return <TasksPage initialTasks={tasks} initialClients={clients} initialProfiles={profiles} />
}
