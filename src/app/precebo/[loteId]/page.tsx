"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Syringe, Move, Banknote, PackagePlus, ShieldPlus, Skull, MoreHorizontal, Info, Calendar, Weight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO, isValid, addDays, getDay, differenceInDays, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PreceboReportData } from '@/components/PreceboReport';
import { deductFromStock, getInventory } from '@/lib/inventory';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface NurseryBatch {
    id: string;
    creationDate: string;
    pigletCount: number;
    initialPigletCount: number;
    totalWeight: number;
    avgWeight: number;
    avgAge: number;
    sows: string[];
    status: 'Activo' | 'Finalizado';
    module?: string;
    events: BatchEvent[];
}

interface ConsumptionRecord {
    id: string;
    weekNumber: number;
    startDate: string;
    endDate: string;
    feedType: string;
    consumption: (number | string)[];
    totalWeek: number;
    totalAccumulated: number;
    accumulatedPerPig: number;
    consumptionPerPigPerDay: number;
}

type PreceboEventType = "Muerte en lote" | "Traslado de lote" | "Venta de lote" | "Ingreso a lote" | "Tratamiento" | "Vacunación";

interface BatchEvent {
    id: string;
    type: PreceboEventType;
    date: string;
    details?: string;
    animalCount?: number;
    totalWeight?: number;
    avgWeight?: number;
    cause?: string;
    product?: string;
    dose?: number;
    destination?: string;
    saleValue?: number;
}

const eventIcons: { [key in PreceboEventType]: React.ReactElement } = {
    "Muerte en lote": <Skull className="h-5 w-5 text-destructive" />,
    "Traslado de lote": <Move className="h-5 w-5 text-blue-500" />,
    "Venta de lote": <Banknote className="h-5 w-5 text-green-500" />,
    "Ingreso a lote": <PackagePlus className="h-5 w-5 text-purple-500" />,
    "Tratamiento": <Syringe className="h-5 w-5 text-red-500" />,
    "Vacunación": <ShieldPlus className="h-5 w-5 text-green-500" />,
};

const allEventTypes: PreceboEventType[] = ["Muerte en lote", "Traslado de lote", "Venta de lote", "Ingreso a lote", "Tratamiento", "Vacunación"];

export default function LotePreceboPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const loteId = params.loteId as string;
    
    const [batch, setBatch] = React.useState<NurseryBatch | null>(null);
    const [consumptionHistory, setConsumptionHistory] = React.useState<ConsumptionRecord[]>([]);
    
    const [isEventFormOpen, setIsEventFormOpen] = React.useState(false);
    const [selectedEventType, setSelectedEventType] = React.useState<PreceboEventType | null>(null);
    const [editingEvent, setEditingEvent] = React.useState<BatchEvent | null>(null);
    const [eventToDelete, setEventToDelete] = React.useState<BatchEvent | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const getConsumptionStorageKey = React.useCallback(() => `consumptionHistory_precebo_${loteId}`, [loteId]);
    
    const loadData = React.useCallback(() => {
        const storedBatches = localStorage.getItem('nurseryBatches');
        if (storedBatches) {
            const batchData = JSON.parse(storedBatches);
            const foundBatch = batchData[loteId];
            if (foundBatch) {
                const processedBatch: NurseryBatch = {
                    ...foundBatch,
                    pigletCount: Number(foundBatch.pigletCount),
                    initialPigletCount: Number(foundBatch.initialPigletCount || foundBatch.pigletCount),
                    totalWeight: Number(foundBatch.totalWeight),
                    avgWeight: Number(foundBatch.avgWeight),
                    avgAge: Number(foundBatch.avgAge),
                    events: foundBatch.events || [],
                };
                setBatch(processedBatch);

                const storageKey = getConsumptionStorageKey();
                const storedConsumption = localStorage.getItem(storageKey);
                let history: ConsumptionRecord[] = storedConsumption ? JSON.parse(storedConsumption) : [];
                
                if (history.length < 8 && foundBatch.creationDate) {
                    const additionalWeeks = Array.from({ length: 8 - history.length }).map((_, weekIndex) => {
                        const currentWeekIndex = history.length + weekIndex;
                        const weekStartDate = addDays(parseISO(foundBatch.creationDate), currentWeekIndex * 7);
                        const weekEndDate = addDays(weekStartDate, 6);
                        return {
                            id: `week-${currentWeekIndex + 1}`,
                            weekNumber: currentWeekIndex + 1,
                            startDate: weekStartDate.toISOString(),
                            endDate: weekEndDate.toISOString(),
                            feedType: '',
                            consumption: Array(7).fill(''),
                            totalWeek: 0,
                            totalAccumulated: 0,
                            accumulatedPerPig: 0,
                            consumptionPerPigPerDay: 0,
                        };
                    });
                    history = [...history, ...additionalWeeks];
                }
                calculateConsumption(history, processedBatch);
            }
        }
    }, [loteId, getConsumptionStorageKey]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const calculateConsumption = (history: ConsumptionRecord[], currentBatch: NurseryBatch) => {
        let accumulatedFeed = 0;
        const deathsCount = currentBatch.events
            .filter(e => e.type === 'Muerte en lote')
            .reduce((sum, e) => sum + (e.animalCount || 0), 0);
        
        const currentAnimalCount = currentBatch.initialPigletCount - deathsCount;

        const calculatedHistory = history.map(week => {
            const weeklyConsumption = week.consumption.reduce((sum: number, val) => sum + Number(val || 0), 0);
            accumulatedFeed += weeklyConsumption;
            const accumulatedPerPig = currentAnimalCount > 0 ? accumulatedFeed / currentAnimalCount : 0;
            const consumptionPerPigPerDay = currentAnimalCount > 0 ? (weeklyConsumption / currentAnimalCount / 7) * 1000 : 0;

            return {
                ...week,
                totalWeek: weeklyConsumption,
                totalAccumulated: accumulatedFeed,
                accumulatedPerPig,
                consumptionPerPigPerDay,
            };
        });

        setConsumptionHistory(calculatedHistory);
        localStorage.setItem(getConsumptionStorageKey(), JSON.stringify(calculatedHistory));
    };

    const handleConsumptionChange = (weekId: string, dayIndex: number, value: string) => {
        if (!batch) return;
        const updatedHistory = consumptionHistory.map(week => {
            if (week.id === weekId) {
                const oldVal = Number(week.consumption[dayIndex] || 0);
                const newVal = Number(value || 0);
                const diff = newVal - oldVal;

                if (week.feedType && diff !== 0) {
                    deductFromStock(week.feedType, diff, `Lote Precebo ${loteId}`, addDays(parseISO(week.startDate), dayIndex).toISOString());
                }

                const newC = [...week.consumption];
                newC[dayIndex] = value;
                return { ...week, consumption: newC };
            }
            return week;
        });
        calculateConsumption(updatedHistory, batch);
    };

    const handleFeedTypeChange = (weekId: string, feedType: string) => {
        if (!batch) return;
        const updated = consumptionHistory.map(w => w.id === weekId ? { ...w, feedType } : w);
        calculateConsumption(updated, batch);
    };

    const generateLiquidationReport = (finalBatch: NurseryBatch, finalEvent: BatchEvent) => {
        const totalDeaths = finalBatch.events.filter(e => e.type === 'Muerte en lote').reduce((sum, e) => sum + (e.animalCount || 0), 0);
        const finalCount = finalEvent.animalCount || finalBatch.pigletCount;
        const daysInPrecebo = differenceInDays(parseISO(finalEvent.date), parseISO(finalBatch.creationDate));
        const totalFeed = consumptionHistory.reduce((sum, w) => sum + w.totalWeek, 0);
        const finalAvgW = finalEvent.avgWeight || 0;
        const finalTotalW = finalAvgW * finalCount;
        const totalGain = finalTotalW - finalBatch.totalWeight;
        
        const report: PreceboReportData = {
            batchId: finalBatch.id,
            generationDate: new Date().toISOString(),
            liquidationReason: finalEvent.type,
            startDate: finalBatch.creationDate,
            endDate: finalEvent.date,
            initialCount: finalBatch.initialPigletCount,
            finalCount: finalCount,
            initialAge: finalBatch.avgAge,
            finalAge: finalBatch.avgAge + daysInPrecebo,
            daysInPrecebo: daysInPrecebo,
            weeksOfLife: Math.floor((finalBatch.avgAge + daysInPrecebo) / 7),
            totalDeaths: totalDeaths,
            mortalityRate: (totalDeaths / finalBatch.initialPigletCount) * 100,
            avgMortalityAge: 0,
            initialTotalWeight: finalBatch.totalWeight,
            finalTotalWeight: finalTotalW,
            initialAvgWeight: finalBatch.avgWeight,
            finalAvgWeight: finalAvgW,
            totalWeightGain: totalGain,
            animalWeightGain: finalCount > 0 ? totalGain / finalCount : 0,
            dailyWeightGain: finalCount > 0 && daysInPrecebo > 0 ? (totalGain / finalCount) / daysInPrecebo * 1000 : 0,
            totalFeedConsumed: totalFeed,
            dailyAnimalConsumption: finalCount > 0 && daysInPrecebo > 0 ? (totalFeed / finalCount) / daysInPrecebo : 0,
            feedConversion: totalGain > 0 ? totalFeed / totalGain : 0,
            saleValue: finalEvent.saleValue,
            healthRecords: finalBatch.events.filter(e => e.type === 'Tratamiento' || e.type === 'Vacunación').map(e => ({
                date: e.date, type: e.type, product: e.product || '', details: e.details || ''
            })),
        };
        const existing = JSON.parse(localStorage.getItem('liquidatedPreceboReports') || '[]');
        existing.push(report);
        localStorage.setItem('liquidatedPreceboReports', JSON.stringify(existing));
    };

    const createCebaBatch = (preceboBatch: NurseryBatch, transferEvent: BatchEvent) => {
        const cebaBatches = JSON.parse(localStorage.getItem('cebaBatches') || '{}');
        const newCebaId = preceboBatch.id.replace('PRECEBO', 'CEBA');
        const daysInPrecebo = differenceInDays(parseISO(transferEvent.date), parseISO(preceboBatch.creationDate));
        cebaBatches[newCebaId] = {
            id: newCebaId,
            creationDate: transferEvent.date,
            pigletCount: transferEvent.animalCount,
            initialPigletCount: transferEvent.animalCount,
            avgWeight: transferEvent.avgWeight,
            totalWeight: (transferEvent.animalCount || 0) * (transferEvent.avgWeight || 0),
            avgAge: preceboBatch.avgAge + daysInPrecebo,
            sows: preceboBatch.sows,
            status: 'Activo',
            events: [],
            originBatchId: preceboBatch.id
        };
        localStorage.setItem('cebaBatches', JSON.stringify(cebaBatches));
    };

    const handleDeleteEvent = () => {
        if (!eventToDelete || !batch) return;
        const updated = { ...batch, events: batch.events.filter(ev => ev.id !== eventToDelete.id) };
        setBatch(updated);
        const stored = JSON.parse(localStorage.getItem('nurseryBatches') || '{}');
        stored[loteId] = updated;
        localStorage.setItem('nurseryBatches', JSON.stringify(stored));
        calculateConsumption(consumptionHistory, updated);
        setIsDeleteDialogOpen(false);
        setEventToDelete(null);
    };

    const EventFormContent = () => {
        if (!selectedEventType || !batch) return null;
        const [aCount, setACount] = React.useState<number | string>(editingEvent?.animalCount || '');
        const [tWeight, setTWeight] = React.useState<number | string>(editingEvent?.totalWeight || '');
        const [avgW, setAvgW] = React.useState<number | string>(editingEvent?.avgWeight || '0.00');

        React.useEffect(() => {
            const nC = Number(aCount);
            const nT = Number(tWeight);
            setAvgW(nC > 0 && nT > 0 ? (nT / nC).toFixed(2) : '0.00');
        }, [aCount, tWeight]);

        const onEventSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const fD = new FormData(e.target as HTMLFormElement);
            const newEv: BatchEvent = {
                id: editingEvent ? editingEvent.id : `evt-${Date.now()}`,
                type: selectedEventType,
                date: fD.get('eventDate') as string,
                details: fD.get('eventNotes') as string || undefined,
                animalCount: Number(fD.get('animalCount')) || undefined,
                totalWeight: Number(fD.get('totalWeight')) || undefined,
                avgWeight: Number(avgW) || undefined,
                cause: fD.get('cause') as string || undefined,
                product: fD.get('product') as string || undefined,
                dose: Number(fD.get('dose')) || undefined,
                destination: fD.get('destination') as string || undefined,
                saleValue: Number(fD.get('saleValue')) || undefined,
            };
            
            let updatedB = { ...batch };
            if (editingEvent) {
                updatedB.events = updatedB.events.map(ev => ev.id === editingEvent.id ? newEv : ev);
            } else {
                updatedB.events = [...updatedB.events, newEv];
            }

            if (['Traslado de lote', 'Venta de lote'].includes(selectedEventType)) {
                updatedB.status = 'Finalizado';
                generateLiquidationReport(updatedB, newEv);
                if (selectedEventType === 'Traslado de lote') createCebaBatch(updatedB, newEv);
                router.push('/analysis/liquidated-batches');
            }

            setBatch(updatedB);
            const stored = JSON.parse(localStorage.getItem('nurseryBatches') || '{}');
            stored[loteId] = updatedB;
            localStorage.setItem('nurseryBatches', JSON.stringify(stored));
            calculateConsumption(consumptionHistory, updatedB);
            setIsEventFormOpen(false);
        };

        return (
            <form onSubmit={onEventSubmit} id="event-form" className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="eventDate">Fecha</Label>
                    <Input id="eventDate" name="eventDate" type="date" required defaultValue={editingEvent?.date || new Date().toISOString().split('T')[0]} />
                </div>
                {['Muerte en lote', 'Traslado de lote', 'Venta de lote', 'Ingreso a lote'].includes(selectedEventType) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="animalCount">Cantidad de Animales</Label>
                            <Input id="animalCount" name="animalCount" type="number" required value={aCount} onChange={e => setACount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalWeight">Peso Total (kg)</Label>
                            <Input id="totalWeight" name="totalWeight" type="number" step="0.1" value={tWeight} onChange={e => setTWeight(e.target.value)} />
                        </div>
                    </div>
                )}
                {['Tratamiento', 'Vacunación'].includes(selectedEventType) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">Producto</Label>
                            <Select name="product" required defaultValue={editingEvent?.product}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    {getInventory().filter(p => p.category === (selectedEventType === 'Tratamiento' ? 'medicamento' : 'vacuna')).map(i => (
                                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dose">Dosis/An. (ml)</Label>
                            <Input id="dose" name="dose" type="number" step="0.1" required defaultValue={editingEvent?.dose}/>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="eventNotes">Notas</Label>
                    <Textarea id="eventNotes" name="eventNotes" defaultValue={editingEvent?.details}/>
                </div>
            </form>
        );
    };

    if (!batch) return <AppLayout><p className="p-8">Cargando...</p></AppLayout>;

    const daysInStage = differenceInDays(new Date(), parseISO(batch.creationDate));
    const totalFeedConsumed = consumptionHistory.reduce((sum, w) => sum + w.totalWeek, 0);
    const deathsCount = batch.events.filter(e => e.type === 'Muerte en lote').reduce((sum, e) => sum + (e.animalCount || 0), 0);
    const mortalityRate = (deathsCount / batch.initialPigletCount) * 100;

    const daysOfWeek = (() => {
        if (!isValid(parseISO(batch.creationDate))) return ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
        const startDayIndex = getDay(parseISO(batch.creationDate)) === 0 ? 6 : getDay(parseISO(batch.creationDate)) - 1;
        const dN = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
        return [...dN.slice(startDayIndex), ...dN.slice(0, startDayIndex)];
    })();

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/precebo')}><ArrowLeft className="h-4 w-4" /></Button>
                        <h1 className="text-2xl font-bold">Lote Precebo: {loteId}</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button disabled={batch.status === 'Finalizado'}><PlusCircle className="mr-2 h-4 w-4" />Evento</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {allEventTypes.map(t => (
                                <DropdownMenuItem key={t} onSelect={() => { setSelectedEventType(t); setEditingEvent(null); setIsEventFormOpen(true); }}>
                                    <div className="flex items-center gap-2">{eventIcons[t]}<span>{t}</span></div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Animales y Bajas</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div><p className="text-2xl font-bold">{batch.pigletCount}</p><p className="text-[10px] text-muted-foreground">Actuales / {batch.initialPigletCount} Inicial</p></div>
                                <div className="text-right text-destructive"><p className="text-sm font-bold">{deathsCount} Bajas</p><p className="text-[10px]">{mortalityRate.toFixed(1)}% Mortalidad</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Tiempo en Etapa</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div><p className="text-2xl font-bold">{daysInStage} días</p><p className="text-[10px] text-muted-foreground">En Precebo</p></div>
                                <div className="text-right"><p className="text-sm font-bold text-primary">{batch.avgAge + daysInStage} días</p><p className="text-[10px]">Edad Actual</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Alimento y Conversión</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div><p className="text-2xl font-bold">{totalFeedConsumed.toFixed(1)} kg</p><p className="text-[10px] text-muted-foreground">Total Consumido</p></div>
                                <div className="text-right text-green-600"><p className="text-sm font-bold">CA: 1.25*</p><p className="text-[10px]">Estimada</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Origen</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {batch.sows.map(s => <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>)}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">Cerdas de origen</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tabla de Consumo Semanal</CardTitle>
                        <CardDescription>Registre el consumo diario en kg por semana de precebo.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table className="min-w-[1000px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Sem.</TableHead>
                                    <TableHead className="w-40">Alimento</TableHead>
                                    {daysOfWeek.map(d => <TableHead key={d} className="capitalize text-center w-20">{d}</TableHead>)}
                                    <TableHead className="text-right w-24">Total Sem</TableHead>
                                    <TableHead className="text-right w-24">Tot. Acum</TableHead>
                                    <TableHead className="text-right w-28">g/an/día</TableHead>
                                    <TableHead className="text-right w-28">Acum/an</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consumptionHistory.map(w => (
                                    <TableRow key={w.id}>
                                        <TableCell className="font-medium">{w.weekNumber}</TableCell>
                                        <TableCell>
                                            <Select value={w.feedType} onValueChange={v => handleFeedTypeChange(w.id, v)} disabled={batch.status === 'Finalizado'}>
                                                <SelectTrigger className="h-8"><SelectValue placeholder="Alimento..." /></SelectTrigger>
                                                <SelectContent>
                                                    {getInventory().filter(i => i.category === 'alimento').map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        {w.consumption.map((c, i) => (
                                            <TableCell key={i} className="p-1">
                                                <Input type="number" defaultValue={c} onBlur={e => handleConsumptionChange(w.id, i, e.target.value)} className="h-8 text-center" disabled={batch.status === 'Finalizado'} />
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right font-semibold">{w.totalWeek.toFixed(1)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{w.totalAccumulated.toFixed(1)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{w.consumptionPerPigPerDay.toFixed(0)} g</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{w.accumulatedPerPig.toFixed(2)} kg</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader><DialogTitle>{editingEvent ? 'Editar' : 'Registrar'} {selectedEventType}</DialogTitle></DialogHeader>
                        <ScrollArea className="flex-1 px-1"><EventFormContent /></ScrollArea>
                        <DialogFooter className="pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsEventFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" form="event-form">Guardar Evento</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteEvent}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
