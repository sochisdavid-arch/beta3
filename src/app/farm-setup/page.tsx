
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
import { firestoreDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { FirebaseError } from 'firebase/app';

export default function FarmSetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const farmInfo = {
            farmName: String(formData.get('farmName') ?? ''),
            location: String(formData.get('location') ?? ''),
            country: String(formData.get('country') ?? ''),
            phone: String(formData.get('phone') ?? ''),
        };

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Sesión requerida',
                description: 'Debes iniciar sesión para guardar la información de tu granja.',
            });
            return;
        }

        try {
            const farmDocRef = doc(firestoreDb, 'users', user.uid, 'profile', 'farm');
            await setDoc(farmDocRef, farmInfo);
            toast({
                title: '¡Granja Configurada!',
                description: 'La información de tu granja ha sido guardada. ¡Bienvenido a SmartPig!',
            });
            router.push('/dashboard');
        } catch (error) {
            const details =
                error instanceof FirebaseError
                    ? `${error.code}${error.message ? `: ${error.message}` : ''}`
                    : (error instanceof Error ? error.message : 'Error desconocido');
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: `No se pudo guardar la información de la granja. ${details}`,
            });
            console.error('Farm setup save failed', error);
        }

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
