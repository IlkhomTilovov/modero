import { useEffect, useState } from 'react';
import { Plus, Shield, ShieldCheck, Trash2, ShoppingCart, Package, Pencil, UserCheck, UserX, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { AppRole, roleDisplayInfo } from '@/lib/permissions';
import { useAdminT } from '@/hooks/useAdminT';
import { useLanguage } from '@/hooks/useLanguage';

interface UserWithProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: AppRole | 'editor';
  status: 'active' | 'disabled';
  created_at: string;
}

export default function Admins() {
  const t = useAdminT().admins;
  const { language } = useLanguage();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('seller');
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');
  
  const { user, isAdmin, session } = useAuth();
  const { toast } = useToast();

  const getInvokeErrorMessage = (err: unknown, fallback = t.genericError) => {
    if (!err || typeof err !== 'object') return fallback;
    const anyErr = err as any;
    if (typeof anyErr?.message === 'string' && anyErr.message.trim()) {
      const msg = anyErr.message.trim();
      if (msg.toLowerCase().includes('edge function returned') || msg.toLowerCase().includes('non-2xx')) {
        const body = anyErr?.context?.body;
        if (typeof body === 'string' && body) {
          try {
            const parsed = JSON.parse(body);
            if (typeof parsed?.error === 'string' && parsed.error.trim()) return parsed.error.trim();
          } catch {}
        }
      }
      return msg;
    }
    if (typeof (anyErr as any)?.error === 'string' && (anyErr as any).error.trim()) {
      return (anyErr as any).error.trim();
    }
    return fallback;
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithProfile[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          role: (userRole?.role as AppRole) || 'seller',
          status: profile.status as 'active' | 'disabled',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: t.errorTitle, description: t.loadError });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast({ variant: 'destructive', title: t.errorTitle, description: t.fillAll });
      return;
    }

    if (formPassword.length < 6) {
      toast({ variant: 'destructive', title: t.errorTitle, description: t.passwordMin });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: formEmail.trim(),
          password: formPassword,
          name: formName.trim(),
          role: formRole,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: t.successTitle, description: t.userCreated });
      setCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.errorTitle, description: getInvokeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update',
          userId: selectedUser.user_id,
          name: formName.trim(),
          role: formRole,
          status: formStatus,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: t.successTitle, description: t.userUpdated });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.errorTitle, description: getInvokeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId: selectedUser.user_id,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: t.successTitle, description: t.userDeleted });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.errorTitle, description: getInvokeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (userItem: UserWithProfile) => {
    setSelectedUser(userItem);
    setFormName(userItem.name);
    setFormRole(userItem.role === 'editor' ? 'manager' : userItem.role);
    setFormStatus(userItem.status);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('seller');
    setFormStatus('active');
    setShowPassword(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleLabel = (role: string) => {
    const mapped = role === 'editor' ? 'manager' : role;
    if (mapped === 'admin') return t.adminRole;
    if (mapped === 'manager') return t.managerRole;
    return t.sellerRole;
  };

  const getRoleColor = (role: string) => {
    const mapped = role === 'editor' ? 'manager' : role;
    return roleDisplayInfo[mapped as AppRole]?.color || roleDisplayInfo.seller.color;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      case 'manager':
      case 'editor':
        return <Package className="h-3 w-3 mr-1" />;
      case 'seller':
        return <ShoppingCart className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'manager' || u.role === 'editor').length;
  const sellerCount = users.filter(u => u.role === 'seller').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t.newUser}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admins}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">{t.adminsHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.managers}</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerCount}</div>
            <p className="text-xs text-muted-foreground">{t.managersHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.sellers}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellerCount}</div>
            <p className="text-xs text-muted-foreground">{t.sellersHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.active}</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">{t.activeHint(users.length)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.listTitle}</CardTitle>
          <CardDescription>{t.listSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.email}</TableHead>
                <TableHead>{t.role}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.created}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => {
                const isCurrentUser = userItem.user_id === user?.id;
                return (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">
                      {userItem.name}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-2">{t.you}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {userItem.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(userItem.role)}>
                        {getRoleIcon(userItem.role)}
                        {getRoleLabel(userItem.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={userItem.status === 'active' ? 'default' : 'secondary'}>
                        {userItem.status === 'active' ? (
                          <><UserCheck className="h-3 w-3 mr-1" /> {t.statusActive}</>
                        ) : (
                          <><UserX className="h-3 w-3 mr-1" /> {t.statusDisabled}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(userItem.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(userItem)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedUser(userItem); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t.noUsers}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.rolesInfoTitle}</CardTitle>
          <CardDescription>{t.rolesInfoSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">{t.sellerRole}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {t.sellerPerms.map((p) => <li key={p}>✓ {p}</li>)}
                {t.sellerDenied.map((p) => <li key={p}>✗ {p}</li>)}
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-green-500" />
                <span className="font-semibold">{t.managerRole}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {t.managerPerms.map((p) => <li key={p}>✓ {p}</li>)}
                {t.managerDenied.map((p) => <li key={p}>✗ {p}</li>)}
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-red-500" />
                <span className="font-semibold">{t.adminRole}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {t.adminPerms.map((p) => <li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.createTitle}</DialogTitle>
            <DialogDescription>{t.createSubtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.name} *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.namePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.email} *</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.passwordLabel}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.role}</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      {t.sellerRole}
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      {t.managerRole}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-500" />
                      {t.adminRole}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving ? t.creating : t.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.editTitle}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.name}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.namePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.role}</Label>
              <Select 
                value={formRole} 
                onValueChange={(v) => setFormRole(v as AppRole)}
                disabled={selectedUser?.user_id === user?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      {t.sellerRole}
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      {t.managerRole}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-500" />
                      {t.adminRole}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.status}</Label>
              <Select 
                value={formStatus} 
                onValueChange={(v) => setFormStatus(v as 'active' | 'disabled')}
                disabled={selectedUser?.user_id === user?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      {t.statusActive}
                    </div>
                  </SelectItem>
                  <SelectItem value="disabled">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      {t.statusDisabled}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser?.name}</strong> ({selectedUser?.email}) {t.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive text-destructive-foreground"
              disabled={saving}
            >
              {saving ? t.deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
