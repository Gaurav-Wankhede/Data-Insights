'use client';

import React, { createContext, useContext, useState } from 'react';

interface IColumnInfo {
  name: string;
  type: string;
  missing_count: number;
  unique_count: number;
}

interface IColumnContextType {
  columns: IColumnInfo[];
  setColumns: (columns: IColumnInfo[]) => void;
}

const ColumnContext = createContext<IColumnContextType | undefined>(undefined);

export function ColumnProvider({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<IColumnInfo[]>([]);

  return (
    <ColumnContext.Provider value={{ columns, setColumns }}>
      {children}
    </ColumnContext.Provider>
  );
}

export function useColumns() {
  const context = useContext(ColumnContext);
  if (context === undefined) {
    throw new Error('useColumns must be used within a ColumnProvider');
  }
  return context;
}
