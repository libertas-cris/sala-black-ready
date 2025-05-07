import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialogContent, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTheme } from "@/components/ThemeProvider";
import { UserPlus, MoreVertical, ShieldAlert, User as LucideUser, Trash2, Lock, Unlock } from "lucide-react";
import { User } from "@/lib/types";
import { AdminRegisterForm } from "@/components/admin/AdminRegisterForm";

interface UserData extends Omit<User, 'role'> {
  created_at: string;
  status?: string;
  role: 'admin' | 'staff';
  ban_duration?: string | null;
}

const Admin = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [userToToggleBlock, setUserToToggleBlock] = useState<UserData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setIsAuthenticated(true);
        
        // Get user info
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setUserEmail(userData.user.email || "");
          
          // Get user profile from users table
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.user.id)
            .single();
            
          if (userProfile) {
            setUserName(userProfile.name);
            
            // Check if user is admin
            if (userProfile.email !== 'admin@salaback.com') {
              toast({
                title: "Acesso negado",
                description: "Você não tem permissão para acessar esta página",
                variant: "destructive"
              });
              navigate('/');
            } else {
              setIsAdmin(true);
              fetchUsers();
            }
          }
        }
      } else {
        navigate('/');
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      // First get users data from the users table
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (usersData) {
        // For each user, check if they have ban duration in auth.users
        const usersWithStatus = await Promise.all(usersData.map(async (user) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
          
          return {
            ...user,
            ban_duration: authUser?.user?.ban_duration || null
          } as UserData;
        }));
        
        setUsers(usersWithStatus);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao buscar usuários",
        description: "Ocorreu um problema ao buscar os dados dos usuários",
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'staff') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole } 
            : user
        )
      );
      
      toast({
        title: "Papel atualizado",
        description: `Usuário agora é ${newRole === 'admin' ? 'administrador' : 'funcionário'}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Erro ao atualizar papel",
        description: "Ocorreu um problema ao atualizar o papel do usuário",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Remove user from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);
        
      if (error) throw error;
      
      // Also delete the user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.id);
      
      if (authError) throw authError;
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro ao remover usuário",
        description: "Ocorreu um problema ao remover o usuário",
        variant: "destructive"
      });
    } finally {
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!userToToggleBlock) return;
    
    try {
      const isCurrentlyBlocked = !!userToToggleBlock.ban_duration;
      
      if (isCurrentlyBlocked) {
        // Unblock user
        const { error } = await supabase.auth.admin.updateUserById(
          userToToggleBlock.id,
          { ban_duration: null }
        );
        
        if (error) throw error;
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userToToggleBlock.id 
              ? { ...user, ban_duration: null } 
              : user
          )
        );
        
        toast({
          title: "Usuário desbloqueado",
          description: `${userToToggleBlock.name} agora pode acessar o sistema`,
        });
      } else {
        // Block user - set ban to effectively forever (100 years)
        const { error } = await supabase.auth.admin.updateUserById(
          userToToggleBlock.id,
          { ban_duration: '876000h' }  // ~100 years
        );
        
        if (error) throw error;
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userToToggleBlock.id 
              ? { ...user, ban_duration: '876000h' } 
              : user
          )
        );
        
        toast({
          title: "Usuário bloqueado",
          description: `${userToToggleBlock.name} não poderá mais acessar o sistema`,
        });
      }
    } catch (error) {
      console.error("Error toggling user block status:", error);
      toast({
        title: "Erro ao alterar status",
        description: "Ocorreu um problema ao alterar o status do usuário",
        variant: "destructive"
      });
    } finally {
      setUserToToggleBlock(null);
      setBlockDialogOpen(false);
    }
  };

  const handleUserCreated = () => {
    setIsAddUserOpen(false);
    fetchUsers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Function to determine user status
  const getUserStatusBadge = (user: UserData) => {
    const isBlocked = !!user.ban_duration;
    
    if (isBlocked) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    
    return <Badge variant="success">Ativo</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Redirecionamento é feito no useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar
        userEmail={userEmail}
        userName={userName}
        onLogout={handleLogout}
        onThemeToggle={toggleTheme}
        currentTheme={theme}
      />
      
      <main className="flex-1">
        <div className="container max-w-screen-lg mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Área Administrativa</h1>
              <p className="text-muted-foreground">
                Gerencie os usuários que têm acesso ao sistema
              </p>
            </div>
            
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova conta de usuário.
                  </DialogDescription>
                </DialogHeader>
                <AdminRegisterForm onSuccess={handleUserCreated} />
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Lista de todos os usuários cadastrados no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? "default" : "outline"}>
                          {user.role === 'admin' ? 'Administrador' : 'Funcionário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getUserStatusBadge(user)}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.role !== 'admin' && (
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Promover a Admin
                              </DropdownMenuItem>
                            )}
                            {user.role === 'admin' && user.email !== 'admin@salaback.com' && (
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'staff')}>
                                <LucideUser className="mr-2 h-4 w-4" />
                                Rebaixar para Staff
                              </DropdownMenuItem>
                            )}
                            
                            {user.email !== 'admin@salaback.com' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setUserToToggleBlock(user);
                                    setBlockDialogOpen(true);
                                  }}
                                  className={!!user.ban_duration ? "text-green-600" : "text-amber-600"}
                                >
                                  {!!user.ban_duration ? (
                                    <>
                                      <Unlock className="mr-2 h-4 w-4" />
                                      Desbloquear Acesso
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="mr-2 h-4 w-4" />
                                      Bloquear Acesso
                                    </>
                                  )}
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover Usuário
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário "{userToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {!!userToToggleBlock?.ban_duration ? "Desbloquear Acesso" : "Bloquear Acesso"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {!!userToToggleBlock?.ban_duration ? (
                <>Tem certeza que deseja desbloquear o acesso de "{userToToggleBlock?.name}"?</>
              ) : (
                <>Tem certeza que deseja bloquear o acesso de "{userToToggleBlock?.name}"?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToToggleBlock(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockToggle} 
              className={!!userToToggleBlock?.ban_duration ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {!!userToToggleBlock?.ban_duration ? "Desbloquear" : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
