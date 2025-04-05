import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  FileText, LayoutGrid, Send, ChevronRight, Upload, BarChart2, Settings, Search, X,
  CheckCircle, Clock, AlertCircle, Loader, Link as LinkIcon, Edit3, FileSignature,
  UserCheck, ChevronLeft, Trash2, Check, AlertTriangle, Info, User, LogOut, Plus,
  Edit, Eye, MoreHorizontal, ChevronsUpDown, Calendar as CalendarIcon, Bell, Database,
  Download, Filter, EyeOff, Lock, Unlock, RefreshCw,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useForm } from 'react-hook-form';

// --- Utilidad para clases condicionales ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Constantes ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['Admin', 'User'] },
  { id: 'instances', label: 'Instancias', icon: FileText, roles: ['Admin'] },
  { id: 'requests', label: 'Solicitudes', icon: Send, roles: ['Admin', 'User'] },
  { id: 'powerbi', label: 'Power BI', icon: BarChart2, roles: ['Admin'] },
  { id: 'settings', label: 'Configuración', icon: Settings, roles: ['Admin'] },
];

const INITIAL_INSTANCES = [
  {
    id: 1,
    nombre: 'Consejo de Ministros',
    delegable: 'INDELEGABLE',
    status: 'Activa',
    createdAt: '2025-01-01',
    dependenciaResponsable: 'Dirección General',
    miembroPrincipal: 'Director General',
    actoAdministrativo: 'Resolución 001-2025',
    periodicidadReuniones: 'Cuando se requiera',
    powerBIIntegration: true,
    orfeoIntegration: false,
    metadata: { lastUpdated: '2025-01-02', version: '1.0' },
  },
  {
    id: 2,
    nombre: 'Consejo Superior de Comercio Exterior',
    delegable: 'DELEGABLE',
    status: 'Activa',
    createdAt: '2025-01-01',
    dependenciaResponsable: 'Subdirección General',
    miembroPrincipal: 'Subdirector General',
    actoAdministrativo: 'Resolución 002-2025',
    periodicidadReuniones: 'Mensual',
    powerBIIntegration: true,
    orfeoIntegration: true,
    metadata: { lastUpdated: '2025-01-03', version: '1.1' },
  },
];

const STATUS_OPTIONS = [
  { value: 'solicitada', label: 'Solicitada', color: 'bg-blue-100 text-blue-800', priority: 1 },
  { value: 'autorizadaDG', label: 'Autorizada DG', color: 'bg-yellow-100 text-yellow-800', priority: 2 },
  { value: 'enElaboracion', label: 'En Elaboración', color: 'bg-orange-100 text-orange-800', priority: 3 },
  { value: 'firmado', label: 'Firmado', color: 'bg-green-100 text-green-800', priority: 4 },
  { value: 'publicado', label: 'Publicado', color: 'bg-green-200 text-green-900', priority: 5 },
  { value: 'rechazado', label: 'Rechazado', color: 'bg-red-100 text-red-800', priority: 0 },
];

const ROLES = { ADMIN: 'Admin', USER: 'User' };
const THEMES = { light: 'light', dark: 'dark' };

// --- Componentes UI Avanzados ---
const Button = ({ variant = 'default', size = 'default', className = '', children, loading, ...props }) => {
  const baseStyle = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100',
  };
  const sizes = { default: 'h-10 px-4 py-2', sm: 'h-8 px-3', icon: 'h-10 w-10' };
  return (
    <button
      className={cn(baseStyle, variants[variant], sizes[size], className, loading && 'cursor-wait')}
      disabled={loading}
      {...props}
    >
      {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};
Button.propTypes = {
  variant: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  loading: PropTypes.bool,
};

const Input = ({ className = '', type = 'text', error, ...props }) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
      error ? 'border-red-500' : 'border-gray-300',
      className
    )}
    {...props}
  />
);
Input.propTypes = { className: PropTypes.string, type: PropTypes.string, error: PropTypes.bool };

const Label = ({ className = '', children, required, ...props }) => (
  <label className={cn('text-sm font-medium text-gray-700 mb-1 block', required && 'after:content-["*"] after:text-red-500', className)} {...props}>
    {children}
  </label>
);
Label.propTypes = { className: PropTypes.string, children: PropTypes.node, required: PropTypes.bool };

const Textarea = ({ className = '', error, ...props }) => (
  <textarea
    className={cn(
      'flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
      error ? 'border-red-500' : 'border-gray-300',
      className
    )}
    {...props}
  />
);
Textarea.propTypes = { className: PropTypes.string, error: PropTypes.bool };

const Card = ({ className = '', children }) => (
  <div className={cn('rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow duration-300', className)}>
    {children}
  </div>
);
const CardHeader = ({ className = '', children }) => (
  <div className={cn('p-6 border-b', className)}>{children}</div>
);
const CardTitle = ({ className = '', children }) => (
  <h3 className={cn('text-xl font-semibold text-gray-800', className)}>{children}</h3>
);
const CardContent = ({ className = '', children }) => (
  <div className={cn('p-6', className)}>{children}</div>
);

const Sheet = ({ children, open, onOpenChange }) => (
  open && (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end animate-fade-in" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-md bg-white p-6 shadow-2xl animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
);
Sheet.propTypes = { children: PropTypes.node, open: PropTypes.bool, onOpenChange: PropTypes.func };

const SheetHeader = ({ children }) => <div className="mb-6 border-b pb-4">{children}</div>;
const SheetTitle = ({ children }) => <h2 className="text-2xl font-bold text-gray-800">{children}</h2>;
const SheetDescription = ({ children }) => <p className="text-sm text-gray-500">{children}</p>;

// --- Componentes Avanzados ---
function Sidebar({ currentPage, setCurrentPage, userRole, isOpen, setIsOpen, theme }) {
  const accessibleItems = useMemo(() => NAV_ITEMS.filter(item => item.roles.includes(userRole)), [userRole]);
  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300',
      isOpen ? 'w-64' : 'w-16',
      theme === THEMES.dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    )}>
      <div className={cn('flex h-16 items-center justify-between px-4 border-b', theme === THEMES.dark ? 'bg-gray-800' : 'bg-blue-50')}>
        {isOpen && <h1 className="text-xl font-bold truncate">Gestión DNP</h1>}
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-2">
        {accessibleItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            className={cn('w-full justify-start', !isOpen && 'justify-center')}
            onClick={() => setCurrentPage(item.id)}
          >
            <item.icon className={cn('h-5 w-5', isOpen && 'mr-3')} />
            {isOpen && <span className="truncate">{item.label}</span>}
          </Button>
        ))}
      </nav>
      {isOpen && (
        <div className={cn('p-4 border-t text-center text-xs', theme === THEMES.dark ? 'text-gray-400' : 'text-gray-500')}>
          v1.0.0 © {new Date().getFullYear()}
        </div>
      )}
    </aside>
  );
}
Sidebar.propTypes = {
  currentPage: PropTypes.string.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  theme: PropTypes.string,
};

function HeaderBar({ toggleSidebar, currentUser, onLogout, theme, toggleTheme }) {
  return (
    <header className={cn(
      'sticky top-0 z-30 flex h-14 items-center justify-between px-4 border-b shadow-sm',
      theme === THEMES.dark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    )}>
      <Button variant="outline" size="icon" className="md:hidden" onClick={toggleSidebar}>
        <LayoutGrid className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium truncate max-w-xs">
          {currentUser.name} <span className="text-gray-500">({currentUser.role})</span>
        </span>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Cambiar tema">
          {theme === THEMES.dark ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onLogout} title="Cerrar sesión">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
HeaderBar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
  theme: PropTypes.string,
  toggleTheme: PropTypes.func.isRequired,
};

function DelegationRequestForm({ delegableInstances, onSubmit, onCancel, isLoading, initialData, theme }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
    defaultValues: initialData || {
      instanceId: '',
      proposedDelegate: '',
      justification: '',
      fechaDesignacion: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      urgency: 'Normal',
      document: null,
    },
  });

  const fechaDesignacion = watch('fechaDesignacion');
  const fileInputRef = useRef(null);

  const handleFormSubmit = async (data) => {
    if (data.fechaVencimiento && new Date(data.fechaVencimiento) < new Date(data.fechaDesignacion)) {
      toast.error('Fecha de vencimiento no puede ser anterior a la de designación');
      return;
    }
    const submissionData = {
      ...data,
      instanceId: parseInt(data.instanceId, 10),
      document: fileInputRef.current?.files[0] || null,
      trazabilidad: initialData?.trazabilidad ? [...initialData.trazabilidad, { estado: data.status || 'solicitada', fecha: new Date().toISOString() }] : [{ estado: 'solicitada', fecha: new Date().toISOString() }],
    };
    await onSubmit(submissionData);
    if (!initialData) reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-6 p-6 rounded-lg shadow-md', theme === THEMES.dark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
      <div>
        <Label htmlFor="instance" required>Instancia</Label>
        <select
          id="instance"
          {...register('instanceId', { required: 'Seleccione una instancia' })}
          className={cn('h-10 w-full rounded-md border px-3', errors.instanceId && 'border-red-500', theme === THEMES.dark && 'bg-gray-700')}
        >
          <option value="">Seleccione...</option>
          {delegableInstances.map((instance) => (
            <option key={instance.id} value={instance.id}>{instance.nombre}</option>
          ))}
        </select>
        {errors.instanceId && <p className="text-sm text-red-500">{errors.instanceId.message}</p>}
      </div>

      <div>
        <Label htmlFor="delegate" required>Delegado Propuesto</Label>
        <Input
          id="delegate"
          {...register('proposedDelegate', { required: 'Ingrese el nombre', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
          placeholder="Nombre completo"
          error={!!errors.proposedDelegate}
          disabled={isLoading || isSubmitting}
        />
        {errors.proposedDelegate && <p className="text-sm text-red-500">{errors.proposedDelegate.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Fecha Designación</Label>
          <Input
            type="date"
            {...register('fechaDesignacion', { required: 'Seleccione una fecha' })}
            error={!!errors.fechaDesignacion}
            disabled={isLoading || isSubmitting}
          />
          {errors.fechaDesignacion && <p className="text-sm text-red-500">{errors.fechaDesignacion.message}</p>}
        </div>
        <div>
          <Label>Fecha Vencimiento</Label>
          <Input
            type="date"
            {...register('fechaVencimiento', { validate: (value) => !value || new Date(value) >= new Date(fechaDesignacion) || 'Fecha inválida' })}
            error={!!errors.fechaVencimiento}
            disabled={isLoading || isSubmitting}
          />
          {errors.fechaVencimiento && <p className="text-sm text-red-500">{errors.fechaVencimiento.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="urgency" required>Urgencia</Label>
        <select
          id="urgency"
          {...register('urgency', { required: 'Seleccione urgencia' })}
          className={cn('h-10 w-full rounded-md border px-3', errors.urgency && 'border-red-500', theme === THEMES.dark && 'bg-gray-700')}
        >
          <option value="Normal">Normal</option>
          <option value="Alta">Alta</option>
        </select>
        {errors.urgency && <p className="text-sm text-red-500">{errors.urgency.message}</p>}
      </div>

      <div>
        <Label htmlFor="justification" required>Justificación</Label>
        <Textarea
          id="justification"
          {...register('justification', { required: 'Ingrese justificación', minLength: { value: 10, message: 'Mínimo 10 caracteres' } })}
          placeholder="Explique el motivo..."
          error={!!errors.justification}
          disabled={isLoading || isSubmitting}
        />
        {errors.justification && <p className="text-sm text-red-500">{errors.justification.message}</p>}
      </div>

      <div>
        <Label htmlFor="document">Documento (Opcional)</Label>
        <Input type="file" id="document" ref={fileInputRef} disabled={isLoading || isSubmitting} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isSubmitting}>Cancelar</Button>
        <Button type="submit" loading={isLoading || isSubmitting}>
          <Send className="w-4 h-4 mr-2" /> {initialData ? 'Actualizar' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
}
DelegationRequestForm.propTypes = {
  delegableInstances: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  initialData: PropTypes.object,
  theme: PropTypes.string,
};

// --- Páginas Avanzadas ---
function Dashboard({ requests, instances, theme }) {
  const stats = useMemo(() => ({
    totalRequests: requests.length,
    pending: requests.filter(r => r.status === 'solicitada').length,
    approved: requests.filter(r => ['firmado', 'publicado'].includes(r.status)).length,
    activeInstances: instances.filter(i => i.status === 'Activa').length,
    overdue: requests.filter(r => r.fechaVencimiento && new Date(r.fechaVencimiento) < new Date()).length,
  }), [requests, instances]);

  const predictiveAnalysis = useMemo(() => {
    const urgencyRatio = requests.filter(r => r.urgency === 'Alta').length / (requests.length || 1);
    return { bottleneckRisk: urgencyRatio > 0.5 ? 'Alto' : 'Bajo' };
  }, [requests]);

  return (
    <div className={cn('space-y-8 p-6', theme === THEMES.dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}>
      <h2 className="text-3xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { title: 'Solicitudes Totales', value: stats.totalRequests, color: 'text-blue-600' },
          { title: 'Pendientes', value: stats.pending, color: 'text-yellow-600' },
          { title: 'Aprobadas', value: stats.approved, color: 'text-green-600' },
          { title: 'Instancias Activas', value: stats.activeInstances, color: 'text-purple-600' },
          { title: 'Vencidas', value: stats.overdue, color: 'text-red-600' },
        ].map(stat => (
          <Card key={stat.title}>
            <CardHeader><CardTitle className="text-lg">{stat.title}</CardTitle></CardHeader>
            <CardContent><p className={cn('text-4xl font-semibold', stat.color)}>{stat.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Análisis Predictivo</CardTitle>
          <p className="text-sm text-gray-500">Riesgo de cuellos de botella: {predictiveAnalysis.bottleneckRisk}</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline"><BarChart2 className="w-4 h-4 mr-2" /> Ver Detalles</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Instances({ instances, onEditInstance, theme }) {
  const [filter, setFilter] = useState('all');
  const filteredInstances = useMemo(() => {
    if (filter === 'all') return instances;
    return instances.filter(i => i.delegable === filter.toUpperCase());
  }, [instances, filter]);

  return (
    <div className={cn('space-y-8 p-6', theme === THEMES.dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Instancias</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={cn('h-10 rounded-md border px-3', theme === THEMES.dark && 'bg-gray-700')}
        >
          <option value="all">Todas</option>
          <option value="delegable">Delegables</option>
          <option value="indelegable">Indelegables</option>
        </select>
      </div>
      <Card>
        <CardContent className="space-y-4">
          {filteredInstances.map((instance) => (
            <div key={instance.id} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div>
                <p className="text-sm font-medium">{instance.nombre}</p>
                <p className="text-xs text-gray-500">{instance.dependenciaResponsable} - {instance.actoAdministrativo}</p>
              </div>
              <div className="flex gap-2">
                <span className={cn('px-2 py-1 rounded-full text-xs', instance.delegable === 'DELEGABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                  {instance.delegable}
                </span>
                <Button variant="ghost" size="icon" onClick={() => onEditInstance(instance)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Requests({ requests, instances, onAddRequest, onEditRequest, onDeleteRequest, theme }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (searchTerm) result = result.filter(r => r.proposedDelegate.toLowerCase().includes(searchTerm.toLowerCase()));
    result.sort((a, b) => {
      const aValue = sortBy === 'date' ? new Date(a[sortBy]) : a[sortBy];
      const bValue = sortBy === 'date' ? new Date(b[sortBy]) : b[sortBy];
      return aValue > bValue ? -1 : 1;
    });
    return result;
  }, [requests, searchTerm, sortBy]);

  return (
    <div className={cn('space-y-8 p-6', theme === THEMES.dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Solicitudes</h2>
        <Button onClick={onAddRequest}><Plus className="w-4 h-4 mr-2" /> Nueva</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-10" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setSortBy(sortBy === 'date' ? 'status' : 'date')}>
              <Filter className="w-4 h-4 mr-2" /> {sortBy === 'date' ? 'Por Fecha' : 'Por Estado'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.map((req) => (
            <div key={req.id} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div>
                <p className="text-sm font-medium">{req.id} - {req.proposedDelegate}</p>
                <p className="text-xs text-gray-500">{new Date(req.date).toLocaleString('es-CO')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-1 rounded-full text-xs', STATUS_OPTIONS.find(s => s.value === req.status)?.color)}>
                  {STATUS_OPTIONS.find(s => s.value === req.status)?.label}
                </span>
                <Button variant="ghost" size="icon" onClick={() => onEditRequest(req)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteRequest(req.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Componente Principal ---
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [instances, setInstances] = useState(INITIAL_INSTANCES);
  const [delegationRequests, setDelegationRequests] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [theme, setTheme] = useState(THEMES.light);

  const currentUser = { name: 'Albert Buitrago', role: ROLES.ADMIN };

  const delegableInstances = useMemo(() => instances.filter(i => i.delegable === 'DELEGABLE'), [instances]);

  const simulateApi = useCallback(async (data, duration = 500) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsLoading(false);
    return { success: true, data };
  }, []);

  const handleAddRequest = useCallback(async (data) => {
    const newId = `req-${Date.now()}`;
    const response = await simulateApi({ ...data, id: newId, status: 'solicitada', date: new Date().toISOString(), requestedBy: currentUser.name });
    if (response.success) {
      setDelegationRequests(prev => [...prev, response.data]);
      toast.success(`Solicitud ${newId} creada`, { action: { label: 'Ver', onClick: () => setEditingRequest(response.data) } });
      setIsSheetOpen(false);
    }
  }, [simulateApi, currentUser.name]);

  const handleEditRequest = useCallback((request) => {
    setEditingRequest(request);
    setIsSheetOpen(true);
  }, []);

  const handleUpdateRequest = useCallback(async (data) => {
    const response = await simulateApi({ ...editingRequest, ...data });
    if (response.success) {
      setDelegationRequests(prev => prev.map(req => req.id === editingRequest.id ? response.data : req));
      toast.success(`Solicitud ${editingRequest.id} actualizada`);
      setIsSheetOpen(false);
      setEditingRequest(null);
    }
  }, [simulateApi, editingRequest]);

  const handleDeleteRequest = useCallback((id) => {
    setDelegationRequests(prev => prev.filter(req => req.id !== id));
    toast.success(`Solicitud ${id} eliminada`);
  }, []);

  const handleExportData = useCallback(() => {
    const json = JSON.stringify({ instances, requests: delegationRequests }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnp_data_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados exitosamente');
  }, [instances, delegationRequests]);

  const checkAlerts = useCallback(() => {
    delegationRequests.forEach(req => {
      if (req.fechaVencimiento && new Date(req.fechaVencimiento) < new Date()) {
        toast.warning(`Solicitud ${req.id} vencida`, { duration: 5000 });
      }
    });
  }, [delegationRequests]);

  useEffect(() => {
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard requests={delegationRequests} instances={instances} theme={theme} />;
      case 'instances':
        return <Instances instances={instances} onEditInstance={console.log} theme={theme} />;
      case 'requests':
        return (
          <Requests
            requests={delegationRequests}
            instances={instances}
            onAddRequest={() => setIsSheetOpen(true)}
            onEditRequest={handleEditRequest}
            onDeleteRequest={handleDeleteRequest}
            theme={theme}
          />
        );
      case 'powerbi':
        return (
          <div className={cn('p-6', theme === THEMES.dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}>
            <h2 className="text-3xl font-bold">Power BI</h2>
            <Card>
              <CardContent>
                <p>Integración Power BI (Simulada) - 85% datos migrados</p>
                <Button variant="outline" className="mt-4"><BarChart2 className="w-4 h-4 mr-2" /> Abrir Dashboard</Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className={cn('p-6', theme === THEMES.dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')}>
            <h2 className="text-3xl font-bold">Configuración</h2>
            <Card>
              <CardContent>
                <Button variant="outline" onClick={handleExportData}><Download className="w-4 h-4 mr-2" /> Exportar Datos</Button>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <div className="p-6">Página no encontrada</div>;
    }
  };

  return (
    <div className={cn('flex h-screen overflow-hidden', theme === THEMES.dark ? 'bg-gray-900' : 'bg-gray-100')}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userRole={currentUser.role}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        theme={theme}
      />
      <main className={cn('flex-1 overflow-y-auto transition-all duration-300', isSidebarOpen ? 'ml-64' : 'ml-16')}>
        <HeaderBar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          onLogout={() => toast.success('Sesión cerrada')}
          theme={theme}
          toggleTheme={() => setTheme(theme === THEMES.light ? THEMES.dark : THEMES.light)}
        />
        <div className="p-6 min-h-[calc(100vh-3.5rem)]">
          {renderPage()}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      </main>
      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setEditingRequest(null); }}>
        <SheetHeader>
          <SheetTitle>{editingRequest ? 'Editar Solicitud' : 'Nueva Solicitud'}</SheetTitle>
          <SheetDescription>Complete los detalles para gestionar la delegación</SheetDescription>
        </SheetHeader>
        <DelegationRequestForm
          delegableInstances={delegableInstances}
          onSubmit={editingRequest ? handleUpdateRequest : handleAddRequest}
          onCancel={() => setIsSheetOpen(false)}
          isLoading={isLoading}
          initialData={editingRequest}
          theme={theme}
        />
      </Sheet>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;