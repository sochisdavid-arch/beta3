
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { Globe, Building, Phone } from 'lucide-react';

const FARM_INFO_KEY = 'farmInformation';

export default function FarmSetupPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const farmInfo = {
            farmName: formData.get('farmName'),
            location: formData.get('location'),
            country: formData.get('country'),
            phone: formData.get('phone'),
        };

        localStorage.setItem(FARM_INFO_KEY, JSON.stringify(farmInfo));

        toast({
            title: '¡Granja Configurada!',
            description: 'La información de tu granja ha sido guardada. ¡Bienvenido a SmartPig!',
        });
        
        router.push('/dashboard');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="mx-auto w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <Logo className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-2xl font-bold">¡Bienvenido a SmartPig!</CardTitle>
                    <CardDescription>Solo un paso más. Cuéntanos sobre tu granja para personalizar tu experiencia.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="farmName">Nombre de la Granja</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input id="farmName" name="farmName" placeholder="Ej: Granja El Porvenir" required className="pl-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Ubicación (Ciudad/Municipio)</Label>
                             <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input id="location" name="location" placeholder="Ej: Anolaima" required className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="country">País</Label>
                            <Input id="country" name="country" placeholder="Ej: Colombia" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono de Contacto</Label>
                             <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input id="phone" name="phone" type="tel" placeholder="Ej: 3101234567" required className="pl-10" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            Guardar y Empezar a Usar SmartPig
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
