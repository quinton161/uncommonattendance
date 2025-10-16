# UI Component Library

A comprehensive, modern UI component library built with React and TailwindCSS for the Uncommon Attendance Management System.

## Features

- 🎨 **Modern Design**: Clean, professional interface with consistent styling
- 🌈 **Customizable**: Extensive theming and variant options
- 📱 **Responsive**: Mobile-first design that works on all devices
- ⚡ **Performance**: Optimized components with minimal bundle size
- 🎭 **Animations**: Smooth transitions and micro-interactions
- ♿ **Accessible**: Built with accessibility best practices
- 🔧 **TypeScript Ready**: Full TypeScript support (when migrated)

## Components

### Layout Components

#### Card
Flexible container component for grouping related content.

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

#### Table
Responsive table component with consistent styling.

```jsx
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Form Components

#### Button
Versatile button component with multiple variants and states.

```jsx
import Button from '../ui/Button';

<Button variant="default" size="md" loading={false}>
  Click me
</Button>
```

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`, `warning`
**Sizes**: `default`, `sm`, `lg`, `icon`

#### Input
Enhanced input component with labels, icons, and validation states.

```jsx
import Input from '../ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  leftIcon={<Mail className="w-4 h-4" />}
  error="Invalid email format"
/>
```

#### Badge
Small status indicators and labels.

```jsx
import Badge from '../ui/Badge';

<Badge variant="success" size="default">
  Active
</Badge>
```

**Variants**: `default`, `secondary`, `destructive`, `success`, `warning`, `info`, `outline`

### Feedback Components

#### LoadingScreen
Full-screen loading component with animations.

```jsx
import LoadingScreen from '../ui/LoadingScreen';

<LoadingScreen
  text="Loading Dashboard"
  subtext="Please wait while we fetch your data"
  progress={75}
/>
```

#### Toast
Notification system for user feedback.

```jsx
import { useToast } from '../ui/Toast';

const { toast } = useToast();

toast.success('Success!', 'Operation completed successfully');
toast.error('Error!', 'Something went wrong');
```

#### Progress
Linear and circular progress indicators.

```jsx
import Progress, { CircularProgress } from '../ui/Progress';

<Progress value={75} max={100} color="blue" showLabel />
<CircularProgress value={75} size="lg" color="green" />
```

### Interactive Components

#### Modal
Flexible modal dialog component.

```jsx
import Modal from '../ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  Modal content
</Modal>
```

### Data Display Components

#### StatCard
Statistical display card with icons and trend indicators.

```jsx
import StatCard from '../ui/StatCard';

<StatCard
  title="Total Users"
  value="1,234"
  icon={Users}
  color="blue"
  change="+12% from last month"
  changeType="positive"
/>
```

## Styling System

### Colors
- **Primary**: Blue (`blue-600`)
- **Success**: Green (`green-600`)
- **Warning**: Yellow (`yellow-600`)
- **Danger**: Red (`red-600`)
- **Info**: Blue (`blue-500`)
- **Gray Scale**: Various gray shades

### Animations
Enhanced with custom animations:
- `fade-in-up`, `fade-in-down`, `fade-in-left`, `fade-in-right`
- `scale-in`, `slide-in-up`, `slide-in-down`
- `wiggle`, `shake`, `heartbeat`, `glow`
- `blob`, `float`, `text-glow`

### Responsive Design
All components are built mobile-first with responsive breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Best Practices

1. **Consistent Spacing**: Use Tailwind's spacing scale (4, 6, 8, 12, 16, etc.)
2. **Color Usage**: Stick to the defined color palette
3. **Typography**: Use consistent font sizes and weights
4. **Accessibility**: Always include proper ARIA labels and keyboard navigation
5. **Performance**: Import only the components you need

## Customization

### Theme Colors
Modify colors in `tailwind.config.js`:

```js
colors: {
  primary: {
    50: '#f0f9ff',
    // ... other shades
    900: '#0c4a6e',
  }
}
```

### Custom Animations
Add new animations in the Tailwind config:

```js
animation: {
  'custom-bounce': 'customBounce 1s ease-in-out infinite',
}
```

## Development

### Adding New Components
1. Create component file in `/components/ui/`
2. Follow existing patterns for props and styling
3. Add to the index.js export file
4. Update this README with usage examples

### Testing
- Test all variants and states
- Verify responsive behavior
- Check accessibility with screen readers
- Test keyboard navigation

## Migration Notes

This library is designed to work seamlessly with the existing React + TailwindCSS setup. No additional dependencies are required beyond what's already installed.

## Support

For questions or issues with the UI components, please refer to the main project documentation or create an issue in the project repository.
