import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { audit } from '../../lib/audit'
import { getPlanColor } from '../../lib/planConfig'
import type { UserProfile, Plan, UserRole } from '../../types/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'

const PAGE_SIZE = 10

interface UserWithPlan extends UserProfile {
  plan: Plan | null
}

interface CreateUserForm {
  name: string
  email: string
  password: string
  planId: string
  role: UserRole
}

interface EditUserForm {
  name: string
  planId: string
  role: UserRole
  isActive: boolean
}

export default function UserManagement() {
  const { profile: actorProfile } = useAuth()

  const [users, setUsers] = useState<UserWithPlan[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [filterRole, setFilterRole] = useState('')

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<UserWithPlan | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<UserWithPlan | null>(null)

  // Forms
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    planId: '',
    role: 'user',
  })
  const [editForm, setEditForm] = useState<EditUserForm>({
    name: '',
    planId: '',
    role: 'user',
    isActive: true,
  })

  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')

  const loadPlans = useCallback(async () => {
    const { data } = await supabase.from('plans').select('*').order('sort_order')
    if (data) setPlans(data as Plan[])
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select(
        `
        id, email, full_name, role, plan_id, is_active,
        api_calls_today, api_calls_month,
        api_reset_daily, api_reset_monthly,
        created_at, updated_at,
        plan:plans(id, name, display_name, api_limit_daily, api_limit_monthly, features, is_active, sort_order, created_at, updated_at)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    if (filterPlan) query = query.eq('plan_id', filterPlan)
    if (filterRole) query = query.eq('role', filterRole)

    try {
      const { data, count, error } = await query

      if (!error && data) {
        setUsers(
          data.map((u) => ({
            ...u,
            plan: Array.isArray(u.plan) ? u.plan[0] : u.plan ?? null,
          })) as UserWithPlan[]
        )
        setTotal(count ?? 0)
      }
    } catch (err) {
      console.error('loadUsers error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterPlan, filterRole])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [search, filterPlan, filterRole])

  async function handleCreateUser() {
    setCreateError('')
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError('Preencha todos os campos obrigatórios.')
      return
    }
    if (createForm.password.length < 6) {
      setCreateError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setCreateLoading(true)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: createForm.email.trim(),
        password: createForm.password,
        user_metadata: { full_name: createForm.name.trim() },
        email_confirm: true,
      })

      if (error) {
        setCreateError(error.message)
        return
      }

      if (data.user) {
        // Update role and plan
        await supabase
          .from('profiles')
          .update({
            role: createForm.role,
            plan_id: createForm.planId || null,
            full_name: createForm.name.trim(),
          })
          .eq('id', data.user.id)

        if (actorProfile) {
          await audit.userCreatedByAdmin(
            actorProfile.id,
            actorProfile.email,
            data.user.id,
            createForm.email
          )
        }

        setShowCreate(false)
        setCreateForm({ name: '', email: '', password: '', planId: '', role: 'user' })
        await loadUsers()
      }
    } catch (err) {
      setCreateError('Erro ao criar usuário. Verifique se você tem permissão de admin.')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleEditUser() {
    if (!editUser || !actorProfile) return
    setEditError('')
    setEditLoading(true)

    try {
      const oldPlan = editUser.plan?.name ?? 'none'
      const newPlan = plans.find((p) => p.id === editForm.planId)?.name ?? 'none'
      const oldRole = editUser.role
      const newRole = editForm.role

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.name,
          plan_id: editForm.planId || null,
          role: editForm.role,
          is_active: editForm.isActive,
        })
        .eq('id', editUser.id)

      if (error) {
        setEditError('Erro ao atualizar usuário.')
        return
      }

      // Log changes
      if (oldPlan !== newPlan) {
        await audit.planChanged(actorProfile.id, actorProfile.email, editUser.id, oldPlan, newPlan)
      }
      if (oldRole !== newRole) {
        await audit.roleChanged(actorProfile.id, actorProfile.email, editUser.id, oldRole, newRole)
      }
      if (editUser.is_active !== editForm.isActive) {
        await audit.accessToggled(actorProfile.id, actorProfile.email, editUser.id, editForm.isActive)
      }

      setEditUser(null)
      await loadUsers()
    } finally {
      setEditLoading(false)
    }
  }

  async function handleToggleActive() {
    if (!confirmToggle || !actorProfile) return
    setToggleLoading(true)

    try {
      const newStatus = !confirmToggle.is_active
      await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', confirmToggle.id)

      await audit.accessToggled(
        actorProfile.id,
        actorProfile.email,
        confirmToggle.id,
        newStatus
      )

      setConfirmToggle(null)
      await loadUsers()
    } finally {
      setToggleLoading(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function openEdit(user: UserWithPlan) {
    setEditUser(user)
    setEditForm({
      name: user.full_name ?? '',
      planId: user.plan_id ?? '',
      role: user.role,
      isActive: user.is_active,
    })
    setEditError('')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-[#aa3bff]" />
            <h1 className="text-xl font-bold text-white">Usuários</h1>
          </div>
          <p className="text-sm text-[#6b6b8a]">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setShowCreate(true); setCreateError('') }}>
          <Plus size={15} />
          Criar Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a]" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)] placeholder:text-[#6b6b8a]"
              />
            </div>
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
          >
            <option value="">Todos os planos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
          >
            <option value="">Todos os papéis</option>
            <option value="admin">Admin</option>
            <option value="user">Usuário</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#aa3bff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6b6b8a]">
            <Users size={32} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(170,59,255,0.08)]">
                  {['Nome', 'Email', 'Plano', 'Papel', 'Status', 'Criado em', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(170,59,255,0.03)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-semibold">
                            {(u.full_name ?? u.email)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[#c4c4d4] font-medium truncate max-w-32">
                          {u.full_name ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b8a]">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.plan ? (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: getPlanColor(u.plan.name),
                            backgroundColor: getPlanColor(u.plan.name) + '18',
                            borderColor: getPlanColor(u.plan.name) + '40',
                          }}
                        >
                          {u.plan.display_name}
                        </span>
                      ) : (
                        <span className="text-xs text-[#6b6b8a]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'default'}>
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? 'success' : 'error'}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b8a] text-xs">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-md text-[#6b6b8a] hover:text-[#aa3bff] hover:bg-[rgba(170,59,255,0.1)] transition-all"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmToggle(u)}
                          className={`p-1.5 rounded-md transition-all ${
                            u.is_active
                              ? 'text-[#6b6b8a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)]'
                              : 'text-[#6b6b8a] hover:text-emerald-400 hover:bg-[rgba(34,197,94,0.1)]'
                          }`}
                          title={u.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(170,59,255,0.08)]">
            <span className="text-xs text-[#6b6b8a]">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-md text-[#6b6b8a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-md text-[#6b6b8a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass glow-accent w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Criar Usuário</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#6b6b8a] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <Input
                label="Nome completo *"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do usuário"
              />
              <Input
                label="Email *"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
              <Input
                label="Senha *"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c4c4d4]">Plano</label>
                <select
                  value={createForm.planId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, planId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                >
                  <option value="">Sem plano</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c4c4d4]">Papel</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {createError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {createError}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} loading={createLoading} className="flex-1">
                  Criar Usuário
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass glow-accent w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Editar Usuário</h2>
              <button onClick={() => setEditUser(null)} className="text-[#6b6b8a] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[#6b6b8a] mb-4">{editUser.email}</p>

            <div className="flex flex-col gap-3.5">
              <Input
                label="Nome completo"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do usuário"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c4c4d4]">Plano</label>
                <select
                  value={editForm.planId}
                  onChange={(e) => setEditForm((f) => ({ ...f, planId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                >
                  <option value="">Sem plano</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c4c4d4]">Papel</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#c4c4d4]">Status</label>
                <button
                  type="button"
                  onClick={() => setEditForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    editForm.isActive
                      ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.25)] text-emerald-400'
                      : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-red-400'
                  }`}
                >
                  {editForm.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {editForm.isActive ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              {editError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {editError}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <Button variant="secondary" onClick={() => setEditUser(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleEditUser} loading={editLoading} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Toggle Modal */}
      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {confirmToggle.is_active ? 'Desativar usuário?' : 'Ativar usuário?'}
            </h3>
            <p className="text-sm text-[#6b6b8a] mb-6">
              {confirmToggle.is_active
                ? `O usuário ${confirmToggle.email} perderá acesso à plataforma.`
                : `O usuário ${confirmToggle.email} voltará a ter acesso.`}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmToggle(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleToggleActive}
                loading={toggleLoading}
                className={`flex-1 ${confirmToggle.is_active ? 'bg-red-500 hover:bg-red-600 shadow-none' : ''}`}
              >
                {confirmToggle.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
