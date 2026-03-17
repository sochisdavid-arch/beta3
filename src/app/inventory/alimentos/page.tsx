
"use client";

import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, ArrowUp, ArrowDown, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getInventory, updateInventory, InventoryItem, FoodConsumptionRecord } from '@/lib/inventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface PurchaseRecord {
    id: string;
    entryDate: string;
    productName: string;
    bags: number;
    kilosPerBag: number;
    totalKilos: number;
    totalValue: number;
    pricePerKg: number;
    lotNumber?: string;
    notes?: string;
}

const PURCHASE_HISTORY_KEY = 'foodPurchaseHistory';
const CONSUMPTION_HISTORY_KEY = 'foodConsumptionHistory';

export default function AlimentosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [alimentos, setAlimentos] = React.useState<InventoryItem[]>([]);
    const [purchaseHistory, setPurchaseHistory] = React.useState<PurchaseRecord[]>([]);
    const [consumptionHistory, setConsumptionHistory] = React.useState<FoodConsumptionRecord[]>([]);

    // Form states for automatic calculation
    const [bags, setBags] = React.useState<number | string>('');
    const [kilosPerBag, setKilosPerBag] = React.useState<number | string>('');
    const [totalValue, setTotalValue] = React.useState<number | string>('');

    const totalKilos = React.useMemo(() => {
        const numBags = Number(bags);
        const numKilosPerBag = Number(kilosPerBag);
        return numBags > 0 && numKilosPerBag > 0 ? numBags * numKilosPerBag : 0;
    }, [bags, kilosPerBag]);

    const pricePerKg = React.useMemo(() => {
        const numTotalValue = Number(totalValue);
        return numTotalValue > 0 && totalKilos > 0 ? numTotalValue / totalKilos : 0;
    }, [totalValue, totalKilos]);

    const loadData = React.useCallback(() => {
        const allInventory = getInventory();
        setAlimentos(allInventory.filter(item => item.category === 'alimento'));

        const storedPurchases = localStorage.getItem(PURCHASE_HISTORY_KEY);
        if (storedPurchases) {
            setPurchaseHistory(JSON.parse(storedPurchases));
        }
        const storedConsumptions = localStorage.getItem(CONSUMPTION_HISTORY_KEY);
        if (storedConsumptions) {
            setConsumptionHistory(JSON.parse(storedConsumptions));
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const productName = formData.get('productName') as string;
        
        if (!productName || totalKilos <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Nombre del producto y cantidades son requeridos.' });
            return;
        }

        const fullInventory = getInventory();
        let product = fullInventory.find(item => item.name.toLowerCase() === productName.toLowerCase() && item.category === 'alimento');
        let updatedInventory: InventoryItem[];

        if (product) {
            // Product exists, update stock
            updatedInventory = fullInventory.map(item => 
                item.id === product!.id ? { ...item, stock: item.stock + totalKilos } : item
            );
        } else {
            // New product, create it
            const newProduct: InventoryItem = {
                id: `ALIM-${Date.now()}`, // Simple unique ID
                name: productName,
                category: 'alimento',
                stock: totalKilos,
            };
            updatedInventory = [...fullInventory, newProduct];
        }

        updateInventory(updatedInventory);
        
        // Save purchase to history
        const newPurchase: PurchaseRecord = {
            id: `compra-${Date.now()}`,
            entryDate: formData.get('entryDate') as string,
            productName: productName,
            bags: Number(bags),
            kilosPerBag: Number(kilosPerBag),
            totalKilos: totalKilos,
            totalValue: Number(totalValue),
            pricePerKg: pricePerKg,
            lotNumber: formData.get('lotNumber') as string,
            notes: formData.get('notes') as string,
        };

        const updatedHistory = [newPurchase, ...purchaseHistory];
        localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(updatedHistory));
        setPurchaseHistory(updatedHistory);
        
        toast({ title: 'Ingreso Registrado', description: `${totalKilos}kg de ${productName} añadidos al inventario.` });
        
        // Reset form and state, and reload data
        setIsFormOpen(false);
        setBags('');
        setKilosPerBag('');
        setTotalValue('');
        loadData();
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/inventory')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Inventario de Alimentos</h1>
                    </div>
                     <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Registrar Ingreso de Alimento
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="text-blue-500"/>Stock Actual de Alimentos</CardTitle>
                        <CardDescription>Inventario disponible de cada tipo de alimento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Stock Actual (kg)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alimentos.length > 0 ? alimentos.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right font-semibold">{item.stock.toFixed(2)} kg</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">No hay alimentos en el inventario.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ArrowUp className="text-green-500"/>Historial de Ingresos de Alimento</CardTitle>
                        <CardDescription>Lista de todas las compras de alimento registradas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Ingreso</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead className="text-right">Kilos Totales</TableHead>
                                    <TableHead className="text-right">Valor Total</TableHead>
                                    <TableHead className="text-right">Precio/kg</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseHistory.length > 0 ? purchaseHistory.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{isValid(parseISO(item.entryDate)) ? format(parseISO(item.entryDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell>{item.lotNumber || 'N/A'}</TableCell>
                                        <TableCell className="text-right">{item.totalKilos.toFixed(2)} kg</TableCell>
                                        <TableCell className="text-right">${(item.totalValue || 0).toLocaleString('es-CO')}</TableCell>
                                        <TableCell className="text-right">${(item.pricePerKg || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No hay ingresos de alimento registrados.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ArrowDown className="text-red-500"/>Historial de Salidas de Alimento</CardTitle>
                        <CardDescription>Consumos registrados automáticamente desde las áreas de Precebo y Ceba.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Lote/Área de Destino</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Cantidad Consumida (kg)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consumptionHistory.length > 0 ? consumptionHistory.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{isValid(parseISO(item.date)) ? format(parseISO(item.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                                        <TableCell className="font-medium">{item.area}</TableCell>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell className="text-right">{item.quantity.toFixed(2)} kg</TableCell>
                                    </TableRow>
                                )) : (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No hay salidas de alimento registradas.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-w-3xl flex flex-col max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Registrar Ingreso de Alimento</DialogTitle>
                             <DialogDescription>
                                Complete los detalles de la compra para añadirla al inventario.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 overflow-y-auto -mx-6 px-6">
                             <form onSubmit={handleAddSubmit} id="add-food-form" className="space-y-4 py-4 pr-6">
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Detalles del Producto</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="entryDate">Fecha de Ingreso</Label>
                                            <Input id="entryDate" name="entryDate" type="date" required defaultValue={new Date().toISOString().substring(0, 10)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="productName">Nombre del Alimento</Label>
                                            <Input id="productName" name="productName" type="text" placeholder="Ej: Precebo Fase 1" required />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle className="text-base">Cantidad</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bags">Nº de Bultos</Label>
                                            <Input id="bags" name="bags" type="number" required value={bags} onChange={(e) => setBags(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="kilosPerBag">Kilos por Bulto</Label>
                                            <Input id="kilosPerBag" name="kilosPerBag" type="number" step="0.1" required value={kilosPerBag} onChange={(e) => setKilosPerBag(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Kilos Totales</Label>
                                            <Input value={totalKilos.toFixed(2)} readOnly className="font-semibold bg-muted" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                     <CardHeader><CardTitle className="text-base">Costo</CardTitle></CardHeader>
                                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="totalValue">Valor Total Compra ($)</Label>
                                            <Input id="totalValue" name="totalValue" type="number" step="0.01" required value={totalValue} onChange={(e) => setTotalValue(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Precio / Kilo ($)</Label>
                                            <Input value={pricePerKg > 0 ? pricePerKg.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} readOnly className="font-semibold bg-muted" />
                                        </div>
                                     </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Información Adicional</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="lotNumber">Número de Lote</Label>
                                            <Input id="lotNumber" name="lotNumber" type="text" placeholder="Lote del fabricante (opcional)" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Observaciones / Notas</Label>
                                            <Textarea id="notes" name="notes" placeholder="Cualquier nota adicional..." />
                                        </div>
                                    </CardContent>
                                </Card>
                            </form>
                        </ScrollArea>
                        <DialogFooter className="flex-shrink-0 border-t pt-4 bg-background -mx-6 px-6 sm:justify-end sm:space-x-2">
                            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" form="add-food-form">Guardar Ingreso</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

    