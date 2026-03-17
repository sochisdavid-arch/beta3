
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Baby, Component } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, parseISO, isValid, differenceInWeeks } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type StatusType = 'Gestante' | 'Vacia' | 'Destetada' | 'Remplazo' | 'Lactante';
type EventType = "Celo" | "Celo no Servido" | "Inseminación" | "Parto" | "Aborto" | "Tratamiento" | "Vacunación" | "Venta" | "Descarte" | "Muerte" | "Muerte de Lechón" | "Adopción de Lechón" | "Donación de Lechón" | "Destete";

interface Event {
    type: EventType | 'Ninguno';
    date: string;
    inseminationGroup?: string;
    details?: string;
    liveBorn?: number;
    stillborn?: number;
    mummified?: number;
    pigletCount?: number;
}

interface Pig {
    id: string;
    breed: string;
    birthDate: string;
    arrivalDate: string;
    weight: number;
    gender: string;
    purchaseValue?: number;
    age: number;
    status: StatusType;
    lastEvent: Event;
    events: Event[];
}

const initialPigs: Pig[] = [
    { 
        id: 'PIG-001', 
        breed: 'Duroc', 
        birthDate: '2023-04-15', 
        arrivalDate: '2023-05-01', 
        weight: 190, 
        gender: 'Hembra', 
        purchaseValue: 150, 
        age: 0, 
        status: 'Lactante', 
        lastEvent: { type: 'Parto', date: '2024-07-08', liveBorn: 14, stillborn: 1, mummified: 0, details: '14 nacidos vivos, 1 mortinato.' }, 
        events: [
            { type: 'Parto', date: '2024-07-08', liveBorn: 14, stillborn: 1, mummified: 0 },
            { type: 'Inseminación', date: '2024-03-17', inseminationGroup: 'SEMANA-12' },
        ] 
    },
    { 
        id: 'PIG-002', 
        breed: 'Landrace', 
        birthDate: '2023-02-26', 
        arrivalDate: '2023-03-15', 
        weight: 210, 
        gender: 'Hembra', 
        purchaseValue: 155, 
        age: 0, 
        status: 'Lactante', 
        lastEvent: { type: 'Parto', date: '2024-07-10', liveBorn: 12, stillborn: 0, mummified: 0, details: '12 nacidos vivos.' }, 
        events: [
            { type: 'Parto', date: '2024-07-10', liveBorn: 12, stillborn: 0, mummified: 0 },
            { type: 'Muerte de Lechón', date: '2024-07-12', pigletCount: 1, details: 'Aplastamiento' },
            { type: 'Inseminación', date: '2024-03-19', inseminationGroup: 'SEMANA-12' },
        ] 
    },
];

const pigBreeds = [
  // Razas Puras
  "Duroc", "Yorkshire", "Landrace", "Hampshire", "Pietrain", "Berkshire", "Chester White", "Spotted", "Poland China", "Tamworth", "Large Black", "Cerdo Ibérico",
  // Líneas Genéticas Comerciales
  "PIC", "Topigs Norsvin", "Hypor (Hendrix Genetics)", "DanBred", "Genus", "Choice Genetics", "Genesus",
  // Otras
  "Otro"
];

const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const date = parseISO(birthDate);
    if (!isValid(date)) return 0;
    return differenceInWeeks(new Date(), date);
}

const getParityData = (pig: Pig) => {
    const partoEvents = pig.events.filter(e => e.type === 'Parto');
    const lastPartoEvent = partoEvents[0]; // Most recent is at the beginning

    if (!lastPartoEvent) {
        return { farrowingDate: null, liveBorn: 0, stillborn: 0, mummified: 0, currentPiglets: 0, parity: 0 };
    }

    const liveBorn = lastPartoEvent.liveBorn ?? 0;
    const stillborn = lastPartoEvent.stillborn ?? 0;
    const mummified = lastPartoEvent.mummified ?? 0;

    const lactationEvents = pig.events.slice(0, pig.events.indexOf(lastPartoEvent));
    
    const deaths = lactationEvents.filter(e => e.type === 'Muerte de Lechón').reduce((sum, e) => sum + (e.pigletCount || 0), 0);
    const adoptions = lactationEvents.filter(e => e.type === 'Adopción de Lechón').reduce((sum, e) => sum + (e.pigletCount || 0), 0);
    const donations = lactationEvents.filter(e => e.type === 'Donación de Lechón').reduce((sum, e) => sum + (e.pigletCount || 0), 0);
    
    const currentPiglets = liveBorn - deaths - donations + adoptions;
    
    return {
        farrowingDate: lastPartoEvent?.date,
        liveBorn: liveBorn,
        stillborn: stillborn,
        mummified: mummified,
        currentPiglets: currentPiglets,
        parity: partoEvents.length,
    };
};

const KpiCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactElement }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function LactationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [allPigs, setAllPigs] = React.useState<Pig[]>([]);
    const [lactatingSows, setLactatingSows] = React.useState<Pig[]>([]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingPig, setEditingPig] = React.useState<Pig | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [pigToDelete, setPigToDelete] = React.useState<Pig | null>(null);
    
    const loadPigs = React.useCallback(() => {
        const pigsFromStorage = localStorage.getItem('pigs');
        const allPigsData: Pig[] = pigsFromStorage ? JSON.parse(pigsFromStorage) : initialPigs;
        
        if (!pigsFromStorage) {
            localStorage.setItem('pigs', JSON.stringify(initialPigs));
        }

        const processedPigs = allPigsData.map(p => ({...p, age: calculateAge(p.birthDate)}));
        setAllPigs(processedPigs);
        const lactating = processedPigs.filter(p => p.status === 'Lactante');
        setLactatingSows(lactating);
    }, []);

    React.useEffect(() => {
        loadPigs();
        
        const handleStorageChange = () => {
            loadPigs();
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadPigs]);


    const openEditDialog = (pig: Pig) => {
        setEditingPig(pig);
        setIsFormOpen(true);
    };

    const openDeleteDialog = (pig: Pig) => {
        setPigToDelete(pig);
        setIsDeleteDialogOpen(true);
    };

    const closeFormDialog = () => {
        setIsFormOpen(false);
        setEditingPig(null);
    };

    const handleAnimalFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const birthDateValue = formData.get('birthDate') as string;
        
        let submittedAnimal: Pig;

        if (editingPig) {
            submittedAnimal = {
              ...editingPig,
              id: formData.get('id') as string,
              breed: formData.get('breed') as string,
              birthDate: birthDateValue,
              arrivalDate: formData.get('arrivalDate') as string,
              weight: parseInt(formData.get('weight') as string),
              gender: formData.get('gender') as string,
              purchaseValue: formData.get('purchaseValue') ? parseInt(formData.get('purchaseValue') as string) : undefined,
              age: calculateAge(birthDateValue),
            };
            
            const updatedPigs = allPigs.map(p => p.id === editingPig.id ? submittedAnimal : p);
            localStorage.setItem('pigs', JSON.stringify(updatedPigs));
            loadPigs();
        }
        
        toast({
            title: "Animal Actualizado",
            description: `El animal con ID ${submittedAnimal!.id} ha sido actualizado correctamente.`
        });

        closeFormDialog();
        (event.target as HTMLFormElement).reset();
    };

    const handleDeleteConfirm = () => {
        if (pigToDelete) {
            const newPigs = allPigs.filter(p => p.id !== pigToDelete.id);
            localStorage.setItem('pigs', JSON.stringify(newPigs));
            loadPigs();
            toast({
                title: "Animal Eliminado",
                description: `El animal con ID ${pigToDelete.id} ha sido eliminado.`,
                variant: "destructive"
            });
        }
        setIsDeleteDialogOpen(false);
        setPigToDelete(null);
    };

    const totalPiglets = lactatingSows.reduce((sum, sow) => sum + getParityData(sow).currentPiglets, 0);
    
    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Cerdas en Lactancia</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <KpiCard title="Madres Lactando" value={lactatingSows.length} icon={<Component className="h-4 w-4 text-muted-foreground"/>} />
                    <KpiCard title="Total Lechones" value={totalPiglets} icon={<Baby className="h-4 w-4 text-muted-foreground"/>} />
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Cerdas</CardTitle>
                        <CardDescription>
                            Aquí se muestran todas las cerdas que se encuentran en la fase de lactancia. Para mover una cerda aquí, registre un evento de "Parto" en su hoja de vida.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Cerda</TableHead>
                                        <TableHead>Fecha Parto</TableHead>
                                        <TableHead className="text-center">Nº Parto</TableHead>
                                        <TableHead className="text-center">Nacidos Vivos</TableHead>
                                        <TableHead className="text-center">Actuales</TableHead>
                                        <TableHead className="text-center">Mortinatos</TableHead>
                                        <TableHead className="text-center">Momias</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lactatingSows.length > 0 ? lactatingSows.map((pig) => {
                                        const parityData = getParityData(pig);
                                        return (
                                        <TableRow key={pig.id} onClick={() => router.push(`/lactation/${pig.id}`)} className="cursor-pointer">
                                            <TableCell className="font-medium">{pig.id}</TableCell>
                                            <TableCell>
                                                {parityData.farrowingDate && isValid(parseISO(parityData.farrowingDate))
                                                    ? format(parseISO(parityData.farrowingDate), 'dd/MM/yyyy')
                                                    : 'N/A'
                                                }
                                            </TableCell>
                                            <TableCell className="text-center">{parityData.parity}</TableCell>
                                            <TableCell className="text-center">{parityData.liveBorn}</TableCell>
                                            <TableCell className="text-center font-bold">{parityData.currentPiglets}</TableCell>
                                            <TableCell className="text-center">{parityData.stillborn}</TableCell>
                                            <TableCell className="text-center">{parityData.mummified}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                      <DropdownMenuItem onSelect={() => openEditDialog(pig)}>Editar</DropdownMenuItem>
                                                      <DropdownMenuSeparator />
                                                      <DropdownMenuItem onSelect={() => openDeleteDialog(pig)} className="text-red-500 focus:text-red-500">Eliminar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No hay cerdas en lactancia en este momento.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Mobile Card View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {lactatingSows.length > 0 ? lactatingSows.map((pig) => {
                                 const parityData = getParityData(pig);
                                return (
                                <Card key={pig.id} onClick={() => router.push(`/lactation/${pig.id}`)} className="hover:bg-accent/50 cursor-pointer">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>{pig.id}</CardTitle>
                                                <CardDescription>
                                                    Parto: {parityData.farrowingDate && isValid(parseISO(parityData.farrowingDate)) ? format(parseISO(parityData.farrowingDate), 'dd/MM/yyyy') : 'N/A'}
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => openEditDialog(pig)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => openDeleteDialog(pig)} className="text-red-500 focus:text-red-500">Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Estado</span>
                                            <Badge variant="default">Lactante (P: {parityData.parity})</Badge>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span className="text-muted-foreground">Vivos</span>
                                            <span>{parityData.liveBorn}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-base">
                                            <span className="text-muted-foreground">Actuales</span>
                                            <span>{parityData.currentPiglets}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Mortinatos</span>
                                            <span>{parityData.stillborn}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Momias</span>
                                            <span>{parityData.mummified}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}) : (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                    <Baby className="w-12 h-12 mb-4" />
                                    <p className="font-semibold">No hay cerdas en lactancia.</p>
                                    <p className="text-sm">Cuando registre un parto, la cerda aparecerá aquí.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Animal</DialogTitle>
                            <DialogDescription>
                                Actualiza la información del animal.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAnimalFormSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="id" className="sm:text-right">ID</Label>
                                <Input id="id" name="id" className="col-span-3" required defaultValue={editingPig?.id} disabled />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="breed" className="sm:text-right">Raza</Label>
                                <Select name="breed" required defaultValue={editingPig?.breed}>
                                    <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seleccionar raza/línea" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {pigBreeds.map(breed => <SelectItem key={breed} value={breed}>{breed}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="gender" className="sm:text-right">Género</Label>
                                <RadioGroup name="gender" required defaultValue={editingPig?.gender || "Hembra"} className="col-span-3 flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Hembra" id="female" />
                                        <Label htmlFor="female">Hembra</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Macho" id="male" />
                                        <Label htmlFor="male">Macho</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="birthDate" className="sm:text-right">F. Nacimiento</Label>
                                <Input id="birthDate" name="birthDate" type="date" className="col-span-3" required defaultValue={editingPig?.birthDate} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="arrivalDate" className="sm:text-right">F. Llegada</Label>
                                <Input id="arrivalDate" name="arrivalDate" type="date" className="col-span-3" required defaultValue={editingPig?.arrivalDate} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="weight" className="sm:text-right">Peso (kg)</Label>
                                <Input id="weight" name="weight" type="number" className="col-span-3" required defaultValue={editingPig?.weight} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="purchaseValue" className="sm:text-right">Valor Compra ($)</Label>
                                <Input id="purchaseValue" name="purchaseValue" type="number" placeholder="Opcional" className="col-span-3" defaultValue={editingPig?.purchaseValue} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={closeFormDialog}>Cancelar</Button>
                                <Button type="submit">Guardar Cambios</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente los datos del animal de nuestros servidores.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
