
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Menu, User, LogOut } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userEmail?: string;
  userName?: string;
  onLogout?: () => void;
}

const Navbar = ({ userEmail = "admin@salaodonto.com", userName = "Administrador", onLogout }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-sala-blue" />
            <span className="font-bold">CAIXA RÁPIDO</span>
          </a>
          <span className="ml-2 rounded-md bg-sala-blue px-1.5 py-0.5 text-xs font-medium text-white">
            SALA BLACK
          </span>
        </div>
        
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <nav className="flex items-center space-x-4 text-sm font-medium">
            <a
              href="#"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              Tarefas
            </a>
            <a
              href="#"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              Equipe
            </a>
            <a
              href="#"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              Configurações
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col">
                    <span>{userName}</span>
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex md:hidden flex-1 justify-end">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-6 py-6">
                <div className="flex flex-col space-y-4">
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground/80 text-foreground font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground/80 text-muted-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tarefas
                  </a>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground/80 text-muted-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Equipe
                  </a>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground/80 text-muted-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Configurações
                  </a>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center mb-4">
                    <User className="h-5 w-5 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground">{userEmail}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
