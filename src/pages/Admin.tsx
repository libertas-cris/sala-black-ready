
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
import { Input } from "@/components/ui/input";
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
import { UserPlus, MoreVertical, ShieldAlert, User, Trash2, Lock, Unlock } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  status?: string;
}

const Admin = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Formulário para adicionar novo usuário
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("staff");
  const [formSubmitting, setFormSubmitting] = useState(false);

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
            setIsAdmin(userProfile.email === 'admin@salaback.com');
            
            // Redirect to homepage if not admin
            if (userProfile.email !== 'admin@salaback.com') {
              toast({
                title: "Acesso negado",
                description: "Você não tem permissão para acessar esta página",
                variant: "destructive"
              });
              navigate('/');
            } else {
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Verificar se os usuários têm acesso bloqueado
        const usersWithStatus = await Promise.all(data.map(async (user) => {
          const { data: authData } = await supabase.auth.admin.getUserById(user.id);
          const isBlocked = authData?.user?.banned || false;
          return { ...user, status: isBlocked ? 'blocked' : 'active' };
        }));
        
        setUsers(usersWithStatus as UserData[]);
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

  const handleRoleChange = async (userId: string, newRole: string) => {
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

  const handleBlockUser = async () => {
    if (!userToEdit) return;
    
    try {
      // Bloquear/desbloquear usuário no Auth
      const isBlocked = userToEdit.status === 'blocked';
      const action = isBlocked ? 'unban' : 'ban';
      
      const { error } = await supabase.auth.admin.updateUserById(
        userToEdit.id,
        { ban_duration: action === 'ban' ? 'none' : '0' }
      );
      
      if (error) throw error;
      
      // Atualizar a interface
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userToEdit.id 
            ? { ...user, status: action === 'ban' ? 'blocked' : 'active' } 
            : user
        )
      );
      
      toast({
        title: action === 'ban' ? "Acesso bloqueado" : "Acesso liberado",
        description: `O acesso do usuário foi ${action === 'ban' ? 'bloqueado' : 'liberado'} com sucesso`,
      });
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      toast({
        title: "Erro ao gerenciar acesso",
        description: "Ocorreu um problema ao atualizar o status do usuário",
        variant: "destructive"
      });
    } finally {
      setUserToEdit(null);
      setBlockDialogOpen(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToEdit) return;
    
    try {
      // Excluir usuário do Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userToEdit.id);
      if (authError) throw authError;
      
      // Excluir registro da tabela users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToEdit.id);
        
      if (error) throw error;
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToEdit.id));
      
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
      setUserToEdit(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    try {
      // 1. Criar usuário no Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: { name: newUserName }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // 2. Inserir na tabela de usuários
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: newUserName,
            email: newUserEmail,
            role: newUserRole
          });
          
        if (insertError) throw insertError;
        
        // 3. As tarefas serão criadas automaticamente pelo trigger no banco de dados
        
        toast({
          title: "Usuário adicionado",
          description: "Novo usuário foi criado com sucesso!",
        });
        
        // Resetar formulário e fechar modal
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("staff");
        setIsAddUserOpen(false);
        
        // Atualizar lista de usuários
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error?.message || "Ocorreu um erro ao criar o novo usuário",
        variant: "destructive"
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
              <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Alunos</h1>
              <p className="text-muted-foreground">
                Gerencie os alunos que têm acesso ao sistema
              </p>
            </div>
            
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Aluno</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova conta de aluno.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Nome Completo</label>
                    <Input 
                      id="name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      disabled={formSubmitting}
                      placeholder="Nome do aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input 
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      disabled={formSubmitting}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Senha</label>
                    <Input 
                      id="password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                      disabled={formSubmitting}
                      placeholder="Senha temporária"
                    />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" disabled={formSubmitting} className="w-full">
                      {formSubmitting ? "Adicionando..." : "Adicionar Aluno"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Alunos</CardTitle>
              <CardDescription>Lista de todos os alunos cadastrados no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className={user.status === 'blocked' ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? "success" : "destructive"}>
                          {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                        </Badge>
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
                            {user.email !== 'admin@salaback.com' && (
                              <>
                                {user.status === 'active' ? (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setUserToEdit(user);
                                      setBlockDialogOpen(true);
                                    }}
                                    className="text-yellow-600"
                                  >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Bloquear Acesso
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setUserToEdit(user);
                                      setBlockDialogOpen(true);
                                    }}
                                  >
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Desbloquear Acesso
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setUserToEdit(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover Aluno
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
      
      {/* Diálogo de confirmação para remover usuário */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o aluno "{userToEdit?.name}"? 
              Esta ação não pode ser desfeita e todos os dados associados serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToEdit(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmação para bloquear/desbloquear usuário */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToEdit?.status === 'blocked' ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToEdit?.status === 'blocked'
                ? `Tem certeza que deseja desbloquear o acesso de "${userToEdit?.name}"? Ele poderá acessar o sistema novamente.`
                : `Tem certeza que deseja bloquear o acesso de "${userToEdit?.name}"? Ele não poderá acessar o sistema até que seja desbloqueado.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToEdit(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockUser} 
              className={userToEdit?.status === 'blocked' ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
            >
              {userToEdit?.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
