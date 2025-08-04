interface EmptyProps {
  message?: string;
  action?: React.ReactNode;
}

export function Empty({ message = 'Không có dữ liệu', action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <p className="text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
