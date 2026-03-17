
"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PigDoctorInputCard } from '@/components/PigDoctorInputCard';
import { PigDoctorOutputCard } from '@/components/PigDoctorOutputCard';
import { PigDoctorOutput } from '@/ai/flows/pig-doctor';
import { Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PigDoctorPage() {
  const [diagnosis, setDiagnosis] = useState<PigDoctorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNewDiagnosis = (newDiagnosis: PigDoctorOutput | null) => {
    setDiagnosis(newDiagnosis);
  };
  
  const handleLoadingState = (loading: boolean) => {
    setIsLoading(loading);
  }

  const handleError = () => {
     toast({
        variant: "destructive",
        title: "¡Oh no! Algo salió mal.",
        description: "Hubo un problema con la solicitud. Por favor, inténtalo de nuevo.",
      });
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center gap-4">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">PigDoctor AI</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Utilice esta herramienta de diagnóstico con IA para obtener análisis presuntivos.
          Proporcione una descripción detallada de los síntomas y, si es posible, una imagen clara del animal o los signos clínicos para obtener la evaluación más precisa.
          <span className="font-semibold text-destructive block mt-2">Recuerde: esta herramienta es un asistente y no reemplaza el criterio de un médico veterinario profesional.</span>
        </p>

        <div className="flex flex-col gap-8">
          <PigDoctorInputCard 
            onNewDiagnosis={handleNewDiagnosis}
            onLoading={handleLoadingState}
            onError={handleError}
            isLoading={isLoading}
          />
          <PigDoctorOutputCard 
            diagnosis={diagnosis} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}
