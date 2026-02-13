# Shared Workflow Framework

A reusable, database-driven workflow framework for building consistent workflow implementations across the application.

## Overview

This framework provides a solid foundation for implementing multi-phase workflows with:
- **Database-driven configuration** - All workflow rules stored in MongoDB
- **Chain of Responsibility pattern** - Composable validation logic
- **Type-safe abstractions** - Generic interfaces for any workflow type
- **Consistent patterns** - Standard approach across all workflows

## Architecture

```
@shared/workflow/
├── interfaces/
│   ├── base-workflow.interface.ts       # Core workflow types
│   └── workflow-validation.interface.ts # Validation types
├── handlers/
│   └── base-workflow.handler.ts         # Base class for phase handlers
├── orchestrators/
│   └── base-workflow.orchestrator.ts    # Base class for workflow coordinators
├── validators/
│   ├── base.validator.ts                # Base class for validators
│   └── validator-chain-builder.ts       # Utility for building validation chains
└── index.ts                             # Public exports
```

## Core Concepts

### 1. Workflow Context
Generic container for workflow execution:
```typescript
export interface BaseWorkflowContext<TData = any, TMetadata = any> {
  phase: string;        // Current workflow phase
  entityId?: string;    // Entity being processed
  data: TData;          // Phase-specific data
  metadata?: TMetadata; // Additional context
}
```

### 2. Workflow Result
Standard result format:
```typescript
export interface BaseWorkflowResult<TEntity = any> {
  success: boolean;
  entity: TEntity;     // The processed entity
  phase: string;       // Current phase
  nextPhase?: string;  // Next phase if available
  message?: string;
  error?: string;
}
```

### 3. Validation Chain
Composable validators using Chain of Responsibility:
```typescript
export interface IWorkflowValidator<TContext> {
  setNext(validator: IWorkflowValidator<TContext>): IWorkflowValidator<TContext>;
  validate(context: TContext): Promise<ValidationResult>;
}
```

## Usage Guide

### Creating a New Workflow

#### Step 1: Define Your Workflow Types

```typescript
// Define your workflow phases
export enum OrderPhase {
  ORDER_CREATED = "ORDER_CREATED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  FULFILLMENT = "FULFILLMENT",
  DELIVERED = "DELIVERED",
}

// Extend base context with workflow-specific data
export interface OrderContext extends BaseWorkflowContext {
  phase: OrderPhase;
  orderId?: string;
  data: CreateOrderDto | UpdateOrderDto;
}

// Extend base result with your entity
export interface OrderResult extends BaseWorkflowResult {
  entity: Order;
  phase: OrderPhase;
  nextPhase?: OrderPhase;
}
```

#### Step 2: Create Workflow Handlers

```typescript
import { BaseWorkflowHandler } from "@shared/workflow";

@Injectable()
export class OrderCreationHandler extends BaseWorkflowHandler<OrderContext, OrderResult> {
  constructor(private readonly orderRepository: OrderRepository) {
    super(OrderPhase.ORDER_CREATED, OrderCreationHandler.name);
  }

  protected async execute(context: OrderContext): Promise<OrderResult> {
    // Your phase-specific logic
    const order = await this.orderRepository.create(context.data);
    
    return {
      success: true,
      entity: order,
      phase: OrderPhase.ORDER_CREATED,
      nextPhase: OrderPhase.PAYMENT_PENDING,
      message: "Order created successfully",
    };
  }
}
```

#### Step 3: Create Validators

```typescript
import { BaseValidator, BaseValidationContext, ValidationResult } from "@shared/workflow";

export interface OrderValidationContext extends BaseValidationContext<Order> {
  order: Order;
  transition?: { nextStatus: string; phase: string; };
}

@Injectable()
export class OrderStockValidator extends BaseValidator<OrderValidationContext> {
  constructor(private readonly inventoryService: InventoryService) {
    super();
  }

  protected async doValidate(context: OrderValidationContext): Promise<ValidationResult> {
    const hasStock = await this.inventoryService.checkStock(context.order.items);
    
    if (!hasStock) {
      return { isValid: false, error: "Insufficient stock" };
    }
    
    return { isValid: true };
  }
}
```

#### Step 4: Create Validator Factory

```typescript
import { ValidatorChainBuilder } from "@shared/workflow";

@Injectable()
export class OrderValidatorFactory {
  constructor(
    private readonly stockValidator: OrderStockValidator,
    private readonly paymentValidator: OrderPaymentValidator,
  ) {}

  createValidationChain(): IWorkflowValidator<OrderValidationContext> {
    // Use shared ValidatorChainBuilder - no manual chaining needed!
    return ValidatorChainBuilder.create(
      this.stockValidator,
      this.paymentValidator,
    );
  }
}

// Alternative: Build chain inline without a factory class
const validator = ValidatorChainBuilder.create(
  new OrderStockValidator(inventoryService),
  new OrderPaymentValidator(paymentService),
);
```

#### Step 5: Create Orchestrator

```typescript
import { BaseWorkflowOrchestrator } from "@shared/workflow";

@Injectable()
export class OrderWorkflowOrchestrator 
  extends BaseWorkflowOrchestrator<Order, OrderPhase> 
{
  constructor(
    private readonly orderCreationHandler: OrderCreationHandler,
    private readonly paymentHandler: OrderPaymentHandler,
    workflowTransitionRepository: WorkflowTransitionRepository,
  ) {
    super(WorkflowType.ORDER_PROCESSING, OrderWorkflowOrchestrator.name, workflowTransitionRepository);
  }

  protected getEntityStatus(entity: Order): string {
    return entity.status;
  }

  async executeCreateOrder(dto: CreateOrderDto): Promise<OrderResult> {
    const context: OrderContext = {
      phase: OrderPhase.ORDER_CREATED,
      data: dto,
    };
    return this.orderCreationHandler.handle(context);
  }

  async executePayment(orderId: string, dto: PaymentDto): Promise<OrderResult> {
    const order = await this.getOrder(orderId);
    const phase = await this.getCurrentPhase(order); // Uses inherited method
    
    const context: OrderContext = {
      phase: phase!,
      orderId,
      data: dto,
    };
    return this.paymentHandler.handle(context);
  }
}
```

#### Step 6: Add Workflow Transitions to Database

Create a migration to seed workflow transitions:

```typescript
export class OrderWorkflowMigration implements Migration {
  async up(db: Db): Promise<void> {
    await db.collection("workflow_transitions").insertMany([
      {
        workflowType: "ORDER_PROCESSING",
        currentStatus: "created",
        nextStatus: "paymentPending",
        phase: "ORDER_CREATED",
        approvalStage: null,
        order: 1,
        isActive: true,
        deletedAt: null,
      },
      {
        workflowType: "ORDER_PROCESSING",
        currentStatus: "paymentPending",
        nextStatus: "fulfillment",
        phase: "PAYMENT_PENDING",
        approvalStage: null,
        order: 2,
        isActive: true,
        deletedAt: null,
      },
      // ... more transitions
    ]);
  }
}
```

## Example: Member Onboarding Workflow

See `src/modules/member/workflow/` for a complete implementation:

```typescript
// Member workflow extends the shared framework
export class WorkflowOrchestrator 
  extends BaseWorkflowOrchestrator<Member, WorkflowPhase> 
  implements IWorkflowOrchestrator 
{
  // Workflow-specific methods
  async executePhase1(dto: CreateMemberDto): Promise<WorkflowResult> { }
  async executeApproval(memberId: string, dto: UpdateStatusDto): Promise<WorkflowResult> { }
  
  // getCurrentPhase() inherited from base class - no duplication!
}
```

## Benefits

### ✅ Consistency
- All workflows follow the same pattern
- Standardized error handling and logging
- Predictable behavior across the codebase

### ✅ Reusability
- Write validators once, use in multiple workflows
- Share common workflow logic
- Reduce code duplication

### ✅ Maintainability
- Clear separation of concerns
- Easy to understand and modify
- Centralized workflow configuration

### ✅ Extensibility
- Add new workflows without touching existing code
- Compose validators in different combinations
- Database-driven workflow rules

### ✅ Testability
- Each component is independently testable
- Mock dependencies easily
- Test validation chains in isolation

## Best Practices

### 1. One Handler Per Phase
Each workflow phase should have its own handler class.

### 2. Composable Validators
Break validation into small, single-purpose validators that can be chained.

### 3. Database-Driven Rules
Store workflow transitions and rules in the database, not in code.

### 4. Type Safety
Always define specific types for your workflow context and results.

### 5. Consistent Naming
- Handlers: `{Entity}{Phase}Handler` (e.g., `OrderCreationHandler`)
- Validators: `{Entity}{Purpose}Validator` (e.g., `OrderStockValidator`)
- Orchestrators: `{Entity}WorkflowOrchestrator` (e.g., `OrderWorkflowOrchestrator`)

## Migration from Legacy Code

If you have existing workflow code:

1. **Identify workflow phases** - Map your current states to phases
2. **Extract validators** - Move validation logic to validator classes
3. **Create handlers** - Wrap phase logic in handler classes
4. **Extend base classes** - Use the shared framework classes
5. **Add database transitions** - Seed workflow configuration
6. **Remove hardcoded logic** - Replace with database queries

## API Reference

### Base Classes

#### `BaseWorkflowHandler<TContext, TResult>`
Base class for workflow phase handlers.
- `getPhase()` - Returns the phase identifier
- `canHandle(context)` - Checks if handler can process the context
- `handle(context)` - Executes the phase logic (calls `execute()`)
- `execute(context)` - **Abstract** - Implement phase-specific logic

#### `BaseWorkflowOrchestrator<TEntity, TPhase>`
Base class for workflow orchestrators.
- `getCurrentPhase(entity)` - Gets the current workflow phase from database
- `getPhaseFromStatus(status)` - Gets phase for a specific status
- `getEntityStatus(entity)` - **Abstract** - Extract status from entity

#### `BaseValidator<TContext>`
Base class for validators.
- `setNext(validator)` - Chains the next validator
- `validate(context)` - Executes validation chain
- `doValidate(context)` - **Abstract** - Implement validation logic

#### `ValidatorChainBuilder`
Utility for building validation chains without manual linking.
- `create(...validators)` - Creates a chain from validators (static method)
- `validate(context, ...validators)` - Creates and executes chain immediately (static method)

**Example:**
```typescript
// Method 1: Create chain, then execute
const chain = ValidatorChainBuilder.create(validator1, validator2, validator3);
const result = await chain.validate(context);

// Method 2: Create and execute in one call
const result = await ValidatorChainBuilder.validate(context, validator1, validator2, validator3);
```

## Related Documentation

- [Member Onboarding Workflow](../../modules/member/workflow/README.md)
- [Workflow Transitions Schema](../../modules/masterdata/schemas/workflow-transition.schema.ts)
- [Database Migrations](../../database/migrations/README.md)

## Support

For questions or issues with the workflow framework, contact the platform team or create an issue in the repository.
