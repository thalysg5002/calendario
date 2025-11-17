/**
 * Sistema de persistência usando LocalStorage do navegador
 */

const STORAGE_KEYS = {
  igrejas: 'calendario_igrejas',
  eventos: 'calendario_eventos',
  aniversarios: 'calendario_aniversarios',
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

/**
 * Carrega dados do LocalStorage
 */
export function loadFromStorage<T>(key: StorageKey): T[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS[key]);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Erro ao carregar ${key} do LocalStorage:`, error);
  }
  return [];
}

/**
 * Salva dados no LocalStorage
 */
export function saveToStorage<T>(key: StorageKey, data: T[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    console.log(`✓ ${key} salvo no LocalStorage (${data.length} registros)`);
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${key} no LocalStorage:`, error);
    return false;
  }
}

/**
 * Remove dados do LocalStorage
 */
export function clearStorage(key: StorageKey): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
    console.log(`✓ ${key} removido do LocalStorage`);
  } catch (error) {
    console.error(`Erro ao remover ${key} do LocalStorage:`, error);
  }
}

/**
 * Remove todos os dados do LocalStorage
 */
export function clearAllStorage(): void {
  Object.keys(STORAGE_KEYS).forEach((key) => {
    clearStorage(key as StorageKey);
  });
}

/**
 * Exporta todos os dados para download
 */
export function exportAllData() {
  const allData = {
    igrejas: loadFromStorage('igrejas'),
    eventos: loadFromStorage('eventos'),
    aniversarios: loadFromStorage('aniversarios'),
    exportedAt: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendario-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa dados de um arquivo
 */
export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.igrejas) saveToStorage('igrejas', data.igrejas);
        if (data.eventos) saveToStorage('eventos', data.eventos);
        if (data.aniversarios) saveToStorage('aniversarios', data.aniversarios);
        
        console.log('✓ Dados importados com sucesso');
        resolve();
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Realiza backup automático: salva uma cópia em LocalStorage e opcionalmente tenta
 * iniciar um download programático (pode ser bloqueado pelo navegador).
 * A função é silenciosa (não mostra UI) e também mantém a última cópia em
 * chave `calendario_auto_backup_latest` e uma cópia com timestamp.
 */
export function autoBackup(options: { download?: boolean } = { download: false }) {
  try {
    const allData = {
      igrejas: loadFromStorage('igrejas'),
      eventos: loadFromStorage('eventos'),
      aniversarios: loadFromStorage('aniversarios'),
      exportedAt: new Date().toISOString(),
    };

    // salvar cópia mais recente
    try {
      localStorage.setItem('calendario_auto_backup_latest', JSON.stringify(allData));
      // também salvar uma cópia com timestamp (mantém histórico local)
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      localStorage.setItem(`calendario_auto_backup_${ts}`, JSON.stringify(allData));
    } catch (e) {
      // se não for possível salvar no localStorage, não interrompe a aplicação
      console.warn('Não foi possível salvar backup no LocalStorage:', e);
    }

    // tentar download programático se solicitado (pode ser bloqueado)
    if (options.download) {
      try {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendario-autobackup-${new Date().toISOString().split('T')[0]}.json`;
        // elemento não anexado ao DOM — muitas vezes funciona, mas pode ser bloqueado pelo navegador
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Download automático do backup foi bloqueado ou falhou:', e);
      }
    }
  } catch (error) {
    console.error('Erro ao executar autoBackup:', error);
  }
}
