"use client";

import { useQuery } from "@tanstack/react-query";
import { unitiesApi } from "@/lib/api/unities";
import { queryKeys } from "@/lib/query-keys";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  const { data: unities, isLoading } = useQuery({
    queryKey: queryKeys.unities.all,
    queryFn: unitiesApi.list,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-72 mb-2" />
              <Skeleton className="h-5 w-56" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Treinamentos Disponíveis
              </h1>
              <p className="text-muted-foreground">
                Escolha uma unidade para começar a aprender.
              </p>
            </>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} variant="interactive" className="group">
                <Skeleton className="h-49 w-full rounded-none" />
                <CardHeader className="gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}

          {unities?.map((unity) => (
            <Card key={unity.publicId} variant="interactive" className="group">
              <div className="h-48 bg-muted relative">
                {unity.unityCover ? (
                  <Image
                    src={unity.unityCover}
                    alt={unity.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
                    <BookOpen className="w-12 h-12 text-primary/40" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{unity.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {unity.description || "Nenhuma descrição disponível."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center gap-4">
                <Button
                  asChild
                  className="w-full group-hover:bg-primary transition-colors"
                >
                  <Link href={`/unity/${encodeURIComponent(unity.name)}`}>
                    Ver Aulas
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {unities?.length === 0 && (
          <div className="text-center py-20 bg-card rounded-lg border-2 border-dashed">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma unidade encontrada
            </h2>
            <p className="text-muted-foreground">
              Novos conteúdos serão adicionados em breve.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
