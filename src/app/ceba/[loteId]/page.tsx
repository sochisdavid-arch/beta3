"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Syringe, Banknote, Skull, ShieldPlus, MoreHorizontal, Info, Calendar, Weight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO, isValid, addDays, getDay, differenceInDays } from 'date-fns';
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

interface CebaBatch {
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

type CebaEventType = "Muerte en lote" | "Venta de lote" | "Tratamiento" | "Vacunación";

interface BatchEvent {
    id: string;
    type: CebaEventType;
    date: string;
    details?: string;
    animalCount?: number;
    avgWeight?: number;
    totalWeight?: number;
    cause?: string;
    product?: string;
    dose?: number;
    saleValue?: number;
}

const eventIcons: { [key in CebaEventType]: React.ReactElement } = {
    "Muerte en lote": <Skull className="h-5 w-5 text-destructive" />,
    "Venta de lote": <Banknote className="h-5 w-5 text-green-500" />,
    "Tratamiento": <Syringe className="h-5 w-5 text-red-500" />,
    "Vacunación": <ShieldPlus className="h-5 w-5 text-green-500" />,
};

export default function LoteCebaPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const loteId = params.loteId as string;
    
    const [batch, setBatch] = React.useState<CebaBatch | null>(null);
    const [consumptionHistory, setConsumptionHistory] = React.useState<ConsumptionRecord[]>([]);
    const [isEventFormOpen, setIsEventFormOpen] = React.useState(false);
    const [selectedEventType, setSelectedEventType] = React.useState<CebaEventType | null>(null);
    const [editingEvent, setEditingEvent] = React.useState<BatchEvent | null>(null);

    const getConsumptionStorageKey = React.useCallback(() => `consumptionHistory_ceba_${loteId}`, [loteId]);
    
    const loadData = React.useCallback(() => {
        const storedBatches = localStorage.getItem('cebaBatches');
        if (storedBatches) {
            const batchData = JSON.parse(storedBatches);
            const foundBatch = batchData[loteId];
            if (foundBatch) {
                const processedBatch: CebaBatch = {
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
                
                if (history.length < 15 && foundBatch.creationDate) {
                    const additionalWeeks = Array.from({ length: 15 - history.length }).map((_, weekIndex) => {
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

    React.useEffect(() => { loadData(); }, [loadData]);
    
    const calculateConsumption = (history: ConsumptionRecord[], currentBatch: CebaBatch) => {
        let accumulatedFeed = 0;
        const totalDeaths = currentBatch.events.filter(e => e.type === 'Muerte en lote').reduce((sum, e) => sum + (e.animalCount || 0), 0);
        const currentAnimalCount = currentBatch.initialPigletCount - totalDeaths;

        const calculated = history.map(week => {
            const weeklyTotal = week.consumption.reduce((sum: number, val) => sum + Number(val || 0), 0);
            accumulatedFeed += weeklyTotal;
            return {
                ...week,
                totalWeek: weeklyTotal,
                totalAccumulated: accumulatedFeed,
                accumulatedPerPig: currentAnimalCount > 0 ? accumulatedFeed / currentAnimalCount : 0,
                consumptionPerPigPerDay: currentAnimalCount > 0 ? (weeklyTotal / currentAnimalCount / 7) : 0,
            };
        });

        setConsumptionHistory(calculated);
        localStorage.setItem(getConsumptionStorageKey(), JSON.stringify(calculated));
    };

    const handleConsumptionChange = (weekId: string, dayIndex: number, value: string) => {
        if (!batch) return;
        const updated = consumptionHistory.map(w => {
            if (w.id === weekId) {
                const oldV = Number(w.consumption[dayIndex] || 0);
                const newV = Number(value || 0);
                if (w.feedType && newV - oldV !== 0) {
                    deductFromStock(w.feedType, newV - oldV, `Lote Ceba ${loteId}`, addDays(parseISO(w.startDate), dayIndex).toISOString());
                }
                const newC = [...w.consumption];
                newC[dayIndex] = value;
                return { ...w, consumption: newC };
            }
            return w;
        });
        calculateConsumption(updated, batch);
    };

    const EventFormContent = () => {
        if (!selectedEventType || !batch) return null;
        const onEventSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const fD = new FormData(e.target as HTMLFormElement);
            const newEv: BatchEvent = {
                id: `evt-${Date.now()}`,
                type: selectedEventType,
                date: fD.get('eventDate') as string,
                animalCount: Number(fD.get('animalCount')),
                avgWeight: Number(fD.get('avgWeight')),
                saleValue: Number(fD.get('saleValue')),
                details: fD.get('details') as string,
            };
            const updatedB = { ...batch, events: [...batch.events, newEv] };
            if (selectedEventType === 'Venta de lote') {
                updatedB.status = 'Finalizado';
                generateLiquidationReport(updatedB, newEv);
                router.push('/analysis/liquidated-batches');
            }
            setBatch(updatedB);
            const stored = JSON.parse(localStorage.getItem('cebaBatches') || '{}');
            stored[loteId] = updatedB;
            localStorage.setItem('cebaBatches', JSON.stringify(stored));
            setIsEventFormOpen(false);
        };

        return (
            <form onSubmit={onEventSubmit} id="event-form" className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="eventDate">Fecha</Label>
                    <Input id="eventDate" name="eventDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="animalCount">Cantidad</Label>
                    <Input id="animalCount" name="animalCount" type="number" required defaultValue={selectedEventType === 'Muerte en lote' ? 1 : batch.pigletCount} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="avgWeight">Peso Promedio (kg)</Label>
                    <Input id="avgWeight" name="avgWeight" type="number" step="0.1" required />
                </div>
                {selectedEventType === 'Venta de lote' && (
                    <div className="space-y-2">
                        <Label htmlFor="saleValue">Valor de Venta ($)</Label>
                        <Input id="saleValue" name="saleValue" type="number" step="0.01" required />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="details">Notas</Label>
                    <Textarea id="details" name="details" />
                </div>
            </form>
        );
    };

    const generateLiquidationReport = (finalBatch: CebaBatch, finalEvent: BatchEvent) => {
        const totalDeaths = finalBatch.events.filter(e => e.type === 'Muerte en lote').reduce((sum, e) => sum + (e.animalCount || 0), 0);
        const finalCount = finalEvent.animalCount || finalBatch.pigletCount;
        const daysInCeba = differenceInDays(parseISO(finalEvent.date), parseISO(finalBatch.creationDate));
        const finalTotalW = (finalEvent.avgWeight || 0) * finalCount;
        const totalGain = finalTotalW - finalBatch.totalWeight;
        const totalFeed = consumptionHistory.reduce((sum, w) => sum + w.totalWeek, 0);
        
        const report: PreceboReportData = {
            batchId: finalBatch.id,
            generationDate: new Date().toISOString(),
            liquidationReason: finalEvent.type,
            startDate: finalBatch.creationDate,
            endDate: finalEvent.date,
            initialCount: finalBatch.initialPigletCount,
            finalCount: finalCount,
            initialAge: finalBatch.avgAge,
            finalAge: finalBatch.avgAge + daysInCeba,
            daysInPrecebo: daysInCeba,
            weeksOfLife: Math.floor((finalBatch.avgAge + daysInCeba) / 7),
            totalDeaths: totalDeaths,
            mortalityRate: (totalDeaths / finalBatch.initialPigletCount) * 100,
            avgMortalityAge: 0,
            initialTotalWeight: finalBatch.totalWeight,
            finalTotalWeight: finalTotalW,
            initialAvgWeight: finalBatch.avgWeight,
            finalAvgWeight: finalEvent.avgWeight || 0,
            totalWeightGain: totalGain,
            animalWeightGain: finalCount > 0 ? totalGain / finalCount : 0,
            dailyWeightGain: finalCount > 0 && daysInCeba > 0 ? (totalGain / finalCount) / daysInCeba * 1000 : 0,
            totalFeedConsumed: totalFeed,
            dailyAnimalConsumption: finalCount > 0 && daysInCeba > 0 ? (totalFeed / finalCount) / daysInCeba : 0,
            feedConversion: totalGain > 0 ? totalFeed / totalGain : 0,
            saleValue: finalEvent.saleValue,
            healthRecords: finalBatch.events.filter(e => e.type === 'Tratamiento' || e.type === 'Vacunación').map(e => ({
                date: e.date, type: e.type, product: e.product || '', details: e.details || ''
            })),
        };
        const existing = JSON.parse(localStorage.getItem('liquidatedCebaReports') || '[]');
        existing.push(report);
        localStorage.setItem('liquidatedCebaReports', JSON.stringify(existing));
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
                        <Button variant="outline" size="icon" onClick={() => router.push('/ceba')}><ArrowLeft className="h-4 w-4" /></Button>
                        <h1 className="text-2xl font-bold">Lote Ceba: {loteId}</h1>
                    </div>
                    <Button onClick={() => { setSelectedEventType('Venta de lote'); setIsEventFormOpen(true); }} disabled={batch.status === 'Finalizado'}><PlusCircle className="mr-2 h-4 w-4" />Liquidar Lote</Button>
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
                                <div><p className="text-2xl font-bold">{daysInStage} días</p><p className="text-[10px] text-muted-foreground">En Ceba</p></div>
                                <div className="text-right"><p className="text-sm font-bold text-primary">{batch.avgAge + daysInStage} días</p><p className="text-[10px]">Edad Actual</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Alimento y Conversión</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div><p className="text-2xl font-bold">{totalFeedConsumed.toFixed(1)} kg</p><p className="text-[10px] text-muted-foreground">Total Consumido</p></div>
                                <div className="text-right text-green-600"><p className="text-sm font-bold">CA: 2.85*</p><p className="text-[10px]">Estimada</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Estado</CardTitle></CardHeader>
                        <CardContent>
                            <Badge variant={batch.status === 'Activo' ? 'default' : 'secondary'} className="text-lg py-1 px-4">{batch.status}</Badge>
                            <p className="text-[10px] text-muted-foreground mt-2">Estado del lote</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tabla de Consumo Semanal (15 Semanas)</CardTitle>
                        <CardDescription>Registre el consumo diario (kg). Las métricas se calculan automáticamente.</CardDescription>
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
                                    <TableHead className="text-right w-28">kg/an/día</TableHead>
                                    <TableHead className="text-right w-28">Acum/an</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consumptionHistory.map(w => (
                                    <TableRow key={w.id}>
                                        <TableCell className="font-medium">{w.weekNumber}</TableCell>
                                        <TableCell>
                                            <Select value={w.feedType} onValueChange={v => {
                                                const updated = consumptionHistory.map(item => item.id === w.id ? { ...item, feedType: v } : item);
                                                calculateConsumption(updated, batch);
                                            }} disabled={batch.status === 'Finalizado'}>
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
                                        <TableCell className="text-right font-mono text-xs">{w.consumptionPerPigPerDay.toFixed(3)} kg</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{w.accumulatedPerPig.toFixed(2)} kg</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Registrar {selectedEventType}</DialogTitle></DialogHeader>
                        <EventFormContent />
                        <DialogFooter><Button type="submit" form="event-form">Confirmar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}