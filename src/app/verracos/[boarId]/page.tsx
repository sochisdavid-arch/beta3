
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Droplet, MoreHorizontal, Syringe, XCircle, HeartPulse } from 'lucide-react';
import { format, parseISO, isValid, differenceInWeeks } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type BoarEventType = 'Ingreso' | 'Eyaculado' | 'Monta Natural' | 'Tratamiento' | 'Vacunación' | 'Venta' | 'Muerte';

interface BoarEvent {
    id: string;
    type: BoarEventType;
    date: string;
    details?: string;
    // Eyaculación specific
    doses?: number;
    dilutedVolume?: number;
    concentration?: number;
    motility?: number;
    // Monta Natural specific
    sowId?: string;
    mounts?: number;
    // Tratamiento/Vacunación specific
    product?: string;
    dose?: number;
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

const BOAR_STORAGE_KEY = 'boarCollection';

const eventIcons: { [key in BoarEventType]: React.ReactElement } = {
    "Ingreso": <PlusCircle className="h-5 w-5 text-green-500" />,
    "Eyaculado": <Droplet className="h-5 w-5 text-blue-500" />,
    "Monta Natural": <HeartPulse className="h-5 w-5 text-pink-500" />,
    "Tratamiento": <Syringe className="h-5 w-5 text-red-500" />,
    "Vacunación": <Syringe className="h-5 w-5 text-green-500" />,
    "Venta": <XCircle className="h-5 w-5" />,
    "Muerte": <XCircle className="h-5 w-5 text-destructive" />,
};

const allEventTypes: BoarEventType[] = ["Eyaculado", "Monta Natural", "Tratamiento", "Vacunación", "Venta", "Muerte"];

export default function BoarHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const boarId = params.boarId as string;
    
    const [boar, setBoar] = React.useState<Boar | null>(null);
    const [isEventFormOpen, setIsEventFormOpen] = React.useState(false);
    const [selectedEventType, setSelectedEventType] = React.useState<BoarEventType | null>(null);

    const loadData = React.useCallback(() => {
        const storedBoars = localStorage.getItem(BOAR_STORAGE_KEY);
        const boars: Boar[] = storedBoars ? JSON.parse(storedBoars) : [];
        const foundBoar = boars.find((b: Boar) => b.id === boarId);
        if (foundBoar) {
            setBoar(foundBoar);
        }
    }, [boarId]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const openEventDialog = (eventType: BoarEventType) => {
        setSelectedEventType(eventType);
        setIsEventFormOpen(true);
    };

    const handleEventSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!boar || !selectedEventType) return;

        const formData = new FormData(e.target as HTMLFormElement);
        
        const newEvent: BoarEvent = {
            id: `evt-${new Date().getTime()}`,
            type: selectedEventType,
            date: formData.get('eventDate') as string,
            details: formData.get('details') as string || undefined,
            doses: Number(formData.get('doses')) || undefined,
            dilutedVolume: Number(formData.get('dilutedVolume')) || undefined,
            concentration: Number(formData.get('concentration')) || undefined,
            motility: Number(formData.get('motility')) || undefined,
            sowId: formData.get('sowId') as string || undefined,
            mounts: Number(formData.get('mounts')) || undefined,
            product: formData.get('product') as string || undefined,
            dose: Number(formData.get('dose')) || undefined,
        };
        
        // Custom details based on type
        if(selectedEventType === 'Monta Natural' && newEvent.sowId) {
            newEvent.details = `Monta a cerda: ${newEvent.sowId}`;
        }
        if(['Tratamiento', 'Vacunación'].includes(selectedEventType) && newEvent.product) {
             newEvent.details = `${newEvent.product} - Dosis: ${newEvent.dose}ml. Motivo: ${formData.get('details')}`;
        }

        const updatedBoar = { ...boar, events: [newEvent, ...boar.events] };
        
        if (['Venta', 'Muerte'].includes(selectedEventType)) {
            updatedBoar.status = selectedEventType === 'Venta' ? 'Vendido' : 'Inactivo';
        }
        
        setBoar(updatedBoar);

        const allBoars: Boar[] = JSON.parse(localStorage.getItem(BOAR_STORAGE_KEY) || '[]');
        const updatedBoars = allBoars.map(b => b.id === boar.id ? updatedBoar : b);
        localStorage.setItem(BOAR_STORAGE_KEY, JSON.stringify(updatedBoars));

        toast({ title: "Evento Registrado", description: `Se ha añadido el evento "${selectedEventType}" al historial.` });
        setIsEventFormOpen(false);
    };
    
    if (!boar) {
        return <AppLayout><div className="flex justify-center items-center h-full"><p>Cargando datos del verraco...</p></div></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/verracos')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Hoja de Vida: {boar.id}</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Agregar Evento</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {allEventTypes.map(type => (
                                <DropdownMenuItem key={type} onSelect={() => openEventDialog(type)}>
                                    <div className="flex items-center gap-2">
                                        {eventIcons[type]}
                                        <span>{type}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <Label>Raza</Label>
                            <p className="font-semibold">{boar.breed}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Edad</Label>
                            <p className="font-semibold">{differenceInWeeks(new Date(), parseISO(boar.birthDate))} semanas</p>
                        </div>
                         <div className="space-y-1">
                            <Label>Peso Actual</Label>
                            <p className="font-semibold">{boar.weight} kg</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Estado</Label>
                            <p className="font-semibold">{boar.status}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Detalles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {boar.events.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell>{format(parseISO(event.date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {eventIcons[event.type]}
                                                <span>{event.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {event.type === 'Eyaculado'
                                             ? `Dosis: ${event.doses || 'N/A'}, Vol: ${event.dilutedVolume || 'N/A'}ml, Conc: ${event.concentration || 'N/A'}M, Mot: ${event.motility || 'N/A'}%`
                                             : event.type === 'Monta Natural'
                                             ? `Cerda: ${event.sowId}, Montas: ${event.mounts || 1}`
                                             : event.details || 'N/A'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Evento: {selectedEventType}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEventSubmit} id="event-form" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="eventDate">Fecha</Label>
                            <Input id="eventDate" name="eventDate" type="date" required />
                        </div>
                        {selectedEventType === 'Eyaculado' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="doses">Número de Dosis</Label>
                                    <Input id="doses" name="doses" type="number" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dilutedVolume">Vol. Diluido (ml)</Label>
                                        <Input id="dilutedVolume" name="dilutedVolume" type="number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="concentration">Conc. (Millones/ml)</Label>
                                        <Input id="concentration" name="concentration" type="number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="motility">Motilidad (%)</Label>
                                        <Input id="motility" name="motility" type="number" />
                                    </div>
                                </div>
                            </>
                        )}
                         {selectedEventType === 'Monta Natural' && (
                            <>
                             <div className="space-y-2">
                                <Label htmlFor="sowId">ID de la Cerda</Label>
                                <Input id="sowId" name="sowId" placeholder="Identificador de la hembra servida" required/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="mounts">Número de Montas</Label>
                                <Input id="mounts" name="mounts" type="number" defaultValue={1} required/>
                            </div>
                            </>
                        )}
                        {['Tratamiento', 'Vacunación'].includes(selectedEventType || '') && (
                            <>
                                 <div className="space-y-2">
                                    <Label htmlFor="product">Producto</Label>
                                    <Input id="product" name="product" placeholder="Nombre del producto" required/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="dose">Dosis (ml)</Label>
                                    <Input id="dose" name="dose" type="number" step="0.1" placeholder="Ej: 2.5" required/>
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="details">
                                {['Venta', 'Muerte'].includes(selectedEventType || '') ? 'Causa / Motivo' : 'Notas Adicionales'}
                            </Label>
                            <Textarea id="details" name="details" />
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsEventFormOpen(false)}>Cancelar</Button>
                        <Button type="submit" form="event-form">Guardar Evento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

    

    