import React from "react";
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import GerenciarAniversarios from "./pages/GerenciarAniversarios";
import { ProvedorAuth, useAuth } from "@/hooks/use-auth";
import { autoBackup } from './lib/local-storage';
import { useEffect } from 'react';

const queryClient = new QueryClient();

import { motion } from "framer-motion";
function Cabecalho() {
  const { usuario } = useAuth();
  const loc = useLocation();
  const ativo = (p: string) => (loc.pathname === p ? "text-primary" : "text-foreground/80 hover:text-foreground");
  return (
    <header className="border-b border-border bg-background">
      {/* Cabeçalho da Igreja */}
      <div className="border-b border-border bg-card">
        <div className="container py-2">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-igreja.png" 
              alt="Logo Igreja Evangélica Assembleia de Deus" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-lg bg-white/10 p-1"
            />
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-primary mb-1">
                IGREJA EVANGÉLICA ASSEMBLEIA DE DEUS
              </h1>
              <div className="text-xs sm:text-sm text-foreground/80 space-y-0.5">
                <p>Rua: Jose Alencar, 17, Vila Torres Galvão, Paulista/PE - CEP: 53403-780</p>
                <p>Presidente PR. Roberto José Dos Santos Lucena</p>
                <p>Coordenador Da Área PR. Gilmar Ribeiro</p>
                <p>Coordenadora Da Área IR. Benezoete Ribeiro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container flex h-09 items-center justify-between gap-6">
        <div className="group flex items-center gap-3 select-none">
          {/* Logo/título da aplicação pode ficar aqui se necessário */}
        </div>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link to="/" className={ativo("/")}>Calendário</Link>
          <Link to="/gerenciar-aniversarios" className={ativo("/gerenciar-aniversarios")}>Aniversários</Link>
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <></>
        </div>
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
  <div className="min-h-screen text-foreground bg-[radial-gradient(circle_at_20%_20%,hsl(var(--card))_0%,transparent_60%),radial-gradient(circle_at_80%_10%,hsl(var(--secondary))_0%,transparent_55%)]">
      <Cabecalho />
      <main className="container py-4">
    <div className="gradient-border rounded-3xl bg-card/85 backdrop-blur-xl p-5 sm:p-8 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.40)] ring-1 ring-black/5 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  useEffect(() => {
    // Executa backup automático no primeiro carregamento (silencioso)
    // Não solicitar download por padrão (download pode ser bloqueado)
    try { autoBackup({ download: false }); } catch (e) { /* noop */ }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Index /></Layout>} />
  {/* rota /login removida - aplicação sem tela de login */}
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/gerenciar-aniversarios" element={<Layout><GerenciarAniversarios /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProvedorAuth>
        <AppContent />
      </ProvedorAuth>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
