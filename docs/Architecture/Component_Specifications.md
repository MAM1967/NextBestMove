# NextBestMove Component Specifications
## Version 1.0 - React + TypeScript Component Architecture

---

## Table of Contents
1. [Type Definitions](#type-definitions)
2. [Component Architecture](#component-architecture)
3. [Component Specifications](#component-specifications)
4. [State Management](#state-management)
5. [API Integration](#api-integration)

---

## Type Definitions

### Core Domain Types

```typescript
// User Types
type User = {
  id: string;
  email: string;
  name: string;
  timezone: string;
  calendar_connected: boolean;
  streak_count: number;
  created_at: string;
  updated_at: string;
};

// Pin Types
type PinStatus = 'ACTIVE' | 'SNOOZED' | 'ARCHIVED';

type PersonPin = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  notes?: string;
  status: PinStatus;
  snooze_until?: string;
  created_at: string;
  updated_at: string;
};

// Action Types
type ActionType = 
  | 'OUTREACH'
  | 'FOLLOW_UP'
  | 'NURTURE'
  | 'CALL_PREP'
  | 'POST_CALL'
  | 'CONTENT'
  | 'FAST_WIN';

type ActionState = 
  | 'NEW'
  | 'SENT'
  | 'REPLIED'
  | 'SNOOZED'
  | 'DONE'
  | 'ARCHIVED';

type Action = {
  id: string;
  user_id: string;
  person_id?: string;
  action_type: ActionType;
  state: ActionState;
  due_date: string;
  completed_at?: string;
  snooze_until?: string;
  notes?: string;
  auto_created: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  person?: PersonPin;
  description?: string;
};

// Daily Plan Types
type DailyPlan = {
  id: string;
  user_id: string;
  date: string;
  focus_statement?: string;
  actions: string[]; // Array of action_ids
  generated_at: string;
  // Computed
  fast_win?: Action;
  regular_actions?: Action[];
};

// Weekly Summary Types
type WeeklySummary = {
  id: string;
  user_id: string;
  week_start_date: string;
  days_active: number;
  actions_completed: number;
  replies: number;
  calls_booked: number;
  insight_text: string;
  next_week_focus: string;
  content_prompts: ContentPrompt[];
  generated_at: string;
  narrative_summary?: string;
};

type ContentPrompt = {
  id: string;
  type: 'WIN_POST' | 'INSIGHT_POST';
  content: string;
  saved: boolean;
};

type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

type Subscription = {
  status: SubscriptionStatus;
  planName: string;
  renewsOn?: string;
  cancelAtPeriodEnd: boolean;
  managePortalUrl?: string;
};

// Settings Types
type NotificationPreferences = {
  morning_plan: boolean;
  fast_win_reminder: boolean;
  follow_up_alerts: boolean;
  weekly_summary: boolean;
};

type UserSettings = {
  timezone: string;
  content_prompts_enabled: boolean;
  notifications: NotificationPreferences;
};
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Navigation (Sidebar)
│   └── Main Content Area
│
├── Pages
│   ├── DailyPlanPage
│   │   ├── DailyPlanHeader
│   │   ├── TodayFocusCard
│   │   ├── ProgressIndicator
│   │   ├── FastWinCard
│   │   ├── ActionCardList
│   │   │   └── ActionCard[]
│   │   └── EmptyState
│   │
│   ├── PinManagementPage
│   │   ├── PinManagementHeader
│   │   ├── PinFilterToggle
│   │   ├── PinList
│   │   │   └── PinRow[]
│   │   ├── EmptyState
│   │   └── FloatingActionButton
│   │
│   ├── WeeklySummaryPage
│   │   ├── WeeklySummaryHeader
│   │   ├── MetricsGrid
│   │   │   └── MetricCard[]
│   │   ├── NarrativeSummaryCard
│   │   ├── InsightCard
│   │   ├── NextWeekFocusCard
│   │   ├── ContentPromptsSection
│   │   │   └── ContentPromptCard[]
│   │   └── ViewPastSummariesLink
│   │
│   └── SettingsPage
│       ├── SettingsSection[]
│       ├── BillingSection
│       └── SettingsRow[]
│
├── Onboarding
│   ├── OnboardingFlow
│   │   ├── OnboardingStep[]
│   │   └── ProgressIndicator
│   │
│   └── Steps
│       ├── WelcomeStep
│       ├── PinFirstPersonStep
│       ├── CalendarConnectStep
│       ├── WeeklyFocusSetupStep
│       ├── FirstPlanReadyStep
│       └── CompleteFastWinStep
│
├── Modals
│   ├── AddPersonModal
│   ├── EditPersonModal
│   ├── ActionNoteModal
│   ├── FollowUpFlowModal
│   ├── FollowUpSchedulingModal
│   ├── WeeklyFocusEditModal
│   ├── SnoozeActionModal
│   └── ConfirmDialog
│
└── Shared Components
    ├── Button
    ├── Card
    ├── Badge
    ├── Input
    ├── TextArea
    ├── Select
    ├── DatePicker
    ├── Toast
    ├── LoadingSpinner
    ├── EmptyState
    └── PaywallOverlay
```

---

## Component Specifications

### 1. Shared/Base Components

#### Button Component

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

// Usage Examples:
<Button variant="primary" onClick={handleClick}>
  Done
</Button>

<Button variant="secondary" size="sm" icon={<Icon />} iconPosition="left">
  Snooze
</Button>
```

**Props:**
- `variant`: Button style variant (default: 'primary')
- `size`: Button size (default: 'md')
- `fullWidth`: Makes button full width (default: false)
- `loading`: Shows spinner instead of text (default: false)
- `disabled`: Disables button interaction (default: false)
- `icon`: Optional icon element
- `iconPosition`: Icon placement (default: 'left')

**States:**
- Default
- Hover
- Active/Pressed
- Disabled
- Loading

**Accessibility:**
- Proper button semantics
- Keyboard navigation support
- ARIA labels for loading states

---

#### Card Component

```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  hoverable?: boolean;
}

// Usage:
<Card variant="elevated" padding="md" hoverable>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

**Props:**
- `variant`: Visual style (default: 'default')
- `padding`: Internal padding size (default: 'md')
- `hoverable`: Enables hover effects (default: false)
- `onClick`: Makes card clickable (default: undefined)

---

#### Badge Component

```typescript
type BadgeVariant = 
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

// Usage:
<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Snoozed</Badge>
```

---

#### Input Component

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'url' | 'tel';
  icon?: React.ReactNode;
  className?: string;
}

// Usage:
<Input
  label="Name"
  placeholder="Enter name"
  value={name}
  onChange={setName}
  error={errors.name}
  required
/>
```

**Features:**
- Error state styling
- Help text support
- Icon support (left/right)
- Required field indicator
- Validation feedback

---

#### TextArea Component

```typescript
interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  className?: string;
}
```

---

#### Modal Component

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

// Usage:
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Pin a Person"
  size="md"
>
  <ModalBody>
    {/* Content */}
  </ModalBody>
  <ModalFooter>
    <Button variant="primary">Save</Button>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
  </ModalFooter>
</Modal>
```

**Features:**
- Backdrop overlay
- Keyboard navigation (Escape to close)
- Focus trap
- Portal rendering
- Animation transitions

---

#### PaywallOverlay Component

```typescript
interface PaywallOverlayProps {
  status: SubscriptionStatus;
  headline?: string;
  description?: string;
  ctaLabel: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
  showClose?: boolean;
}
```

**Usage:**
- Wraps primary content when subscription is inactive/past due.
- Displays badge for `status` (trialing, active, etc.).
- Primary CTA triggers checkout or billing portal depending on status.

**States:**
- `trialing`: highlight renewal date
- `past_due`: show warning variant
- `canceled`: show “reactivate” messaging

**Accessibility:**
- Trap focus inside overlay when blocking interaction.
- Announce reason via `aria-live="polite"` (e.g., “Subscription required”).

---

### 2. Page Components

#### DailyPlanPage Component

```typescript
interface DailyPlanPageProps {
  date?: string; // Optional date override, defaults to today
}

// Internal State:
type DailyPlanState = {
  dailyPlan: DailyPlan | null;
  weeklyFocus: string;
  loading: boolean;
  error: string | null;
};

// Component Structure:
const DailyPlanPage: React.FC<DailyPlanPageProps> = ({ date }) => {
  const [state, setState] = useState<DailyPlanState>({
    dailyPlan: null,
    weeklyFocus: '',
    loading: true,
    error: null,
  });

  // Effects
  useEffect(() => {
    loadDailyPlan(date || new Date().toISOString().split('T')[0]);
    loadWeeklyFocus();
  }, [date]);

  // Handlers
  const handleActionComplete = async (actionId: string, completionType: string) => {
    // Update action state
    // Handle "Got reply" flow if needed
  };

  const handleActionSnooze = async (actionId: string, snoozeUntil: string) => {
    // Snooze action
  };

  return (
    <div className="daily-plan-page">
      <DailyPlanHeader />
      <TodayFocusCard focus={state.weeklyFocus} />
      {state.dailyPlan && (
        <>
          <ProgressIndicator
            completed={getCompletedCount(state.dailyPlan)}
            total={state.dailyPlan.actions.length}
          />
          {state.dailyPlan.fast_win && (
            <FastWinCard
              action={state.dailyPlan.fast_win}
              onComplete={handleActionComplete}
              onSnooze={handleActionSnooze}
            />
          )}
          <ActionCardList
            actions={state.dailyPlan.regular_actions || []}
            onComplete={handleActionComplete}
            onSnooze={handleActionSnooze}
            onAddNote={(actionId) => openNoteModal(actionId)}
          />
        </>
      )}
      {!state.dailyPlan && !state.loading && (
        <EmptyState
          title="You're all set for today!"
          description="Check back tomorrow for your next actions."
        />
      )}
    </div>
  );
};
```

**Data Fetching:**
- Loads daily plan for specified date (default: today)
- Loads weekly focus
- Handles loading and error states

**Sub-components:**
- `DailyPlanHeader`
- `TodayFocusCard`
- `ProgressIndicator`
- `FastWinCard`
- `ActionCardList`

---

#### FastWinCard Component

```typescript
interface FastWinCardProps {
  action: Action;
  onComplete: (actionId: string, completionType?: string) => void;
  onSnooze: (actionId: string, snoozeUntil: string) => void;
}

const FastWinCard: React.FC<FastWinCardProps> = ({
  action,
  onComplete,
  onSnooze,
}) => {
  const handleDone = () => {
    if (action.action_type === 'FOLLOW_UP') {
      // Show "Got reply" modal
      openFollowUpFlowModal(action.id);
    } else {
      onComplete(action.id, 'done');
    }
  };

  return (
    <Card variant="elevated" className="fast-win-card">
      <div className="fast-win-badge">Fast Win (under 5 minutes)</div>
      <h3>{action.description || getDefaultDescription(action)}</h3>
      {action.person && (
        <a href={action.person.url} target="_blank" rel="noopener noreferrer">
          {getUrlTypeLabel(action.person.url)}
        </a>
      )}
      <div className="fast-win-actions">
        <Button variant="primary" onClick={handleDone}>
          Done
        </Button>
        <Button variant="secondary" onClick={() => openSnoozeModal(action.id)}>
          Snooze
        </Button>
      </div>
    </Card>
  );
};
```

**Features:**
- Special purple accent styling
- Badge indicator
- Person link display
- Completion flow handling

---

#### ActionCard Component

```typescript
interface ActionCardProps {
  action: Action;
  onComplete: (actionId: string, completionType?: string) => void;
  onSnooze: (actionId: string, snoozeUntil: string) => void;
  onAddNote: (actionId: string) => void;
  onClick?: (action: Action) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onComplete,
  onSnooze,
  onAddNote,
  onClick,
}) => {
  const getActionButtons = () => {
    switch (action.action_type) {
      case 'FOLLOW_UP':
        return (
          <>
            <Button variant="primary" onClick={() => openFollowUpFlowModal(action.id)}>
              Done - Got reply
            </Button>
            <Button
              variant="secondary"
              onClick={() => onComplete(action.id, 'sent')}
            >
              Done - No reply yet
            </Button>
            <Button variant="ghost" onClick={() => openSnoozeModal(action.id)}>
              Snooze
            </Button>
            <Button variant="ghost" onClick={() => onAddNote(action.id)}>
              Add note
            </Button>
          </>
        );
      case 'CONTENT':
        return (
          <>
            <Button variant="primary" onClick={() => onComplete(action.id)}>
              Done
            </Button>
            <Button variant="ghost" onClick={() => openSnoozeModal(action.id)}>
              Snooze
            </Button>
            <Button variant="ghost" onClick={() => viewContentPrompt(action)}>
              View prompt
            </Button>
          </>
        );
      default:
        return (
          <>
            <Button variant="primary" onClick={() => onComplete(action.id)}>
              Done
            </Button>
            <Button variant="ghost" onClick={() => openSnoozeModal(action.id)}>
              Snooze
            </Button>
            <Button variant="ghost" onClick={() => onAddNote(action.id)}>
              Add note
            </Button>
          </>
        );
    }
  };

  return (
    <Card
      variant="default"
      hoverable
      className="action-card"
      onClick={() => onClick?.(action)}
    >
      <Badge variant={getActionTypeBadgeVariant(action.action_type)}>
        {action.action_type.replace('_', ' ')}
      </Badge>
      <h4>{getActionTitle(action)}</h4>
      <p className="action-description">{action.description}</p>
      {action.person && (
        <a
          href={action.person.url}
          target="_blank"
          rel="noopener noreferrer"
          className="person-link"
        >
          {getUrlTypeLabel(action.person.url)}
        </a>
      )}
      {action.notes && (
        <div className="action-notes">
          <Icon name="note" />
          <span>{action.notes}</span>
        </div>
      )}
      <div className="action-buttons">{getActionButtons()}</div>
    </Card>
  );
};
```

**Features:**
- Dynamic button set based on action type
- Person link display
- Notes indicator
- Click handler for detail view

---

#### PinManagementPage Component

```typescript
interface PinManagementPageProps {}

type PinFilter = 'ALL' | 'ACTIVE' | 'SNOOZED' | 'ARCHIVED';

type PinManagementState = {
  pins: PersonPin[];
  filteredPins: PersonPin[];
  filter: PinFilter;
  loading: boolean;
  error: string | null;
  selectedPin: PersonPin | null;
};

const PinManagementPage: React.FC<PinManagementPageProps> = () => {
  const [state, setState] = useState<PinManagementState>({
    pins: [],
    filteredPins: [],
    filter: 'ALL',
    loading: true,
    error: null,
    selectedPin: null,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadPins();
  }, []);

  useEffect(() => {
    applyFilter(state.filter);
  }, [state.filter, state.pins]);

  const applyFilter = (filter: PinFilter) => {
    const filtered = state.pins.filter((pin) => {
      if (filter === 'ALL') return true;
      return pin.status === filter;
    });
    setState((prev) => ({ ...prev, filteredPins: filtered }));
  };

  const handleFilterChange = (filter: PinFilter) => {
    setState((prev) => ({ ...prev, filter }));
  };

  const handlePinSnooze = async (pinId: string, snoozeUntil: string) => {
    // API call to snooze pin
    await updatePinStatus(pinId, 'SNOOZED', snoozeUntil);
    loadPins();
  };

  const handlePinArchive = async (pinId: string) => {
    // API call to archive pin
    await updatePinStatus(pinId, 'ARCHIVED');
    loadPins();
  };

  const handlePinRestore = async (pinId: string) => {
    // API call to restore pin
    await updatePinStatus(pinId, 'ACTIVE');
    loadPins();
  };

  return (
    <div className="pin-management-page">
      <PinManagementHeader />
      <PinFilterToggle
        currentFilter={state.filter}
        onFilterChange={handleFilterChange}
      />
      {state.filteredPins.length > 0 ? (
        <PinList
          pins={state.filteredPins}
          onEdit={(pin) => {
            setState((prev) => ({ ...prev, selectedPin: pin }));
            setIsEditModalOpen(true);
          }}
          onSnooze={handlePinSnooze}
          onArchive={handlePinArchive}
          onRestore={handlePinRestore}
        />
      ) : (
        <EmptyState
          title="No pins found"
          description={
            state.filter === 'ALL'
              ? "You haven't pinned anyone yet. Pin someone you want to follow up with."
              : `No ${state.filter.toLowerCase()} pins found.`
          }
          action={
            state.filter === 'ALL' ? (
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                Pin a Person
              </Button>
            ) : null
          }
        />
      )}
      <FloatingActionButton
        icon={<PlusIcon />}
        onClick={() => setIsAddModalOpen(true)}
        label="Pin a Person"
      />
      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handlePinSave}
      />
      <EditPersonModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        pin={state.selectedPin}
        onSave={handlePinUpdate}
      />
    </div>
  );
};
```

**Features:**
- Filtering by status
- CRUD operations
- Modal management
- Floating action button

---

#### BillingSection Component

```typescript
interface BillingSectionProps {
  subscription: Subscription | null;
  onCheckout: () => Promise<void>;
  onManageBilling: () => Promise<void>;
}

const BillingSection: React.FC<BillingSectionProps> = ({
  subscription,
  onCheckout,
  onManageBilling,
}) => {
  const status = subscription?.status ?? 'canceled';
  const isActive = status === 'active' || status === 'trialing';

  return (
    <Card variant="elevated" className="billing-section">
      <BillingStatusBadge status={status} />
      <h3>{isActive ? 'Your plan' : 'Start your plan'}</h3>
      <p>{subscription?.planName ?? 'Daily plan + summaries + AI insights'}</p>
      <div className="billing-actions">
        <Button
          variant="primary"
          onClick={isActive ? onManageBilling : onCheckout}
        >
          {isActive ? 'Manage billing' : 'Subscribe'}
        </Button>
        {!isActive && (
          <Button variant="ghost" onClick={onManageBilling}>
            View plan details
          </Button>
        )}
      </div>
      {subscription?.renewsOn && (
        <p className="billing-footnote">
          Renews on {formatDate(subscription.renewsOn)}
          {subscription.cancelAtPeriodEnd && ' (canceling at period end)'}
        </p>
      )}
    </Card>
  );
};
```

**States:**
- `trialing`: purple accent + copy “Trial ends on …”
- `past_due`: warning banner with secondary “Update payment” CTA
- `canceled`: show paywall summary + subscribe button

**Data Requirements:**
- `Subscription` pulled via `/api/me` or dedicated billing endpoint.
- Portal URL and checkout URL retrieved lazily to avoid leaking secrets.

---

#### PinRow Component

```typescript
interface PinRowProps {
  pin: PersonPin;
  onEdit: (pin: PersonPin) => void;
  onSnooze: (pinId: string, snoozeUntil: string) => void;
  onArchive: (pinId: string) => void;
  onRestore: (pinId: string) => void;
}

const PinRow: React.FC<PinRowProps> = ({
  pin,
  onEdit,
  onSnooze,
  onArchive,
  onRestore,
}) => {
  const getActions = () => {
    if (pin.status === 'ARCHIVED') {
      return (
        <>
          <Button variant="ghost" size="sm" onClick={() => onEdit(pin)}>
            View/Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onRestore(pin.id)}>
            Restore
          </Button>
        </>
      );
    }

    if (pin.status === 'SNOOZED') {
      return (
        <>
          <Button variant="ghost" size="sm" onClick={() => onEdit(pin)}>
            View/Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onUnsnooze(pin.id)}>
            Unsnooze
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onArchive(pin.id)}>
            Archive
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => onEdit(pin)}>
          View/Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openSnoozeModal(pin.id)}>
          Snooze
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onArchive(pin.id)}>
          Archive
        </Button>
      </>
    );
  };

  return (
    <Card
      variant={pin.status === 'ARCHIVED' ? 'outlined' : 'default'}
      className={`pin-row ${pin.status.toLowerCase()}`}
      style={pin.status === 'ARCHIVED' ? { opacity: 0.6 } : undefined}
    >
      <div className="pin-row-content">
        <div className="pin-info">
          <h4>{pin.name}</h4>
          <div className="pin-meta">
            <Badge variant={getStatusBadgeVariant(pin.status)}>
              {pin.status === 'SNOOZED' && pin.snooze_until
                ? `Snoozed until ${formatDate(pin.snooze_until)}`
                : pin.status}
            </Badge>
            <span className="pin-url-type">{getUrlTypeLabel(pin.url)}</span>
            <span className="pin-date">Added {formatRelativeDate(pin.created_at)}</span>
          </div>
          {pin.notes && (
            <p className="pin-notes">
              <Icon name="note" />
              {pin.notes}
            </p>
          )}
        </div>
        <div className="pin-actions">{getActions()}</div>
      </div>
    </Card>
  );
};
```

---

### 3. Modal Components

#### AddPersonModal Component

```typescript
interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pin: Omit<PersonPin, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL or email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave({
        name: formData.name.trim(),
        url: formData.url.trim(),
        notes: formData.notes.trim() || undefined,
        status: 'ACTIVE',
      });
      setFormData({ name: '', url: '', notes: '' });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to save pin. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pin a Person"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Input
            label="Name"
            value={formData.name}
            onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            error={errors.name}
            required
            placeholder="Enter person's name"
          />
          <Input
            label="URL (LinkedIn, CRM, or email link)"
            value={formData.url}
            onChange={(value) => setFormData((prev) => ({ ...prev, url: value }))}
            error={errors.url}
            helpText="Enter a LinkedIn profile URL, CRM link, or email (mailto:name@example.com)"
            required
            type="url"
            placeholder="https://linkedin.com/in/..."
          />
          <TextArea
            label="Notes (optional)"
            value={formData.notes}
            onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
            placeholder="Add context, reminders, or notes about this person..."
            rows={3}
          />
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Pin
          </Button>
        </ModalFooter>
      </form>
      <div className="modal-footer-text">
        You'll see them again when it's time to follow up.
      </div>
    </Modal>
  );
};
```

---

#### FollowUpFlowModal Component

```typescript
interface FollowUpFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action;
  onSchedule: (actionId: string, followUpDate: string, note?: string) => Promise<void>;
  onSnooze: (actionId: string, snoozeUntil: string) => Promise<void>;
  onComplete: (actionId: string) => Promise<void>;
}

const FollowUpFlowModal: React.FC<FollowUpFlowModalProps> = ({
  isOpen,
  onClose,
  action,
  onSchedule,
  onSnooze,
  onComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<'schedule' | 'snooze' | 'complete' | null>(null);

  const handleOptionSelect = (option: 'schedule' | 'snooze' | 'complete') => {
    setSelectedOption(option);
    
    if (option === 'complete') {
      onComplete(action.id);
      onClose();
    } else if (option === 'snooze') {
      // Open snooze modal
      // This would be handled by parent or another modal
    } else {
      // Open scheduling modal
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Got a reply — what's next?"
      size="sm"
    >
      <ModalBody>
        <div className="follow-up-options">
          <button
            className="follow-up-option recommended"
            onClick={() => handleOptionSelect('schedule')}
          >
            <Icon name="calendar" />
            <div>
              <strong>Schedule follow-up</strong>
              <span className="recommended-badge">Recommended</span>
            </div>
          </button>
          <button
            className="follow-up-option"
            onClick={() => handleOptionSelect('snooze')}
          >
            <Icon name="snooze" />
            <div>
              <strong>Snooze</strong>
              <span>Come back to this later</span>
            </div>
          </button>
          <button
            className="follow-up-option"
            onClick={() => handleOptionSelect('complete')}
          >
            <Icon name="check" />
            <div>
              <strong>Mark complete</strong>
              <span>No further action needed</span>
            </div>
          </button>
        </div>
        <Button
          variant="ghost"
          onClick={() => openNoteModal(action.id)}
          className="add-note-link"
        >
          Add note about this reply
        </Button>
      </ModalBody>
    </Modal>
  );
};
```

---

### 4. Onboarding Components

#### OnboardingFlow Component

```typescript
interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 
  | 'welcome'
  | 'pin_first_person'
  | 'calendar_connect'
  | 'weekly_focus'
  | 'first_plan_ready'
  | 'complete_fast_win';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());

  const steps: { key: OnboardingStep; component: React.ComponentType<any> }[] = [
    { key: 'welcome', component: WelcomeStep },
    { key: 'pin_first_person', component: PinFirstPersonStep },
    { key: 'calendar_connect', component: CalendarConnectStep },
    { key: 'weekly_focus', component: WeeklyFocusSetupStep },
    { key: 'first_plan_ready', component: FirstPlanReadyStep },
    { key: 'complete_fast_win', component: CompleteFastWinStep },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const CurrentStepComponent = steps[currentStepIndex]?.component;

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleSkip = (step: OnboardingStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    handleNext();
  };

  return (
    <div className="onboarding-flow">
      <ProgressIndicator
        current={currentStepIndex + 1}
        total={steps.length}
      />
      {CurrentStepComponent && (
        <CurrentStepComponent
          onNext={handleNext}
          onBack={handleBack}
          onSkip={currentStep === 'calendar_connect' ? () => handleSkip(currentStep) : undefined}
        />
      )}
    </div>
  );
};
```

---

## State Management

### Recommended Approach: React Query + Zustand

#### React Query for Server State
- Daily plans
- Pins
- Actions
- Weekly summaries
- User settings

#### Zustand for Client State
- UI state (modals, filters, selected items)
- Form state
- Onboarding progress
- Toast notifications
- Billing state (subscription status, paywall modal)

### Example Store Structure

```typescript
// stores/uiStore.ts
interface UIState {
  // Modals
  isAddLeadModalOpen: boolean;
  isEditLeadModalOpen: boolean;
  selectedLead: Lead | null;
  
  // Filters
  leadFilter: LeadFilter;
  
  // Toasts
  toasts: Toast[];
  
  // Actions
  openAddLeadModal: () => void;
  closeAddLeadModal: () => void;
  openEditLeadModal: (lead: Lead) => void;
  closeEditLeadModal: () => void;
  setLeadFilter: (filter: LeadFilter) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Billing
  subscriptionStatus: SubscriptionStatus;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  showPaywall: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
}
```

---

## API Integration

### API Endpoints Structure

```typescript
// api/dailyPlan.ts
export const dailyPlanApi = {
  get: (date: string) => fetch(`/api/daily-plans/${date}`),
  generate: (date: string) => fetch(`/api/daily-plans/${date}/generate`, { method: 'POST' }),
};

// api/leads.ts
export const leadsApi = {
  list: () => fetch('/api/leads'),
  get: (id: string) => fetch(`/api/leads/${id}`),
  create: (data: CreateLeadData) => fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateLeadData) => fetch(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetch(`/api/leads/${id}`, { method: 'DELETE' }),
};

// api/actions.ts
export const actionsApi = {
  updateState: (id: string, state: ActionState, data?: any) => 
    fetch(`/api/actions/${id}/state`, { method: 'PATCH', body: JSON.stringify({ state, ...data }) }),
  snooze: (id: string, until: string) => 
    fetch(`/api/actions/${id}/snooze`, { method: 'PATCH', body: JSON.stringify({ until }) }),
  addNote: (id: string, note: string) => 
    fetch(`/api/actions/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
};

// api/billing.ts
export const billingApi = {
  createCheckoutSession: () =>
    fetch('/api/billing/create-checkout-session', { method: 'POST' }).then((res) => res.json()),
  openCustomerPortal: () =>
    fetch('/api/billing/customer-portal', { method: 'POST' }).then((res) => res.json()),
  getSubscription: () =>
    fetch('/api/billing/subscription').then((res) => res.json()),
};
```

---

## Component Testing Recommendations

### Unit Tests
- Button component variants and states
- Input validation
- Badge rendering
- Modal open/close behavior
- PaywallOverlay messaging per subscription status
- BillingSection CTA logic (subscribe vs manage billing)

### Integration Tests
- Daily plan loading and display
- Pin CRUD operations
- Action completion flows
- Modal interactions

### E2E Tests (Playwright/Cypress)
- Complete onboarding flow
- Daily plan interaction
- Pin management workflow
- Weekly summary review

---

*End of Component Specifications v1.0*

