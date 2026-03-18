
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, differenceInWeeks } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { loadBoars, saveBoars } from '@/lib/boarsStore';


interface BoarEvent {
    id: string;
    type: 'Ingreso' | 'Eyaculado' | 'Tratamiento' | 'Vacunación' | 'Venta' | 'Muerte';
    date: string;
    details?: string;
    // Add other event-specific fields if necessary
}

interface Boar {
    id: string;
    breed: string;
    birthDate: string;
    arrivalDate: string;
    status: 'Activo' | 'Inactivo' | 'Vendido';
    weight: number;
    purchaseValue?: number;
    events: BoarEvent[];
}

const pigBreeds = [
  "Duroc", "Yorkshire", "Landrace", "Hampshire", "Pietrain", "Berkshire", "Chester White", "Spotted", "Poland China", "Tamworth", "Large Black", "Cerdo Ibérico",
  "PIC", "Topigs Norsvin", "Hypor (Hendrix Genetics)", "DanBred", "Genus", "Choice Genetics", "Genesus",
  "Otro"
];

const calculateAgeInWeeks = (birthDate: string) => {
    if (!birthDate || !isValid(parseISO(birthDate))) return 0;
    return differenceInWeeks(new Date(), parseISO(birthDate));
};

export default function VerracosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const [boars, setBoars] = React.useState<Boar[]>([]);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingBoar, setEditingBoar] = React.useState<Boar | null>(null);

    const reloadBoars = React.useCallback(async () => {
        if (!user) return;
        const items = await loadBoars<Boar>(user.uid);
        setBoars(items);
    }, [user]);

    React.useEffect(() => {
        reloadBoars().catch((e) => console.error('Boars load failed', e));
    }, [reloadBoars]);

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const id = formData.get('id') as string;

        const boarData: Omit<Boar, 'events' | 'status'> = {
            id,
            breed: formData.get('breed') as string,
            birthDate: formData.get('birthDate') as string,
            arrivalDate: formData.get('arrivalDate') as string,
            weight: Number(formData.get('weight')),
            purchaseValue: Number(formData.get('purchaseValue')) || undefined,
        };

        let updatedBoars: Boar[];
        if (editingBoar) {
            updatedBoars = boars.map(b => b.id === editingBoar.id ? { ...editingBoar, ...boarData } : b);
            toast({ title: 'Verraco Actualizado', description: `Los datos de ${boarData.id} han sido actualizados.` });
        } else {
            if (boars.some(b => b.id === id)) {
                toast({ variant: 'destructive', title: 'Error', description: `El verraco con ID ${id} ya existe.` });
                return;
            }
            const newBoar: Boar = {
                ...boarData,
                status: 'Activo',
                events: [{ id: `evt-${Date.now()}`, type: 'Ingreso', date: boarData.arrivalDate, details: 'Ingreso inicial a la granja' }]
            };
            updatedBoars = [...boars, newBoar];
            toast({ title: 'Verraco Agregado', description: `${newBoar.id} ha sido registrado.` });
        }

        if (user) {
            saveBoars<Boar>(user.uid, updatedBoars).then(() => setBoars(updatedBoars));
        } else {
            setBoars(updatedBoars);
        }
        setIsFormOpen(false);
        setEditingBoar(null);
    };

    const handleRowClick = (boarId: string) => {
        router.push(`/verracos/${boarId}`);
    };
    
    const activeBoarsCount = boars.filter(b => b.status === 'Activo').length;

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Verracos</h1>
                    <Button onClick={() => { setEditingBoar(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Verraco
                    </Button>
                </div>
                
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Verracos Activos</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeBoarsCount}</div>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Machos Reproductores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Verraco</TableHead>
                                    <TableHead>Raza</TableHead>
                                    <TableHead>Fecha Ingreso</TableHead>
                                    <TableHead>Edad (Semanas)</TableHead>
                                    <TableHead>Peso (kg)</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {boars.length > 0 ? boars.map(boar => (
                                    <TableRow key={boar.id} onClick={() => handleRowClick(boar.id)} className="cursor-pointer">
                                        <TableCell className="font-medium">{boar.id}</TableCell>
                                        <TableCell>{boar.breed}</TableCell>
                                        <TableCell>{format(parseISO(boar.arrivalDate), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{calculateAgeInWeeks(boar.birthDate)}</TableCell>
                                        <TableCell>{boar.weight}</TableCell>
                                        <TableCell>
                                            <Badge variant={boar.status === 'Activo' ? 'default' : 'secondary'}>{boar.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No hay verracos registrados.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBoar ? 'Editar' : 'Agregar'} Verraco</DialogTitle>
                            <DialogDescription>Complete los datos para registrar un nuevo macho reproductor.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleFormSubmit} id="boar-form" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="id">ID del Verraco</Label>
                                <Input id="id" name="id" required defaultValue={editingBoar?.id} disabled={!!editingBoar} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="breed">Raza</Label>
                                <Select name="breed" required defaultValue={editingBoar?.breed}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar raza/línea" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {pigBreeds.map(breed => <SelectItem key={breed} value={breed}>{breed}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                                <Input id="birthDate" name="birthDate" type="date" required defaultValue={editingBoar?.birthDate} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="arrivalDate">Fecha de Ingreso</Label>
                                <Input id="arrivalDate" name="arrivalDate" type="date" required defaultValue={editingBoar?.arrivalDate} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="weight">Peso (kg)</Label>
                                <Input id="weight" name="weight" type="number" step="0.1" required defaultValue={editingBoar?.weight} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purchaseValue">Valor de Compra ($)</Label>
                                <Input id="purchaseValue" name="purchaseValue" type="number" step="0.01" placeholder="Opcional" defaultValue={editingBoar?.purchaseValue} />
                            </div>
                        </form>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" form="boar-form">{editingBoar ? 'Guardar Cambios' : 'Agregar Verraco'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
