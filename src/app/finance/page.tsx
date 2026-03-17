
"use client";

import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, Scale } from 'lucide-react';
import { getFinancialSummary, FinancialTransaction } from '@/lib/finance';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '$0';
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
};

export default function FinancePage() {
    const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = React.useState<FinancialTransaction[]>([]);
    const [summary, setSummary] = React.useState({ income: 0, expenses: 0, balance: 0 });
    const [monthlyData, setMonthlyData] = React.useState<any[]>([]);
    const [costPerKilo, setCostPerKilo] = React.useState(0);
    const [filter, setFilter] = React.useState('all');
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const { toast } = useToast();

    const loadFinancialData = React.useCallback(() => {
        const liquidatedPreceboReports = JSON.parse(localStorage.getItem('liquidatedPreceboReports') || '[]');
        const liquidatedCebaReports = JSON.parse(localStorage.getItem('liquidatedCebaReports') || '[]');
        const pigs = JSON.parse(localStorage.getItem('pigs') || '[]');
        const foodPurchases = JSON.parse(localStorage.getItem('foodPurchaseHistory') || '[]');
        const personnel = JSON.parse(localStorage.getItem('personnelList') || '[]');
        const manualTransactions = JSON.parse(localStorage.getItem('manualTransactions') || '[]');

        const { 
            transactions: allTransactions, 
            summary: financialSummary, 
            monthlyData: financialMonthlyData, 
            costPerKilo: calculatedCostPerKilo 
        } = getFinancialSummary(
            liquidatedPreceboReports,
            liquidatedCebaReports,
            pigs,
            foodPurchases,
            personnel,
            manualTransactions
        );
        
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        setSummary(financialSummary);
        setMonthlyData(financialMonthlyData);
        setCostPerKilo(calculatedCostPerKilo);
    }, []);

    React.useEffect(() => {
        loadFinancialData();
    }, [loadFinancialData]);

    React.useEffect(() => {
        if (filter === 'all') {
            setFilteredTransactions(transactions);
        } else {
            setFilteredTransactions(transactions.filter(t => t.type === filter));
        }
    }, [filter, transactions]);
    
    const handleTransactionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const type = formData.get('type') as 'income' | 'expense';
        const date = formData.get('date') as string;
        const amount = Number(formData.get('amount'));
        const category = formData.get('category') as string;
        const description = formData.get('description') as string;
        
        if(!type || !date || !amount || !category || !description) {
            toast({ variant: 'destructive', title: 'Error', description: 'Todos los campos son requeridos.' });
            return;
        }

        const newTransaction = {
            id: `manual-${Date.now()}`,
            date,
            description,
            type,
            category,
            amount,
        };

        const manualTransactions = JSON.parse(localStorage.getItem('manualTransactions') || '[]');
        manualTransactions.push(newTransaction);
        localStorage.setItem('manualTransactions', JSON.stringify(manualTransactions));

        toast({
            title: '¡Movimiento Registrado!',
            description: 'La transacción ha sido añadida correctamente.'
        });

        setIsFormOpen(false);
        loadFinancialData();
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Análisis Financiero</h1>
                    <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Movimiento
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-green-600 break-words">{formatCurrency(summary.income)}</div>
                            <p className="text-xs text-muted-foreground">Total de ingresos registrados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-red-600 break-words">{formatCurrency(summary.expenses)}</div>
                            <p className="text-xs text-muted-foreground">Total de egresos registrados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'} break-words`}>{formatCurrency(summary.balance)}</div>
                            <p className="text-xs text-muted-foreground">Ingresos - Egresos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Costo por Kilo Producido</CardTitle>
                            <Scale className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xl font-bold text-blue-600 break-words`}>{formatCurrency(costPerKilo)}</div>
                            <p className="text-xs text-muted-foreground">Costo total / Kilos vendidos</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Flujo de Caja Mensual</CardTitle>
                        <CardDescription>Comparativo de ingresos y egresos por mes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(value) => formatCurrency(value as number)}
                                />
                                <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'hsl(var(--card))',
                                      borderColor: 'hsl(var(--border))',
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend iconSize={10}/>
                                <Bar dataKey="ingresos" fill="hsl(var(--chart-2))" name="Ingresos" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="egresos" fill="hsl(var(--chart-5))" name="Egresos" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Historial de Transacciones</CardTitle>
                                <CardDescription>Lista de todos los movimientos financieros registrados.</CardDescription>
                            </div>
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="income">Ingresos</SelectItem>
                                    <SelectItem value="expense">Egresos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{t.description}</div>
                                            <div className="text-sm text-muted-foreground">{t.category}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>
                                                {t.type === 'income' ? 'Ingreso' : 'Egreso'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(t.amount)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No hay transacciones registradas.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Movimiento Manual</DialogTitle>
                        <DialogDescription>
                            Registre un ingreso o egreso que no esté directamente ligado a la producción.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 overflow-y-auto -mx-6 px-6">
                        <form onSubmit={handleTransactionSubmit} id="transaction-form" className="space-y-6 py-4 pr-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Tipo y Fecha</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label>Tipo de Movimiento</Label>
                                        <RadioGroup name="type" required defaultValue="expense" className="flex gap-4 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="income" id="income" />
                                                <Label htmlFor="income">Ingreso</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="expense" id="expense" />
                                                <Label htmlFor="expense">Egreso</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Fecha</Label>
                                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().substring(0, 10)}/>
                                    </div>
                                </CardContent>
                            </Card>
                           
                           <Card>
                                <CardHeader><CardTitle className="text-base">Detalles de la Transacción</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Monto ($)</Label>
                                            <Input id="amount" name="amount" type="number" step="0.01" required placeholder="Ej: 50000" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="category">Categoría</Label>
                                            <Input id="category" name="category" type="text" required placeholder="Ej: Servicios Públicos" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descripción</Label>
                                        <Textarea id="description" name="description" required placeholder="Ej: Pago factura de energía del mes de Julio." />
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </ScrollArea>
                    <DialogFooter className="flex-shrink-0 pt-4 border-t -mx-6 px-6 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                        <Button type="submit" form="transaction-form">Guardar Movimiento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
