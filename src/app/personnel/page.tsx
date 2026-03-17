
"use client";

import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { PlusCircle, User, MoreHorizontal, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Personnel {
    id: string; // cedula
    name: string;
    role: string;
    phone: string;
    email: string;
    hireDate: string;
    status: 'Activo' | 'Inactivo';
    salary?: number;
    bonus?: number;
}

const PERSONNEL_STORAGE_KEY = 'personnelList';

export default function PersonnelPage() {
    const { toast } = useToast();
    const [personnelList, setPersonnelList] = React.useState<Personnel[]>([]);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingPersonnel, setEditingPersonnel] = React.useState<Personnel | null>(null);

    const loadPersonnel = React.useCallback(() => {
        const storedPersonnel = localStorage.getItem(PERSONNEL_STORAGE_KEY);
        if (storedPersonnel) {
            setPersonnelList(JSON.parse(storedPersonnel));
        }
    }, []);

    React.useEffect(() => {
        loadPersonnel();
    }, [loadPersonnel]);
    
    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const id = formData.get('id') as string;

        const newPersonnel: Personnel = {
            id,
            name: formData.get('name') as string,
            role: formData.get('role') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
            hireDate: formData.get('hireDate') as string,
            status: editingPersonnel ? editingPersonnel.status : 'Activo', // Keep status on edit, default on new
            salary: Number(formData.get('salary')) || undefined,
            bonus: Number(formData.get('bonus')) || undefined,
        };

        const currentList = JSON.parse(localStorage.getItem(PERSONNEL_STORAGE_KEY) || '[]');
        
        if (editingPersonnel) {
            // Update existing personnel
            const updatedList = currentList.map((p: Personnel) => p.id === editingPersonnel.id ? newPersonnel : p);
            localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(updatedList));
            toast({
                title: 'Personal Actualizado',
                description: `Los datos de ${newPersonnel.name} han sido actualizados.`,
            });
        } else {
            // Add new personnel, check for duplicates
            if (currentList.some((p: Personnel) => p.id === id)) {
                toast({
                    variant: 'destructive',
                    title: 'Error: Empleado duplicado',
                    description: `Ya existe un empleado con la cédula ${id}.`
                });
                return;
            }
            const updatedList = [...currentList, newPersonnel];
            localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(updatedList));
            toast({
                title: '¡Personal Agregado!',
                description: `${newPersonnel.name} ha sido añadido al equipo.`,
            });
        }
        
        setIsFormOpen(false);
        setEditingPersonnel(null);
        loadPersonnel();
    };

    const openEditDialog = (person: Personnel) => {
        setEditingPersonnel(person);
        setIsFormOpen(true);
    };

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return 'N/A';
        return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                     <Button onClick={() => { setEditingPersonnel(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Personal
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Equipo de la Granja</CardTitle>
                        <CardDescription>
                            Listado de todo el personal activo e inactivo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead>Sueldo</TableHead>
                                        <TableHead>Bonificaciones</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {personnelList.length > 0 ? personnelList.map(person => (
                                        <TableRow key={person.id}>
                                            <TableCell className="font-medium">
                                                <div>{person.name}</div>
                                                <div className="text-xs text-muted-foreground">{person.id}</div>
                                            </TableCell>
                                            <TableCell>{person.role}</TableCell>
                                            <TableCell>{formatCurrency(person.salary)}</TableCell>
                                            <TableCell>{formatCurrency(person.bonus)}</TableCell>
                                            <TableCell>
                                                <Badge variant={person.status === 'Activo' ? 'default' : 'secondary'}>
                                                    {person.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => openEditDialog(person)}>Editar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No hay personal registrado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingPersonnel ? 'Editar' : 'Agregar Nuevo'} Personal</DialogTitle>
                            <DialogDescription>
                                Complete los datos del empleado para registrarlo en el sistema.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 overflow-y-auto -mx-6 px-6">
                            <form onSubmit={handleFormSubmit} id="personnel-form" className="space-y-6 py-4 pr-6">
                                
                                <div>
                                    <h3 className="text-base font-semibold text-foreground mb-2">Información Personal</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre Completo</Label>
                                            <Input id="name" name="name" type="text" placeholder="Nombre y Apellido" required defaultValue={editingPersonnel?.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="id">Cédula / Documento</Label>
                                            <Input id="id" name="id" type="text" placeholder="Número de documento" required defaultValue={editingPersonnel?.id} disabled={!!editingPersonnel} />
                                        </div>
                                    </div>
                                </div>
                                
                                <Separator />

                                <div>
                                    <h3 className="text-base font-semibold text-foreground mb-2">Detalles del Contrato</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="role">Cargo</Label>
                                            <Input id="role" name="role" type="text" placeholder="Ej: Operario, Veterinario" required defaultValue={editingPersonnel?.role}/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="hireDate">Fecha de Contratación</Label>
                                            <Input id="hireDate" name="hireDate" type="date" required defaultValue={editingPersonnel?.hireDate} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="salary">Sueldo Base ($)</Label>
                                            <Input id="salary" name="salary" type="number" step="1000" placeholder="Ej: 1500000" defaultValue={editingPersonnel?.salary} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bonus">Bonificaciones ($)</Label>
                                            <Input id="bonus" name="bonus" type="number" step="1000" placeholder="Opcional" defaultValue={editingPersonnel?.bonus} />
                                        </div>
                                    </div>
                                </div>

                                <Separator />
                                
                                <div>
                                    <h3 className="text-base font-semibold text-foreground mb-2">Datos de Contacto</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Teléfono</Label>
                                            <Input id="phone" name="phone" type="tel" required defaultValue={editingPersonnel?.phone} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Correo Electrónico</Label>
                                            <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" required defaultValue={editingPersonnel?.email}/>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </ScrollArea>
                        <DialogFooter className="flex-shrink-0 pt-4 border-t -mx-6 px-6 bg-background">
                            <Button type="button" variant="ghost" onClick={() => { setIsFormOpen(false); setEditingPersonnel(null); }}>Cancelar</Button>
                            <Button type="submit" form="personnel-form">{editingPersonnel ? 'Guardar Cambios' : 'Guardar Empleado'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
