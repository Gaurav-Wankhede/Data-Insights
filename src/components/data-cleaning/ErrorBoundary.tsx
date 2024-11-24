import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';

interface Props {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<Props> = ({ error, resetErrorBoundary }) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTitle>Something went wrong:</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Button 
        onClick={resetErrorBoundary}
        variant="outline"
        className="mt-2"
      >
        <ReloadIcon className="mr-2 h-4 w-4" /> Try again
      </Button>
    </Alert>
  );
};
