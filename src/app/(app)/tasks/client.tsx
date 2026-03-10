'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, Profile, Task, TaskStatus } from '@/types'
import { cn, getStatusClasses, formatDate, getInitials } from '@/lib/utils'
import { Plus, CheckCircle2, Clock, Circle, AlertTriangle } from 'lucide-react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  'Done': <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'In Progress': <Clock className="h-4 w-4 text-blue-500" />,
  'Not Started': <Circle className="h-4 w-4 text-gray-300" />,
  'Overdue': <AlertTriangle className="h-4 w-4 text-red-500" />,
}

const STATUS_ORDER: TaskStatus[] = ['Not Started', 'In Progress', 'Done', 'Overdue']

export default function TasksPage({
  initialTasks,
  initialClients,
  initialProfiles,
}: {
  initialTasks: Task[]
  initialClients: Client[]
  initialProfiles: Profile[]
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [clientFilter, setClientFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const filtered = tasks.filter(t => {
    const matchClient = clientFilter === 'All' || t.client_id === clientFilter
    const matchStatus = statusFilter === 'All' || t.status === statusFilter
    const matchMonth = !month || t.month_year === month
    return matchClient && matchStatus && matchMonth
  })

  async function cycleStatus(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length]
    // Optimistic update
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: nextStatus } : t))
    // Persist to Supabase
    const supabase = createBrowserClient()
    const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', id)
    if (error) {
      // Roll back on error
      setTasks(ts => ts.map(t => t.id === id ? { ...t, status: task.status } : t))
    }
  }

  const getClient = (id: string | null) => id ? initialClients.find(c => c.id === id) : null
  const getAssignee = (id: string | null) => id ? initialProfiles.find(p => p.id === id) : null

  const overdue = tasks.filter(t => t.status === 'Overdue').length
  const done = tasks.filter(t => t.status === 'Done').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Monthly Task Calendar" subtitle={`${done} done · ${overdue} overdue`}
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', val: tasks.length, color: 'text-gray-900' },
            { label: 'Overdue', val: overdue, color: 'text-red-600' },
            { label: 'In Progress', val: tasks.filter(t => t.status === 'In Progress').length, color: 'text-blue-600' },
            { label: 'Done', val: done, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Clients</option>
            {initialClients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Statuses</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Task list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {['', 'Task', 'Client', 'Assigned To', 'Due Date', 'Frequency', 'Status', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(task => {
                const client = getClient(task.client_id)
                const assignee = getAssignee(task.assigned_to)
                return (
                  <tr key={task.id} className={cn('hover:bg-gray-50/50', task.status === 'Overdue' && 'bg-red-50/30')}>
                    <td className="px-4 py-3">
                      <button onClick={() => cycleStatus(task.id)}>{STATUS_ICONS[task.status]}</button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{task.task_name}</td>
                    <td className="px-4 py-3">
                      {client ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: client.color_tag ?? '#3b82f6' }}>
                            {getInitials(client.business_name)}
                          </div>
                          <span className="text-xs text-gray-600 truncate max-w-24">{client.business_name}</span>
                        </div>
                      ) : <span className="text-xs text-gray-400">Agency</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{assignee?.full_name?.split(' ')[0] ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(task.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{task.frequency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => cycleStatus(task.id)}>
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(task.status))}>
                          {task.status}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-32 truncate">{task.notes ?? '—'}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">
                    {tasks.length === 0 ? 'No tasks yet. Add your first task!' : 'No tasks found for this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
