
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/lib/apiTypes";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RegisterForm from "@/components/auth/RegisterForm";
import { UserPlus, Trash2, Shield, ShieldAlert } from "lucide-react";

const UsersPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
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
            setIsAdmin(userProfile.role === 'admin');
            
            // Only fetch users if admin
            if (userProfile.role === 'admin') {
              fetchUsers();
            } else {
              // Redirect non-admin users
              navigate('/');
            }
          }
        }
      } else {
        // Redirect to login if not authenticated
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
        setUsers(data as User[]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao buscar usuários",
        description: "Ocorreu um erro ao tentar buscar os usuários",
        variant: "destructive"
      });
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  
  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: 'admin' } : user
      ));
      
      toast({
        title: "Usuário promovido",
        description: "O usuário foi promovido a administrador com sucesso!",
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "Erro ao promover usuário",
        description: "Ocorreu um erro ao tentar promover o usuário",
        variant: "destructive"
      });
    }
  };
  
  const handleDemoteToStaff = async (userId: string) => {
    // Prevent demoting yourself
    const currentUser = await supabase.auth.getUser();
    if (currentUser.data.user?.id === userId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover seus próprios privilégios de administrador",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'staff' })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: 'staff' } : user
      ));
      
      toast({
        title: "Privilégios removidos",
        description: "O usuário agora é um membro da equipe regular",
      });
    } catch (error) {
      console.error("Error demoting user:", error);
      toast({
        title: "Erro ao alterar privilégios",
        description: "Ocorreu um erro ao tentar alterar os privilégios do usuário",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    // Prevent deleting yourself
    const currentUser = await supabase.auth.getUser();
    if (currentUser.data.user?.id === userId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive"
      });
      return;
    }
    
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    try {
      // Delete from users table first (will cascade to auth.users due to our trigger)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao tentar excluir o usuário",
        variant: "destructive"
      });
    }
  };
  
  const handleRegisterComplete = () => {
    setIsRegisterDialogOpen(false);
    fetchUsers();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || !isAdmin) {
    navigate('/');
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar 
        userEmail={userEmail} 
        userName={userName || "Usuário"} 
        onLogout={handleLogout}
        onThemeToggle={() => {}}
        currentTheme="light"
      />
      
      <main className="flex-1">
        <div className="container max-w-screen-xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
              <p className="text-muted-foreground">
                Gerencie os usuários do sistema CAIXA RÁPIDO
              </p>
            </div>
            
            <Button onClick={() => setIsRegisterDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Equipe'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'staff' ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handlePromoteToAdmin(user.id)}
                            title="Promover a administrador"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDemoteToStaff(user.id)}
                            title="Rebaixar para equipe"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie uma nova conta para um membro da equipe.
            </DialogDescription>
          </DialogHeader>
          <RegisterForm onRegister={handleRegisterComplete} adminCreation={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
