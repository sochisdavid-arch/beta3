
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Syringe, Baby, HeartPulse, XCircle, Beaker, PlusCircle, ChevronDown, MoreHorizontal, Wheat } from 'lucide-react';
import { format, parseISO, differenceInWeeks, isValid, addDays } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockInventory } from '@/lib/mock-data';
import { deductFromStock, getInventory } from '@/lib/inventory';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


// Mock data - in a real app, this would come from an API
type GestationEventType = "Celo" | "Celo no Servido" | "Inseminación" | "Parto" | "Aborto" | "Tratamiento" | "Vacunación" | "Venta" | "Descarte" | "Muerte" | "Destete";
type StatusType = 'Gestante' | 'Vacia' | 'Destetada' | 'Remplazo' | 'Lactante';

interface Event {
    id: string; // Unique ID for each event
    type: GestationEventType | 'Ninguno';
    date: string;
    inseminationGroup?: string;
    details?: string;
    liveBorn?: number;
    stillborn?: number;
    mummified?: number;
    product?: string;
    dose?: number;
    boarId?: string;
}

interface Boar {
    id: string;
    events: any[];
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
        lastEvent: { id: 'evt1', type: 'Parto', date: '2024-07-08', liveBorn: 14, stillborn: 1, mummified: 0, details: '14 nacidos vivos, 1 mortinato.' }, 
        events: [
            { id: 'evt1', type: 'Parto', date: '2024-07-08', liveBorn: 14, stillborn: 1, mummified: 0, details: '14 nacidos vivos, 1 mortinato.' },
            { id: 'evt2', type: 'Inseminación', date: '2024-03-17', inseminationGroup: 'SEMANA-12', details: 'Inseminado por Operario A con semen de macho M-012.' },
            { id: 'evt3', type: 'Vacunación', date: '2024-03-01', details: 'Vacuna contra Parvovirus.' },
            { id: 'evt4', type: 'Tratamiento', date: '2024-02-15', details: 'Desparasitación interna.' }
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
        lastEvent: { id: 'evt5', type: 'Parto', date: '2024-07-10', liveBorn: 12, stillborn: 0, mummified: 0, details: '12 nacidos vivos.' }, 
        events: [
            { id: 'evt5', type: 'Parto', date: '2024-07-10', liveBorn: 12, stillborn: 0, mummified: 0, details: '12 nacidos vivos.' },
            { id: 'evt6', type: 'Inseminación', date: '2024-03-19', inseminationGroup: 'SEMANA-12', details: 'Inseminado por Operario B.' },
        ] 
    },
    { 
        id: 'PIG-003', 
        breed: 'Yorkshire', 
        birthDate: '2023-05-13', 
        arrivalDate: '2023-06-01', 
        weight: 180, 
        gender: 'Hembra', 
        purchaseValue: 160, 
        age: 0, 
        status: 'Gestante', 
        lastEvent: { id: 'evt7', type: 'Inseminación', date: '2024-05-20', inseminationGroup: 'SEMANA-21' }, 
        events: [
            { id: 'evt7', type: 'Inseminación', date: '2024-05-20', inseminationGroup: 'SEMANA-21', details: 'Inseminado por Operario A.' },
            { id: 'evt8', type: 'Celo no Servido', date: '2024-04-30', details: 'Baja condición corporal.' }
        ] 
    },
    { 
        id: 'PIG-004', 
        breed: 'Duroc', 
        birthDate: '2024-01-10', 
        arrivalDate: '2024-02-25', 
        weight: 120, 
        gender: 'Macho', 
        purchaseValue: 120, 
        age: 0, 
        status: 'Remplazo', 
        lastEvent: { id: 'evt9', type: 'Ninguno', date: '' }, 
        events: [] 
    },
    { 
        id: 'PIG-005', 
        breed: 'Pietrain', 
        birthDate: '2023-03-25', 
        arrivalDate: '2023-04-10', 
        weight: 185, 
        gender: 'Hembra', 
        purchaseValue: 165, 
        age: 0, 
        status: 'Destetada', 
        lastEvent: { id: 'evt10', type: 'Destete', date: '2024-06-25' }, 
        events: [
            { id: 'evt10', type: 'Destete', date: '2024-06-25', details: 'Destetados 11 lechones.' },
            { id: 'evt11', type: 'Parto', date: '2024-05-28', details: '11 nacidos vivos, 2 mortinatos.' }
        ] 
    },
];

const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const date = parseISO(birthDate);
    if (!isValid(date)) return 0;
    return differenceInWeeks(new Date(), date);
}

const calculateProbableFarrowingDate = (inseminationDate: string) => {
    if (inseminationDate) {
        const date = parseISO(inseminationDate);
        if (isValid(date)) {
            return format(addDays(date, 114), 'dd/MM/yyyy');
        }
    }
    return 'N/A';
};

const getStatusVariant = (status: StatusType) => {
    switch (status) {
      case 'Gestante': return 'default';
      case 'Lactante': return 'default';
      case 'Destetada': return 'secondary';
      case 'Vacia': return 'destructive';
      case 'Remplazo': return 'outline';
      default: return 'secondary';
    }
};

const eventIcons: { [key in GestationEventType]: React.ReactElement } = {
    "Inseminación": <HeartPulse className="h-5 w-5 text-pink-500" />,
    "Parto": <Baby className="h-5 w-5 text-blue-500" />,
    "Tratamiento": <Syringe className="h-5 w-5 text-red-500" />,
    "Vacunación": <Syringe className="h-5 w-5 text-green-500" />,
    "Aborto": <XCircle className="h-5 w-5 text-destructive" />,
    "Celo": <HeartPulse className="h-5 w-5 text-orange-500" />,
    "Celo no Servido": <HeartPulse className="h-5 w-5 text-muted-foreground" />,
    "Venta": <XCircle className="h-5 w-5" />,
    "Descarte": <XCircle className="h-5 w-5" />,
    "Muerte": <XCircle className="h-5 w-5" />,
    "Destete": <XCircle className="h-5 w-5 text-orange-500" />,
};

const allEventTypes: GestationEventType[] = ["Celo", "Celo no Servido", "Inseminación", "Parto", "Aborto", "Tratamiento", "Vacunación", "Venta", "Descarte", "Muerte"];

export default function PigHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const pigId = params.pigId as string;
    
    const [pig, setPig] = React.useState<Pig | null>(null);
    const [isEventFormOpen, setIsEventFormOpen] = React.useState(false);
    const [selectedEventType, setSelectedEventType] = React.useState<GestationEventType | null>(null);
    const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const loadData = React.useCallback(() => {
        const pigsFromStorage = localStorage.getItem('pigs');
        const pigs = pigsFromStorage ? JSON.parse(pigsFromStorage) : initialPigs;
        const foundPig = pigs.find((p: Pig) => p.id === pigId);
        if (foundPig) {
            setPig({...foundPig, age: calculateAge(foundPig.birthDate)});
        }
    }, [pigId]);


    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const openEventDialog = (eventType: GestationEventType) => {
        setSelectedEventType(eventType);
        setEditingEvent(null);
        setIsEventFormOpen(true);
    };
    
    const openEditEventDialog = (event: Event) => {
        setSelectedEventType(event.type as GestationEventType);
        setEditingEvent(event);
        setIsEventFormOpen(true);
    };

    const openDeleteEventDialog = (event: Event) => {
        setEventToDelete(event);
        setIsDeleteDialogOpen(true);
    };

    const EventForm = () => {
        if (!selectedEventType) return null;
    
        const [inseminationDate, setInseminationDate] = React.useState<string>(editingEvent?.date || '');
        const [boarList, setBoarList] = React.useState<Boar[]>([]);

        React.useEffect(() => {
            if (selectedEventType === 'Inseminación') {
                const storedBoars = localStorage.getItem('boarCollection');
                if (storedBoars) {
                    setBoarList(JSON.parse(storedBoars));
                }
            }
        }, []);
        
        const probableFarrowingDate = React.useMemo(() => {
            if (inseminationDate) {
                const date = parseISO(inseminationDate);
                if (isValid(date)) {
                    return format(addDays(date, 114), 'dd/MM/yyyy');
                }
            }
            return '---';
        }, [inseminationDate]);
    
        const [liveBorn, setLiveBorn] = React.useState<number | string>(editingEvent?.liveBorn || '');
        const [litterWeight, setLitterWeight] = React.useState<number | string>('');
        const averagePigletWeight = React.useMemo(() => {
            const numLiveBorn = Number(liveBorn);
            const numLitterWeight = Number(litterWeight);
            if (numLiveBorn > 0 && numLitterWeight > 0) {
                return (numLitterWeight / numLiveBorn).toFixed(2);
            }
            return '---';
        }, [liveBorn, litterWeight]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const eventDate = formData.get('eventDate') as string;
            
            const eventData: Event = {
                id: editingEvent ? editingEvent.id : `evt-${Date.now()}`,
                type: selectedEventType,
                date: eventDate,
                details: formData.get('eventNotes') as string || `${selectedEventType} registrado.`,
            };

            let updatedPig = { ...pig! };

            if (selectedEventType === 'Inseminación') {
                 const boarId = formData.get('boarId') as string;
                 eventData.boarId = boarId;
                 eventData.details = `Inseminada por Macho: ${boarId}. ${formData.get('eventNotes') || ''}`;

                 // Add event to boar's history
                 const allBoars = JSON.parse(localStorage.getItem('boarCollection') || '[]');
                 const boarIndex = allBoars.findIndex((b: Boar) => b.id === boarId);
                 if (boarIndex !== -1) {
                     allBoars[boarIndex].events.unshift({
                         id: `evt-monta-${Date.now()}`,
                         type: 'Monta Natural',
                         date: eventDate,
                         sowId: pig!.id,
                         details: `Servicio a cerda ${pig!.id}`,
                         mounts: 1
                     });
                     localStorage.setItem('boarCollection', JSON.stringify(allBoars));
                 }
            }

            if (selectedEventType === 'Parto') {
                const liveBornCount = Number(formData.get('liveBorn'));
                eventData.liveBorn = liveBornCount;
                eventData.stillborn = Number(formData.get('stillborn'));
                eventData.mummified = Number(formData.get('mummified'));
                eventData.details = `${liveBornCount} lechones vivos. Peso camada: ${formData.get('litterWeight')}kg.`;
            }

            if (['Tratamiento', 'Vacunación'].includes(selectedEventType)) {
                eventData.product = formData.get('product') as string;
                eventData.dose = Number(formData.get('dose'));

                if (!editingEvent && eventData.product && eventData.dose) {
                    const result = deductFromStock(eventData.product, eventData.dose);
                    if (result.success) {
                        toast({
                            title: "Stock Actualizado",
                            description: `Se descontaron ${eventData.dose.toFixed(2)}ml. Stock restante: ${result.newStock?.toFixed(2)}ml`,
                        });
                    } else {
                        toast({ variant: "destructive", title: "Error de Stock", description: result.message });
                        return;
                    }
                }
                eventData.details = `${formData.get('details')} - Dosis: ${eventData.dose}ml.`;
            }


            if (editingEvent) {
                updatedPig.events = updatedPig.events.map(ev => ev.id === editingEvent.id ? eventData : ev);
            } else {
                updatedPig.events.unshift(eventData); // Add to the beginning
            }
            
            // Sort events by date descending to ensure `lastEvent` is correct
            updatedPig.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            updatedPig.lastEvent = updatedPig.events[0] || { id: 'none', type: 'Ninguno', date: '' };


            if (selectedEventType === 'Parto') {
                updatedPig.status = 'Lactante';
            }
            
            const pigsFromStorage = localStorage.getItem('pigs');
            let pigs = pigsFromStorage ? JSON.parse(pigsFromStorage) : initialPigs;
            pigs = pigs.map((p: Pig) => p.id === updatedPig.id ? updatedPig : p);
            localStorage.setItem('pigs', JSON.stringify(pigs));

            setPig(updatedPig);
            
            toast({
                title: `¡Evento ${editingEvent ? 'Actualizado' : 'Registrado'}!`,
                description: `El evento "${selectedEventType}" ha sido ${editingEvent ? 'actualizado' : 'añadido'} al historial.`,
            });
            
            setIsEventFormOpen(false);
            setEditingEvent(null);

            if (selectedEventType === 'Parto' && !editingEvent) {
                toast({
                    title: "¡Estado Actualizado!",
                    description: `La cerda ${pig!.id} ha sido movida a Lactancia.`,
                });
                router.push(`/lactation/${pig!.id}`);
            }
        };
        
        return (
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{editingEvent ? 'Editar' : 'Registrar'} Evento: {selectedEventType}</DialogTitle>
                    <DialogDescription>
                        Complete la información para el evento.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                 <ScrollArea className="h-full pr-6">
                    <form onSubmit={handleSubmit} id="event-form" className="space-y-4 pt-2 pb-6">
                        <div className="space-y-2">
                            <Label htmlFor="eventDate">Fecha del Evento</Label>
                            <Input 
                                id="eventDate" 
                                name="eventDate"
                                type="date" 
                                required 
                                defaultValue={editingEvent?.date}
                                onChange={e => selectedEventType === 'Inseminación' && setInseminationDate(e.target.value)}
                            />
                        </div>

                        {selectedEventType === 'Celo' && (
                            <div className="space-y-2">
                                <Label htmlFor="observations">Observaciones</Label>
                                <Textarea id="observations" name="observations" placeholder="Ej: Signos de celo muy evidentes." defaultValue={editingEvent?.details}/>
                            </div>
                        )}
                        {selectedEventType === 'Celo no Servido' && (
                            <div className="space-y-2">
                                <Label htmlFor="reason">Motivo</Label>
                                <Input id="reason" name="reason" placeholder="Ej: Condición corporal baja" defaultValue={editingEvent?.details}/>
                            </div>
                        )}
                        {selectedEventType === 'Inseminación' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="boarId">Macho / Verraco</Label>
                                    <Select name="boarId" required defaultValue={editingEvent?.boarId}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar verraco"/></SelectTrigger>
                                        <SelectContent>
                                            {boarList.map(boar => (
                                                <SelectItem key={boar.id} value={boar.id}>{boar.id}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sowWeight">Peso de la Cerda (kg) - Opcional</Label>
                                    <Input id="sowWeight" name="sowWeight" type="number" step="0.1" placeholder="Ej. 180.5"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inseminationGroup">Grupo de Inseminación</Label>
                                    <Input id="inseminationGroup" name="inseminationGroup" placeholder="Ej. SEMANA-34" defaultValue={editingEvent?.inseminationGroup} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inseminator">Inseminador</Label>
                                    <Input id="inseminator" name="inseminator" placeholder="Nombre del operario" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Probable de Parto</Label>
                                    <div className="text-lg font-semibold p-2 border rounded-md bg-muted">
                                        {probableFarrowingDate}
                                    </div>
                                </div>
                            </>
                        )}
                        {selectedEventType === 'Parto' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="totalBorn">Total Nacidos</Label>
                                    <Input id="totalBorn" name="totalBorn" type="number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="liveBorn">Vivos</Label>
                                    <Input id="liveBorn" name="liveBorn" type="number" required value={liveBorn} onChange={e => setLiveBorn(e.target.value)} defaultValue={editingEvent?.liveBorn} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stillborn">Mortinatos</Label>
                                    <Input id="stillborn" name="stillborn" type="number" required defaultValue={editingEvent?.stillborn} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="mummified">Momias</Label>
                                    <Input id="mummified" name="mummified" type="number" required defaultValue={editingEvent?.mummified} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="lowViability">Baja Viabilidad</Label>
                                    <Input id="lowViability" name="lowViability" type="number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="litterWeight">Peso Camada (kg)</Label>
                                    <Input id="litterWeight" name="litterWeight" type="number" step="0.1" required value={litterWeight} onChange={e => setLitterWeight(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Peso Promedio (kg)</Label>
                                    <div className="text-lg font-semibold p-2 border rounded-md bg-muted h-10 flex items-center">
                                        {averagePigletWeight}
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="sowWeightParto">Peso Cerda (kg) - Opcional</Label>
                                    <Input id="sowWeightParto" name="sowWeightParto" type="number" step="0.1" placeholder="Ej. 220.5"/>
                                </div>
                            </div>
                        )}
                        {selectedEventType === 'Aborto' && (
                            <div className="space-y-2">
                                <Label htmlFor="abortionReason">Causa probable</Label>
                                <Input id="abortionReason" name="abortionReason" placeholder="Ej: Estrés por calor" defaultValue={editingEvent?.details} />
                            </div>
                        )}
                        {selectedEventType === 'Tratamiento' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="product">Producto</Label>
                                     <Select name="product" required>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar medicamento"/></SelectTrigger>
                                        <SelectContent>
                                            {getInventory().filter(p => p.category === 'medicamento').map(item => (
                                                <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.stock})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dose">Dosis (ml)</Label>
                                    <Input id="dose" name="dose" type="number" step="0.1" placeholder="Ej. 2.5" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="details">Motivo</Label>
                                    <Input id="details" name="details" placeholder="Ej: Tratamiento para cojera" required defaultValue={editingEvent?.details}/>
                                </div>
                            </>
                        )}
                        {selectedEventType === 'Vacunación' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="product">Vacuna / Producto</Label>
                                     <Select name="product" required>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar vacuna"/></SelectTrigger>
                                        <SelectContent>
                                            {getInventory().filter(p => p.category === 'vacuna').map(item => (
                                                <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.stock})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dose">Dosis (ml)</Label>
                                    <Input id="dose" name="dose" type="number" step="0.1" placeholder="Ej. 2.0" required />
                                </div>
                             </>
                        )}
                        {['Venta', 'Descarte', 'Muerte'].includes(selectedEventType) && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Causa / Motivo</Label>
                                    <Input id="reason" name="reason" placeholder={`Motivo de la ${selectedEventType.toLowerCase()}`} required defaultValue={editingEvent?.details}/>
                                </div>
                                {['Venta', 'Descarte', 'Muerte'].includes(selectedEventType) && (
                                <div className="space-y-2">
                                        <Label htmlFor="saleValue">Valor de la Venta ($)</Label>
                                        <Input id="saleValue" name="saleValue" type="number" step="0.01" placeholder="Opcional" />
                                    </div>
                                )}
                            </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="eventNotes">Notas Adicionales</Label>
                            <Textarea id="eventNotes" name="eventNotes" placeholder="Cualquier nota adicional relevante para este evento." defaultValue={editingEvent?.details}/>
                        </div>
                    </form>
                    </ScrollArea>
                </div>
                <DialogFooter className="flex-shrink-0 pt-4 border-t -mx-6 px-6 bg-background">
                    <Button type="button" variant="ghost" onClick={() => setIsEventFormOpen(false)}>Cancelar</Button>
                    <Button type="submit" form="event-form">Guardar Evento</Button>
                </DialogFooter>
            </DialogContent>
        )
      }

    const handleDeleteEvent = () => {
        if (!eventToDelete || !pig) return;
        
        let updatedPig = { ...pig };
        updatedPig.events = updatedPig.events.filter(ev => ev.id !== eventToDelete.id);
        updatedPig.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        updatedPig.lastEvent = updatedPig.events[0] || { id: 'none', type: 'Ninguno', date: '' };
        
        // Add logic to potentially update pig status if the deleted event was critical
        
        const pigsFromStorage = localStorage.getItem('pigs');
        let pigs = pigsFromStorage ? JSON.parse(pigsFromStorage) : initialPigs;
        pigs = pigs.map((p: Pig) => p.id === updatedPig.id ? updatedPig : p);
        localStorage.setItem('pigs', JSON.stringify(pigs));

        setPig(updatedPig);
        toast({
            title: "Evento Eliminado",
            description: `El evento "${eventToDelete.type}" ha sido eliminado del historial.`,
        });

        setIsDeleteDialogOpen(false);
        setEventToDelete(null);
    };

    if (!pig) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <p>Cargando datos del animal...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/gestation')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Hoja de Vida: {pig.id}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Agregar Evento
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {allEventTypes.map(eventType => (
                                    <DropdownMenuItem key={eventType} onSelect={() => openEventDialog(eventType)}>
                                        {eventType}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <Label>Raza</Label>
                            <p className="font-semibold">{pig.breed}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Edad</Label>
                            <p className="font-semibold">{pig.age} semanas</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Estado Actual</Label>
                            <div><Badge variant={getStatusVariant(pig.status)}>{pig.status}</Badge></div>
                        </div>
                         <div className="space-y-1">
                            <Label>F. Parto Probable</Label>
                            <div className="font-semibold">
                                {pig.status === 'Gestante' && pig.lastEvent.type === 'Inseminación' 
                                  ? calculateProbableFarrowingDate(pig.lastEvent.date)
                                  : 'N/A'
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Eventos</CardTitle>
                        <CardDescription>Eventos registrados para esta hembra, del más reciente al más antiguo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative pl-6">
                            <div className="absolute left-[34px] top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                            
                            <div className="space-y-8">
                                {pig.events.map((event, index) => (
                                    <div key={`${event.id}-${index}`} className="flex gap-4 items-start relative">
                                        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card border shrink-0">
                                            {eventIcons[event.type as GestationEventType] || <Beaker className="h-5 w-5 text-muted-foreground" />}
                                        </div>
                                        <div className="flex-grow pt-2">
                                            <p className="font-semibold">{event.type}</p>
                                            <p className="text-sm text-muted-foreground">{isValid(parseISO(event.date)) ? format(parseISO(event.date), 'dd/MM/yyyy') : 'N/A'}</p>
                                            {event.details && <p className="text-sm mt-1">{event.details}</p>}
                                            {event.inseminationGroup && <Badge variant="outline" className="mt-1">Grupo: {event.inseminationGroup}</Badge>}
                                        </div>
                                        <div className="absolute top-2 right-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => openEditEventDialog(event)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => openDeleteEventDialog(event)} className="text-destructive">Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                                {pig.events.length === 0 && (
                                    <p className="text-muted-foreground text-center py-4">No hay eventos registrados para este animal.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isEventFormOpen} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setEditingEvent(null);
                }
                setIsEventFormOpen(isOpen);
            }}>
                <EventForm />
            </Dialog>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El evento será eliminado permanentemente del historial del animal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEvent}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
    

