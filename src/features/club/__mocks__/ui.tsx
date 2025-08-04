// Mock for @/components/ui components
const mockComponent = (name: string) => {
  const component = (props: any) => {
    return <div data-testid={`mock-${name}`} {...props} />;
  };
  component.displayName = name;
  return component;
};

export const Card = mockComponent('Card');
export const CardContent = mockComponent('CardContent');
export const CardHeader = mockComponent('CardHeader');
export const CardTitle = mockComponent('CardTitle');
export const Button = mockComponent('Button');
export const Input = mockComponent('Input');
export const Badge = mockComponent('Badge');
export const Avatar = mockComponent('Avatar');
export const AvatarImage = mockComponent('AvatarImage');
export const AvatarFallback = mockComponent('AvatarFallback');
