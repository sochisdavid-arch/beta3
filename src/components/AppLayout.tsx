"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Boxes,
  Users,
  Landmark,
  Stethoscope,
  LineChart,
  ChevronDown,
  Activity,
  GitCommitHorizontal,
  ClipboardList,
  TestTube,
  Warehouse,
  Baby,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { SpermIcon } from '@/components/icons/sperm-icon';
import { BabyBottleIcon } from '@/components/icons/baby-bottle-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { auth, firestoreDb } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      return;
    }

    const checkFarm = async () => {
      try {
        const farmDocRef = doc(firestoreDb, 'users', user.uid, 'profile', 'farm');
        const snap = await getDoc(farmDocRef);
        if (!snap.exists() && pathname !== '/farm-setup' && !pathname.startsWith('/licensing') && !pathname.startsWith('/payment-confirmation')) {
          toast({
            title: "Configuración requerida",
            description: "Por favor, completa la configuración de tu granja para continuar.",
          });
          router.push('/farm-setup');
        }
      } catch (error) {
        const details =
          error instanceof FirebaseError
            ? `${error.code}${error.message ? `: ${error.message}` : ""}`
            : (error instanceof Error ? error.message : "Error desconocido");
        console.error('Error checking farm configuration', error);
        toast({
          variant: "destructive",
          title: "No se pudo verificar tu granja",
          description: details,
        });
      }
    };

    checkFarm();
  }, [pathname, router, toast, user]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión. Por favor, inténtalo de nuevo.",
      });
    }
  };

  const menuItems = [
    { href: '/dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { href: '/gestation', label: 'Gestación', icon: SpermIcon },
    { href: '/lactation', label: 'Lactancia', icon: BabyBottleIcon },
    { href: '/verracos', label: 'Verracos', icon: TestTube },
    { href: '/precebo', label: 'Precebo', icon: Baby },
    { href: '/ceba', label: 'Ceba', icon: Warehouse },
    { href: '/inventory', label: 'Inventario', icon: Boxes },
    { href: '/personnel', label: 'Personal', icon: Users },
    { href: '/pig-doctor', label: 'PigDoctor AI', icon: Stethoscope },
    { href: '/finance', label: 'Análisis Financiero', icon: Landmark },
    { href: '/forms', label: 'Formularios', icon: ClipboardList },
  ];

  const licenseItems = [
    { href: '/licensing', label: 'Planes y Precios', icon: ShieldCheck },
    { href: '/payment-confirmation', label: 'Activar Licencia', icon: KeyRound },
  ];
  
  const gestationAnalysisMenuItems = [
      { href: '/analysis/gestation-performance', label: 'Desempeño Gestación' },
      { href: '/analysis/reproductive-loss', label: 'Pérdida Reproductiva' },
      { href: '/analysis/service-analysis', label: 'Análisis de Servicios' },
      { href: '/analysis/farrowing-rate', label: 'Análisis Tasa de Parición' },
      { href: '/analysis/reproductive-loss-analysis', label: 'Análisis Pérdidas Reproductivas' },
      { href: '/analysis/sow-card', label: 'Ficha de la Madre' },
  ];
  
  const lactationAnalysisMenuItems = [
       { href: '/analysis/maternity-performance', label: 'Análisis Potencial Productivo' },
       { href: '/analysis/farrowing-forecast', label: 'Previsión de Parto' },
       { href: '/analysis/weaning-forecast', label: 'Previsión de Destete' },
       { href: '/analysis/birth-analysis', label: 'Análisis de Nacimientos' },
       { href: '/analysis/lactation-analysis', label: 'Análisis de Destetados' },
       { href: '/analysis/mortality-analysis', label: 'Análisis de mortalidad' },
  ];
  
  const productionAnalysisMenuItems = [
       { href: '/analysis/liquidated-batches', label: 'Lotes Liquidados' },
  ];

  const isGestationAnalysisActive = gestationAnalysisMenuItems.some(item => pathname.startsWith(item.href));
  const isLactationAnalysisActive = lactationAnalysisMenuItems.some(item => pathname.startsWith(item.href));
  const isProductionAnalysisActive = productionAnalysisMenuItems.some(item => pathname.startsWith(item.href));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="size-7" />
            <span className="font-bold text-lg">SmartPig</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
                 <Collapsible defaultOpen={isGestationAnalysisActive}>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className="justify-between"
                            >
                            <div className="flex items-center gap-2">
                                <GitCommitHorizontal />
                                <span>Análisis Gestación</span>
                            </div>
                            <ChevronDown className="size-4 shrink-0 transition-transform ease-in-out group-data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {gestationAnalysisMenuItems.map((item) => (
                                <SidebarMenuSubItem key={item.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>{item.label}</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <Collapsible defaultOpen={isLactationAnalysisActive}>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className="justify-between"
                            >
                            <div className="flex items-center gap-2">
                                <Activity />
                                <span>Análisis Lactancia</span>
                            </div>
                            <ChevronDown className="size-4 shrink-0 transition-transform ease-in-out group-data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {lactationAnalysisMenuItems.map((item) => (
                                <SidebarMenuSubItem key={item.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>{item.label}</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuItem>
             <SidebarMenuItem>
                 <Collapsible defaultOpen={isProductionAnalysisActive}>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className="justify-between"
                            >
                            <div className="flex items-center gap-2">
                                <LineChart />
                                <span>Análisis Producción</span>
                            </div>
                            <ChevronDown className="size-4 shrink-0 transition-transform ease-in-out group-data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {productionAnalysisMenuItems.map((item) => (
                                <SidebarMenuSubItem key={item.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>{item.label}</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuItem>

            <DropdownMenuSeparator />
            <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suscripción</p>
            </div>
            {licenseItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <div className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-sidebar-accent/50">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="@user" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                     <div className="group-data-[collapsible=icon]:hidden flex flex-col">
                        <span className="text-sm font-semibold text-sidebar-foreground">Admin de la Granja</span>
                        <span className="text-xs text-sidebar-foreground/90">admin@smartpig.com</span>
                    </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin de la Granja</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@smartpig.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="mr-2 h-4 w-4" />Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Configuración</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}