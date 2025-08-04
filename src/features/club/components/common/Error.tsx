interface ErrorProps {
  message?: string;
  retry?: () => void;
}

export function Error({ message = 'Đã xảy ra lỗi', retry }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-destructive">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
