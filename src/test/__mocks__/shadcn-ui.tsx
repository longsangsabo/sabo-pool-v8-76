// Mock shadcn-ui form components
jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({ render }: { render: (props: any) => React.ReactNode }) => render({ field: {} }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormMessage: () => null,
}));

// Mock shadcn-ui input components
jest.mock('@/components/ui/input', () => ({
  Input: ({ type = 'text', ...props }: { type?: string }) => <input type={type} {...props} />,
}));

// Mock shadcn-ui textarea component
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

// Mock shadcn-ui select components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));

// Mock shadcn-ui date picker component
jest.mock('@/components/ui/date-picker', () => ({
  DatePicker: () => <input type="date" />,
}));
