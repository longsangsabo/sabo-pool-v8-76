# 💻 [Development Feature/System Title]

*#tags: development, implementation, [feature-name], template*

**Last Updated**: [YYYY-MM-DD]
**Status**: [Draft|Review|Approved]
**Owner**: [Your Name/Team]
**Dependencies**: [Related dev docs, API docs, setup guides]

**Purpose**: Development guide for implementing [specific feature/system/component]

---

## 🎯 Development Overview

### 📋 Feature Scope
- **Feature**: [Feature name and description]
- **User Story**: As a [user type], I want [goal] so that [benefit]
- **Acceptance Criteria**: [List of requirements that must be met]
- **Technical Complexity**: [Low|Medium|High]
- **Estimated Effort**: [X hours/days]

### 🏗️ Architecture Overview
Brief description of how this feature fits into the overall system architecture.

---

## 🚀 Quick Implementation Guide

### ⚡ Fastest Path to MVP
```bash
# Create feature branch
git checkout -b feature/[feature-name]

# Generate boilerplate
npm run generate:component [ComponentName]

# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch
```

### 🔍 Quick Validation
```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Run unit tests
npm test [feature-name]

# Test component in isolation
npm run storybook
```

---

## 📚 Detailed Implementation

### 🧱 Core Components

#### 1. Data Models
```typescript
// Define data structures
interface [FeatureName] {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Database schema
const [featureName]Schema = {
  tableName: '[feature_name]',
  columns: {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'varchar', length: 255 },
    status: { type: 'enum', values: ['active', 'inactive'] },
    // ... additional fields
  }
};
```

#### 2. API Endpoints
```typescript
// RESTful API design
// GET /api/[feature-name] - List all
// GET /api/[feature-name]/:id - Get by ID
// POST /api/[feature-name] - Create new
// PUT /api/[feature-name]/:id - Update
// DELETE /api/[feature-name]/:id - Delete

// Example implementation
export async function handle[FeatureName]Request(req: Request, res: Response) {
  switch (req.method) {
    case 'GET':
      return await get[FeatureName](req, res);
    case 'POST':
      return await create[FeatureName](req, res);
    // ... other methods
  }
}
```

#### 3. Frontend Components
```tsx
// React component structure
interface [FeatureName]Props {
  data: [FeatureName][];
  onAction: (action: string, item: [FeatureName]) => void;
}

export const [FeatureName]Component: React.FC<[FeatureName]Props> = ({
  data,
  onAction
}) => {
  // Component implementation
  return (
    <div className="[feature-name]-container">
      {/* Component JSX */}
    </div>
  );
};
```

---

## 🗄️ Database Implementation

### 📊 Schema Design
```sql
-- Create table
CREATE TABLE [feature_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_[feature_name]_status (status),
  INDEX idx_[feature_name]_created_at (created_at)
);

-- Create relationships
ALTER TABLE [feature_name] 
ADD CONSTRAINT fk_[feature_name]_user 
FOREIGN KEY (user_id) REFERENCES users(id);
```

### 🔧 Database Operations
```typescript
// Database service layer
class [FeatureName]Service {
  async create(data: Create[FeatureName]Input): Promise<[FeatureName]> {
    // Implementation
  }

  async findById(id: string): Promise<[FeatureName] | null> {
    // Implementation
  }

  async update(id: string, data: Update[FeatureName]Input): Promise<[FeatureName]> {
    // Implementation
  }

  async delete(id: string): Promise<void> {
    // Implementation
  }

  async list(filters: [FeatureName]Filters): Promise<[FeatureName][]> {
    // Implementation
  }
}
```

---

## 🎨 Frontend Implementation

### ⚛️ React Components
```tsx
// Main component
export const [FeatureName]Page: React.FC = () => {
  const [data, setData] = useState<[FeatureName][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load[FeatureName]Data();
  }, []);

  const load[FeatureName]Data = async () => {
    try {
      setLoading(true);
      const result = await api.get[FeatureName]List();
      setData(result);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <[FeatureName]List data={data} onUpdate={load[FeatureName]Data} />
      )}
    </div>
  );
};
```

### 🎨 Styling Implementation
```css
/* Component styles */
.[feature-name]-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.[feature-name]-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.[feature-name]-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .[feature-name]-container {
    padding: 0.5rem;
  }
}
```

### 🪝 Custom Hooks
```typescript
// Custom hook for feature management
export const use[FeatureName] = () => {
  const [items, setItems] = useState<[FeatureName][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await [featureName]Api.getAll();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (data: Create[FeatureName]Input) => {
    const newItem = await [featureName]Api.create(data);
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    // ... other operations
  };
};
```

---

## 🧪 Testing Implementation

### ✅ Unit Tests
```typescript
// Component testing
describe('[FeatureName]Component', () => {
  const mockProps = {
    data: [
      { id: '1', name: 'Test Item', status: 'active' as const }
    ],
    onAction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component with data', () => {
    render(<[FeatureName]Component {...mockProps} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  test('calls onAction when button clicked', () => {
    render(<[FeatureName]Component {...mockProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockProps.onAction).toHaveBeenCalledWith('action', mockProps.data[0]);
  });
});

// Service testing
describe('[FeatureName]Service', () => {
  let service: [FeatureName]Service;

  beforeEach(() => {
    service = new [FeatureName]Service();
  });

  test('creates new item successfully', async () => {
    const data = { name: 'New Item' };
    const result = await service.create(data);
    expect(result.name).toBe(data.name);
    expect(result.id).toBeDefined();
  });
});
```

### 🔗 Integration Tests
```typescript
// API integration testing
describe('[FeatureName] API Integration', () => {
  test('POST /api/[feature-name] creates new item', async () => {
    const data = { name: 'Integration Test Item' };
    
    const response = await request(app)
      .post('/api/[feature-name]')
      .send(data)
      .expect(201);

    expect(response.body).toMatchObject({
      name: data.name,
      status: 'active'
    });
  });

  test('GET /api/[feature-name] returns list', async () => {
    const response = await request(app)
      .get('/api/[feature-name]')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

---

## 📊 Performance Considerations

### ⚡ Optimization Strategies
```typescript
// React performance optimizations
const [FeatureName]List = React.memo<[FeatureName]ListProps>(({ data, onAction }) => {
  const memoizedData = useMemo(() => 
    data.filter(item => item.status === 'active'), 
    [data]
  );

  const handleAction = useCallback((action: string, item: [FeatureName]) => {
    onAction(action, item);
  }, [onAction]);

  return (
    <VirtualizedList
      items={memoizedData}
      renderItem={({ item }) => (
        <[FeatureName]Item key={item.id} item={item} onAction={handleAction} />
      )}
    />
  );
});

// Database query optimization
const get[FeatureName]ListOptimized = async (filters: [FeatureName]Filters) => {
  return await db
    .select('id', 'name', 'status', 'created_at')
    .from('[feature_name]')
    .where('status', '=', 'active')
    .orderBy('created_at', 'desc')
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);
};
```

### 📊 Monitoring and Metrics
```typescript
// Performance monitoring
const performance[FeatureName] = {
  trackAPICall: (endpoint: string, duration: number) => {
    analytics.track('api_call', {
      endpoint,
      duration,
      feature: '[feature-name]'
    });
  },

  trackUserAction: (action: string) => {
    analytics.track('user_action', {
      action,
      feature: '[feature-name]',
      timestamp: Date.now()
    });
  }
};
```

---

## 🚨 Error Handling

### 🛡️ Error Management
```typescript
// Global error handling
class [FeatureName]Error extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = '[FeatureName]Error';
  }
}

// API error handling
const handle[FeatureName]Error = (error: unknown): Response => {
  if (error instanceof [FeatureName]Error) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
};

// Frontend error boundary
export const [FeatureName]ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<[FeatureName]ErrorFallback />}
      onError={(error) => console.error('[FeatureName] Error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

---

## 📋 Implementation Checklist

### ✅ Backend Development
- [ ] Database schema designed and created
- [ ] API endpoints implemented
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Unit tests written
- [ ] Integration tests added

### 🎨 Frontend Development
- [ ] Components designed and implemented
- [ ] State management configured
- [ ] API integration completed
- [ ] Error handling added
- [ ] Responsive design implemented
- [ ] Accessibility features added

### 🧪 Testing & Quality
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests implemented
- [ ] Code review completed
- [ ] Performance tested
- [ ] Security review done

### 🚀 Deployment Ready
- [ ] Documentation updated
- [ ] Migration scripts created
- [ ] Environment variables configured
- [ ] Monitoring setup
- [ ] Feature flags configured

---

## 📖 References

### 🔗 Related Documentation
- `TEST_comprehensive-guide.md` - Testing procedures
- `SETUP_complete-guide.md` - Environment setup
- `API_[related-api].md` - API documentation

### 📚 Technical Resources
- [Framework Documentation Links]
- [Best Practices Guides]
- [Design Pattern References]

### 🛠️ Tools and Libraries
- **Frontend**: [React|Vue|Angular]
- **Backend**: [Node.js|Express|Fastify]
- **Database**: [PostgreSQL|MongoDB|Redis]
- **Testing**: [Jest|Vitest|Playwright]

---

**Template Version**: 1.0  
**Last Updated**: August 2025  
**Status**: ✅ Template Ready  

---

## 📝 Template Usage Instructions

1. **Copy this template**: `cp docs/templates/DEV_template.md docs/DEV_your-feature.md`
2. **Replace placeholders**: Update all `[bracketed]` content with specific feature details
3. **Add implementation details**: Include actual code examples and configurations
4. **Test all code**: Verify every code snippet and command works
5. **Update metadata**: Set correct tags, owner, dependencies
6. **Review and approve**: Follow team review process
